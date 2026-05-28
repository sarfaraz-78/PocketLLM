import { create } from 'zustand';
import { ModelInfo } from '../types';

interface ModelState {
  downloadedModels: ModelInfo[];
  activeModel: ModelInfo | null;
  downloadQueue: ModelInfo[];
  addDownloadedModel: (model: ModelInfo) => void;
  removeDownloadedModel: (modelId: string) => void;
  setActiveModel: (model: ModelInfo | null) => void;
  updateDownloadProgress: (modelId: string, progress: number) => void;
  setDownloadStatus: (
    modelId: string,
    status: ModelInfo['downloadStatus']
  ) => void;
  addToDownloadQueue: (model: ModelInfo) => void;
  removeFromDownloadQueue: (modelId: string) => void;
}

export const useModelStore = create<ModelState>((set) => ({
  downloadedModels: [],
  activeModel: null,
  downloadQueue: [],

  addDownloadedModel: (model) =>
    set((state) => ({
      downloadedModels: [...state.downloadedModels, model],
    })),

  removeDownloadedModel: (modelId) =>
    set((state) => ({
      downloadedModels: state.downloadedModels.filter((m) => m.id !== modelId),
      activeModel:
        state.activeModel?.id === modelId ? null : state.activeModel,
    })),

  setActiveModel: (model) => set({ activeModel: model }),

  updateDownloadProgress: (modelId, progress) =>
    set((state) => ({
      downloadQueue: state.downloadQueue.map((m) =>
        m.id === modelId ? { ...m, downloadProgress: progress } : m
      ),
    })),

  setDownloadStatus: (modelId, status) =>
    set((state) => ({
      downloadQueue: state.downloadQueue.map((m) =>
        m.id === modelId ? { ...m, downloadStatus: status } : m
      ),
    })),

  addToDownloadQueue: (model) =>
    set((state) => ({
      downloadQueue: [...state.downloadQueue, model],
    })),

  removeFromDownloadQueue: (modelId) =>
    set((state) => ({
      downloadQueue: state.downloadQueue.filter((m) => m.id !== modelId),
    })),
}));
