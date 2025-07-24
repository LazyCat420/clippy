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
  onStop?: () => void;
}

class TTSService {
  private speechSynthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isSupported: boolean;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isStopped: boolean = false;
  private currentPromise: Promise<void> | null = null;
  private currentResolve: (() => void) | null = null;
  private currentReject: ((error: Error) => void) | null = null;
  private ttsQueue: Array<{
    options: TTSOptions;
    resolve: () => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessingQueue: boolean = false;

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

  /**
   * Format text for TTS by removing or replacing problematic characters
   */
  private formatTextForTTS(text: string): string {
    return text
      // Replace bullet points and similar characters with periods
      .replace(/[•·‣⁃]/g, '. ')
      // Replace asterisks with spaces (they get pronounced as "asterisk")
      .replace(/\*/g, ' ')
      // Replace underscores with spaces
      .replace(/_/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      // Replace multiple periods with single period
      .replace(/\.+/g, '.')
      // Clean up any remaining special characters that might cause issues
      .replace(/[^\w\s.,!?;:()\-'"]/g, ' ')
      // Trim whitespace
      .trim();
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

      // Add to queue
      this.ttsQueue.push({ options, resolve, reject });
      
      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.ttsQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.ttsQueue.length > 0) {
      const { options, resolve, reject } = this.ttsQueue.shift()!;
      
      try {
        await this.startNewUtterance(options);
        resolve();
      } catch (error) {
        reject(error as Error);
      }
    }

    this.isProcessingQueue = false;
  }

  private startNewUtterance(options: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      // Format text for TTS
      const formattedText = this.formatTextForTTS(options.text);
      
      // Don't speak if text is empty after formatting
      if (!formattedText.trim()) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(formattedText);
      this.currentUtterance = utterance;
      this.isStopped = false;
      this.currentPromise = new Promise<void>((innerResolve, innerReject) => {
        this.currentResolve = innerResolve;
        this.currentReject = innerReject;
      });

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
        this.cleanup();
        if (!this.isStopped) {
          options.onEnd?.();
          resolve();
        } else {
          resolve(); // Resolve even if stopped to continue queue
        }
      };

      utterance.onerror = (event) => {
        this.cleanup();
        const error = new Error(`TTS Error: ${event.error}`);
        options.onError?.(error);
        reject(error);
      };

      // Start speaking
      this.speechSynthesis.speak(utterance);
    });
  }

  private cleanup() {
    this.currentUtterance = null;
    this.currentPromise = null;
    this.currentResolve = null;
    this.currentReject = null;
  }

  public stop(): void {
    if (this.currentUtterance) {
      this.isStopped = true;
      this.speechSynthesis.cancel();
      this.cleanup();
    }
    
    // Clear the queue when stopping
    this.ttsQueue = [];
  }

  public stopAll(): void {
    // Stop current utterance
    this.stop();
    
    // Clear the queue
    this.clearQueue();
    
    // Cancel any pending speech synthesis
    this.speechSynthesis.cancel();
    
    // Reset all state
    this.isStopped = false;
    this.isProcessingQueue = false;
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

  public getQueueLength(): number {
    return this.ttsQueue.length;
  }

  public isQueueProcessing(): boolean {
    return this.isProcessingQueue;
  }

  public clearQueue(): void {
    this.ttsQueue = [];
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
      },
      technical: {
        name: 'Technical Clippy',
        settings: {
          rate: 1.1,
          pitch: 1.0,
          volume: 0.9
        }
      },
      creative: {
        name: 'Creative Clippy',
        settings: {
          rate: 1.0,
          pitch: 1.2,
          volume: 0.8
        }
      },
      alert: {
        name: 'Alert Clippy',
        settings: {
          rate: 1.3,
          pitch: 1.4,
          volume: 1.0
        }
      },
      friendly: {
        name: 'Friendly Clippy',
        settings: {
          rate: 0.9,
          pitch: 1.1,
          volume: 0.8
        }
      }
    };
  }

  // Enhanced speak with animation context
  public speakWithAnimation(text: string, animationTrigger?: string): Promise<void> {
    // Choose voice preset based on animation context with expanded mapping
    let preset = 'modern';
    
    switch (animationTrigger) {
      // Celebration and success
      case 'congratulate':
      case 'excited':
        preset = 'excited';
        break;
        
      // Explanations and teaching
      case 'explain':
      case 'thinking':
        preset = 'calm';
        break;
        
      // Greetings and friendly interactions
      case 'greeting':
      case 'wave':
      case 'friendly':
        preset = 'friendly';
        break;
        
      // Technical content
      case 'getTechy':
      case 'checkingSomething':
      case 'processing':
        preset = 'technical';
        break;
        
      // Creative content
      case 'getArtsy':
      case 'getWizardy':
        preset = 'creative';
        break;
        
      // Alerts and warnings
      case 'alert':
      case 'getAttention':
        preset = 'alert';
        break;
        
      // Goodbyes
      case 'goodbye':
        preset = 'friendly';
        break;
        
      // Default
      default:
        preset = 'modern';
    }

    const voicePreset = this.getVoicePresets()[preset as keyof ReturnType<typeof this.getVoicePresets>];
    
    return this.speak({
      text,
      settings: voicePreset.settings,
      onStart: () => {
        console.log(`TTS: Started speaking with ${preset} voice (trigger: ${animationTrigger})`);
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