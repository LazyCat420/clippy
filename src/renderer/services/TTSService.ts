export interface VoiceSettings {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface TTSOptions {
  text: string;
  settings?: VoiceSettings;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

class TTSService {
  private speechSynthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isSupported: boolean;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.isSupported = 'speechSynthesis' in window;
    
    if (this.isSupported) {
      this.loadVoices();
      // Listen for voices to be loaded
      this.speechSynthesis.addEventListener('voiceschanged', () => {
        this.loadVoices();
      });
    }
  }

  private loadVoices() {
    this.voices = this.speechSynthesis.getVoices();
  }

  public getVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  public getAvailableVoices(): Array<{ name: string; lang: string; default?: boolean }> {
    return this.voices.map(voice => ({
      name: voice.name,
      lang: voice.lang,
      default: voice.default
    }));
  }

  public isTTSSupported(): boolean {
    return this.isSupported;
  }

  public speak(options: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        const error = new Error('Speech synthesis is not supported in this browser');
        options.onError?.(error);
        reject(error);
        return;
      }

      // Cancel any current speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(options.text);
      this.currentUtterance = utterance;

      // Apply voice settings
      const settings = options.settings || {};
      
      if (settings.voice) {
        const selectedVoice = this.voices.find(v => v.name === settings.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.rate = settings.rate ?? 1.0;
      utterance.pitch = settings.pitch ?? 1.0;
      utterance.volume = settings.volume ?? 1.0;

      // Event handlers
      utterance.onstart = () => {
        options.onStart?.();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        options.onEnd?.();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        const error = new Error(`TTS Error: ${event.error}`);
        options.onError?.(error);
        reject(error);
      };

      // Start speaking
      this.speechSynthesis.speak(utterance);
    });
  }

  public stop(): void {
    if (this.currentUtterance) {
      this.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
  }

  public pause(): void {
    this.speechSynthesis.pause();
  }

  public resume(): void {
    this.speechSynthesis.resume();
  }

  public isSpeaking(): boolean {
    return this.speechSynthesis.speaking;
  }

  public isPaused(): boolean {
    return this.speechSynthesis.paused;
  }

  // Predefined voice presets
  public getVoicePresets() {
    return {
      classic: {
        name: 'Classic Clippy',
        settings: {
          rate: 0.9,
          pitch: 1.1,
          volume: 0.8
        }
      },
      modern: {
        name: 'Modern Assistant',
        settings: {
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0
        }
      },
      excited: {
        name: 'Excited Clippy',
        settings: {
          rate: 1.2,
          pitch: 1.3,
          volume: 0.9
        }
      },
      calm: {
        name: 'Calm Clippy',
        settings: {
          rate: 0.8,
          pitch: 0.9,
          volume: 0.7
        }
      }
    };
  }

  // Speak with animation context
  public speakWithAnimation(text: string, animationTrigger?: string): Promise<void> {
    // Choose voice preset based on animation context
    let preset = 'modern';
    
    switch (animationTrigger) {
      case 'congratulate':
      case 'excited':
        preset = 'excited';
        break;
      case 'explain':
      case 'thinking':
        preset = 'calm';
        break;
      case 'greeting':
        preset = 'classic';
        break;
      default:
        preset = 'modern';
    }

    const voicePreset = this.getVoicePresets()[preset as keyof ReturnType<typeof this.getVoicePresets>];
    
    return this.speak({
      text,
      settings: voicePreset.settings,
      onStart: () => {
        console.log(`TTS: Started speaking with ${preset} voice`);
      },
      onEnd: () => {
        console.log('TTS: Finished speaking');
      },
      onError: (error) => {
        console.error('TTS Error:', error);
      }
    });
  }
}

// Create singleton instance
export const ttsService = new TTSService(); 