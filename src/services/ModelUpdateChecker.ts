import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const CHECK_INTERVAL_MS = 1000 * 60 * 60 * 24; // 24 hours

const STORAGE_KEY = '@pocketllm/last_update_check';
const SKIPPED_KEY = '@pocketllm/skipped_versions';

const PACKAGE_VERSION = '3.0.0';

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  releaseNotes?: string;
  releaseUrl?: string;
  publishedAt?: string;
  isPrerelease: boolean;
  forceUpdate: boolean;
}

class ModelUpdateCheckerService {
  private interval: ReturnType<typeof setInterval> | null = null;

  async shouldCheck(): Promise<boolean> {
    try {
      const lastCheck = await AsyncStorage.getItem(STORAGE_KEY);
      if (!lastCheck) return true;
      const elapsed = Date.now() - parseInt(lastCheck, 10);
      return elapsed > CHECK_INTERVAL_MS;
    } catch {
      return true;
    }
  }

  async markChecked(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      // ignore
    }
  }

  async skipVersion(version: string): Promise<void> {
    try {
      const skipped = await this.getSkippedVersions();
      skipped.push(version);
      await AsyncStorage.setItem(SKIPPED_KEY, JSON.stringify(skipped));
    } catch {
      // ignore
    }
  }

  async getSkippedVersions(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(SKIPPED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async checkForUpdate(
    owner: string,
    repo: string
  ): Promise<UpdateInfo | null> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
        {
          headers: { Accept: 'application/vnd.github+json' },
        }
      );
      if (!response.ok) {
        return null;
      }
      const data = await response.json();
      const latest = (data.tag_name || '').replace(/^v/, '');
      const current = PACKAGE_VERSION;
      const skipped = await this.getSkippedVersions();
      const updateAvailable = this.compareVersions(latest, current) > 0 && !skipped.includes(latest);
      const forceUpdate =
        (data.body?.includes('!!FORCE_UPDATE!!') || false) &&
        updateAvailable;

      await this.markChecked();

      return {
        currentVersion: current,
        latestVersion: latest,
        updateAvailable,
        releaseNotes: data.body,
        releaseUrl: data.html_url,
        publishedAt: data.published_at,
        isPrerelease: data.prerelease || false,
        forceUpdate,
      };
    } catch (e) {
      return null;
    }
  }

  compareVersions(a: string, b: string): number {
    const aParts = a.split('.').map((n) => parseInt(n, 10) || 0);
    const bParts = b.split('.').map((n) => parseInt(n, 10) || 0);
    const maxLen = Math.max(aParts.length, bParts.length);
    for (let i = 0; i < maxLen; i++) {
      const aN = aParts[i] || 0;
      const bN = bParts[i] || 0;
      if (aN > bN) return 1;
      if (aN < bN) return -1;
    }
    return 0;
  }

  startPeriodicChecks(owner: string, repo: string, callback: (info: UpdateInfo) => void) {
    this.stopPeriodicChecks();
    const run = async () => {
      if (await this.shouldCheck()) {
        const info = await this.checkForUpdate(owner, repo);
        if (info?.updateAvailable) {
          callback(info);
        }
      }
    };
    run();
    this.interval = setInterval(run, CHECK_INTERVAL_MS);
  }

  stopPeriodicChecks() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getDownloadUrl(): string {
    return Platform.select({
      android: 'https://github.com/PocketLLM/PocketLLM/releases/latest',
      ios: 'https://apps.apple.com/app/id000000',
      default: 'https://github.com/PocketLLM/PocketLLM/releases/latest',
    })!;
  }
}

export const modelUpdateChecker = new ModelUpdateCheckerService();
