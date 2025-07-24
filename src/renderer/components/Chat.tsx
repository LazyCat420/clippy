import { useState, useEffect } from "react";

import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { GroundingSearchResult } from "./GroundingSearchResult";
import { ErrorBoundary } from "./ErrorBoundary";
import { ANIMATION_KEYS_BRACKETS } from "../clippy-animation-helpers";
import { useChat } from "../contexts/ChatContext";
import { electronAi, clippyApi } from "../clippyApi";
import { useSharedState } from "../contexts/SharedStateContext";

export type ChatProps = {
  style?: React.CSSProperties;
};

export function Chat({ style }: ChatProps) {
  const { setAnimationKey, setStatus, status, messages, addMessage } =
    useChat();
  const { settings } = useSharedState();
  const [streamingMessageContent, setStreamingMessageContent] =
    useState<string>("");
  const [lastRequestUUID, setLastRequestUUID] = useState<string>(
    crypto.randomUUID(),
  );
  const [isGroundingSearching, setIsGroundingSearching] = useState<boolean>(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup any ongoing requests
      if (lastRequestUUID) {
        try {
          electronAi.abortRequest(lastRequestUUID);
        } catch (error) {
          console.error("Error aborting request on cleanup:", error);
        }
      }
    };
  }, [lastRequestUUID]);

  const handleAbortMessage = () => {
    electronAi.abortRequest(lastRequestUUID);
  };

  const handleToggleGrounding = () => {
    const newValue = !settings.enableGroundingSearch;
    clippyApi.setState("settings.enableGroundingSearch", newValue);
  };

  const handleSendMessage = async (message: string) => {
    if (status !== "idle") {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: message,
      sender: "user",
      createdAt: Date.now(),
    };

    await addMessage(userMessage);
    setStreamingMessageContent("");
    setStatus("thinking");

    try {
      // Check if grounding search is enabled and we have a valid API key
      const shouldUseGroundingSearch = 
        settings.enableGroundingSearch && 
        settings.googleApiKey && 
        settings.googleApiKey.length > 0;

      if (shouldUseGroundingSearch) {
        // Use grounding search
        setStatus("responding");
        setIsGroundingSearching(true);
        
        try {
          const groundingResponse = await clippyApi.performGroundingSearch(
            message,
            settings.googleApiKey,
            settings.groundingModel || "gemini-2.0-flash"
          );

          // Validate response
          if (!groundingResponse || !groundingResponse.content) {
            throw new Error("Invalid response from grounding search");
          }

          // Optimized streaming simulation - faster and more stable
          const content = groundingResponse.content;
          const chunks = content.match(/.{1,50}/g) || [content]; // Split into 50-char chunks for better performance
          let displayedContent = '';
          
          for (let i = 0; i < chunks.length; i++) {
            displayedContent += chunks[i];
            setStreamingMessageContent(displayedContent);
            // Faster typing simulation with fewer updates
            await new Promise(resolve => setTimeout(resolve, 15));
          }

          // Create message with grounding search result
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            content: content,
            sender: "clippy",
            createdAt: Date.now(),
            children: (
              <ErrorBoundary>
                <GroundingSearchResult
                  content={groundingResponse.content}
                  groundingMetadata={groundingResponse.groundingMetadata}
                  renderedContent={groundingResponse.renderedContent}
                />
              </ErrorBoundary>
            ),
          };

          addMessage(assistantMessage);
        } catch (groundingError) {
          setIsGroundingSearching(false);
          console.error("Grounding search failed, falling back to local model:", groundingError);
          
          // Show error message to user
          const errorMessage: Message = {
            id: crypto.randomUUID(),
            content: `🌐 Grounding search failed: ${groundingError instanceof Error ? groundingError.message : 'Unknown error'}. Falling back to local model...`,
            sender: "clippy",
            createdAt: Date.now(),
          };
          addMessage(errorMessage);
          
          // Fallback to local model if grounding search fails
          const requestUUID = crypto.randomUUID();
          setLastRequestUUID(requestUUID);

          const response = await window.electronAi.promptStreaming(message, {
            requestUUID,
          });

          let fullContent = "";
          let filteredContent = "";
          let hasSetAnimationKey = false;

          for await (const chunk of response) {
            if (fullContent === "") {
              setStatus("responding");
            }

            if (!hasSetAnimationKey) {
              const { text, animationKey } = filterMessageContent(
                fullContent + chunk,
              );

              filteredContent = text;
              fullContent = fullContent + chunk;

              if (animationKey) {
                setAnimationKey(animationKey);
                hasSetAnimationKey = true;
              }
            } else {
              filteredContent += chunk;
            }

            setStreamingMessageContent(filteredContent);
          }

          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            content: filteredContent,
            sender: "clippy",
            createdAt: Date.now(),
          };

          addMessage(assistantMessage);
        }
      } else {
        // Use local model
        const requestUUID = crypto.randomUUID();
        setLastRequestUUID(requestUUID);

        const response = await window.electronAi.promptStreaming(message, {
          requestUUID,
        });

        let fullContent = "";
        let filteredContent = "";
        let hasSetAnimationKey = false;

        for await (const chunk of response) {
          if (fullContent === "") {
            setStatus("responding");
          }

          if (!hasSetAnimationKey) {
            const { text, animationKey } = filterMessageContent(
              fullContent + chunk,
            );

            filteredContent = text;
            fullContent = fullContent + chunk;

            if (animationKey) {
              setAnimationKey(animationKey);
              hasSetAnimationKey = true;
            }
          } else {
            filteredContent += chunk;
          }

          setStreamingMessageContent(filteredContent);
        }

        // Once streaming is complete, add the full message to the messages array
        // and clear the streaming message
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          content: filteredContent,
          sender: "clippy",
          createdAt: Date.now(),
        };

        addMessage(assistantMessage);
      }
    } catch (error) {
      console.error(error);
      
      // Add error message
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        sender: "clippy",
        createdAt: Date.now(),
      };
      
      addMessage(errorMessage);
    } finally {
      setStreamingMessageContent("");
      setStatus("idle");
      setIsGroundingSearching(false);
    }
  };

  return (
    <ErrorBoundary>
      <div style={style} className="chat-container">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {status === "responding" && (
          <Message
            message={{
              id: "streaming",
              content: isGroundingSearching 
                ? `${streamingMessageContent}${streamingMessageContent ? '' : '🌐 Searching the web...'}`
                : streamingMessageContent,
              sender: "clippy",
              createdAt: Date.now(),
            }}
          />
        )}
        <ChatInput 
          onSend={handleSendMessage} 
          onAbort={handleAbortMessage} 
          onToggleGrounding={handleToggleGrounding}
        />
      </div>
    </ErrorBoundary>
  );
}

/**
 * Filter the message content to get the text and animation key
 *
 * @param content - The content of the message
 * @returns The text and animation key
 */
function filterMessageContent(content: string): {
  text: string;
  animationKey: string;
} {
  let text = content;
  let animationKey = "";

  if (content === "[") {
    text = "";
  } else if (/^\[[A-Za-z]*$/m.test(content)) {
    text = content.replace(/^\[[A-Za-z]*$/m, "").trim();
  } else {
    // Check for animation keys in brackets
    for (const key of ANIMATION_KEYS_BRACKETS) {
      if (content.startsWith(key)) {
        animationKey = key.slice(1, -1);
        text = content.slice(key.length).trim();
        break;
      }
    }
  }

  return { text, animationKey };
}
