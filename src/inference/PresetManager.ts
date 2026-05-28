import { DeviceTier, InferencePreset } from '../types';

export class PresetManager {
  static getPresetForTier(tier: DeviceTier): InferencePreset {
    switch (tier) {
      case DeviceTier.ULTRA_LOW:
        return {
          n_ctx: 512,
          n_gpu_layers: 0,
          n_threads: 2,
          n_batch: 256,
          n_ubatch: 128,
          cache_type_k: 'q4_0',
          cache_type_v: 'q4_0',
          flash_attn_type: 'off',
          use_mmap: true,
          use_mlock: false,
          no_extra_bufts: true,
          ctx_shift: true,
        };

      case DeviceTier.LOW:
        return {
          n_ctx: 1024,
          n_gpu_layers: 0,
          n_threads: 2,
          n_batch: 512,
          n_ubatch: 256,
          cache_type_k: 'q4_0',
          cache_type_v: 'q4_0',
          flash_attn_type: 'off',
          use_mmap: true,
          use_mlock: false,
          no_extra_bufts: true,
          ctx_shift: true,
        };

      case DeviceTier.MEDIUM:
        return {
          n_ctx: 2048,
          n_gpu_layers: 20,
          n_threads: 4,
          n_batch: 512,
          n_ubatch: 512,
          cache_type_k: 'q8_0',
          cache_type_v: 'q8_0',
          flash_attn_type: 'auto',
          use_mmap: true,
          use_mlock: false,
          no_extra_bufts: false,
          ctx_shift: true,
        };

      case DeviceTier.HIGH:
        return {
          n_ctx: 4096,
          n_gpu_layers: 99,
          n_threads: 6,
          n_batch: 1024,
          n_ubatch: 512,
          cache_type_k: 'q8_0',
          cache_type_v: 'q8_0',
          flash_attn_type: 'auto',
          use_mmap: true,
          use_mlock: true,
          no_extra_bufts: false,
          ctx_shift: true,
        };

      case DeviceTier.PREMIUM:
        return {
          n_ctx: 8192,
          n_gpu_layers: 99,
          n_threads: 8,
          n_batch: 1024,
          n_ubatch: 1024,
          cache_type_k: 'f16',
          cache_type_v: 'f16',
          flash_attn_type: 'auto',
          use_mmap: true,
          use_mlock: true,
          no_extra_bufts: false,
          ctx_shift: true,
        };
    }
  }

  static estimateMemoryUsage(
    modelSizeMB: number,
    nCtx: number,
    cacheType: string
  ): number {
    const cacheMultiplier =
      cacheType === 'q4_0' ? 0.25 : cacheType === 'q8_0' ? 0.5 : 1.0;
    const cacheSizeMB = (nCtx / 1024) * 100 * cacheMultiplier;
    return modelSizeMB + cacheSizeMB + 200;
  }
}
