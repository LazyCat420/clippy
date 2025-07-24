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
import { ANIMATION_TRIGGERS, calculateSimpleDirection } from "../contexts/AnimationContext";

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

  // Get current positions (simplified)
  const getPositions = useCallback(() => {
    if (!clippyRef.current || !chatWindowRef.current) {
      return null;
    }

    const clippyRect = clippyRef.current.getBoundingClientRect();
    const chatRect = chatWindowRef.current.getBoundingClientRect();

    // Check if elements are actually visible
    if (clippyRect.width === 0 || clippyRect.height === 0 || 
        chatRect.width === 0 || chatRect.height === 0) {
      return null;
    }

    return {
      clippy: {
        x: clippyRect.left + clippyRect.width / 2, // Center point
        y: clippyRect.top + clippyRect.height / 2,
      },
      chat: {
        x: chatRect.left + chatRect.width / 2, // Center point
        y: chatRect.top + chatRect.height / 2,
      },
    };
  }, []);

  // Monitor position changes
  useEffect(() => {
    if (!isChatWindowOpen || currentView !== "chat") {
      return;
    }

    const checkPositions = () => {
      const positions = getPositions();
      if (positions) {
        const direction = calculateSimpleDirection(positions.clippy, positions.chat);
        console.log(`Position update: direction = ${direction}`);
      }
    };

    // Check positions periodically when chat is open
    const interval = setInterval(checkPositions, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, [isChatWindowOpen, currentView, getPositions]);

  // Enhanced idle animation that sometimes looks at chat
  const playEnhancedIdleAnimation = useCallback(() => {
    if (status !== "idle") return;

    const positions = getPositions();
    const shouldLookAtChat = Math.random() < CHAT_LOOK_PROBABILITY && 
                            positions && 
                            isChatWindowOpen && 
                            currentView === "chat";

    if (shouldLookAtChat) {
      // Look at chat using simple direction system
      const lookDirection = calculateSimpleDirection(positions.clippy, positions.chat);
      
      if (lookDirection) {
        log(`Clippy looking at chat: ${lookDirection}`, { positions });
        setAnimation(ANIMATIONS[ANIMATION_TRIGGERS[lookDirection]]);
        
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
  }, [status, getPositions, isChatWindowOpen, currentView, getChatLookDirection, animation]);

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
