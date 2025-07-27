import React from "react";
import { useBubbleView } from "../contexts/BubbleViewContext";
import { useSharedState } from "../contexts/SharedStateContext";

export const WelcomeMessageContent: React.FC = () => {
  const { setCurrentView } = useBubbleView();
  const { settings } = useSharedState();

  const hasApiKey = settings.googleApiKey && settings.googleApiKey.length > 0;

  return (
    <div>
      <strong>Welcome to Clippy!</strong>
      <p>
        This little app is a love letter and homage to the late, great Clippy,
        the assistant from Microsoft Office 1997. The character was designed by
        illustrator Kevan Atteberry, who created more than 15 potential
        characters for Microsoft's Office Assistants. It is <i>not</i>{" "}
        affiliated, approved, or supported by Microsoft. Consider it software
        art or satire.
      </p>
      <p>
        This version of Clippy uses Google's Gemini AI with grounding search to
        provide real-time, up-to-date information from the web. You can ask me
        anything and I'll search for the latest information to help you!
      </p>
      <p>
        By the way, you can open or close this chat window by clicking right on
        Clippy's head.
      </p>

      {!hasApiKey ? (
        <div style={{ marginTop: "15px", marginBottom: "15px" }}>
          <p style={{ color: "#ff6b35", fontWeight: "bold" }}>
            ⚠️ Google API Key Required
          </p>
          <p>
            To start chatting with Clippy, you need to add your Google API key in the settings.
            Get your free API key from{" "}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0066cc" }}
            >
              Google AI Studio
            </a>
          </p>
          <button onClick={() => setCurrentView("settings-google")}>
            Add Google API Key
          </button>
        </div>
      ) : (
        <div style={{ marginTop: "15px", marginBottom: "15px" }}>
          <p style={{ color: "green", fontWeight: "bold" }}>
            ✓ Ready to chat! Google grounding search is enabled.
          </p>
          <p>
            Current model: <strong>{settings.groundingModel || "gemini-2.0-flash-lite"}</strong>
          </p>
        </div>
      )}

      <button onClick={() => setCurrentView("settings-google")}>
        Google Settings
      </button>
    </div>
  );
};
