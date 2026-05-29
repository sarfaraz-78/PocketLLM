import { NativeModules, NativeEventEmitter, DeviceEventEmitter, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BackgroundDownload = NativeModules.BackgroundDownload;

const eventEmitter = Platform.OS === 'ios'
  ? new NativeEventEmitter(BackgroundDownload)
  : DeviceEventEmitter;

interface DownloadTask {
  downloadId: number;
  modelId: string;
  url: string;
  fileName: string;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  localPath?: string;
  error?: string;
}

const STORAGE_KEY = '@pocketllm_downloads';

class BackgroundDownloadService {
  private tasks: Map<string, DownloadTask> = new Map();
  private progressListeners: Map<string, ((progress: number) => void)> = new Map();
  private statusListeners: Set<(tasks: DownloadTask[]) => void> = new Set();
  private initialized = false;

  constructor() {
    this.init();
  }

  private async init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load persisted tasks
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([modelId, task]: [string, any]) => {
          this.tasks.set(modelId, task);
        });
      }
    } catch (e) {
      console.warn('[BackgroundDownload] Failed to load persisted tasks', e);
    }

    // Listen for native events
    eventEmitter.addListener('DownloadProgress', this.handleProgress);
    eventEmitter.addListener('DownloadComplete', this.handleComplete);

    // Resume any incomplete downloads on startup
    this.resumeIncompleteDownloads();
  }

  private handleProgress = (event: any) => {
    const { downloadId, modelId, progress } = event;
    const task = this.tasks.get(modelId);
    if (task && task.downloadId === downloadId) {
      task.progress = progress;
      task.status = 'downloading';
      this.saveTasks();

      const listener = this.progressListeners.get(modelId);
      if (listener) {
        listener(progress);
      }
      this.notifyStatusListeners();
    }
  };

  private handleComplete = (event: any) => {
    const { downloadId, modelId, success, localPath, status } = event;
    const task = this.tasks.get(modelId);
    if (task && task.downloadId === downloadId) {
      task.status = success ? 'completed' : 'failed';
      task.progress = success ? 100 : task.progress;
      if (localPath) task.localPath = localPath;
      if (!success) task.error = 'Download failed';
      this.saveTasks();

      const listener = this.progressListeners.get(modelId);
      if (listener) {
        listener(success ? 100 : task.progress);
      }
      this.notifyStatusListeners();
    }
  };

  private async saveTasks() {
    try {
      const obj: Record<string, DownloadTask> = {};
      this.tasks.forEach((task, modelId) => {
        obj[modelId] = task;
      });
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.warn('[BackgroundDownload] Failed to save tasks', e);
    }
  }

  private async resumeIncompleteDownloads() {
    for (const [modelId, task] of this.tasks.entries()) {
      if (task.status === 'downloading' || task.status === 'pending' || task.status === 'paused') {
        // Check if the download is actually still running in the system
        try {
          const result = await BackgroundDownload.isDownloadComplete(task.downloadId);
          if (result.complete) {
            if (result.success) {
              task.status = 'completed';
              task.progress = 100;
              task.localPath = result.localPath;
            } else {
              // Retry the download
              await this.retryDownload(modelId);
            }
          } else {
            // Still downloading, update status
            task.status = 'downloading';
            this.pollProgress(modelId);
          }
          this.saveTasks();
          this.notifyStatusListeners();
        } catch (e) {
          // Download ID no longer valid, retry
          await this.retryDownload(modelId);
        }
      }
    }
  }

  private async retryDownload(modelId: string) {
    const task = this.tasks.get(modelId);
    if (!task) return;

    try {
      const result = await BackgroundDownload.startDownload(
        modelId,
        task.url,
        task.fileName
      );
      if (result.success) {
        task.downloadId = result.downloadId;
        task.status = 'downloading';
        task.error = undefined;
        this.saveTasks();
        this.pollProgress(modelId);
      } else if (result.status === 'completed') {
        task.status = 'completed';
        task.progress = 100;
        task.localPath = result.localPath;
        this.saveTasks();
      }
    } catch (e) {
      task.status = 'failed';
      task.error = e instanceof Error ? e.message : 'Retry failed';
      this.saveTasks();
    }
    this.notifyStatusListeners();
  }

  private async pollProgress(modelId: string) {
    const task = this.tasks.get(modelId);
    if (!task || task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
      return;
    }

    try {
      const result = await BackgroundDownload.getDownloadProgress(task.downloadId);
      task.progress = result.progress;
      task.status = result.status as any;

      if (result.status === 'completed') {
        task.status = 'completed';
        task.progress = 100;
        task.localPath = result.localUri?.replace('file://', '');
      } else if (result.status === 'failed') {
        task.status = 'failed';
        task.error = result.error || 'Download failed';
      }

      this.saveTasks();

      const listener = this.progressListeners.get(modelId);
      if (listener) {
        listener(task.progress);
      }
      this.notifyStatusListeners();

      // Continue polling if still active
      if (task.status === 'downloading' || task.status === 'pending' || task.status === 'paused') {
        setTimeout(() => this.pollProgress(modelId), 2000);
      }
    } catch (e) {
      // Download ID might be invalid, will be caught by resume logic
    }
  }

  async startDownload(
    modelId: string,
    url: string,
    fileName: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    if (onProgress) {
      this.progressListeners.set(modelId, onProgress);
    }

    // Check if already downloading
    const existing = this.tasks.get(modelId);
    if (existing && (existing.status === 'downloading' || existing.status === 'pending')) {
      return;
    }

    try {
      const result = await BackgroundDownload.startDownload(modelId, url, fileName);

      const task: DownloadTask = {
        downloadId: result.downloadId,
        modelId,
        url,
        fileName,
        status: result.status || 'downloading',
        progress: 0,
        localPath: result.localPath,
      };

      this.tasks.set(modelId, task);
      this.saveTasks();
      this.notifyStatusListeners();

      // Start polling
      this.pollProgress(modelId);
    } catch (e) {
      const task: DownloadTask = {
        downloadId: -1,
        modelId,
        url,
        fileName,
        status: 'failed',
        progress: 0,
        error: e instanceof Error ? e.message : 'Failed to start download',
      };
      this.tasks.set(modelId, task);
      this.saveTasks();
      this.notifyStatusListeners();
      throw e;
    }
  }

  async cancelDownload(modelId: string): Promise<void> {
    const task = this.tasks.get(modelId);
    if (task && task.downloadId > 0) {
      try {
        await BackgroundDownload.cancelDownload(task.downloadId);
      } catch (e) {
        // Ignore
      }
    }
    this.tasks.delete(modelId);
    this.progressListeners.delete(modelId);
    this.saveTasks();
    this.notifyStatusListeners();
  }

  async getLocalPath(modelId: string): Promise<string | undefined> {
    const task = this.tasks.get(modelId);
    if (task?.status === 'completed') {
      return task.localPath;
    }
    return undefined;
  }

  getDownloadStatus(modelId: string): DownloadTask | undefined {
    return this.tasks.get(modelId);
  }

  getAllTasks(): DownloadTask[] {
    return Array.from(this.tasks.values());
  }

  onStatusChange(callback: (tasks: DownloadTask[]) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.getAllTasks());
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private notifyStatusListeners() {
    const tasks = this.getAllTasks();
    this.statusListeners.forEach((cb) => cb(tasks));
  }

  async retry(modelId: string, onProgress?: (progress: number) => void): Promise<void> {
    const task = this.tasks.get(modelId);
    if (!task) return;

    if (onProgress) {
      this.progressListeners.set(modelId, onProgress);
    }

    // Cancel existing if any
    if (task.downloadId > 0) {
      try {
        await BackgroundDownload.cancelDownload(task.downloadId);
      } catch (e) {
        // Ignore
      }
    }

    await this.retryDownload(modelId);
  }

  cleanup() {
    eventEmitter.removeAllListeners('DownloadProgress');
    eventEmitter.removeAllListeners('DownloadComplete');
    this.progressListeners.clear();
    this.statusListeners.clear();
  }
}

export const backgroundDownload = new BackgroundDownloadService();
export type { DownloadTask };
