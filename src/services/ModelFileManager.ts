import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { ModelInfo } from '../types';

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
      .map((file) => ({
        id: file.name,
        name: file.name.replace('.gguf', ''),
        repoId: 'local',
        fileName: file.name,
        downloadUrl: '',
        sizeMB: Math.round((file.size || 0) / (1024 * 1024)),
        quantization: 'Unknown',
        params: 'Unknown',
        tier: 'MEDIUM' as any,
        localPath: file.path,
        downloadStatus: 'downloaded' as const,
      }));
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

    const downloadResult = RNFS.downloadFile({
      fromUrl: model.downloadUrl,
      toFile: destinationPath,
      progress: (res) => {
        const progress =
          (res.bytesWritten / res.contentLength) * 100;
        onProgress(progress);
      },
      progressDivider: 1,
    });

    const result = await downloadResult.promise;

    if (result.statusCode === 200) {
      return destinationPath;
    } else {
      throw new Error(`Download failed with status: ${result.statusCode}`);
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
