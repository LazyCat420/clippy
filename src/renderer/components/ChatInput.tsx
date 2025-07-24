import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "../contexts/ChatContext";
import { useSharedState } from "../contexts/SharedStateContext";
import { ttsService } from "../services/TTSService";
import { clippyApi } from "../clippyApi";

export type ChatInputProps = {
  onSend: (message: string) => void;
  onAbort: () => void;
  onToggleGrounding?: () => void;
};

export function ChatInput({ onSend, onAbort, onToggleGrounding }: ChatInputProps) {
  const { status } = useChat();
  const { settings } = useSharedState();
  const [message, setMessage] = useState("");
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);
  const [ttsQueueLength, setTtsQueueLength] = useState(0);
  const [actualApiKey, setActualApiKey] = useState<string>("");
  const { isModelLoaded } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get the actual API key on component mount
  useEffect(() => {
    const getApiKey = async () => {
      try {
        const apiKey = await clippyApi.getGoogleApiKey();
        setActualApiKey(apiKey);
      } catch (error) {
        console.error("Failed to get API key:", error);
        setActualApiKey("");
      }
    };
    
    getApiKey();
  }, []);

  // Refresh API key when settings change
  useEffect(() => {
    const getApiKey = async () => {
      try {
        const apiKey = await clippyApi.getGoogleApiKey();
        setActualApiKey(apiKey);
      } catch (error) {
        console.error("Failed to get API key:", error);
        setActualApiKey("");
      }
    };
    
    // Small delay to ensure the setting has been saved
    const timeoutId = setTimeout(getApiKey, 100);
    return () => clearTimeout(timeoutId);
  }, [settings.googleApiKey]);

  // Check TTS speaking status periodically
  useEffect(() => {
    const checkTTSSpeaking = () => {
      setIsTTSSpeaking(ttsService.isSpeaking());
      setTtsQueueLength(ttsService.getQueueLength());
    };

    // Check immediately
    checkTTSSpeaking();

    // Check every 100ms when TTS is enabled
    const interval = settings.enableTTS ? setInterval(checkTTSSpeaking, 100) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [settings.enableTTS]);

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();

    if (trimmedMessage) {
      onSend(trimmedMessage);
      setMessage("");
    }
  }, [message, onSend]);

  const handleAbort = useCallback(() => {
    setMessage("");
    onAbort();
  }, [onAbort]);

  const handleStopTTS = useCallback(() => {
    ttsService.stopAll();
  }, []);

  const handleSendOrAbort = useCallback(() => {
    if (status === "responding") {
      handleAbort();
    } else {
      handleSend();
    }
  }, [status, handleSend, handleAbort]);

  const buttonStyle: React.CSSProperties = {
    alignSelf: "flex-end",
    height: "23px",
  };

  useEffect(() => {
    if (isModelLoaded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isModelLoaded]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const trimmedMessage = message.trim();

      if (trimmedMessage) {
        onSend(trimmedMessage);
        setMessage("");
      }

      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Global keyboard listener for TTS stop
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && settings.enableTTS && (ttsService.isSpeaking() || ttsService.getQueueLength() > 0)) {
        ttsService.stopAll();
        e.preventDefault();
      }
    };

    if (settings.enableTTS) {
      document.addEventListener('keydown', handleGlobalKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [settings.enableTTS]);

  const placeholder = isModelLoaded
    ? settings.enableGroundingSearch && actualApiKey
      ? "Type a message, press Enter to send... (🌐 Grounding Search Enabled)"
      : "Type a message, press Enter to send..."
    : "This is your chat input, we're just waiting for a model to load...";

  return (
    <div style={{ display: "flex", alignItems: "flex-end" }}>
      <textarea
        rows={1}
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={!isModelLoaded}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        style={{
          flex: 1,
          marginRight: "8px",
          resize: "vertical",
          minHeight: "23px",
          width: 80,
        }}
      />
      
      {/* TTS Stop Button */}
      {settings.enableTTS && (isTTSSpeaking || ttsQueueLength > 0) && (
        <button
          onClick={handleStopTTS}
          style={{
            marginRight: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            backgroundColor: "#ff4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            minWidth: "60px",
          }}
          title={`Stop TTS${ttsQueueLength > 0 ? ` (${ttsQueueLength} in queue)` : ''}`}
        >
          🔇 {ttsQueueLength > 0 ? `Stop (${ttsQueueLength})` : 'Stop'}
        </button>
      )}
      
      {/* Grounding Search Toggle Button */}
      {isModelLoaded && onToggleGrounding && (
        <button
          onClick={onToggleGrounding}
          style={{
            marginRight: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            backgroundColor: settings.enableGroundingSearch && actualApiKey ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            minWidth: "60px",
          }}
          title={settings.enableGroundingSearch && actualApiKey 
            ? `Grounding Search ON (${settings.groundingModel || "gemini-2.0-flash"})` 
            : "Grounding Search OFF"}
        >
          🌐 {settings.enableGroundingSearch && actualApiKey ? "ON" : "OFF"}
        </button>
      )}
      
      <button
        disabled={!isModelLoaded}
        style={buttonStyle}
        onClick={handleSendOrAbort}
      >
        {status === "responding" ? "Abort" : "Send"}
      </button>
    </div>
  );
}
