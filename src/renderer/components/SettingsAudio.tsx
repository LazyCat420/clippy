import { useSharedState } from "../contexts/SharedStateContext";
import { clippyApi } from "../clippyApi";
import { ttsService } from "../services/TTSService";
import { audioService } from "../services/AudioService";
import { useState, useEffect } from "react";

export const SettingsAudio: React.FC = () => {
  const { settings } = useSharedState();
  const [availableVoices, setAvailableVoices] = useState<Array<{ name: string; lang: string; default?: boolean }>>([]);
  const [isTTSSupported, setIsTTSSupported] = useState(false);
  const [isAudioSupported, setIsAudioSupported] = useState(false);

  useEffect(() => {
    // Check TTS support
    setIsTTSSupported(ttsService.isTTSSupported());
    setIsAudioSupported(audioService.isAudioSupported());
    
    // Load available voices
    if (isTTSSupported) {
      setAvailableVoices(ttsService.getAvailableVoices());
    }
  }, [isTTSSupported]);

  const handleSettingChange = (key: string, value: any) => {
    clippyApi.setState(`settings.${key}`, value);
  };

  const testTTS = async () => {
    if (isTTSSupported) {
      try {
        await ttsService.speak({
          text: "Hello! This is a test of Clippy's text-to-speech feature.",
          settings: {
            rate: settings.ttsRate,
            pitch: settings.ttsPitch,
            volume: settings.ttsVolume,
            voice: settings.ttsVoice
          }
        });
      } catch (error) {
        console.error("TTS test failed:", error);
      }
    }
  };

  const testSoundEffect = async () => {
    if (isAudioSupported) {
      try {
        await audioService.playSuccessSound();
      } catch (error) {
        console.error("Sound effect test failed:", error);
      }
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <h3>Audio & Speech Settings</h3>
      
      {/* TTS Section */}
      <div style={{ marginBottom: "20px" }}>
        <h4>Text-to-Speech</h4>
        
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="checkbox"
              checked={settings.enableTTS || false}
              onChange={(e) => handleSettingChange("enableTTS", e.target.checked)}
            />
            Enable Text-to-Speech
          </label>
          {!isTTSSupported && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
              TTS is not supported in this browser
            </div>
          )}
        </div>

        {settings.enableTTS && isTTSSupported && (
          <>
            <div style={{ marginBottom: "10px" }}>
              <label>
                Voice:
                <select
                  value={settings.ttsVoice || ""}
                  onChange={(e) => handleSettingChange("ttsVoice", e.target.value)}
                  style={{ marginLeft: "8px" }}
                >
                  <option value="">Default</option>
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>
                Speech Rate: {settings.ttsRate || 1.0}
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.ttsRate || 1.0}
                  onChange={(e) => handleSettingChange("ttsRate", parseFloat(e.target.value))}
                  style={{ marginLeft: "8px", width: "100px" }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>
                Pitch: {settings.ttsPitch || 1.0}
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.ttsPitch || 1.0}
                  onChange={(e) => handleSettingChange("ttsPitch", parseFloat(e.target.value))}
                  style={{ marginLeft: "8px", width: "100px" }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>
                Volume: {settings.ttsVolume || 0.8}
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={settings.ttsVolume || 0.8}
                  onChange={(e) => handleSettingChange("ttsVolume", parseFloat(e.target.value))}
                  style={{ marginLeft: "8px", width: "100px" }}
                />
              </label>
            </div>

            <button onClick={testTTS} style={{ marginTop: "8px" }}>
              Test TTS
            </button>
          </>
        )}
      </div>

      {/* Sound Effects Section */}
      <div style={{ marginBottom: "20px" }}>
        <h4>Sound Effects</h4>
        
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="checkbox"
              checked={settings.enableSoundEffects || false}
              onChange={(e) => handleSettingChange("enableSoundEffects", e.target.checked)}
            />
            Enable Sound Effects
          </label>
          {!isAudioSupported && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
              Audio is not supported in this browser
            </div>
          )}
        </div>

        {settings.enableSoundEffects && isAudioSupported && (
          <button onClick={testSoundEffect} style={{ marginTop: "8px" }}>
            Test Sound Effect
          </button>
        )}
      </div>

      {/* Voice Presets Section */}
      {settings.enableTTS && isTTSSupported && (
        <div style={{ marginBottom: "20px" }}>
          <h4>Voice Presets</h4>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
            Quick voice presets for different moods:
          </p>
          
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                handleSettingChange("ttsRate", 0.9);
                handleSettingChange("ttsPitch", 1.1);
                handleSettingChange("ttsVolume", 0.8);
              }}
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Classic Clippy
            </button>
            
            <button
              onClick={() => {
                handleSettingChange("ttsRate", 1.0);
                handleSettingChange("ttsPitch", 1.0);
                handleSettingChange("ttsVolume", 1.0);
              }}
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Modern
            </button>
            
            <button
              onClick={() => {
                handleSettingChange("ttsRate", 1.2);
                handleSettingChange("ttsPitch", 1.3);
                handleSettingChange("ttsVolume", 0.9);
              }}
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Excited
            </button>
            
            <button
              onClick={() => {
                handleSettingChange("ttsRate", 0.8);
                handleSettingChange("ttsPitch", 0.9);
                handleSettingChange("ttsVolume", 0.7);
              }}
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Calm
            </button>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div style={{ fontSize: "12px", color: "#666", borderTop: "1px solid #ccc", paddingTop: "16px" }}>
        <h4>Information</h4>
        <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
          <li>Text-to-Speech uses your system's built-in voices</li>
          <li>Sound effects are generated using Web Audio API</li>
          <li>Animations will automatically trigger appropriate sounds</li>
          <li>You can test both TTS and sound effects using the buttons above</li>
        </ul>
      </div>
    </div>
  );
}; 