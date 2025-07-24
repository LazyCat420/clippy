import { clippyApi } from "../clippyApi";
import { useSharedState } from "../contexts/SharedStateContext";
import { Checkbox } from "./Checkbox";

export const SettingsGoogle: React.FC = () => {
  const { settings } = useSharedState();

  const handleApiKeyChange = (value: string) => {
    clippyApi.setState("settings.googleApiKey", value);
  };

  const handleEnableGroundingSearch = (checked: boolean) => {
    clippyApi.setState("settings.enableGroundingSearch", checked);
  };

  const handleModelChange = (value: string) => {
    clippyApi.setState("settings.groundingModel", value);
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