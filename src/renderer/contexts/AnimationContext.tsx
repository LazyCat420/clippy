import { createContext, useContext, useCallback, ReactNode } from "react";
import { useChat } from "./ChatContext";

// Animation trigger types - expanded to include all available animations
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
  | "checkingSomething"
  | "gestureDown"
  | "gestureLeft"
  | "gestureRight"
  | "gestureUp"
  | "getArtsy"
  | "getTechy"
  | "getWizardy"
  | "hearing"
  | "hide"
  | "show"
  | "print"
  | "save"
  | "sendMail"
  | "wave"
  | "emptyTrash"
  | "lookDown"
  | "lookDownLeft"
  | "lookDownRight"
  | "lookLeft"
  | "lookRight"
  | "lookUp"
  | "lookUpLeft"
  | "lookUpRight"
  | "default";

// Context for animation triggers
interface AnimationContextType {
  triggerAnimation: (trigger: AnimationTrigger) => void;
  triggerAnimationForContent: (content: string) => void;
  triggerAnimationForStatus: (status: string) => void;
  triggerLookAtChat: (clippyPos: ClippyPosition, chatPos: ChatPosition) => void;
  getChatLookDirection: (clippyPos: ClippyPosition, chatPos: ChatPosition) => AnimationTrigger | null;
  lookAtChat: () => Promise<void>;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

// Expanded animation mapping based on triggers - now includes all 23 animations
export const ANIMATION_TRIGGERS: Record<AnimationTrigger, string> = {
  alert: "Alert", // FIXED: Alert now correctly maps to Alert.png (which is the tapping animation)
  checkingSomething: "CheckingSomething",
  congratulate: "Congratulate",
  explain: "Explain", // TODO: Need to find correct animation name for explain
  getAttention: "GetAttention",
  getArtsy: "GetArtsy",
  getTechy: "GetTechy",
  getWizardy: "GetWizardy",
  goodbye: "GoodBye",
  greeting: "Greeting",
  hearing: "Hearing 1",
  hide: "Hide",
  show: "Show",
  thinking: "Thinking",
  processing: "Processing",
  searching: "Searching",
  wave: "Wave",
  writing: "Writing",
  print: "Print",
  save: "Save",
  sendMail: "SendMail",
  emptyTrash: "EmptyTrash",
  gestureUp: "GestureUp",
  gestureDown: "GestureDown",
  gestureLeft: "GestureLeft", // FIXED: Animation names are already mirrored, so use direct mapping
  gestureRight: "GestureRight", // FIXED: Animation names are already mirrored, so use direct mapping
  lookDown: "LookDown",
  lookDownLeft: "LookDownLeft", // FIXED: Animation names are already mirrored, so use direct mapping
  lookDownRight: "LookDownRight", // FIXED: Animation names are already mirrored, so use direct mapping
  lookLeft: "LookLeft", // FIXED: Animation names are already mirrored, so use direct mapping
  lookRight: "LookRight", // FIXED: Animation names are already mirrored, so use direct mapping
  lookUp: "LookUp",
  lookUpLeft: "LookUpLeft", // FIXED: Animation names are already mirrored, so use direct mapping
  lookUpRight: "LookUpRight", // FIXED: Animation names are already mirrored, so use direct mapping
  default: "Default"
};

// Enhanced keywords that suggest specific animations with better categorization
const CONTENT_KEYWORDS: Record<string, AnimationTrigger> = {
  // Error and Alert related - now triggers Wave (tapping on glass)
  "error": "alert",
  "warning": "alert",
  "problem": "alert",
  "issue": "alert",
  "bug": "alert",
  "crash": "alert",
  "failed": "alert",
  "exception": "alert",
  "invalid": "alert",
  "wrong": "alert",
  "incorrect": "alert",
  "broken": "alert",
  "not working": "alert",
  "doesn't work": "alert",
  "failed to": "alert",
  "unable to": "alert",
  "cannot": "alert",
  "can't": "alert",
  
  // Checking and Analysis
  "check": "checkingSomething",
  "checking": "checkingSomething",
  "examining": "checkingSomething",
  "analyzing": "checkingSomething",
  "investigating": "checkingSomething",
  "debugging": "checkingSomething",
  "troubleshooting": "checkingSomething",
  "diagnosing": "checkingSomething",
  "reviewing": "checkingSomething",
  "inspecting": "checkingSomething",
  "verifying": "checkingSomething",
  "testing": "checkingSomething",
  
  // Thinking and Processing
  "thinking": "thinking",
  "processing": "processing", 
  "computing": "processing",
  "calculating": "processing",
  "working on": "processing",
  "generating": "processing",
  "creating": "processing",
  "building": "processing",
  "compiling": "processing",
  "loading": "processing",
  "initializing": "processing",
  "starting": "processing",
  "running": "processing",
  "executing": "processing",
  
  // Congratulations and Success
  "congratulations": "congratulate",
  "congrats": "congratulate",
  "great job": "congratulate",
  "well done": "congratulate",
  "excellent": "congratulate",
  "fantastic": "congratulate",
  "amazing": "congratulate",
  "brilliant": "congratulate",
  "perfect": "congratulate",
  "success": "congratulate",
  "succeeded": "congratulate",
  "completed": "congratulate",
  "finished": "congratulate",
  "done": "congratulate",
  "achieved": "congratulate",
  "accomplished": "congratulate",
  
  // Explanations and Teaching
  "explain": "explain",
  "explanation": "explain",
  "here's how": "explain",
  "let me explain": "explain",
  "the reason": "explain",
  "because": "explain",
  "this is because": "explain",
  "in other words": "explain",
  "to clarify": "explain",
  "for example": "explain",
  "such as": "explain",
  "like": "explain",
  "similar to": "explain",
  "means": "explain",
  "refers to": "explain",
  "definition": "explain",
  "tutorial": "explain",
  "guide": "explain",
  "instructions": "explain",
  "steps": "explain",
  "how to": "explain",
  
  // Attention and Important
  "attention": "getAttention",
  "notice": "getAttention",
  "important": "getAttention",
  "critical": "getAttention",
  "urgent": "getAttention",
  "priority": "getAttention",
  "key": "getAttention",
  "essential": "getAttention",
  "crucial": "getAttention",
  "vital": "getAttention",
  "significant": "getAttention",
  "major": "getAttention",
  "serious": "getAttention",
  
  // Writing and Content Creation
  "writing": "writing",
  "composing": "writing",
  "drafting": "writing",
  "authoring": "writing",
  "documenting": "writing",
  "recording": "writing",
  "noting": "writing",
  "document": "writing",
  "report": "writing",
  "article": "writing",
  "blog": "writing",
  "post": "writing",
  "content": "writing",
  "text": "writing",
  
  // Searching and Research
  "searching": "searching",
  "search": "searching",
  "finding": "searching",
  "looking for": "searching",
  "researching": "searching",
  "exploring": "searching",
  "discovering": "searching",
  "locating": "searching",
  "browsing": "searching",
  "scanning": "searching",
  "query": "searching",
  "results": "searching",
  "found": "searching",
  
  // Greetings and Welcoming
  "hello": "greeting",
  "hi": "greeting",
  "hey": "greeting",
  "welcome": "greeting",
  "good morning": "greeting",
  "good afternoon": "greeting",
  "good evening": "greeting",
  "greetings": "greeting",
  "nice to meet": "greeting",
  "pleasure": "greeting",
  "introduction": "greeting",
  
  // Goodbyes and Farewells
  "goodbye": "goodbye",
  "bye": "goodbye",
  "see you": "goodbye",
  "farewell": "goodbye",
  "until next time": "goodbye",
  "take care": "goodbye",
  "have a good": "goodbye",
  "enjoy": "goodbye",
  "thanks": "goodbye",
  "thank you": "goodbye",
  "appreciate": "goodbye",
  
  // Gestures and Pointing
  "point": "gestureRight",
  "pointing": "gestureRight",
  "direct": "gestureRight",
  "indicate": "gestureRight",
  "highlight": "gestureRight",
  "mark": "gestureRight",
  "select": "gestureRight",
  "choose": "gestureRight",
  "pick": "gestureRight",
  
  // Technical and Programming
  "code": "getTechy",
  "programming": "getTechy",
  "coding": "getTechy",
  "script": "getTechy",
  "function": "getTechy",
  "method": "getTechy",
  "class": "getTechy",
  "object": "getTechy",
  "variable": "getTechy",
  "algorithm": "getTechy",
  "data structure": "getTechy",
  "database": "getTechy",
  "api": "getTechy",
  "framework": "getTechy",
  "library": "getTechy",
  "syntax": "getTechy",
  "compiler": "getTechy",
  "debugger": "getTechy",
  "repository": "getTechy",
  "git": "getTechy",
  "deployment": "getTechy",
  "server": "getTechy",
  "client": "getTechy",
  "frontend": "getTechy",
  "backend": "getTechy",
  "fullstack": "getTechy",
  
  // Creative and Artsy
  "design": "getArtsy",
  "creative": "getArtsy",
  "art": "getArtsy",
  "drawing": "getArtsy",
  "painting": "getArtsy",
  "sketch": "getArtsy",
  "illustration": "getArtsy",
  "graphic": "getArtsy",
  "visual": "getArtsy",
  "color": "getArtsy",
  "style": "getArtsy",
  "layout": "getArtsy",
  "typography": "getArtsy",
  "branding": "getArtsy",
  "logo": "getArtsy",
  "icon": "getArtsy",
  "animation": "getArtsy",
  "video": "getArtsy",
  "photo": "getArtsy",
  "image": "getArtsy",
  "picture": "getArtsy",
  
  // Magical and Fun
  "magic": "getWizardy",
  "wizard": "getWizardy",
  "spell": "getWizardy",
  "enchant": "getWizardy",
  "transform": "getWizardy",
  "wonderful": "getWizardy",
  "incredible": "getWizardy",
  "awesome": "getWizardy",
  "cool": "getWizardy",
  "fun": "getWizardy",
  "exciting": "getWizardy",
  "interesting": "getWizardy",
  "fascinating": "getWizardy",
  "surprising": "getWizardy",
  "unexpected": "getWizardy",
  
  // File Operations
  "save": "save",
  "saving": "save",
  "store": "save",
  "backup": "save",
  "export": "save",
  "download": "save",
  "archive": "save",
  "print": "print",
  "printing": "print",
  "printout": "print",
  "hardcopy": "print",
  
  // Communication
  "email": "sendMail",
  "mail": "sendMail",
  "send": "sendMail",
  "reply": "sendMail",
  "forward": "sendMail",
  "inbox": "sendMail",
  "outbox": "sendMail",
  "attachment": "sendMail",
  "cc": "sendMail",
  "bcc": "sendMail",
  
  // Cleanup and Organization
  "delete": "emptyTrash",
  "remove": "emptyTrash",
  "trash": "emptyTrash",
  "recycle": "emptyTrash",
  "clean": "emptyTrash",
  "clear": "emptyTrash",
  "organize": "emptyTrash",
  "sort": "emptyTrash",
  "arrange": "emptyTrash",
  "tidy": "emptyTrash",
  "neaten": "emptyTrash",
  
  // Looking and Observing
  "look": "lookRight",
  "looking": "lookRight",
  "see": "lookRight",
  "view": "lookRight",
  "watch": "lookRight",
  "observe": "lookRight",
  "examine": "lookRight",
  "inspect": "lookRight",
  "monitor": "lookRight",
  "track": "lookRight",
  
  // Listening and Hearing
  "listen": "hearing",
  "listening": "hearing",
  "hear": "hearing",
  "audio": "hearing",
  "sound": "hearing",
  "voice": "hearing",
  "speech": "hearing",
  "talk": "hearing",
  "speak": "hearing",
  "conversation": "hearing",
  "dialogue": "hearing",
  
  // Waving and Gestures
  "wave": "wave",
  "waving": "wave",
  "greet": "wave",
  
  // Hiding and Showing
  "hide": "hide",
  "hiding": "hide",
  "conceal": "hide",
  "cover": "hide",
  "mask": "hide",
  "showing": "show",
  "display": "show",
  "reveal": "show",
  "uncover": "show",
  "expose": "show",
  "present": "show"
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
    
    // Priority-based keyword matching with context awareness
    const matchedTrigger = findBestAnimationMatch(lowerContent);
    if (matchedTrigger) {
      triggerAnimation(matchedTrigger);
      return;
    }
    
    // Fallback to pattern-based analysis
    const patternTrigger = analyzeContentPatterns(lowerContent);
    if (patternTrigger) {
      triggerAnimation(patternTrigger);
      return;
    }
    
    // Default animation
    triggerAnimation("default");
  }, [triggerAnimation]);

  // Enhanced function to find the best animation match based on content
  const findBestAnimationMatch = (content: string): AnimationTrigger | null => {
    // CORRECTED Priority order based on what animations actually show
    // This mapping will be updated as we test each animation
    const priorityCategories = [
      // High priority - Error and alert related
      { keywords: ["error", "warning", "problem", "issue", "bug", "crash", "failed", "exception"], trigger: "alert" as AnimationTrigger },
      { keywords: ["check", "checking", "examining", "analyzing", "debugging", "troubleshooting"], trigger: "checkingSomething" as AnimationTrigger },
      
      // TEMPORARY: Based on user feedback, GetTechy shows headphones/music, not technical content
      // We'll need to find the correct animation for technical content
                        { keywords: ["music", "audio", "sound", "headphones", "listening", "hear"], trigger: "hearing" as AnimationTrigger },
      
      // Creative content (GetArtsy seems to work correctly)
      { keywords: ["design", "creative", "art", "drawing", "painting", "graphic", "visual"], trigger: "getArtsy" as AnimationTrigger },
      { keywords: ["magic", "wizard", "spell", "enchant", "transform", "wonderful"], trigger: "getWizardy" as AnimationTrigger },
      
      // Content type priority
      { keywords: ["explain", "explanation", "here's how", "let me explain", "tutorial", "guide"], trigger: "explain" as AnimationTrigger },
      { keywords: ["congratulations", "congrats", "great job", "well done", "excellent", "success"], trigger: "congratulate" as AnimationTrigger },
      { keywords: ["attention", "notice", "important", "critical", "urgent"], trigger: "getAttention" as AnimationTrigger },
      
      // Action-based priority
      { keywords: ["save", "saving", "store", "backup", "export"], trigger: "save" as AnimationTrigger },
      { keywords: ["print", "printing", "printout", "hardcopy"], trigger: "print" as AnimationTrigger },
      { keywords: ["email", "mail", "send", "reply", "forward"], trigger: "sendMail" as AnimationTrigger },
      { keywords: ["delete", "remove", "trash", "recycle", "clean"], trigger: "emptyTrash" as AnimationTrigger },
      { keywords: ["search", "searching", "finding", "looking for", "researching"], trigger: "searching" as AnimationTrigger },
      { keywords: ["write", "writing", "composing", "drafting", "authoring"], trigger: "writing" as AnimationTrigger },
      { keywords: ["think", "thinking", "processing", "computing", "calculating"], trigger: "thinking" as AnimationTrigger },
      
      // Communication priority
      { keywords: ["hello", "hi", "hey", "welcome", "greetings"], trigger: "greeting" as AnimationTrigger },
      { keywords: ["goodbye", "bye", "see you", "farewell", "take care"], trigger: "goodbye" as AnimationTrigger },
      { keywords: ["wave", "waving", "greet"], trigger: "wave" as AnimationTrigger },
      
      // Sensory priority
      { keywords: ["look", "looking", "see", "view", "watch", "observe"], trigger: "lookRight" as AnimationTrigger },
      { keywords: ["listen", "listening", "hear", "audio", "sound", "voice"], trigger: "hearing" as AnimationTrigger },
      
      // Gesture priority
      { keywords: ["point", "pointing", "direct", "indicate", "highlight"], trigger: "gestureRight" as AnimationTrigger },
      
      // Visibility priority
      { keywords: ["hide", "hiding", "conceal", "cover", "mask"], trigger: "hide" as AnimationTrigger },
      { keywords: ["showing", "display", "reveal", "uncover", "expose"], trigger: "show" as AnimationTrigger }
    ];

    // Check each category in priority order
    for (const category of priorityCategories) {
      for (const keyword of category.keywords) {
        if (content.includes(keyword)) {
          return category.trigger;
        }
      }
    }

    return null;
  };

  // Enhanced pattern analysis for content that doesn't match specific keywords
  const analyzeContentPatterns = (content: string): AnimationTrigger | null => {
    // Sentiment analysis patterns
    const hasExclamation = content.includes("!");
    const hasQuestion = content.includes("?");
    const contentLength = content.length;
    const wordCount = content.split(/\s+/).length;
    
    // Excitement patterns (multiple exclamation marks, positive words)
    if (hasExclamation && (content.includes("great") || content.includes("amazing") || content.includes("fantastic"))) {
      return "congratulate";
    }
    
    // Question patterns
    if (hasQuestion) {
      if (contentLength > 100) {
        return "thinking"; // Complex questions
      } else if (content.includes("how") || content.includes("what") || content.includes("why")) {
        return "explain"; // Explanatory questions
      }
    }
    
    // Long content patterns
    if (contentLength > 300) {
      if (content.includes("step") || content.includes("process") || content.includes("method")) {
        return "explain"; // Instructional content
      } else if (content.includes("result") || content.includes("output") || content.includes("generated")) {
        return "writing"; // Generated content
      }
    }
    
    // Technical content patterns
    if (content.includes("function") || content.includes("variable") || content.includes("class") || 
        content.includes("api") || content.includes("database") || content.includes("server")) {
      return "getTechy";
    }
    
    // Creative content patterns
    if (content.includes("design") || content.includes("color") || content.includes("style") || 
        content.includes("layout") || content.includes("visual")) {
      return "getArtsy";
    }
    
    // Error/Problem patterns
    if (content.includes("doesn't") || content.includes("won't") || content.includes("can't") || 
        content.includes("failed") || content.includes("broken")) {
      return "alert";
    }
    
    // Processing patterns
    if (content.includes("working") || content.includes("generating") || content.includes("creating") || 
        content.includes("building") || content.includes("compiling")) {
      return "processing";
    }
    
    return null;
  };

  const triggerAnimationForStatus = useCallback((status: string) => {
    const lowerStatus = status.toLowerCase();
    
    // Enhanced status-based animation mapping
    switch (lowerStatus) {
      // Processing states
      case "thinking":
      case "processing":
      case "analyzing":
        triggerAnimation("thinking");
        break;
        
      case "responding":
      case "generating":
      case "creating":
        triggerAnimation("processing");
        break;
        
      case "searching":
      case "finding":
      case "researching":
        triggerAnimation("searching");
        break;
        
      case "writing":
      case "composing":
      case "drafting":
        triggerAnimation("writing");
        break;
        
      // Error states
      case "error":
      case "failed":
      case "problem":
      case "issue":
        triggerAnimation("alert");
        break;
        
      // Success states
      case "success":
      case "completed":
      case "finished":
      case "done":
        triggerAnimation("congratulate");
        break;
        
      // Communication states
      case "greeting":
      case "welcome":
        triggerAnimation("greeting");
        break;
        
      case "goodbye":
      case "farewell":
        triggerAnimation("goodbye");
        break;
        
      // Attention states
      case "attention":
      case "important":
      case "critical":
        triggerAnimation("getAttention");
        break;
        
      // Technical states
      case "coding":
      case "programming":
      case "debugging":
        triggerAnimation("getTechy");
        break;
        
      // Creative states
      case "designing":
      case "creating":
      case "artistic":
        triggerAnimation("getArtsy");
        break;
        
      // File operation states
      case "saving":
      case "storing":
        triggerAnimation("save");
        break;
        
      case "printing":
        triggerAnimation("print");
        break;
        
      case "sending":
      case "emailing":
        triggerAnimation("sendMail");
        break;
        
      case "deleting":
      case "cleaning":
        triggerAnimation("emptyTrash");
        break;
        
      // Default fallback
      default:
        triggerAnimation("default");
        break;
    }
  }, [triggerAnimation]);

  const getChatLookDirection = useCallback((clippyPos: ClippyPosition, chatPos: ChatPosition) => {
    // Convert to simple positions (center points)
    const simpleClippyPos = {
      x: clippyPos.x + clippyPos.width / 2,
      y: clippyPos.y + clippyPos.height / 2,
    };
    const simpleChatPos = {
      x: chatPos.x + chatPos.width / 2,
      y: chatPos.y + chatPos.height / 2,
    };
    return calculateSimpleDirection(simpleClippyPos, simpleChatPos);
  }, []);

  const triggerLookAtChat = useCallback((clippyPos: ClippyPosition, chatPos: ChatPosition) => {
    // Convert to simple positions (center points)
    const simpleClippyPos = {
      x: clippyPos.x + clippyPos.width / 2,
      y: clippyPos.y + clippyPos.height / 2,
    };
    const simpleChatPos = {
      x: chatPos.x + chatPos.width / 2,
      y: chatPos.y + chatPos.height / 2,
    };
    const lookDirection = calculateSimpleDirection(simpleClippyPos, simpleChatPos);
    if (lookDirection) {
      triggerAnimation(lookDirection);
    }
  }, [triggerAnimation]);

  // Function to look at chat using IPC-based solution - EXACT SAME LOGIC AS WORKING TEST
  const lookAtChat = useCallback(async () => {
    try {
      console.log("🎯 AnimationContext: Attempting to look at chat...");
      
      // Get all window positions from main process - EXACT SAME AS WORKING TEST
      const windowPositions = await (window as any).clippy.getWindowPositions();
      
      if (windowPositions && windowPositions.length > 0) {
        console.log(`🎯 AnimationContext: Found ${windowPositions.length} windows`);
        
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
          console.log(`🎯 AnimationContext: Found windows - Clippy: "${clippyWindow.title}", Chat: "${chatWindow.title}"`);
          
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
            console.log(`🎯 AnimationContext: Clippy looking at chat: ${directionResult.direction}`);
            // Use the EXACT SAME animation trigger as the working test
            triggerAnimation(directionResult.direction);
            console.log("✅ Animation triggered!");
          } else {
            console.log(`🎯 AnimationContext: Chat too far away: ${directionResult.distance}px`);
          }
        } else {
          console.log("🎯 AnimationContext: Could not identify windows, trying fallback...");
          
          // Fallback: manually identify based on size and position - EXACT SAME AS WORKING TEST
          const smallWindow = windowPositions.find((w: any) => w.width < 200);
          const largeWindow = windowPositions.find((w: any) => w.width > 400);
          
          if (smallWindow && largeWindow) {
            console.log(`🎯 AnimationContext: Fallback - Small: "${smallWindow.title}", Large: "${largeWindow.title}"`);
            
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
              console.log(`🎯 AnimationContext: Clippy looking at chat (fallback): ${directionResult.direction}`);
              // Use the EXACT SAME animation trigger as the working test
              triggerAnimation(directionResult.direction);
              console.log("✅ Animation triggered!");
            } else {
              console.log(`🎯 AnimationContext: Fallback - Chat too far away: ${directionResult.distance}px`);
            }
          } else {
            console.log("🎯 AnimationContext: Fallback also failed - no suitable windows found");
          }
        }
      } else {
        console.log("🎯 AnimationContext: No windows found");
      }
    } catch (error) {
      console.error("🎯 AnimationContext: Failed to look at chat:", error);
    }
  }, [triggerAnimation]);

  const value: AnimationContextType = {
    triggerAnimation,
    triggerAnimationForContent,
    triggerAnimationForStatus,
    triggerLookAtChat,
    getChatLookDirection,
    lookAtChat
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

// Chat position detection for looking animations
export interface ChatPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClippyPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

 

// Simple and reliable direction calculation system
export interface SimplePosition {
  x: number;
  y: number;
}

// Calculate direction between two points using simple geometry
export function calculateSimpleDirection(
  clippyPos: SimplePosition,
  chatPos: SimplePosition
): AnimationTrigger | null {
  // Calculate the difference in coordinates
  const deltaX = chatPos.x - clippyPos.x;
  const deltaY = chatPos.y - clippyPos.y;
  
  // Calculate distance
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // If too far away, don't look
  const maxDistance = 600; // pixels
  if (distance > maxDistance) {
    return null;
  }
  
  // Calculate angle in degrees (0 = right, 90 = up, 180 = left, 270 = down)
  const angleDegrees = (Math.atan2(-deltaY, deltaX) * 180 / Math.PI + 360) % 360;
  
  // Convert angle to direction
  // We'll use 8 directions for more precision
  if (angleDegrees >= 337.5 || angleDegrees < 22.5) {
    return "lookRight"; // 0° ± 22.5°
  } else if (angleDegrees >= 22.5 && angleDegrees < 67.5) {
    return "lookUpRight"; // 45° ± 22.5°
  } else if (angleDegrees >= 67.5 && angleDegrees < 112.5) {
    return "lookUp"; // 90° ± 22.5°
  } else if (angleDegrees >= 112.5 && angleDegrees < 157.5) {
    return "lookUpLeft"; // 135° ± 22.5°
  } else if (angleDegrees >= 157.5 && angleDegrees < 202.5) {
    return "lookLeft"; // 180° ± 22.5°
  } else if (angleDegrees >= 202.5 && angleDegrees < 247.5) {
    return "lookDownLeft"; // 225° ± 22.5°
  } else if (angleDegrees >= 247.5 && angleDegrees < 292.5) {
    return "lookDown"; // 270° ± 22.5°
  } else {
    return "lookDownRight"; // 315° ± 22.5°
  }
}

// Enhanced version that also returns debug info
export function calculateDirectionWithDebug(
  clippyPos: SimplePosition,
  chatPos: SimplePosition
): { direction: AnimationTrigger | null; debug: string } {
  const deltaX = chatPos.x - clippyPos.x;
  const deltaY = chatPos.y - clippyPos.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  const angleDegrees = (Math.atan2(-deltaY, deltaX) * 180 / Math.PI + 360) % 360;
  
  const maxDistance = 600;
  if (distance > maxDistance) {
    return {
      direction: null,
      debug: `Too far: ${distance.toFixed(0)}px > ${maxDistance}px`
    };
  }
  
  const direction = calculateSimpleDirection(clippyPos, chatPos);
  const debug = `Distance: ${distance.toFixed(0)}px, Angle: ${angleDegrees.toFixed(1)}°, Direction: ${direction}`;
  
  return { direction, debug };
} 