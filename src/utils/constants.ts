import { CompletionSettings } from '../types';

export const DEFAULT_SYSTEM_PROMPT =
  'You are a helpful, friendly AI assistant. Keep your responses concise and helpful.';

export const DEFAULT_COMPLETION_SETTINGS: CompletionSettings = {
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  min_p: 0.05,
  n_predict: 512,
  penalty_repeat: 1.1,
  penalty_freq: 0.0,
  penalty_present: 0.0,
};

export const MODEL_FILE_EXTENSION = '.gguf';

export const HUGGINGFACE_API_BASE = 'https://huggingface.co/api';

export const APP_NAME = 'PocketLLM';
