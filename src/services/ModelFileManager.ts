import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { ModelInfo } from '../types';
import { backgroundDownload, DownloadTask } from './BackgroundDownload';
import { extractParams } from '../utils/paramUtils';

export class ModelFileManager {
  static async getModelDirectory(): Promise<string> {
    const baseDir =
      Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.ExternalDirectoryPath;
    const modelDir = `${baseDir}/models`;

    if (!(await RNFS.exists(modelDir))) {
      await RNFS.mkdir(modelDir);
    }

    return modelDir;
  }

  static async listLocalModels(): Promise<ModelInfo[]> {
    // Get models from the legacy directory
    const legacyModelDir = await this.getModelDirectory();
    const legacyFiles = await RNFS.readDir(legacyModelDir).catch(() => []);

    // Get models from the background download directory (external files)
    const bgModelDir = `${RNFS.ExternalDirectoryPath}/models`;
    const bgFiles = await RNFS.readDir(bgModelDir).catch(() => []);

    const allFiles = [...legacyFiles, ...bgFiles];
    const seen = new Set<string>();

    const models: ModelInfo[] = [];

    for (const file of allFiles) {
      if (!file.name.endsWith('.gguf') || !file.isFile()) continue;
      if (seen.has(file.name)) continue;
      seen.add(file.name);

      const quantMatch = file.name.match(/(UD-[A-Z0-9]+(?:_[A-Z0-9]+)*|IQ\d+(?:_[A-Z0-9]+)*|Q\d+(?:_[A-Z0-9]+)*|FP16|BF16|F16|F32)/i);
      models.push({
        id: file.name,
        name: file.name.replace('.gguf', ''),
        repoId: 'local',
        fileName: file.name,
        downloadUrl: '',
        sizeMB: Math.round((file.size || 0) / (1024 * 1024)),
        quantization: quantMatch ? quantMatch[1].toUpperCase() : 'unknown',
        params: extractParams(file.name),
        tier: 'MEDIUM' as any,
        localPath: file.path,
        downloadStatus: 'downloaded' as const,
      });
    }

    // Also include active/incomplete downloads
    const activeTasks = backgroundDownload.getAllTasks();
    for (const task of activeTasks) {
      if (seen.has(task.fileName)) continue;

      if (task.status === 'downloading' || task.status === 'pending' || task.status === 'paused') {
        models.push({
          id: task.fileName,
          name: task.fileName.replace('.gguf', ''),
          repoId: 'downloading',
          fileName: task.fileName,
          downloadUrl: task.url,
          sizeMB: 0,
          quantization: 'unknown',
          params: extractParams(task.fileName),
          tier: 'MEDIUM' as any,
          localPath: undefined,
          downloadStatus: 'downloading' as const,
          downloadProgress: task.progress,
        });
      }
    }

    return models;
  }

  static async downloadModel(
    model: ModelInfo,
    onProgress: (progress: number) => void
  ): Promise<string> {
    const legacyModelDir = await this.getModelDirectory();
    const legacyPath = `${legacyModelDir}/${model.fileName}`;

    // Check legacy directory first
    if (await RNFS.exists(legacyPath)) {
      return legacyPath;
    }

    // Check background download directory
    const bgPath = `${RNFS.ExternalDirectoryPath}/models/${model.fileName}`;
    if (await RNFS.exists(bgPath)) {
      return bgPath;
    }

    // Start background download
    await backgroundDownload.startDownload(
      model.id,
      model.downloadUrl,
      model.fileName,
      onProgress
    );

    // Return the expected path
    return `${RNFS.ExternalDirectoryPath}/models/${model.fileName}`;
  }

  static async isDownloadComplete(modelId: string): Promise<{ complete: boolean; path?: string }> {
    const task = backgroundDownload.getDownloadStatus(modelId);
    if (task?.status === 'completed' && task.localPath) {
      return { complete: true, path: task.localPath };
    }

    // Check legacy path
    const legacyModelDir = await this.getModelDirectory();
    const legacyPath = `${legacyModelDir}/${modelId}`;
    if (await RNFS.exists(legacyPath)) {
      return { complete: true, path: legacyPath };
    }

    // Check background download path
    const bgPath = `${RNFS.ExternalDirectoryPath}/models/${modelId}`;
    if (await RNFS.exists(bgPath)) {
      return { complete: true, path: bgPath };
    }

    return { complete: false };
  }

  static async deleteModel(modelPath: string): Promise<void> {
    if (await RNFS.exists(modelPath)) {
      await RNFS.unlink(modelPath);
    }
  }

  static async cancelDownload(modelId: string): Promise<void> {
    await backgroundDownload.cancelDownload(modelId);
  }

  static async retryDownload(modelId: string, onProgress: (progress: number) => void): Promise<void> {
    await backgroundDownload.retry(modelId, onProgress);
  }

  static getDownloadTasks(): DownloadTask[] {
    return backgroundDownload.getAllTasks();
  }

  static onDownloadStatusChange(callback: (tasks: DownloadTask[]) => void): () => void {
    return backgroundDownload.onStatusChange(callback);
  }

  static async getModelSize(modelPath: string): Promise<number> {
    const stat = await RNFS.stat(modelPath);
    return Math.round(stat.size / (1024 * 1024));
  }

  static async modelExists(modelPath: string): Promise<boolean> {
    return await RNFS.exists(modelPath);
  }
}
