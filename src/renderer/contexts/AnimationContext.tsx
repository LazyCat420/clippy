import { createContext, useContext, useCallback, ReactNode } from "react";
import { useChat } from "./ChatContext";

// Animation trigger types
export type AnimationTrigger = 
  | "thinking" 
  | "congratulate" 
  | "explain" 
  | "getAttention" 
  | "processing" 
  | "writing" 
  | "searching"
  | "greeting"
  | "goodbye"
  | "alert"
  | "default";

// Context for animation triggers
interface AnimationContextType {
  triggerAnimation: (trigger: AnimationTrigger) => void;
  triggerAnimationForContent: (content: string) => void;
  triggerAnimationForStatus: (status: string) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

// Animation mapping based on triggers
const ANIMATION_TRIGGERS: Record<AnimationTrigger, string> = {
  thinking: "Thinking",
  congratulate: "Congratulate", 
  explain: "Explain",
  getAttention: "GetAttention",
  processing: "Processing",
  writing: "Writing",
  searching: "Searching",
  greeting: "Greeting",
  goodbye: "GoodBye",
  alert: "Alert",
  default: "Default"
};

// Keywords that suggest specific animations
const CONTENT_KEYWORDS: Record<string, AnimationTrigger> = {
  // Thinking/Processing
  "thinking": "thinking",
  "processing": "processing", 
  "analyzing": "processing",
  "computing": "processing",
  "calculating": "processing",
  
  // Congratulations
  "congratulations": "congratulate",
  "congrats": "congratulate",
  "great job": "congratulate",
  "well done": "congratulate",
  "excellent": "congratulate",
  "fantastic": "congratulate",
  "amazing": "congratulate",
  
  // Explanations
  "explain": "explain",
  "explanation": "explain",
  "here's how": "explain",
  "let me explain": "explain",
  "the reason": "explain",
  "because": "explain",
  
  // Attention
  "attention": "getAttention",
  "notice": "getAttention",
  "important": "getAttention",
  "warning": "alert",
  "error": "alert",
  "problem": "alert",
  
  // Writing/Content
  "writing": "writing",
  "creating": "writing",
  "generating": "writing",
  "composing": "writing",
  "drafting": "writing",
  
  // Searching
  "searching": "searching",
  "search": "searching",
  "finding": "searching",
  "looking for": "searching",
  "researching": "searching",
  
  // Greetings
  "hello": "greeting",
  "hi": "greeting",
  "hey": "greeting",
  "welcome": "greeting",
  "good morning": "greeting",
  "good afternoon": "greeting",
  "good evening": "greeting",
  
  // Goodbyes
  "goodbye": "goodbye",
  "bye": "goodbye",
  "see you": "goodbye",
  "farewell": "goodbye",
  "until next time": "goodbye"
};

export function AnimationProvider({ children }: { children: ReactNode }) {
  const { setAnimationKey } = useChat();

  const triggerAnimation = useCallback((trigger: AnimationTrigger) => {
    const animationKey = ANIMATION_TRIGGERS[trigger];
    if (animationKey) {
      setAnimationKey(animationKey);
    }
  }, [setAnimationKey]);

  const triggerAnimationForContent = useCallback((content: string) => {
    const lowerContent = content.toLowerCase();
    
    // Check for exact keyword matches first
    for (const [keyword, trigger] of Object.entries(CONTENT_KEYWORDS)) {
      if (lowerContent.includes(keyword)) {
        triggerAnimation(trigger);
        return;
      }
    }
    
    // Check for patterns in the content
    if (lowerContent.includes("?") && lowerContent.length > 50) {
      // Long questions might need thinking
      triggerAnimation("thinking");
    } else if (lowerContent.includes("!") && (lowerContent.includes("great") || lowerContent.includes("amazing"))) {
      // Excitement suggests congratulations
      triggerAnimation("congratulate");
    } else if (lowerContent.length > 200) {
      // Long responses might be explanations
      triggerAnimation("explain");
    } else {
      // Default animation
      triggerAnimation("default");
    }
  }, [triggerAnimation]);

  const triggerAnimationForStatus = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case "thinking":
      case "processing":
        triggerAnimation("thinking");
        break;
      case "responding":
        triggerAnimation("processing");
        break;
      case "searching":
        triggerAnimation("searching");
        break;
      case "writing":
        triggerAnimation("writing");
        break;
      case "error":
        triggerAnimation("alert");
        break;
      default:
        triggerAnimation("default");
    }
  }, [triggerAnimation]);

  const value: AnimationContextType = {
    triggerAnimation,
    triggerAnimationForContent,
    triggerAnimationForStatus
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimation() {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimation must be used within an AnimationProvider");
  }
  return context;
} 