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
        )}&limit=${limit}&sort=downloads&direction=-1`
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

  static async getGGUFFiles(
    modelId: string
  ): Promise<Array<{ filename: string; size: number }>> {
    try {
      const modelInfo = await this.getModelInfo(modelId);
      const ggufFiles = modelInfo.siblings
        .filter((file) => file.rfilename.endsWith('.gguf'))
        .map((file) => ({
          filename: file.rfilename,
          size: file.size || 0,
        }));

      return ggufFiles;
    } catch (error) {
      console.error('Error fetching GGUF files:', error);
      throw error;
    }
  }

  static getDownloadUrl(modelId: string, filename: string): string {
    return `https://huggingface.co/${modelId}/resolve/main/${filename}`;
  }
}
