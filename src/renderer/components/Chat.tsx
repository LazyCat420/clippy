import { useState, useEffect, useCallback } from "react";

import { Message } from "./Message";
import { ChatInput } from "./ChatInput";
import { GroundingSearchResult } from "./GroundingSearchResult";
import { ErrorBoundary } from "./ErrorBoundary";
import { ANIMATION_KEYS_BRACKETS } from "../clippy-animation-helpers";
import { useChat } from "../contexts/ChatContext";
import { useAnimation } from "../contexts/AnimationContext";
import { electronAi, clippyApi } from "../clippyApi";
import { useSharedState } from "../contexts/SharedStateContext";
import { ttsService } from "../services/TTSService";
import { ANIMATION_TRIGGERS } from "../contexts/AnimationContext";

export type ChatProps = {
  style?: React.CSSProperties;
};

export function Chat({ style }: ChatProps) {
  const { setAnimationKey, setStatus, status, messages, addMessage } =
    useChat();
  const { settings } = useSharedState();
  const { triggerAnimation, triggerAnimationForContent, triggerAnimationForStatus } = useAnimation();

  // Create enhanced prompt with animation selection instructions and object awareness
  const createEnhancedPrompt = useCallback(async (userMessage: string): Promise<string> => {
    // Get current window positions for object awareness
    let positionInfo = "";
    try {
      const windowPositions = await (window as any).clippy.getWindowPositions();
      const screenInfo = await (window as any).clippy.getScreenInfo();
      
      if (windowPositions && windowPositions.length > 0) {
        const clippyWindow = windowPositions.find((w: any) =>
          w.title.toLowerCase().includes('clippy') && !w.title.toLowerCase().includes('chat') || w.width < 200
        );
        const chatWindow = windowPositions.find((w: any) =>
          w.title.toLowerCase().includes('chat') || w.width > 400
        );
        
        if (clippyWindow && chatWindow) {
          const clippyCenter = { 
            x: clippyWindow.x + clippyWindow.width / 2, 
            y: clippyWindow.y + clippyWindow.height / 2 
          };
          const chatCenter = { 
            x: chatWindow.x + chatWindow.width / 2, 
            y: chatWindow.y + chatWindow.height / 2 
          };
          
          // Calculate relative position
          const deltaX = chatCenter.x - clippyCenter.x;
          const deltaY = chatCenter.y - clippyCenter.y;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          
          // Determine direction
          let direction = "";
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            direction = deltaX > 0 ? "to my right" : "to my left";
          } else {
            direction = deltaY > 0 ? "below me" : "above me";
          }
          
          positionInfo = `\n\n📍 OBJECT AWARENESS:
• I am located at position (${clippyCenter.x.toFixed(0)}, ${clippyCenter.y.toFixed(0)})
• The chat window is located at position (${chatCenter.x.toFixed(0)}, ${chatCenter.y.toFixed(0)})
• The chat window is ${direction} from me, about ${distance.toFixed(0)} pixels away
• Screen resolution: ${screenInfo?.width || 'unknown'} x ${screenInfo?.height || 'unknown'}

When users ask about the location of objects, I can provide accurate spatial information.`;
        }
      }
    } catch (error) {
      console.log("Could not get position info for object awareness:", error);
    }

    return `You are Clippy, a helpful AI assistant with object awareness. When responding to the user, choose the most appropriate animation that matches the emotional tone and context of your response.

AVAILABLE ANIMATIONS (23 total):
thinking, congratulate, explain, getAttention, processing, writing, searching, greeting, goodbye, alert, checkingSomething, gestureUp, gestureDown, gestureLeft, gestureRight, getArtsy, getTechy, getWizardy, hearing, hide, show, print, save, sendMail, wave, emptyTrash, lookDown, lookDownLeft, lookDownRight, lookLeft, lookRight, lookUp, lookUpLeft, lookUpRight, default

DETAILED ANIMATION SELECTION RULES:

🎯 EMOTIONAL & STATUS ANIMATIONS:
• [thinking] - When processing, analyzing, or considering something: "Let me think about that...", "I'm analyzing the problem..."
• [congratulate] - When praising success or achievement: "Great job!", "Excellent work!", "You did it!", "Well done!"
• [explain] - When teaching or providing detailed explanations: "Here's how it works...", "Let me explain...", "The reason is..."
• [getAttention] - When emphasizing important information: "Pay attention!", "This is critical!", "Important notice!"
• [processing] - When working on complex tasks: "Working on it...", "Processing your request...", "Computing..."
• [writing] - When creating content or documenting: "I'm writing that down...", "Let me document this...", "Creating a report..."

🔍 SEARCH & ANALYSIS ANIMATIONS:
• [searching] - When looking for information: "Searching for that...", "Let me find...", "Looking up..."
• [checkingSomething] - When verifying or examining: "Let me check...", "Verifying...", "Examining the details..."

👋 COMMUNICATION ANIMATIONS:
• [greeting] - When saying hello or being friendly: "Hello!", "Hi there!", "Welcome!", "Good to see you!"
• [goodbye] - When saying farewell: "Goodbye!", "See you later!", "Take care!", "Thanks for chatting!"
• [wave] - When being friendly or welcoming: "Hello!", "Hi!", "Welcome back!"

⚠️ ALERT & ERROR ANIMATIONS:
• [alert] - When warning about problems or errors: "Warning!", "There's an error!", "Problem detected!", "Be careful!"

🎨 TOPIC-SPECIFIC ANIMATIONS:
• [getArtsy] - When discussing creative topics: "That's creative!", "Design is important...", "Let's make it beautiful...", "Art is..."
• [getTechy] - When discussing technical topics: "Here's the code...", "Technically speaking...", "The algorithm is...", "Programming-wise..."
• [getWizardy] - When discussing magical or amazing topics: "That's incredible!", "How amazing!", "This is magical!", "Wonderful!"

👂 AUDIO & HEARING ANIMATIONS:
• [hearing] - When discussing audio, music, or listening: "I hear you!", "That sounds good!", "Music is...", "Listen to this..."

📁 FILE OPERATION ANIMATIONS:
• [print] - When discussing printing: "Printing that...", "Let me print...", "Here's the printout..."
• [save] - When discussing saving files: "Saving that...", "Let me save...", "Backing up..."
• [sendMail] - When discussing email or communication: "Sending that email...", "Let me mail...", "Email sent!"

🗑️ CLEANUP ANIMATIONS:
• [emptyTrash] - When deleting, removing, or cleaning up: "Deleting that...", "Removing...", "Cleaning up...", "Trashing...", "Let me delete..."

👁️ LOOKING ANIMATIONS (8 directions):
• [lookUp] - When looking upward or at something above
• [lookDown] - When looking downward or at something below
• [lookLeft] - When looking left or at something to the left
• [lookRight] - When looking right or at something to the right
• [lookUpLeft] - When looking up and left
• [lookUpRight] - When looking up and right
• [lookDownLeft] - When looking down and left
• [lookDownRight] - When looking down and right

👆 GESTURE ANIMATIONS:
• [gestureUp] - When pointing up or directing attention upward
• [gestureDown] - When pointing down or directing attention downward
• [gestureLeft] - When pointing left or directing attention left
• [gestureRight] - When pointing right or directing attention right

👻 VISIBILITY ANIMATIONS:
• [hide] - When concealing or hiding information: "Let me hide that...", "This is private..."
• [show] - When revealing or displaying information: "Here it is!", "Let me show you...", "Revealing..."

OBJECT AWARENESS INSTRUCTIONS:
• When users ask about the location of objects (like "where is the chatbox?"), use the position information provided
• You can describe spatial relationships accurately
• Use appropriate looking animations when referring to object locations
• Be helpful and precise about object positions${positionInfo}

RESPONSE FORMAT:
Start your response with the animation in brackets, then provide your answer.

EXAMPLES:
• User: "Can you delete this file?" → "[emptyTrash] Sure! I'll delete that file for you."
• User: "Great job!" → "[congratulate] Thank you! I'm glad I could help!"
• User: "How do I code this?" → "[getTechy] Let me show you the code for that..."
• User: "There's an error" → "[alert] I see the problem! Let me help you fix it."
• User: "Hello!" → "[greeting] Hi there! How can I help you today?"
• User: "Can you explain this?" → "[explain] Of course! Let me break this down for you..."
• User: "That's amazing!" → "[getWizardy] It really is incredible, isn't it?"
• User: "Save this for me" → "[save] I'll save that for you right away!"
• User: "Where is the chatbox?" → "[lookRight] The chat window is to my right, about 300 pixels away from my current position."

User message: ${userMessage}

Choose the most appropriate animation and respond:`;
  }, []);

  // Smart animation selection based on user input (hardcoded fallback)
  const getSmartAnimationForUserInput = useCallback((userMessage: string): string | null => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Delete/Remove operations
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove') || lowerMessage.includes('trash') || lowerMessage.includes('clean')) {
      return 'emptyTrash';
    }
    
    // Save operations
    if (lowerMessage.includes('save') || lowerMessage.includes('backup') || lowerMessage.includes('store')) {
      return 'save';
    }
    
    // Print operations
    if (lowerMessage.includes('print') || lowerMessage.includes('printout')) {
      return 'print';
    }
    
    // Email operations
    if (lowerMessage.includes('email') || lowerMessage.includes('mail') || lowerMessage.includes('send')) {
      return 'sendMail';
    }
    
    // Greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey') || lowerMessage.includes('welcome')) {
      return 'greeting';
    }
    
    // Goodbyes
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') || lowerMessage.includes('see you') || lowerMessage.includes('thanks')) {
      return 'goodbye';
    }
    
    // Praise/Congratulations
    if (lowerMessage.includes('great') || lowerMessage.includes('good job') || lowerMessage.includes('excellent') || lowerMessage.includes('amazing') || lowerMessage.includes('perfect')) {
      return 'congratulate';
    }
    
    // Errors/Problems
    if (lowerMessage.includes('error') || lowerMessage.includes('problem') || lowerMessage.includes('bug') || lowerMessage.includes('issue') || lowerMessage.includes('wrong')) {
      return 'alert';
    }
    
    // Technical topics
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('function') || lowerMessage.includes('algorithm') || lowerMessage.includes('technical')) {
      return 'getTechy';
    }
    
    // Creative topics
    if (lowerMessage.includes('design') || lowerMessage.includes('creative') || lowerMessage.includes('art') || lowerMessage.includes('beautiful') || lowerMessage.includes('color')) {
      return 'getArtsy';
    }
    
    // Amazing/Magical topics
    if (lowerMessage.includes('incredible') || lowerMessage.includes('magical') || lowerMessage.includes('wonderful') || lowerMessage.includes('awesome') || lowerMessage.includes('cool')) {
      return 'getWizardy';
    }
    
    // Audio/Music topics
    if (lowerMessage.includes('music') || lowerMessage.includes('audio') || lowerMessage.includes('sound') || lowerMessage.includes('listen') || lowerMessage.includes('hear')) {
      return 'hearing';
    }
    
    // Search/Lookup
    if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('look up') || lowerMessage.includes('research')) {
      return 'searching';
    }
    
    // Explain/Help
    if (lowerMessage.includes('explain') || lowerMessage.includes('how') || lowerMessage.includes('what') || lowerMessage.includes('why') || lowerMessage.includes('help')) {
      return 'explain';
    }
    
    // Processing/Working
    if (lowerMessage.includes('process') || lowerMessage.includes('work on') || lowerMessage.includes('computing') || lowerMessage.includes('generating')) {
      return 'processing';
    }
    
    // Writing/Documenting
    if (lowerMessage.includes('write') || lowerMessage.includes('document') || lowerMessage.includes('create') || lowerMessage.includes('note')) {
      return 'writing';
    }
    
    // Hide/Show
    if (lowerMessage.includes('hide') || lowerMessage.includes('conceal')) {
      return 'hide';
    }
    if (lowerMessage.includes('show') || lowerMessage.includes('reveal') || lowerMessage.includes('display')) {
      return 'show';
    }
    
    return null; // Let LLM decide
  }, []);
  const [streamingMessageContent, setStreamingMessageContent] =
    useState<string>("");
  const [lastRequestUUID, setLastRequestUUID] = useState<string>(
    crypto.randomUUID(),
  );
  const [isGroundingSearching, setIsGroundingSearching] = useState<boolean>(false);
  const [isTTSSpeaking, setIsTTSSpeaking] = useState(false);
  const [ttsQueueLength, setTtsQueueLength] = useState(0);

  // Check TTS speaking status periodically
  useEffect(() => {
    const checkTTSSpeaking = () => {
      setIsTTSSpeaking(ttsService.isSpeaking());
      setTtsQueueLength(ttsService.getQueueLength());
    };

    // Check immediately
    checkTTSSpeaking();

    // Check every 100ms when TTS is enabled
    const interval = settings.enableTTS ? setInterval(checkTTSSpeaking, 100) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [settings.enableTTS]);

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
    // Stop TTS if it's speaking
    if (ttsService.isSpeaking() || ttsService.getQueueLength() > 0) {
      ttsService.stopAll();
    }
    
    // Abort AI request if there's one active
    if (lastRequestUUID) {
      window.electronAi.abortRequest(lastRequestUUID);
    }
    
    setStatus("idle");
    setStreamingMessageContent("");
    setIsGroundingSearching(false);
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
    
    // Don't trigger animation here - let the LLM choose the appropriate animation

    try {
      // Get the actual API key (not redacted)
      const actualApiKey = await clippyApi.getGoogleApiKey();
      
      // Check if grounding search is enabled and we have a valid API key
      const shouldUseGroundingSearch = 
        settings.enableGroundingSearch && 
        actualApiKey && 
        actualApiKey.length > 0;

      if (shouldUseGroundingSearch) {
        // Use grounding search
        setStatus("responding");
        setIsGroundingSearching(true);
        
        try {
          // Use enhanced prompt with animation selection for grounding search
          const enhancedPrompt = await createEnhancedPrompt(message);
          const groundingResponse = await clippyApi.performGroundingSearch(
            enhancedPrompt,
            actualApiKey,
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

                  // Extract animation from the response
        const { text: responseText, animationKey: responseAnimation } = filterMessageContent(groundingResponse.content);
        
        console.log(`🎭 Grounding Search - Raw response: "${groundingResponse.content.substring(0, 100)}..."`);
        console.log(`🎭 Grounding Search - Extracted text: "${responseText.substring(0, 100)}..."`);
        console.log(`🎭 Grounding Search - Extracted animation: "${responseAnimation}"`);
        
        // Hybrid animation selection: LLM choice + hardcoded fallback
        let selectedAnimation = responseAnimation;
        
        if (!selectedAnimation) {
          // Try hardcoded fallback based on user input
          selectedAnimation = getSmartAnimationForUserInput(message);
          console.log(`🎭 LLM didn't select animation, using hardcoded fallback: ${selectedAnimation}`);
        } else {
          console.log(`🎭 Using LLM-selected animation: ${selectedAnimation}`);
        }
        
        if (selectedAnimation) {
          // Use direct animation trigger
          triggerAnimation(selectedAnimation as any);
        } else {
          console.log(`🎭 No animation found, using default`);
          triggerAnimation("default");
        }
          
          // Update the message with the filtered text
          assistantMessage.content = responseText;
          addMessage(assistantMessage);
          
          // Speak the response using TTS with the selected animation
          if (settings.enableTTS) {
            ttsService.speakWithAnimation(responseText, responseAnimation || "explain").catch(error => {
              console.warn("TTS failed:", error);
            });
          }
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
          
          // Trigger alert animation for error
          triggerAnimationForStatus("error");
          
          // Fallback to local model if grounding search fails
          const requestUUID = crypto.randomUUID();
          setLastRequestUUID(requestUUID);

          // Use enhanced prompt with animation selection
          const enhancedPrompt = await createEnhancedPrompt(message);
          const response = await window.electronAi.promptStreaming(enhancedPrompt, {
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

        // Use enhanced prompt with animation selection
        const enhancedPrompt = await createEnhancedPrompt(message);
        const response = await window.electronAi.promptStreaming(enhancedPrompt, {
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

        // Extract animation from the final content
        const { text: responseText, animationKey: responseAnimation } = filterMessageContent(filteredContent);
        
        console.log(`🎭 Local Model - Raw response: "${filteredContent.substring(0, 100)}..."`);
        console.log(`🎭 Local Model - Extracted text: "${responseText.substring(0, 100)}..."`);
        console.log(`🎭 Local Model - Extracted animation: "${responseAnimation}"`);
        
        // Hybrid animation selection: LLM choice + hardcoded fallback
        let selectedAnimation = responseAnimation;
        
        if (!selectedAnimation) {
          // Try hardcoded fallback based on user input
          selectedAnimation = getSmartAnimationForUserInput(message);
          console.log(`🎭 LLM didn't select animation, using hardcoded fallback: ${selectedAnimation}`);
        } else {
          console.log(`🎭 Using LLM-selected animation: ${selectedAnimation}`);
        }
        
        if (selectedAnimation) {
          // Use direct animation trigger
          triggerAnimation(selectedAnimation as any);
        } else {
          console.log(`🎭 No animation found, using default`);
          triggerAnimation("default");
        }
        
        // Update the message with the filtered text
        assistantMessage.content = responseText;
        addMessage(assistantMessage);
        
        // Speak the response using TTS with the selected animation
        if (settings.enableTTS) {
          ttsService.speakWithAnimation(responseText, responseAnimation || "explain").catch(error => {
            console.warn("TTS failed:", error);
          });
        }
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
      
      // Trigger alert animation for error
      triggerAnimationForStatus("error");
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
        {/* TTS Speaking Indicator */}
        {settings.enableTTS && (isTTSSpeaking || ttsQueueLength > 0) && (
          <div style={{
            padding: "8px 12px",
            margin: "8px 0",
            backgroundColor: "#e3f2fd",
            border: "1px solid #2196f3",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#1976d2",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>🔊</span>
            <span>
              {isTTSSpeaking 
                ? `Clippy is speaking${ttsQueueLength > 0 ? ` (${ttsQueueLength} more in queue)` : ''}... Press Escape to stop`
                : `${ttsQueueLength} message${ttsQueueLength > 1 ? 's' : ''} waiting to be spoken... Press Escape to stop`
              }
            </span>
          </div>
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
 * Enhanced to handle LLM animation selection
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

  // Handle partial animation brackets
  if (content === "[") {
    text = "";
    return { text, animationKey };
  }

  // Handle complete animation brackets at the start
  const animationMatch = content.match(/^\[([A-Za-z]+)\]\s*(.*)/s);
  if (animationMatch) {
    const [, animation, rest] = animationMatch;
    // Validate that it's a known animation
    if (Object.keys(ANIMATION_TRIGGERS).includes(animation)) {
      animationKey = animation;
      text = rest.trim();
      console.log(`🎭 LLM selected animation: ${animation} for content: "${text.substring(0, 50)}..."`);
    } else {
      // Invalid animation, treat as regular text
      text = content;
      console.log(`⚠️ LLM selected invalid animation: ${animation}, treating as regular text`);
    }
  } else {
    // Check for animation keys in brackets using the existing system
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
