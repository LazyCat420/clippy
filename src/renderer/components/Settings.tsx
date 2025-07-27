import { useState } from "react";
import { SettingsAppearance } from "./SettingsAppearance";
import { SettingsGoogle } from "./SettingsGoogle";
import { SettingsAudio } from "./SettingsAudio";
import { SettingsAdvanced } from "./SettingsAdvanced";
import { SettingsAbout } from "./SettingsAbout";

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("appearance");

  const tabs = [
    { id: "appearance", label: "Appearance", component: SettingsAppearance },
    { id: "google", label: "Google", component: SettingsGoogle },
    { id: "audio", label: "Audio", component: SettingsAudio },
    { id: "advanced", label: "Advanced", component: SettingsAdvanced },
    { id: "about", label: "About", component: SettingsAbout },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || SettingsAppearance;

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "20px", fontSize: "24px", fontWeight: "bold" }}>
        Clippy Settings
      </h1>

      <div style={{ marginBottom: "20px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px",
              marginRight: "8px",
              border: "1px solid #ccc",
              backgroundColor: activeTab === tab.id ? "#0078d4" : "#f0f0f0",
              color: activeTab === tab.id ? "white" : "black",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "4px" }}>
        <ActiveComponent />
      </div>
    </div>
  );
};
