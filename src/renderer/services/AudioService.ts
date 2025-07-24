export interface AudioSettings {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
}

export interface AudioOptions {
  settings?: AudioSettings;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'AudioContext' in window || 'webkitAudioContext' in window;
    
    if (this.isSupported) {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
      this.isSupported = false;
    }
  }

  public isAudioSupported(): boolean {
    return this.isSupported;
  }

  public async loadSound(name: string, url: string): Promise<void> {
    if (!this.isSupported || !this.audioContext) {
      throw new Error('Audio is not supported');
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.error(`Failed to load sound ${name}:`, error);
      throw error;
    }
  }

  public playSound(name: string, options: AudioOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.audioContext) {
        const error = new Error('Audio is not supported');
        options.onError?.(error);
        reject(error);
        return;
      }

      const audioBuffer = this.sounds.get(name);
      if (!audioBuffer) {
        const error = new Error(`Sound ${name} not found`);
        options.onError?.(error);
        reject(error);
        return;
      }

      try {
        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        source.buffer = audioBuffer;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Apply settings
        const settings = options.settings || {};
        gainNode.gain.value = settings.volume ?? 0.5;
        source.playbackRate.value = settings.playbackRate ?? 1.0;
        source.loop = settings.loop ?? false;

        // Event handlers
        source.onended = () => {
          options.onEnd?.();
          resolve();
        };

        // Note: AudioBufferSourceNode doesn't have onerror, so we handle errors differently
        // Errors will be caught in the try-catch block below

        options.onStart?.();
        source.start(0);
      } catch (error) {
        options.onError?.(error as Error);
        reject(error);
      }
    });
  }

  public stopAllSounds(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.initAudioContext();
    }
  }

  // Predefined sound effects
  public async playAnimationSound(animationName: string): Promise<void> {
    const soundMap: Record<string, string> = {
      'Congratulate': 'success',
      'Alert': 'alert',
      'GetAttention': 'attention',
      'Greeting': 'greeting',
      'GoodBye': 'goodbye',
      'Thinking': 'thinking',
      'Processing': 'processing',
      'Writing': 'writing',
      'Searching': 'searching'
    };

    const soundName = soundMap[animationName];
    if (soundName) {
      try {
        await this.playSound(soundName, {
          settings: { volume: 0.3 },
          onError: (error) => {
            console.warn(`Could not play sound for ${animationName}:`, error);
          }
        });
      } catch (error) {
        // Silently fail for missing sounds
        console.warn(`Sound not available for ${animationName}`);
      }
    }
  }

  // Generate simple tones for testing
  public playTone(frequency: number, duration: number, options: AudioOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported || !this.audioContext) {
        const error = new Error('Audio is not supported');
        options.onError?.(error);
        reject(error);
        return;
      }

      try {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        const settings = options.settings || {};
        gainNode.gain.value = settings.volume ?? 0.1;

        oscillator.onended = () => {
          options.onEnd?.();
          resolve();
        };

        options.onStart?.();
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration / 1000);
      } catch (error) {
        options.onError?.(error as Error);
        reject(error);
      }
    });
  }

  // Paper clip sound effect (simple tone)
  public async playPaperClipSound(): Promise<void> {
    await this.playTone(800, 200, {
      settings: { volume: 0.2 },
      onError: (error) => {
        console.warn('Could not play paper clip sound:', error);
      }
    });
  }

  // Notification sound
  public async playNotificationSound(): Promise<void> {
    await this.playTone(1000, 300, {
      settings: { volume: 0.3 },
      onError: (error) => {
        console.warn('Could not play notification sound:', error);
      }
    });
  }

  // Success sound
  public async playSuccessSound(): Promise<void> {
    try {
      await this.playTone(523, 150, { settings: { volume: 0.2 } }); // C
      await this.playTone(659, 150, { settings: { volume: 0.2 } }); // E
      await this.playTone(784, 300, { settings: { volume: 0.2 } }); // G
    } catch (error) {
      console.warn('Could not play success sound:', error);
    }
  }

  // Error sound
  public async playErrorSound(): Promise<void> {
    try {
      await this.playTone(200, 200, { settings: { volume: 0.3 } });
      await this.playTone(150, 200, { settings: { volume: 0.3 } });
    } catch (error) {
      console.warn('Could not play error sound:', error);
    }
  }
}

// Create singleton instance
export const audioService = new AudioService(); 