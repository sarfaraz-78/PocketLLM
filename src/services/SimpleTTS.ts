import { NativeModules } from 'react-native';
import { TTSVoice } from '../types';

const TTS = NativeModules.TTS;

class SimpleTTSEngine {
  private isAvailable: boolean = false;
  private isSpeakingFlag: boolean = false;
  private currentVoiceId: string = 'af_bella';

  constructor() {
    this.isAvailable = !!TTS && !!TTS.speak;
  }

  isReady(): boolean {
    return this.isAvailable;
  }

  async getSystemVoices(): Promise<TTSVoice[]> {
    if (!this.isAvailable || !TTS.getVoices) return [];
    try {
      const voices: any[] = await TTS.getVoices();
      return voices.map((v) => ({
        id: v.id,
        name: v.name,
        gender: (v.gender as any) || 'neutral',
        locale: v.locale,
        source: 'system' as const,
      }));
    } catch (e) {
      console.error('[TTS] getVoices error:', e);
      return [];
    }
  }

  setVoice(voiceId: string): void {
    this.currentVoiceId = voiceId;
    if (!this.isAvailable || !TTS.setVoice) return;
    try {
      TTS.setVoice(voiceId);
    } catch (e) {
      console.error('[TTS] setVoice error:', e);
    }
  }

  getCurrentVoiceId(): string {
    return this.currentVoiceId;
  }

  async speak(text: string): Promise<void> {
    if (!this.isAvailable) {
      console.warn('[TTS] Native TTS module not available');
      return;
    }

    try {
      this.isSpeakingFlag = true;
      
      if (TTS.setDefaultLanguage) {
        TTS.setDefaultLanguage('en-US');
      }
      if (TTS.setDefaultRate) {
        TTS.setDefaultRate(0.5);
      }
      if (TTS.setDefaultPitch) {
        TTS.setDefaultPitch(1.0);
      }

      await TTS.speak(text);
      this.isSpeakingFlag = false;
    } catch (e) {
      console.error('[TTS] Speak error:', e);
      this.isSpeakingFlag = false;
    }
  }

  stop(): void {
    if (!this.isAvailable) return;
    try {
      TTS.stop();
      this.isSpeakingFlag = false;
    } catch (e) {
      console.error('[TTS] Stop error:', e);
    }
  }

  isCurrentlySpeaking(): boolean {
    return this.isSpeakingFlag;
  }
}

export const simpleTTS = new SimpleTTSEngine();
