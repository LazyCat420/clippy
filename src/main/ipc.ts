import { clipboard, Data, ipcMain, BrowserWindow, screen } from "electron";
import {
  toggleChatWindow,
  maximizeChatWindow,
  minimizeChatWindow,
} from "./windows";
import { IpcMessages } from "../ipc-messages";

import { getStateManager } from "./state";
import { getChatManager } from "./chats";
import { ChatWithMessages } from "../types/interfaces";
import { getMainAppMenu } from "./menu";
import { checkForUpdates } from "./update";
import { getVersions } from "./helpers/getVersions";
import { getClippyDebugInfo } from "./debug-clippy";
import { getDebugManager } from "./debug";
import { getLogger } from "./logger";
import { GroundingSearchService } from "./groundingSearch";

export function setupIpcListeners() {
  // Window
  ipcMain.handle(IpcMessages.TOGGLE_CHAT_WINDOW, () => toggleChatWindow());
  ipcMain.handle(IpcMessages.MINIMIZE_CHAT_WINDOW, () => minimizeChatWindow());
  ipcMain.handle(IpcMessages.MAXIMIZE_CHAT_WINDOW, () => maximizeChatWindow());
  ipcMain.handle(IpcMessages.POPUP_APP_MENU, () => getMainAppMenu().popup());

  // State
  ipcMain.handle(IpcMessages.STATE_GET_FULL, () => {
    const state = getStateManager().store.store;
    // Create a safe copy without sensitive data
    const safeState = {
      ...state,
      settings: {
        ...state.settings,
        googleApiKey: state.settings.googleApiKey ? '[REDACTED]' : undefined,
      },
    };
    return safeState;
  });
  ipcMain.handle(IpcMessages.STATE_GET, (_, key: string) => getStateManager().store.get(key));
  ipcMain.handle(IpcMessages.STATE_SET, (_, key: string, value: any) => getStateManager().store.set(key, value));
  ipcMain.handle(IpcMessages.STATE_OPEN_IN_EDITOR, () => getStateManager().store.openInEditor());
  ipcMain.handle(IpcMessages.STATE_GET_GOOGLE_API_KEY, () => {
    const settings = getStateManager().store.get("settings");
    return settings?.googleApiKey || "";
  });

  // Debug
  ipcMain.handle(IpcMessages.DEBUG_STATE_GET_FULL, () => getDebugManager().store.store);
  ipcMain.handle(IpcMessages.DEBUG_STATE_GET, (_, key: string) => getDebugManager().store.get(key));
  ipcMain.handle(IpcMessages.DEBUG_STATE_SET, (_, key: string, value: any) => getDebugManager().store.set(key, value));
  ipcMain.handle(IpcMessages.DEBUG_STATE_OPEN_IN_EDITOR, () => getDebugManager().store.openInEditor());
  ipcMain.handle(IpcMessages.DEBUG_GET_DEBUG_INFO, () => getClippyDebugInfo());

  // App
  ipcMain.handle(IpcMessages.APP_CHECK_FOR_UPDATES, () => checkForUpdates());
  ipcMain.handle(IpcMessages.APP_GET_VERSIONS, () => getVersions());

  // Chat
  ipcMain.handle(IpcMessages.CHAT_GET_CHAT_RECORDS, () =>
    getChatManager().getChats(),
  );
  ipcMain.handle(IpcMessages.CHAT_GET_CHAT_WITH_MESSAGES, (_, chatId: string) =>
    getChatManager().getChatWithMessages(chatId),
  );
  ipcMain.handle(
    IpcMessages.CHAT_WRITE_CHAT_WITH_MESSAGES,
    (_, chatWithMessages: ChatWithMessages) =>
      getChatManager().writeChatWithMessages(chatWithMessages),
  );
  ipcMain.handle(IpcMessages.CHAT_DELETE_CHAT, (_, chatId: string) =>
    getChatManager().deleteChat(chatId),
  );
  ipcMain.handle(IpcMessages.CHAT_DELETE_ALL_CHATS, () =>
    getChatManager().deleteAllChats(),
  );
  
  // Chat new chat event
  ipcMain.handle(IpcMessages.CHAT_NEW_CHAT, () => {
    // This is handled by the renderer, just acknowledge
    return { success: true };
  });

  // Grounding Search
  ipcMain.handle(
    IpcMessages.GROUNDING_SEARCH,
    async (_, prompt: string, apiKey: string, model: string) => {
      try {
        return await GroundingSearchService.performGroundingSearch({
          prompt,
          apiKey,
          model,
        });
      } catch (error) {
        getLogger().error("Grounding search error:", error);
        throw error;
      }
    },
  );

  ipcMain.handle(IpcMessages.GROUNDING_VALIDATE_API_KEY, (_, apiKey: string) => {
    return GroundingSearchService.validateApiKey(apiKey);
  });

  // Clipboard
  ipcMain.handle(IpcMessages.CLIPBOARD_WRITE, (_, data: Data) =>
    clipboard.write(data, "clipboard"),
  );

  // Get window positions for Clippy direction calculation
  ipcMain.handle('GET_WINDOW_POSITIONS', async () => {
    try {
      const allWindows = BrowserWindow.getAllWindows();
      const windowPositions = allWindows.map(window => {
        const bounds = window.getBounds();
        const title = window.getTitle();
        const id = window.id;
        
        return {
          id,
          title,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          isVisible: window.isVisible(),
          isFocused: window.isFocused()
        };
      });
      
      console.log('Window positions:', windowPositions);
      return windowPositions;
    } catch (error) {
      console.error('Error getting window positions:', error);
      return [];
    }
  });

  // Get screen information for coordinate calculations
  ipcMain.handle('GET_SCREEN_INFO', async () => {
    try {
      const displays = screen.getAllDisplays();
      const primaryDisplay = screen.getPrimaryDisplay();
      const cursorPoint = screen.getCursorScreenPoint();
      
      return {
        displays: displays.map(display => ({
          id: display.id,
          bounds: display.bounds,
          workArea: display.workArea,
          scaleFactor: display.scaleFactor
        })),
        primaryDisplay: {
          id: primaryDisplay.id,
          bounds: primaryDisplay.bounds,
          workArea: primaryDisplay.workArea
        },
        cursorPoint: {
          x: cursorPoint.x,
          y: cursorPoint.y
        }
      };
    } catch (error) {
      console.error('Error getting screen info:', error);
      return null;
    }
  });

  // Calculate direction between two points
  ipcMain.handle('CALCULATE_DIRECTION', async (event, clippyPos, chatPos) => {
    try {
      const deltaX = chatPos.x - clippyPos.x;
      const deltaY = chatPos.y - clippyPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // If too far away, don't look
      const maxDistance = 800; // pixels
      if (distance > maxDistance) {
        return { direction: null, distance, reason: 'too_far' };
      }
      
      // Calculate angle in degrees (0 = right, 90 = up, 180 = left, 270 = down)
      const angleDegrees = (Math.atan2(-deltaY, deltaX) * 180 / Math.PI + 360) % 360;
      
      // Convert angle to direction
      let direction = null;
      if (angleDegrees >= 337.5 || angleDegrees < 22.5) {
        direction = "lookRight";
      } else if (angleDegrees >= 22.5 && angleDegrees < 67.5) {
        direction = "lookUpRight";
      } else if (angleDegrees >= 67.5 && angleDegrees < 112.5) {
        direction = "lookUp";
      } else if (angleDegrees >= 112.5 && angleDegrees < 157.5) {
        direction = "lookUpLeft";
      } else if (angleDegrees >= 157.5 && angleDegrees < 202.5) {
        direction = "lookLeft";
      } else if (angleDegrees >= 202.5 && angleDegrees < 247.5) {
        direction = "lookDownLeft";
      } else if (angleDegrees >= 247.5 && angleDegrees < 292.5) {
        direction = "lookDown";
      } else {
        direction = "lookDownRight";
      }
      
      return {
        direction,
        distance,
        angleDegrees,
        deltaX,
        deltaY
      };
    } catch (error) {
      console.error('Error calculating direction:', error);
      return { direction: null, error: error.message };
    }
  });
}
