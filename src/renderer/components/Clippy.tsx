import { useEffect, useState, useCallback, useRef } from "react";

import { ANIMATIONS, Animation } from "../clippy-animations";
import {
  EMPTY_ANIMATION,
  getRandomIdleAnimation,
} from "../clippy-animation-helpers";
import { useChat } from "../contexts/ChatContext";
import { useSharedState } from "../contexts/SharedStateContext";
import { log } from "../logging";
import { useDebugState } from "../contexts/DebugContext";
import { audioService } from "../services/AudioService";
import { useAnimation } from "../contexts/AnimationContext";
import { useBubbleView } from "../contexts/BubbleViewContext";
import { ANIMATION_TRIGGERS } from "../contexts/AnimationContext";

const WAIT_TIME = 6000;
const CHAT_LOOK_PROBABILITY = 0.3; // 30% chance to look at chat during idle

interface ClippyProps {
  chatWindowRef: React.RefObject<HTMLDivElement>;
}

export function Clippy({ chatWindowRef }: ClippyProps) {
  const {
    animationKey,
    status,
    setStatus,
    setIsChatWindowOpen,
    isChatWindowOpen,
  } = useChat();
  const { enableDragDebug } = useDebugState();
  const { settings } = useSharedState();
  const { triggerLookAtChat, getChatLookDirection } = useAnimation();
  const { currentView } = useBubbleView();


  const [animation, setAnimation] = useState<Animation>(EMPTY_ANIMATION);
  const [animationTimeoutId, setAnimationTimeoutId] = useState<
    number | undefined
  >(undefined);
  
  // Refs for position tracking
  const clippyRef = useRef<HTMLDivElement>(null);





    // Enhanced idle animation that sometimes looks at chat - EXACT SAME LOGIC AS WORKING TEST
  const playEnhancedIdleAnimation = useCallback(async () => {
    if (status !== "idle") return;

    const shouldLookAtChat = Math.random() < CHAT_LOOK_PROBABILITY && 
                            isChatWindowOpen && 
                            currentView === "chat";

    if (shouldLookAtChat) {
      try {
        console.log("🎯 Idle: Attempting to look at chat...");
        
        // Get all window positions from main process - EXACT SAME AS WORKING TEST
        const windowPositions = await (window as any).clippy.getWindowPositions();
        
        if (windowPositions && windowPositions.length > 0) {
          console.log(`🎯 Idle: Found ${windowPositions.length} windows`);
          
          // Try to identify Clippy and chat windows - EXACT SAME LOGIC AS WORKING TEST
          const clippyWindow = windowPositions.find((w: any) => 
            w.title.toLowerCase().includes('clippy') && !w.title.toLowerCase().includes('chat') ||
            w.width < 200 // Small window likely to be Clippy
          );
          
          const chatWindow = windowPositions.find((w: any) => 
            w.title.toLowerCase().includes('chat') ||
            w.width > 400 // Large window likely to be chat
          );
          
          if (clippyWindow && chatWindow) {
            console.log(`🎯 Idle: Found windows - Clippy: "${clippyWindow.title}", Chat: "${chatWindow.title}"`);
            
            // Calculate center points - EXACT SAME AS WORKING TEST
            const clippyCenter = {
              x: clippyWindow.x + clippyWindow.width / 2,
              y: clippyWindow.y + clippyWindow.height / 2
            };
            
            const chatCenter = {
              x: chatWindow.x + chatWindow.width / 2,
              y: chatWindow.y + chatWindow.height / 2
            };
            
            // Calculate direction using main process - EXACT SAME AS WORKING TEST
            const directionResult = await (window as any).clippy.calculateDirection(clippyCenter, chatCenter);
            
            if (directionResult.direction) {
              log(`🎯 Idle: Clippy looking at chat: ${directionResult.direction}`, { 
                clippyCenter, 
                chatCenter, 
                distance: directionResult.distance 
              });
              // Use the EXACT SAME animation trigger as the working test
              setAnimation(ANIMATIONS[ANIMATION_TRIGGERS[directionResult.direction as keyof typeof ANIMATION_TRIGGERS]]);
              console.log("✅ Animation triggered!");
              
              // After looking at chat, return to default and schedule next idle
              setAnimationTimeoutId(
                window.setTimeout(() => {
                  setAnimation(ANIMATIONS.Default);
                  setAnimationTimeoutId(
                    window.setTimeout(playEnhancedIdleAnimation, WAIT_TIME),
                  );
                }, 2000), // Look at chat for 2 seconds
              );
              return;
            } else {
              console.log(`🎯 Idle: Chat too far away: ${directionResult.distance}px`);
            }
          } else {
            console.log("🎯 Idle: Could not identify windows, trying fallback...");
            
            // Fallback: manually identify based on size and position - EXACT SAME AS WORKING TEST
            const smallWindow = windowPositions.find((w: any) => w.width < 200);
            const largeWindow = windowPositions.find((w: any) => w.width > 400);
            
            if (smallWindow && largeWindow) {
              console.log(`🎯 Idle: Fallback - Small: "${smallWindow.title}", Large: "${largeWindow.title}"`);
              
              // Calculate center points
              const clippyCenter = {
                x: smallWindow.x + smallWindow.width / 2,
                y: smallWindow.y + smallWindow.height / 2
              };
              
              const chatCenter = {
                x: largeWindow.x + largeWindow.width / 2,
                y: largeWindow.y + largeWindow.height / 2
              };
              
              // Calculate direction using main process
              const directionResult = await (window as any).clippy.calculateDirection(clippyCenter, chatCenter);
              
              if (directionResult.direction) {
                log(`🎯 Idle: Clippy looking at chat (fallback): ${directionResult.direction}`, { 
                  clippyCenter, 
                  chatCenter, 
                  distance: directionResult.distance 
                });
                // Use the EXACT SAME animation trigger as the working test
                setAnimation(ANIMATIONS[ANIMATION_TRIGGERS[directionResult.direction as keyof typeof ANIMATION_TRIGGERS]]);
                console.log("✅ Animation triggered!");
                
                // After looking at chat, return to default and schedule next idle
                setAnimationTimeoutId(
                  window.setTimeout(() => {
                    setAnimation(ANIMATIONS.Default);
                    setAnimationTimeoutId(
                      window.setTimeout(playEnhancedIdleAnimation, WAIT_TIME),
                    );
                  }, 2000), // Look at chat for 2 seconds
                );
                return;
              } else {
                console.log(`🎯 Idle: Fallback - Chat too far away: ${directionResult.distance}px`);
              }
            } else {
              console.log("🎯 Idle: Fallback also failed - no suitable windows found");
            }
          }
        } else {
          console.log("🎯 Idle: No windows found");
        }
      } catch (error) {
        console.error("🎯 Idle: Failed to look at chat:", error);
      }
    }

    // Regular idle animation
    const randomIdleAnimation = getRandomIdleAnimation(animation);
    setAnimation(randomIdleAnimation);

    // Reset back to default after animation and schedule next
    setAnimationTimeoutId(
      window.setTimeout(() => {
        setAnimation(ANIMATIONS.Default);
        setAnimationTimeoutId(
          window.setTimeout(playEnhancedIdleAnimation, WAIT_TIME),
        );
      }, randomIdleAnimation.length),
    );
  }, [status, isChatWindowOpen, currentView, getChatLookDirection, animation]);

  const playAnimation = useCallback((key: string) => {
    if (ANIMATIONS[key]) {
      log(`Playing animation`, { key });

      if (animationTimeoutId) {
        window.clearTimeout(animationTimeoutId);
      }

      setAnimation(ANIMATIONS[key]);
      
      // Play sound effect for animation if enabled
      if (settings.enableSoundEffects) {
        audioService.playAnimationSound(key).catch(error => {
          // Silently fail if audio is not available
          console.warn(`Could not play sound for animation ${key}:`, error);
        });
      }
      
      setAnimationTimeoutId(
        window.setTimeout(() => {
          setAnimation(ANIMATIONS.Default);
        }, ANIMATIONS[key].length + 200),
      );
    } else {
      log(`Animation not found`, { key });
    }
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatWindowOpen(!isChatWindowOpen);
  }, [isChatWindowOpen, setIsChatWindowOpen]);

  useEffect(() => {
    if (status === "welcome" && animation === EMPTY_ANIMATION) {
      setAnimation(ANIMATIONS.Show);
      setTimeout(() => {
        setStatus("idle");
      }, ANIMATIONS.Show.length + 200);
    } else if (status === "idle") {
      if (!animationTimeoutId) {
        playEnhancedIdleAnimation();
      }
    }

    // Clean up timeouts when component unmounts or status changes
    return () => {
      if (animationTimeoutId) {
        window.clearTimeout(animationTimeoutId);
      }
    };
  }, [status, playEnhancedIdleAnimation, animationTimeoutId]);

  useEffect(() => {
    log(`New animation key`, { animationKey });
    playAnimation(animationKey);
  }, [animationKey, playAnimation]);

  return (
    <div>
      <div
        ref={clippyRef}
        className="app-drag"
        style={{
          position: "absolute",
          height: "93px",
          width: "124px",
          backgroundColor: enableDragDebug ? "blue" : "transparent",
          opacity: 0.5,
          zIndex: 5,
        }}
      >
        <div
          className="app-no-drag"
          style={{
            position: "absolute",
            height: "80px",
            width: "45px",
            backgroundColor: enableDragDebug ? "red" : "transparent",
            zIndex: 10,
            right: "40px",
            top: "2px",
            cursor: "help",
          }}
          onClick={toggleChat}
        ></div>
      </div>
      <img
        className="app-no-select"
        src={animation.src}
        draggable={false}
        alt="Clippy"
      />
    </div>
  );
}
