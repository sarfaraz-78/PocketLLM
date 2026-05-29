import { NativeModules } from 'react-native';

const TTS = NativeModules.TTS;

class SimpleTTSEngine {
  private isAvailable: boolean = false;
  private isSpeakingFlag: boolean = false;

  constructor() {
    this.isAvailable = !!TTS && !!TTS.speak;
  }

  isReady(): boolean {
    return this.isAvailable;
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
