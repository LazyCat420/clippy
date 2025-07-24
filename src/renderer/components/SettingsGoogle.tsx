import { clippyApi } from "../clippyApi";
import { useSharedState } from "../contexts/SharedStateContext";
import { Checkbox } from "./Checkbox";
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

  const handleEnableGroundingSearch = (checked: boolean) => {
    clippyApi.setState("settings.enableGroundingSearch", checked);
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
• Enable Grounding Search: ${settings.enableGroundingSearch ? "Yes" : "No"}
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
          Enable Clippy to search the internet for real-time information using Google's Gemini API.
          This allows Clippy to provide up-to-date answers to your questions.
        </p>
        
        <Checkbox
          id="enableGroundingSearch"
          label="Enable grounding search (requires Google API key)"
          checked={settings.enableGroundingSearch || false}
          onChange={handleEnableGroundingSearch}
        />

        {settings.enableGroundingSearch && (
          <>
            <div style={{ marginTop: "15px" }}>
              <label htmlFor="googleApiKey" style={{ display: "block", marginBottom: "5px" }}>
                Google API Key:
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
              <button 
                onClick={testApiKey}
                style={{ 
                  marginTop: "8px", 
                  padding: "6px 12px",
                  fontSize: "12px",
                  backgroundColor: "#0066cc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Test API Key
              </button>
              <button 
                onClick={debugApiKey}
                style={{ 
                  marginTop: "8px", 
                  marginLeft: "8px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  backgroundColor: "#666",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Debug Info
              </button>
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
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended - High RPM)</option>
                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
              </select>
              <p style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                Choose the model for grounding search. Gemini 2.0 Flash is recommended for high request rates.
              </p>
            </div>

            <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f0f8ff", borderRadius: "4px" }}>
              <strong>How it works:</strong>
              <ul style={{ margin: "5px 0", paddingLeft: "20px" }}>
                <li>When you ask a question, Clippy will search the internet for relevant information</li>
                <li>Search results are used to provide grounded, up-to-date answers</li>
                <li>Source links are provided for verification</li>
                <li>Your API key is stored locally and never shared</li>
              </ul>
            </div>
          </>
        )}
      </fieldset>
    </div>
  );
}; 