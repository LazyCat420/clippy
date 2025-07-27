import { clippyApi } from "../clippyApi";
import { useSharedState } from "../contexts/SharedStateContext";
import { useState } from "react";

export const SettingsGoogle: React.FC = () => {
  const { settings } = useSharedState();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>("");

  const handleApiKeyChange = async (value: string) => {
    setIsSaving(true);
    await clippyApi.setState("settings.googleApiKey", value);
    setIsSaving(false);
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleModelChange = (value: string) => {
    clippyApi.setState("settings.groundingModel", value);
  };

  const testApiKey = async () => {
    try {
      const apiKey = await clippyApi.getGoogleApiKey();
      if (apiKey) {
        const isValid = await clippyApi.validateApiKey(apiKey);
        if (isValid) {
          alert("✅ API key is valid and working!");
        } else {
          alert("❌ API key appears to be invalid. Please check your key.");
        }
      } else {
        alert("❌ No API key found. Please enter your Google API key.");
      }
    } catch (error) {
      alert(`❌ Error testing API key: ${error}`);
    }
  };

  const debugApiKey = async () => {
    try {
      const apiKey = await clippyApi.getGoogleApiKey();
      const hasApiKey = apiKey && apiKey.length > 0;
      const keyLength = apiKey ? apiKey.length : 0;
      const keyStart = apiKey ? apiKey.substring(0, 4) : "N/A";
      
      alert(`🔍 API Key Debug Info:
• Has API Key: ${hasApiKey ? "Yes" : "No"}
• Key Length: ${keyLength} characters
• Key Starts With: ${keyStart}...
• Grounding Search: Always Enabled
• Grounding Model: ${settings.groundingModel || "Not set"}`);
    } catch (error) {
      alert(`❌ Error getting debug info: ${error}`);
    }
  };

  return (
    <div>
      <fieldset>
        <legend>Google Gemini Grounding Search</legend>
        <p>
          Clippy uses Google's Gemini AI with grounding search to provide real-time information from the web.
          This allows Clippy to search the internet and provide up-to-date answers to your questions.
        </p>
        
        <div style={{ marginTop: "15px" }}>
          <label htmlFor="googleApiKey" style={{ display: "block", marginBottom: "5px" }}>
            Google API Key: *
          </label>
          <input
            id="googleApiKey"
            type="password"
            value={settings.googleApiKey || ""}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="Enter your Google API key"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              fontFamily: "monospace",
            }}
          />
          <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
            Get your API key from{" "}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0066cc" }}
            >
              Google AI Studio
            </a>
          </p>
          <p style={{ fontSize: "11px", color: "#888", marginTop: "3px", fontStyle: "italic" }}>
            🔒 Your API key is encrypted and stored locally. It's never logged or shared.
          </p>
          {isSaving && (
            <p style={{ fontSize: "11px", color: "#0066cc", marginTop: "3px" }}>
              💾 Saving...
            </p>
          )}
          {lastSaved && (
            <p style={{ fontSize: "11px", color: "#4CAF50", marginTop: "3px" }}>
              ✅ Saved at {lastSaved}
            </p>
          )}
        </div>

        <div style={{ marginTop: "15px" }}>
          <label htmlFor="groundingModel" style={{ display: "block", marginBottom: "5px" }}>
            Grounding Model:
          </label>
          <select
            id="groundingModel"
            value={settings.groundingModel || "gemini-2.0-flash"}
            onChange={(e) => handleModelChange(e.target.value)}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          >
            <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite (Free - Recommended)</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash (Free - High RPM)</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite (Free)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Free)</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash (Free)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Paid)</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro (Paid)</option>
          </select>
                      <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
              Choose the model for grounding search. Gemini 2.0 Flash Lite is recommended for free tier users. All models support grounding search.
            </p>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={testApiKey}
            style={{
              padding: "8px 16px",
              marginRight: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Test API Key
          </button>
          <button
            onClick={debugApiKey}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Debug Info
          </button>
        </div>

        <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f0f8ff", borderRadius: "4px" }}>
          <h4 style={{ margin: "0 0 10px 0", color: "#0066cc" }}>ℹ️ About Google Grounding Search</h4>
          <ul style={{ margin: "0", paddingLeft: "20px", fontSize: "14px" }}>
            <li>Real-time web search for up-to-date information</li>
            <li>Source citations and clickable search results</li>
            <li>No local model downloads or VRAM usage</li>
            <li>Requires internet connection and Google API key</li>
            <li>Free tier available with generous limits</li>
          </ul>
        </div>
      </fieldset>
    </div>
  );
}; 