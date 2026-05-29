import { create } from 'zustand';
import { ModelInfo } from '../types';

interface ModelState {
  downloadedModels: ModelInfo[];
  activeModel: ModelInfo | null;
  loadingModelId: string | null;
  addDownloadedModel: (model: ModelInfo) => void;
  removeDownloadedModel: (modelId: string) => void;
  setActiveModel: (model: ModelInfo | null) => void;
  updateModelProgress: (modelId: string, progress: number) => void;
  setModelStatus: (modelId: string, status: ModelInfo['downloadStatus']) => void;
  setLoadingModelId: (modelId: string | null) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  downloadedModels: [],
  activeModel: null,
  loadingModelId: null,

  addDownloadedModel: (model) =>
    set((state) => {
      const filtered = state.downloadedModels.filter((m) => m.id !== model.id);
      return { downloadedModels: [...filtered, model] };
    }),

  removeDownloadedModel: (modelId) =>
    set((state) => ({
      downloadedModels: state.downloadedModels.filter((m) => m.id !== modelId),
      activeModel:
        state.activeModel?.id === modelId ? null : state.activeModel,
    })),

  setActiveModel: (model) => set({ activeModel: model }),

  updateModelProgress: (modelId, progress) =>
    set((state) => ({
      downloadedModels: state.downloadedModels.map((m) =>
        m.id === modelId ? { ...m, downloadProgress: progress, downloadStatus: 'downloading' as const } : m
      ),
    })),

  setModelStatus: (modelId, status) =>
    set((state) => ({
      downloadedModels: state.downloadedModels.map((m) =>
        m.id === modelId ? { ...m, downloadStatus: status } : m
      ),
    })),

  setLoadingModelId: (modelId) => set({ loadingModelId: modelId }),
}));
