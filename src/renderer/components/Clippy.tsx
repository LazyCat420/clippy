import { useEffect, useState, useCallback } from "react";

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

const WAIT_TIME = 6000;

export function Clippy() {
  const {
    animationKey,
    status,
    setStatus,
    setIsChatWindowOpen,
    isChatWindowOpen,
  } = useChat();
  const { enableDragDebug } = useDebugState();
  const { settings } = useSharedState();
  const [animation, setAnimation] = useState<Animation>(EMPTY_ANIMATION);
  const [animationTimeoutId, setAnimationTimeoutId] = useState<
    number | undefined
  >(undefined);

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
    const playRandomIdleAnimation = () => {
      if (status !== "idle") return;

      const randomIdleAnimation = getRandomIdleAnimation(animation);
      setAnimation(randomIdleAnimation);

      // Reset back to default after 6 seconds and schedule next animation
      setAnimationTimeoutId(
        window.setTimeout(() => {
          setAnimation(ANIMATIONS.Default);
          setAnimationTimeoutId(
            window.setTimeout(playRandomIdleAnimation, WAIT_TIME),
          );
        }, randomIdleAnimation.length),
      );
    };

    if (status === "welcome" && animation === EMPTY_ANIMATION) {
      setAnimation(ANIMATIONS.Show);
      setTimeout(() => {
        setStatus("idle");
      }, ANIMATIONS.Show.length + 200);
    } else if (status === "idle") {
      if (!animationTimeoutId) {
        playRandomIdleAnimation();
      }
    }

    // Clean up timeouts when component unmounts or status changes
    return () => {
      if (animationTimeoutId) {
        window.clearTimeout(animationTimeoutId);
      }
    };
  }, [status]);

  useEffect(() => {
    log(`New animation key`, { animationKey });
    playAnimation(animationKey);
  }, [animationKey, playAnimation]);

  return (
    <div>
      <div
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
