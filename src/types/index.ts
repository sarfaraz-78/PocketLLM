export enum DeviceTier {
  ULTRA_LOW = 'ULTRA_LOW',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  PREMIUM = 'PREMIUM',
}

export interface DeviceProfile {
  tier: DeviceTier;
  ramGB: number;
  cpuCores: number;
  platform: 'ios' | 'android';
  gpuAvailable: boolean;
  gpuName?: string;
  cpuModel?: string;
  abis?: string[];
  is64Bit?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  timings?: {
    tokensPerSecond: number;
    totalTokens: number;
    promptTokens: number;
    promptPerSecond?: number;
    totalTimeMs?: number;
  };
  attachments?: Array<{ uri: string; type: 'image' | 'audio'; name?: string; duration?: number }>;
  ttsAudioUri?: string;
  ttsDuration?: number;
  // v3.0: Conversation branching
  branchId?: string;
  parentMessageId?: string;
  branchSiblings?: string[];
}

export interface ConversationBranch {
  id: string;
  parentMessageId: string;
  createdAt: number;
  active: boolean;
  messageCount: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  repoId: string;
  fileName: string;
  downloadUrl: string;
  sizeMB: number;
  quantization: string;
  params: string;
  architecture?: string;
  tier: DeviceTier;
  localPath?: string;
  downloadStatus: 'not_downloaded' | 'downloading' | 'downloaded' | 'error';
  downloadProgress?: number;
  availableQuants?: Array<{ fileName: string; sizeMB: number; quantLabel: string }>;
  specs?: {
    vocabSize?: number;
    contextSize?: number;
    embeddingLength?: number;
    layerCount?: number;
    feedForwardLength?: number;
    headCount?: number;
    kvHeadCount?: number;
    maxTokens?: number;
    quantizationVersion?: string;
  };
  mmprojPath?: string;
  isMultimodal?: boolean;
  // v3.0: User notes and ratings
  userNote?: string;
  userRating?: number;
  lastUsedAt?: number;
  useCount?: number;
}

export interface InferencePreset {
  n_ctx: number;
  n_gpu_layers: number;
  n_threads: number;
  n_batch: number;
  n_ubatch: number;
  cache_type_k: 'f16' | 'f32' | 'q8_0' | 'q4_0' | 'q4_1' | 'iq4_nl' | 'q5_0' | 'q5_1';
  cache_type_v: 'f16' | 'f32' | 'q8_0' | 'q4_0' | 'q4_1' | 'iq4_nl' | 'q5_0' | 'q5_1';
  flash_attn_type: 'auto' | 'on' | 'off';
  use_mmap: boolean;
  use_mlock: boolean;
  no_extra_bufts: boolean;
  ctx_shift: boolean;
}

export interface CompletionSettings {
  temperature: number;
  top_p: number;
  top_k: number;
  min_p: number;
  n_predict: number;
  penalty_repeat: number;
  penalty_freq: number;
  penalty_present: number;
}

export interface TTSVoice {
  id: string;
  name: string;
  gender: 'female' | 'male' | 'neutral';
  locale?: string;
  source: 'kokoro' | 'system';
}

export interface AppSettings {
  deviceTier: DeviceTier | null;
  tierOverride: boolean;
  systemPrompt: string;
  completionSettings: CompletionSettings;
  darkMode: boolean;
  onboardingComplete: boolean;
  enableThinking: boolean;
  codingMode: boolean;
  ttsVoiceId: string;
  turboQuantEnabled: boolean;
}

export interface HuggingFaceModel {
  id: string;
  modelId: string;
  author: string;
  sha: string;
  downloads: number;
  likes: number;
  tags: string[];
  siblings: Array<{
    rfilename: string;
    size?: number;
  }>;
}

export interface GenerationStats {
  tokensPerSecond: number;
  totalTokens: number;
  promptTokens: number;
  promptPerSecond: number;
  totalTimeMs: number;
}
