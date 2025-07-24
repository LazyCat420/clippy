import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "../contexts/ChatContext";
import { useSharedState } from "../contexts/SharedStateContext";
export type ChatInputProps = {
  onSend: (message: string) => void;
  onAbort: () => void;
  onToggleGrounding?: () => void;
};

export function ChatInput({ onSend, onAbort, onToggleGrounding }: ChatInputProps) {
  const { status } = useChat();
  const { settings } = useSharedState();
  const [message, setMessage] = useState("");
  const { isModelLoaded } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const placeholder = isModelLoaded
    ? settings.enableGroundingSearch && settings.googleApiKey
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
      
      {/* Grounding Search Toggle Button */}
      {isModelLoaded && onToggleGrounding && (
        <button
          onClick={onToggleGrounding}
          style={{
            marginRight: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            backgroundColor: settings.enableGroundingSearch && settings.googleApiKey ? "#4CAF50" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            minWidth: "60px",
          }}
          title={settings.enableGroundingSearch && settings.googleApiKey 
            ? `Grounding Search ON (${settings.groundingModel || "gemini-2.0-flash"})` 
            : "Grounding Search OFF"}
        >
          🌐 {settings.enableGroundingSearch && settings.googleApiKey ? "ON" : "OFF"}
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
