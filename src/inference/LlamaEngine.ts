import { initLlama, loadLlamaModelInfo } from 'llama.rn';
import { CompletionSettings, DeviceTier, GenerationStats, ModelInfo } from '../types';
import { PresetManager } from './PresetManager';
import { STOP_WORDS } from '../utils/stopWords';
import { AttachmentItem } from '../components/ChatInput';

export type RNLlamaMessagePart = {
  type: 'text' | 'image_url' | 'input_audio';
  text?: string;
  image_url?: { url?: string };
  input_audio?: { format: string; data?: string; url?: string };
};

export async function extractModelSpecs(modelPath: string): Promise<ModelInfo['specs']> {
  try {
    const info = await loadLlamaModelInfo(modelPath);
    if (!info || typeof info !== 'object') return undefined;

    const meta = (info as any).meta || info;
    const arch = meta?.['general.architecture'] || '';
    const archKey = arch ? `${arch}.` : 'llama.';

    return {
      vocabSize: meta?.[`${archKey}vocab_size`] || meta?.['tokenizer.ggml.tokens']?.length || undefined,
      contextSize: meta?.[`${archKey}context_length`] || meta?.[`${archKey}max_position_embeddings`] || undefined,
      embeddingLength: meta?.[`${archKey}embedding_length`] || meta?.[`${archKey}hidden_size`] || undefined,
      layerCount: meta?.[`${archKey}block_count`] || meta?.[`${archKey}num_hidden_layers`] || undefined,
      feedForwardLength: meta?.[`${archKey}feed_forward_length`] || meta?.[`${archKey}intermediate_size`] || undefined,
      headCount: meta?.[`${archKey}attention.head_count`] || meta?.[`${archKey}num_attention_heads`] || undefined,
      kvHeadCount: meta?.[`${archKey}attention.head_count_kv`] || meta?.[`${archKey}num_key_value_heads`] || undefined,
      maxTokens: meta?.[`${archKey}context_length`] || undefined,
      quantizationVersion: meta?.['general.quantization_version']?.toString(),
    };
  } catch (e) {
    console.warn('[extractModelSpecs] Failed to read specs:', e);
    return undefined;
  }
}

export class LlamaEngine {
  private context: any = null;
  private isGenerating: boolean = false;
  private isLoading: boolean = false;
  private currentTier: DeviceTier | null = null;
  private lastModelInfo: any = null;
  private mmprojPath: string | null = null;
  private multimodalEnabled: boolean = false;

async loadModel(modelPath: string, tier: DeviceTier, mmprojPath?: string): Promise<void> {
    if (this.isLoading) {
      throw new Error('Model load already in progress. Please wait.');
    }

    this.isLoading = true;
    this.mmprojPath = mmprojPath || null;
    this.multimodalEnabled = false;

    try {
      if (this.context) {
        await this.release();
      }

      // Pre-validate the file with a lightweight metadata read
      try {
        this.lastModelInfo = await loadLlamaModelInfo(modelPath);
        console.log('[LlamaEngine] Model info:', this.lastModelInfo);
      } catch (infoErr) {
        throw new Error(
          `Cannot read model file. File may be corrupted or incomplete. (${infoErr})`
        );
      }

      this.currentTier = tier;
      const preset = PresetManager.getPresetForTier(tier);

      // Try loading with preset settings
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
      } catch (initErr: any) {
        // If mmap failed, try without mmap (some 32-bit devices have mmap issues on external storage)
        if (preset.use_mmap && initErr?.message?.toLowerCase()?.includes('mmap')) {
          console.warn('[LlamaEngine] mmap failed, retrying without mmap');
          this.context = await initLlama({
            model: modelPath,
            use_mlock: false,
            use_mmap: false,
            n_ctx: preset.n_ctx,
            n_gpu_layers: 0,
            n_threads: preset.n_threads,
            n_batch: preset.n_batch,
            n_ubatch: preset.n_ubatch,
            cache_type_k: preset.cache_type_k,
            cache_type_v: preset.cache_type_v,
            flash_attn_type: 'off',
            no_extra_bufts: true,
            ctx_shift: preset.ctx_shift,
          });
        } else {
          throw initErr;
        }
      }

      // Initialize multimodal if projector path provided
      if (this.mmprojPath) {
        try {
          console.log('[LlamaEngine] Initializing multimodal with projector:', this.mmprojPath);
          await this.context.initMultimodal({ path: this.mmprojPath, use_gpu: false });
          const support = await this.context.getMultimodalSupport();
          console.log('[LlamaEngine] Multimodal support:', support);
          this.multimodalEnabled = support.vision || support.audio;
        } catch (mmErr) {
          console.warn('[LlamaEngine] Failed to init multimodal:', mmErr);
          this.multimodalEnabled = false;
        }
      }
    } catch (error) {
      console.error('[LlamaEngine] loadModel error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to load model'
      );
    } finally {
      this.isLoading = false;
    }
  }

  async getModelInfo(modelPath: string): Promise<any> {
    return await loadLlamaModelInfo(modelPath);
  }

  getLastModelInfo(): any {
    return this.lastModelInfo;
  }

  async sendMessage(
    messages: Array<{ role: string; content: string | RNLlamaMessagePart[] }>,
    settings: CompletionSettings,
    onToken: (token: string) => void,
    attachments?: AttachmentItem[]
  ): Promise<{ text: string; stats: GenerationStats }> {
    if (!this.context) {
      throw new Error('Model not loaded');
    }

    this.isGenerating = true;

    try {
      // Build messages with image/audio attachments as message parts
      const formattedMessages = messages.map((msg) => {
        // If message already has array content (from prior parts), return as-is
        if (Array.isArray(msg.content)) return msg;

        // Check if this is the last user message and has attachments
        const hasAttachments =
          msg.role === 'user' &&
          attachments &&
          attachments.length > 0 &&
          attachments.some((a) => a.type === 'image' || a.type === 'audio');

        if (hasAttachments) {
          const imageAtts = attachments!.filter((a) => a.type === 'image');
          const audioAtts = attachments!.filter((a) => a.type === 'audio');
          const parts: RNLlamaMessagePart[] = [
            { type: 'text', text: msg.content as string },
            ...imageAtts.map((att) => ({
              type: 'image_url' as const,
              image_url: { url: att.uri },
            })),
            ...audioAtts.map((att) => ({
              type: 'input_audio' as const,
              input_audio: { format: 'mp4', url: att.uri },
            })),
          ];
          return { role: msg.role, content: parts };
        }

        return msg;
      });

      const completionParams: any = {
        messages: formattedMessages,
        n_predict: settings.n_predict,
        temperature: settings.temperature,
        top_p: settings.top_p,
        top_k: settings.top_k,
        min_p: settings.min_p,
        penalty_repeat: settings.penalty_repeat,
        penalty_freq: settings.penalty_freq,
        penalty_present: settings.penalty_present,
        stop: STOP_WORDS,
      };

      // Check multimodal support
      const hasImages = attachments?.some((a) => a.type === 'image');
      const hasAudio = attachments?.some((a) => a.type === 'audio');
      if ((hasImages || hasAudio) && !this.multimodalEnabled) {
        console.warn('[LlamaEngine] Multimodal not enabled. Attachments may not work.');
      }

      const result = await this.context.completion(
        completionParams,
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
        if (this.multimodalEnabled) {
          await this.context.releaseMultimodal();
        }
        await this.context.release();
      } catch (error) {
        console.error('Error releasing context:', error);
      }
      this.context = null;
    }
    this.currentTier = null;
    this.lastModelInfo = null;
    this.mmprojPath = null;
    this.multimodalEnabled = false;
  }

  isLoaded(): boolean {
    return this.context !== null;
  }

  isMultimodalLoaded(): boolean {
    return this.multimodalEnabled;
  }

  getCurrentTier(): DeviceTier | null {
    return this.currentTier;
  }
}

export const llamaEngine = new LlamaEngine();
