import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import { Message } from "../components/Message";
import { clippyApi } from "../clippyApi";
import { SharedStateContext } from "./SharedStateContext";
import { WelcomeMessageContent } from "../components/WelcomeMessageContent";
import { ChatRecord, MessageRecord } from "../../types/interfaces";
import { useDebugState } from "./DebugContext";
import { ANIMATION_KEYS_BRACKETS } from "../clippy-animation-helpers";

type ClippyNamedStatus =
  | "welcome"
  | "idle"
  | "responding"
  | "thinking"
  | "goodbye";

export type ChatContextType = {
  messages: Message[];
  addMessage: (message: Message) => Promise<void>;
  setMessages: (messages: Message[]) => void;
  animationKey: string;
  setAnimationKey: (animationKey: string) => void;
  status: ClippyNamedStatus;
  setStatus: (status: ClippyNamedStatus) => void;
  isChatWindowOpen: boolean;
  setIsChatWindowOpen: (isChatWindowOpen: boolean) => void;
  chatRecords: Record<string, ChatRecord>;
  currentChatRecord: ChatRecord;
  selectChat: (chatId: string) => void;
  startNewChat: () => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  deleteAllChats: () => Promise<void>;
};

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined,
);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatRecord, setCurrentChatRecord] = useState<ChatRecord>({
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    preview: "",
  });
  const [chatRecords, setChatRecords] = useState<Record<string, ChatRecord>>(
    {},
  );
  const [animationKey, setAnimationKey] = useState<string>("");
  const [status, setStatus] = useState<ClippyNamedStatus>("welcome");
  const { settings } = useContext(SharedStateContext);
  const debug = useDebugState();
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(false);

  const getSystemPrompt = useCallback(() => {
    return settings.systemPrompt?.replace(
      "[LIST OF ANIMATIONS]",
      ANIMATION_KEYS_BRACKETS.join(", "),
    ) || "You are Clippy, a helpful AI assistant.";
  }, [settings.systemPrompt]);

  const addMessage = useCallback(
    async (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    },
    [],
  );

  const selectChat = useCallback(
    async (chatId: string) => {
      try {
        const chatWithMessages = await clippyApi.getChatWithMessages(chatId);

        if (chatWithMessages) {
          setMessages(chatWithMessages.messages);
          setCurrentChatRecord(chatWithMessages.chat);
        }
      } catch (error) {
        console.error("Error selecting chat:", error);
      }
    },
    [],
  );

  const startNewChat = useCallback(async () => {
    try {
      // Create a new chat record
      const newChatRecord: ChatRecord = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        preview: "",
      };

      setCurrentChatRecord(newChatRecord);
      setMessages([]);
      setStatus("welcome");

      // Add welcome message
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        content: "Hello! I'm Clippy, your AI assistant. I can help you with questions using Google's grounding search to find real-time information. Just ask me anything!",
        sender: "clippy",
        createdAt: Date.now(),
        children: <WelcomeMessageContent />,
      };

      setMessages([welcomeMessage]);
    } catch (error) {
      console.error("Error starting new chat:", error);
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    try {
      await clippyApi.deleteChat(chatId);
      
      // Remove from chat records
      setChatRecords((prev) => {
        const newRecords = { ...prev };
        delete newRecords[chatId];
        return newRecords;
      });

      // If this was the current chat, start a new one
      if (currentChatRecord.id === chatId) {
        await startNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  }, [currentChatRecord.id, startNewChat]);

  const deleteAllChats = useCallback(async () => {
    try {
      await clippyApi.deleteAllChats();
      setChatRecords({});
      await startNewChat();
    } catch (error) {
      console.error("Error deleting all chats:", error);
    }
  }, [startNewChat]);

  // Load chat records on mount
  useEffect(() => {
    const loadChatRecords = async () => {
      try {
        const records = await clippyApi.getChatRecords();
        setChatRecords(records);
      } catch (error) {
        console.error("Error loading chat records:", error);
      }
    };

    loadChatRecords();
  }, []);

  // Start with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: crypto.randomUUID(),
        content: "Hello! I'm Clippy, your AI assistant. I can help you with questions using Google's grounding search to find real-time information. Just ask me anything!",
        sender: "clippy",
        createdAt: Date.now(),
        children: <WelcomeMessageContent />,
      };

      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  const value: ChatContextType = {
    messages,
    addMessage,
    setMessages,
    animationKey,
    setAnimationKey,
    status,
    setStatus,
    isChatWindowOpen,
    setIsChatWindowOpen,
    chatRecords,
    currentChatRecord,
    selectChat,
    startNewChat,
    deleteChat,
    deleteAllChats,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

function messageRecordFromMessage(message: Message): MessageRecord {
  return {
    id: message.id,
    content: message.content,
    sender: message.sender,
    createdAt: message.createdAt,
  };
}

function getPreviewFromMessages(messages: Message[]): string {
  const lastUserMessage = messages
    .filter((msg) => msg.sender === "user")
    .pop();

  if (lastUserMessage) {
    return lastUserMessage.content.substring(0, 100);
  }

  return "New chat";
}
