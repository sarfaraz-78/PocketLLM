import { HUGGINGFACE_API_BASE } from '../utils/constants';
import { HuggingFaceModel } from '../types';

export class HuggingFaceApi {
  static async searchModels(
    query: string,
    limit: number = 20
  ): Promise<HuggingFaceModel[]> {
    try {
      const response = await fetch(
        `${HUGGINGFACE_API_BASE}/models?search=${encodeURIComponent(
          query + ' gguf'
        )}&limit=${limit}&sort=downloads&direction=-1&expand[]=siblings`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching models:', error);
      throw error;
    }
  }

  static async getModelInfo(modelId: string): Promise<HuggingFaceModel> {
    try {
      const response = await fetch(
        `${HUGGINGFACE_API_BASE}/models/${modelId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching model info:', error);
      throw error;
    }
  }

  static async getModelTree(
    modelId: string
  ): Promise<Array<{ path: string; size: number }>> {
    try {
      const response = await fetch(
        `${HUGGINGFACE_API_BASE}/models/${modelId}/tree/main?recursive=true`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Unexpected tree API response format');
      }

      const files = data
        .filter(
          (item: any) =>
            item.type === 'file' &&
            item.path &&
            item.path.toLowerCase().endsWith('.gguf')
        )
        .map((item: any) => ({
          path: item.path,
          size: typeof item.size === 'number' ? item.size : 0,
        }));

      console.log(`[HF Tree] ${modelId}: ${files.length} GGUF files found`);
      return files;
    } catch (error) {
      console.error('Error fetching model tree:', error);
      throw error;
    }
  }

  static async getFileSizeFromHead(modelId: string, filename: string): Promise<number> {
    try {
      const response = await fetch(this.getDownloadUrl(modelId, filename), {
        method: 'HEAD',
      });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0;
    }
  }

  static async getGGUFFiles(
    modelId: string
  ): Promise<Array<{ filename: string; size: number }>> {
    try {
      const treeFiles = await this.getModelTree(modelId);
      return treeFiles.map((file) => ({
        filename: file.path,
        size: file.size,
      }));
    } catch (error) {
      console.error('Error fetching GGUF files:', error);
      throw error;
    }
  }

  static getDownloadUrl(modelId: string, filename: string): string {
    return `https://huggingface.co/${modelId}/resolve/main/${filename}`;
  }
}
