import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { ModelInfo } from '../types';
import { DownloadNotificationService } from './DownloadNotification';
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
    const modelDir = await this.getModelDirectory();
    const files = await RNFS.readDir(modelDir);

    return files
      .filter((file) => file.name.endsWith('.gguf') && file.isFile())
      .map((file) => {
        const quantMatch = file.name.match(/(UD-[A-Z0-9]+(?:_[A-Z0-9]+)*|IQ\d+(?:_[A-Z0-9]+)*|Q\d+(?:_[A-Z0-9]+)*|FP16|BF16|F16|F32)/i);
        return {
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
        };
      });
  }

  static async downloadModel(
    model: ModelInfo,
    onProgress: (progress: number) => void
  ): Promise<string> {
    const modelDir = await this.getModelDirectory();
    const destinationPath = `${modelDir}/${model.fileName}`;

    if (await RNFS.exists(destinationPath)) {
      return destinationPath;
    }

    DownloadNotificationService.show(`Downloading ${model.name}`);

    try {
      const downloadResult = RNFS.downloadFile({
        fromUrl: model.downloadUrl,
        toFile: destinationPath,
        begin: () => {
          DownloadNotificationService.show(`Downloading ${model.name}`);
        },
        progress: (res) => {
          const progress =
            (res.bytesWritten / res.contentLength) * 100;
          onProgress(progress);
          DownloadNotificationService.updateProgress(progress);
        },
        progressDivider: 1,
      });

      const result = await downloadResult.promise;

      if (result.statusCode === 200) {
        DownloadNotificationService.showComplete(`${model.name} downloaded`);
        return destinationPath;
      } else {
        throw new Error(`Download failed with status: ${result.statusCode}`);
      }
    } catch (error) {
      DownloadNotificationService.cancel();
      throw error;
    }
  }

  static async deleteModel(modelPath: string): Promise<void> {
    if (await RNFS.exists(modelPath)) {
      await RNFS.unlink(modelPath);
    }
  }

  static async getModelSize(modelPath: string): Promise<number> {
    const stat = await RNFS.stat(modelPath);
    return Math.round(stat.size / (1024 * 1024));
  }

  static async modelExists(modelPath: string): Promise<boolean> {
    return await RNFS.exists(modelPath);
  }
}
