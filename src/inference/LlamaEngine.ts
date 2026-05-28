import { initLlama, loadLlamaModelInfo } from 'llama.rn';
import { CompletionSettings, DeviceTier, GenerationStats } from '../types';
import { PresetManager } from './PresetManager';
import { STOP_WORDS } from '../utils/stopWords';

export class LlamaEngine {
  private context: any = null;
  private isGenerating: boolean = false;
  private currentTier: DeviceTier | null = null;

  async loadModel(modelPath: string, tier: DeviceTier): Promise<void> {
    if (this.context) {
      await this.release();
    }

    this.currentTier = tier;
    const preset = PresetManager.getPresetForTier(tier);

    try {
      this.context = await initLlama({
        model: modelPath,
        use_mlock: preset.use_mlock,
        use_mmap: preset.use_mmap,
        n_ctx: preset.n_ctx,
        n_gpu_layers: preset.n_gpu_layers,
        n_threads: preset.n_threads,
        n_batch: preset.n_batch,
        n_ubatch: preset.n_ubatch,
        cache_type_k: preset.cache_type_k,
        cache_type_v: preset.cache_type_v,
        flash_attn_type: preset.flash_attn_type,
        no_extra_bufts: preset.no_extra_bufts,
        ctx_shift: preset.ctx_shift,
      });
    } catch (error) {
      throw new Error(`Failed to load model: ${error}`);
    }
  }

  async getModelInfo(modelPath: string): Promise<any> {
    return await loadLlamaModelInfo(modelPath);
  }

  async sendMessage(
    messages: Array<{ role: string; content: string }>,
    settings: CompletionSettings,
    onToken: (token: string) => void
  ): Promise<{ text: string; stats: GenerationStats }> {
    if (!this.context) {
      throw new Error('Model not loaded');
    }

    this.isGenerating = true;

    try {
      const result = await this.context.completion(
        {
          messages,
          n_predict: settings.n_predict,
          temperature: settings.temperature,
          top_p: settings.top_p,
          top_k: settings.top_k,
          min_p: settings.min_p,
          penalty_repeat: settings.penalty_repeat,
          penalty_freq: settings.penalty_freq,
          penalty_present: settings.penalty_present,
          stop: STOP_WORDS,
        },
        (data: any) => {
          if (this.isGenerating && data.token) {
            onToken(data.token);
          }
        }
      );

      const stats: GenerationStats = {
        tokensPerSecond: result.timings?.predicted_per_second || 0,
        totalTokens: result.tokens_predicted || 0,
        promptTokens: result.tokens_evaluated || 0,
        promptPerSecond: result.timings?.prompt_per_second || 0,
        totalTimeMs:
          (result.timings?.predicted_ms || 0) +
          (result.timings?.prompt_ms || 0),
      };

      return { text: result.text, stats };
    } finally {
      this.isGenerating = false;
    }
  }

  stopGeneration(): void {
    this.isGenerating = false;
  }

  async release(): Promise<void> {
    if (this.context) {
      try {
        await this.context.release();
      } catch (error) {
        console.error('Error releasing context:', error);
      }
      this.context = null;
    }
    this.currentTier = null;
  }

  isLoaded(): boolean {
    return this.context !== null;
  }

  getCurrentTier(): DeviceTier | null {
    return this.currentTier;
  }
}

export const llamaEngine = new LlamaEngine();
