import { ElectronLlmRenderer } from "@electron/llm";
import { SharedState } from "../sharedState";
import {
  ChatRecord,
  ChatWithMessages,
  ClippyDebugInfo,
  Versions,
} from "../types/interfaces";
import { DebugState } from "../debugState";

import type { BubbleView } from "./contexts/BubbleViewContext";
import { Data } from "electron";

export interface ClippyApi {
  // Window
  toggleChatWindow: () => Promise<void>;
  minimizeChatWindow: () => Promise<void>;
  maximizeChatWindow: () => Promise<void>;
  onSetBubbleView: (callback: (bubbleView: BubbleView) => void) => void;
  offSetBubbleView: () => void;
  popupAppMenu: () => void;
  // Models
  updateModelState: () => Promise<void>;
  downloadModelByName: (name: string) => Promise<void>;
  removeModelByName: (name: string) => Promise<void>;
  deleteModelByName: (name: string) => Promise<boolean>;
  deleteAllModels: () => Promise<boolean>;
  addModelFromFile: () => Promise<void>;
  // State
  offStateChanged: () => void;
  onStateChanged: (callback: (state: SharedState) => void) => void;
  getFullState: () => Promise<SharedState>;
  getState: (key: string) => Promise<any>;
  setState: (key: string, value: any) => Promise<void>;
  openStateInEditor: () => Promise<void>;
  getGoogleApiKey: () => Promise<string>;
  // Debug
  offDebugStateChanged: () => void;
  onDebugStateChanged: (callback: (state: DebugState) => void) => void;
  getFullDebugState: () => Promise<DebugState>;
  getDebugState: (key: string) => Promise<any>;
  setDebugState: (key: string, value: any) => Promise<void>;
  openDebugStateInEditor: () => Promise<void>;
  getDebugInfo(): Promise<ClippyDebugInfo>;
  // App
  getVersions: () => Promise<Versions>;
  checkForUpdates: () => Promise<void>;
  // Grounding Search
  performGroundingSearch: (prompt: string, apiKey: string, model: string) => Promise<any>;
  validateApiKey: (apiKey: string) => Promise<boolean>;
  // Chats
  getChatRecords: () => Promise<Record<string, ChatRecord>>;
  getChatWithMessages: (chatId: string) => Promise<ChatWithMessages | null>;
  writeChatWithMessages: (chatWithMessages: ChatWithMessages) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  deleteAllChats: () => Promise<void>;
  onNewChat: (callback: () => void) => void;
  offNewChat: () => void;
  // Clipboard
  clipboardWrite: (data: Data) => Promise<void>;
  
  // Window position tracking for Clippy direction
  getWindowPositions: () => Promise<Array<{
    id: number;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isVisible: boolean;
    isFocused: boolean;
  }>>;
  
  getScreenInfo: () => Promise<{
    displays: Array<{
      id: number;
      bounds: { x: number; y: number; width: number; height: number };
      workArea: { x: number; y: number; width: number; height: number };
      scaleFactor: number;
    }>;
    primaryDisplay: {
      id: number;
      bounds: { x: number; y: number; width: number; height: number };
      workArea: { x: number; y: number; width: number; height: number };
    };
    cursorPoint: { x: number; y: number };
  } | null>;
  
  calculateDirection: (clippyPos: { x: number; y: number }, chatPos: { x: number; y: number }) => Promise<{
    direction: string | null;
    distance: number;
    angleDegrees?: number;
    deltaX?: number;
    deltaY?: number;
    reason?: string;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAi: ElectronLlmRenderer;
    clippy: ClippyApi;
  }
}

export const clippyApi = window["clippy"];
export const electronAi = window["electronAi"];
