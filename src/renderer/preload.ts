// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, Data, ipcRenderer } from "electron";
import { IpcMessages } from "../ipc-messages";
import type { SharedState } from "../sharedState";
import type { ClippyApi } from "./clippyApi";
import { ChatWithMessages } from "../types/interfaces";
import { DebugState } from "../debugState";
import { BubbleView } from "./contexts/BubbleViewContext";

const clippyApi: ClippyApi = {
  // Window
  toggleChatWindow: () => ipcRenderer.invoke(IpcMessages.TOGGLE_CHAT_WINDOW),
  minimizeChatWindow: () => ipcRenderer.invoke(IpcMessages.MINIMIZE_CHAT_WINDOW),
  maximizeChatWindow: () => ipcRenderer.invoke(IpcMessages.MAXIMIZE_CHAT_WINDOW),
  onSetBubbleView: (callback) => {
    ipcRenderer.on(IpcMessages.SET_BUBBLE_VIEW, (_, bubbleView: BubbleView) => callback(bubbleView));
  },
  offSetBubbleView: () => {
    ipcRenderer.removeAllListeners(IpcMessages.SET_BUBBLE_VIEW);
  },
  popupAppMenu: () => ipcRenderer.invoke(IpcMessages.POPUP_APP_MENU),



  // State
  offStateChanged: () => {
    ipcRenderer.removeAllListeners(IpcMessages.STATE_CHANGED);
  },
  onStateChanged: (callback) => {
    ipcRenderer.on(IpcMessages.STATE_CHANGED, (_, state: SharedState) => callback(state));
  },
  getFullState: () => ipcRenderer.invoke(IpcMessages.STATE_GET_FULL),
  getState: (key: string) => ipcRenderer.invoke(IpcMessages.STATE_GET, key),
  setState: (key: string, value: any) => ipcRenderer.invoke(IpcMessages.STATE_SET, key, value),
  openStateInEditor: () => ipcRenderer.invoke(IpcMessages.STATE_OPEN_IN_EDITOR),
  getGoogleApiKey: () => ipcRenderer.invoke(IpcMessages.STATE_GET_GOOGLE_API_KEY),

  // Debug
  offDebugStateChanged: () => {
    ipcRenderer.removeAllListeners(IpcMessages.DEBUG_STATE_CHANGED);
  },
  onDebugStateChanged: (callback) => {
    ipcRenderer.on(IpcMessages.DEBUG_STATE_CHANGED, (_, state: DebugState) => callback(state));
  },
  getFullDebugState: () => ipcRenderer.invoke(IpcMessages.DEBUG_STATE_GET_FULL),
  getDebugState: (key: string) => ipcRenderer.invoke(IpcMessages.DEBUG_STATE_GET, key),
  setDebugState: (key: string, value: any) => ipcRenderer.invoke(IpcMessages.DEBUG_STATE_SET, key, value),
  openDebugStateInEditor: () => ipcRenderer.invoke(IpcMessages.DEBUG_STATE_OPEN_IN_EDITOR),
  getDebugInfo: () => ipcRenderer.invoke(IpcMessages.DEBUG_GET_DEBUG_INFO),

  // App
  getVersions: () => ipcRenderer.invoke(IpcMessages.APP_GET_VERSIONS),
  checkForUpdates: () => ipcRenderer.invoke(IpcMessages.APP_CHECK_FOR_UPDATES),

  // Grounding Search
  performGroundingSearch: (prompt: string, apiKey: string, model: string) =>
    ipcRenderer.invoke(IpcMessages.GROUNDING_SEARCH, prompt, apiKey, model),
  validateApiKey: (apiKey: string) => ipcRenderer.invoke(IpcMessages.GROUNDING_VALIDATE_API_KEY, apiKey),

  // Chat
  getChatRecords: () => ipcRenderer.invoke(IpcMessages.CHAT_GET_CHAT_RECORDS),
  getChatWithMessages: (chatId: string) => ipcRenderer.invoke(IpcMessages.CHAT_GET_CHAT_WITH_MESSAGES, chatId),
  writeChatWithMessages: (chatWithMessages: ChatWithMessages) =>
    ipcRenderer.invoke(IpcMessages.CHAT_WRITE_CHAT_WITH_MESSAGES, chatWithMessages),
  deleteChat: (chatId: string) => ipcRenderer.invoke(IpcMessages.CHAT_DELETE_CHAT, chatId),
  deleteAllChats: () => ipcRenderer.invoke(IpcMessages.CHAT_DELETE_ALL_CHATS),
  onNewChat: (callback: () => void) => {
    ipcRenderer.on(IpcMessages.CHAT_NEW_CHAT, callback);
  },
  offNewChat: () => {
    ipcRenderer.removeAllListeners(IpcMessages.CHAT_NEW_CHAT);
  },

  // Clipboard
  clipboardWrite: (data: Data) => ipcRenderer.invoke(IpcMessages.CLIPBOARD_WRITE, data),
  
  // Window position tracking for Clippy direction
  getWindowPositions: () => ipcRenderer.invoke('GET_WINDOW_POSITIONS'),
  getScreenInfo: () => ipcRenderer.invoke('GET_SCREEN_INFO'),
  calculateDirection: (clippyPos: any, chatPos: any) => ipcRenderer.invoke('CALCULATE_DIRECTION', clippyPos, chatPos),
};

// Expose only clippyApi - no more electronAi for local models
contextBridge.exposeInMainWorld("clippy", clippyApi);
