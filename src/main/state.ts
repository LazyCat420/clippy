import Store from "electron-store";

import { getChatWindow, getMainWindow, setFont, setFontSize } from "./windows";
import { IpcMessages } from "../ipc-messages";
import { EMPTY_SHARED_STATE, SettingsState, SharedState } from "../sharedState";
import { getLogger } from "./logger";
import { setupAppMenu } from "./menu";

export class StateManager {
  public store = new Store<SharedState>({
    defaults: {
      ...EMPTY_SHARED_STATE,
    },
    encryptionKey: 'clippy-secure-key-2024', // Encrypt sensitive data
  });

  constructor() {
    this.ensureCorrectSettingsState();

    this.store.onDidAnyChange(this.onDidAnyChange);

    // Handle settings changes
    this.store.onDidChange("settings", (newValue, oldValue) => {
      this.onSettingsChange(newValue, oldValue);
    });
  }

  private ensureCorrectSettingsState() {
    const settings = this.store.get("settings");

    if (settings.topK === undefined) {
      settings.topK = 10;
    }

    if (settings.temperature === undefined) {
      settings.temperature = 0.7;
    }

    this.store.set("settings", settings);
  }

  /**
   * Handles settings changes.
   */
  private onSettingsChange(newValue: SettingsState, oldValue?: SettingsState) {
    const logger = getLogger();

    // Handle font changes
    if (newValue.defaultFont !== oldValue?.defaultFont) {
      setFont(newValue.defaultFont);
      logger.info(`Font changed to ${newValue.defaultFont}`);
    }

    if (newValue.defaultFontSize !== oldValue?.defaultFontSize) {
      setFontSize(newValue.defaultFontSize);
      logger.info(`Font size changed to ${newValue.defaultFontSize}`);
    }

    // Handle window behavior changes
    if (newValue.clippyAlwaysOnTop !== oldValue?.clippyAlwaysOnTop) {
      const mainWindow = getMainWindow();
      if (mainWindow) {
        mainWindow.setAlwaysOnTop(newValue.clippyAlwaysOnTop || false);
        logger.info(`Clippy always on top: ${newValue.clippyAlwaysOnTop}`);
      }
    }

    if (newValue.chatAlwaysOnTop !== oldValue?.chatAlwaysOnTop) {
      const chatWindow = getChatWindow();
      if (chatWindow) {
        chatWindow.setAlwaysOnTop(newValue.chatAlwaysOnTop || false);
        logger.info(`Chat always on top: ${newValue.chatAlwaysOnTop}`);
      }
    }

    // Handle auto-open chat
    if (newValue.alwaysOpenChat !== oldValue?.alwaysOpenChat) {
      logger.info(`Always open chat: ${newValue.alwaysOpenChat}`);
    }

    // Handle TTS changes
    if (newValue.enableTTS !== oldValue?.enableTTS) {
      logger.info(`TTS enabled: ${newValue.enableTTS}`);
    }

    // Handle grounding search changes
    if (newValue.enableGroundingSearch !== oldValue?.enableGroundingSearch) {
      logger.info(`Grounding search enabled: ${newValue.enableGroundingSearch}`);
    }

    // Update menu
    setupAppMenu();
  }

  public onDidAnyChange(newValue: SharedState = this.store.store) {
    const logger = getLogger();
    logger.debug("State changed, notifying renderer");

    // Notify renderer of state change
    const chatWindow = getChatWindow();
    if (chatWindow) {
      chatWindow.webContents.send(IpcMessages.STATE_CHANGED, newValue);
    }
  }
}

let _stateManager: StateManager | null = null;

export function getStateManager() {
  if (!_stateManager) {
    _stateManager = new StateManager();
  }
  return _stateManager;
}
