import { useSharedState } from "../contexts/SharedStateContext";
import { clippyApi } from "../clippyApi";
import { ttsService } from "../services/TTSService";
import { audioService } from "../services/AudioService";
import { useAnimation } from "../contexts/AnimationContext";
import { useState, useEffect } from "react";
import { useChat } from "../contexts/ChatContext";
import { calculateSimpleDirection, calculateDirectionWithDebug } from "../contexts/AnimationContext";

export function SettingsAudio() {
  const { settings } = useSharedState();
  const { triggerAnimationForContent, getChatLookDirection, triggerAnimation } = useAnimation();
  const { setAnimationKey } = useChat();
  const [availableVoices, setAvailableVoices] = useState<Array<{ name: string; lang: string; default?: boolean }>>([]);
  const [isTTSSupported, setIsTTSSupported] = useState(false);
  const [isAudioSupported, setIsAudioSupported] = useState(false);

  useEffect(() => {
    // Check TTS support
    setIsTTSSupported(ttsService.isTTSSupported());
    setIsAudioSupported(audioService.isAudioSupported());
    
    // Load available voices
    if (isTTSSupported) {
      setAvailableVoices(ttsService.getAvailableVoices());
    }
  }, [isTTSSupported]);

  const handleSettingChange = (key: string, value: any) => {
    clippyApi.setState(`settings.${key}`, value);
  };

  const testTTS = async () => {
    if (isTTSSupported) {
      try {
        await ttsService.speak({
          text: "Hello! This is a test of Clippy's text-to-speech feature.",
          settings: {
            rate: settings.ttsRate,
            pitch: settings.ttsPitch,
            volume: settings.ttsVolume,
            voice: settings.ttsVoice
          }
        });
      } catch (error) {
        console.error("TTS test failed:", error);
      }
    }
  };

  const testTTSWithSpecialChars = async () => {
    if (isTTSSupported) {
      try {
        await ttsService.speak({
          text: "Testing special characters: • Bullet points • Asterisks * Underscores _ And other symbols!",
          settings: {
            rate: settings.ttsRate,
            pitch: settings.ttsPitch,
            volume: settings.ttsVolume,
            voice: settings.ttsVoice
          }
        });
      } catch (error) {
        console.error("TTS test failed:", error);
      }
    }
  };

  const stopTTS = () => {
    if (isTTSSupported) {
      ttsService.stopAll();
    }
  };

  const testTTSQueue = async () => {
    if (isTTSSupported) {
      try {
        // Queue multiple TTS requests to test the queue system
        console.log("Testing TTS queue with multiple requests...");
        
        const promises = [
          ttsService.speak({
            text: "First message in the queue.",
            settings: {
              rate: settings.ttsRate,
              pitch: settings.ttsPitch,
              volume: settings.ttsVolume,
              voice: settings.ttsVoice
            }
          }),
          ttsService.speak({
            text: "Second message in the queue.",
            settings: {
              rate: settings.ttsRate,
              pitch: settings.ttsPitch,
              volume: settings.ttsVolume,
              voice: settings.ttsVoice
            }
          }),
          ttsService.speak({
            text: "Third message in the queue.",
            settings: {
              rate: settings.ttsRate,
              pitch: settings.ttsPitch,
              volume: settings.ttsVolume,
              voice: settings.ttsVoice
            }
          })
        ];
    
        // Start all requests (they will be queued)
        promises.forEach((promise, index) => {
          promise.catch(error => {
            console.error(`TTS request ${index + 1} failed:`, error);
          });
        });
    
        alert("✅ Queued 3 TTS messages! Try stopping them with the Stop button or Escape key.");
      } catch (error) {
        console.error("TTS queue test failed:", error);
        alert("❌ TTS queue test failed");
      }
    }
  };

  // Test animation system with different content types
  const testAnimationWithContent = (content: string) => {
    try {
      console.log(`Testing animation system with content: "${content}"`);
      
      // Trigger animation based on content
      triggerAnimationForContent(content);
      
      // Also test TTS with the same content
      if (settings.enableTTS) {
        ttsService.speakWithAnimation(content, "explain").catch(error => {
          console.warn("TTS failed:", error);
        });
      }
      
      alert(`✅ Triggered animation for: "${content}"`);
    } catch (error) {
      console.error("Animation test failed:", error);
      alert("❌ Animation test failed");
    }
  };

  // Test individual animations to see what they actually show
  const testIndividualAnimation = (animationName: string) => {
    try {
      console.log(`Testing individual animation: ${animationName}`);
      
      // Directly trigger the specific animation
      setAnimationKey(animationName);
      
      alert(`🎬 Playing animation: ${animationName}\n\nPlease observe what this animation actually shows so we can correct the mappings!`);
    } catch (error) {
      console.error("Individual animation test failed:", error);
      alert("❌ Individual animation test failed");
    }
  };

  const testSoundEffect = async () => {
    if (isAudioSupported) {
      try {
        await audioService.playSuccessSound();
      } catch (error) {
        console.error("Sound effect test failed:", error);
      }
    }
  };

  // Robust element discovery function
  const findElements = () => {
    console.log("🔍 Searching for Clippy and chat elements...");
    
    // Try multiple strategies to find Clippy
    let clippyElement = null;
    const clippySelectors = [
      '.app-no-select', // ✅ Found in debug!
      '.app-drag',
      '[data-clippy]',
      '.clippy',
      '.app',
      'img[src*="clippy"]',
      'img[src*="animation"]',
      'div[style*="position: absolute"]',
      'div[style*="z-index"]'
    ];
    
    for (const selector of clippySelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log(`✅ Found Clippy with selector: ${selector}`);
        clippyElement = element;
        break;
      }
    }
    
    // Try multiple strategies to find chat
    let chatElement = null;
    const chatSelectors = [
      '.bubble-container',
      '.chat-container',
      '.bubble',
      '[data-chat]',
      '.window-portal',
      'div[style*="width: 450px"]',
      'div[style*="height: 650px"]',
      '.chat-window',
      // More comprehensive chat detection
      'div[style*="position: fixed"]',
      'div[style*="position: absolute"]',
      'div[style*="z-index: 1000"]',
      'div[style*="z-index: 999"]',
      'div[style*="background"]',
      'div[style*="border"]',
      // Look for any div with significant dimensions
      'div[style*="width"]',
      'div[style*="height"]'
    ];
    
    for (const selector of chatSelectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        console.log(`✅ Found chat with selector: ${selector}`);
        chatElement = element;
        break;
      }
    }
    
    // Fallback: search by content/attributes
    if (!clippyElement) {
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        if (div.style.position === 'absolute' && div.style.zIndex && div.children.length > 0) {
          const hasImage = div.querySelector('img');
          if (hasImage) {
            console.log("✅ Found Clippy by fallback search");
            clippyElement = div as HTMLElement;
            break;
          }
        }
      }
    }
    
    if (!chatElement) {
      const allDivs = document.querySelectorAll('div');
      for (const div of allDivs) {
        const style = div.style;
        const rect = div.getBoundingClientRect();
        
        // Look for elements that could be the chat window
        if (
          // Has significant dimensions
          (rect.width > 300 && rect.height > 400) ||
          // Has specific styling that suggests it's a window
          (style.position === 'fixed' || style.position === 'absolute') ||
          (style.zIndex && parseInt(style.zIndex) > 100) ||
          // Has background or border (window-like appearance)
          style.backgroundColor || style.border ||
          // Has specific dimensions
          style.width === '450px' || style.height === '650px'
        ) {
          console.log("✅ Found potential chat element:", {
            width: rect.width,
            height: rect.height,
            position: style.position,
            zIndex: style.zIndex,
            className: div.className,
            id: div.id
          });
          chatElement = div as HTMLElement;
          break;
        }
      }
    }
    
    return { clippyElement, chatElement };
  };

  // Electron-specific element discovery for multi-window apps
  const findElementsElectron = () => {
    console.log("🔧 Electron Multi-Window Element Discovery...");
    
    let debugInfo = "🔧 Electron Analysis:\n\n";
    
    // Check if we're in the main window or a child window
    const isMainWindow = window.location.href.includes('index.html') || window.location.href.includes('localhost');
    debugInfo += `Window Type: ${isMainWindow ? 'Main Window' : 'Child Window'}\n`;
    debugInfo += `URL: ${window.location.href}\n\n`;
    
    // Try to access parent window if we're in a child window
    let targetWindow = window;
    if (window.parent !== window) {
      debugInfo += "✅ Found parent window\n";
      targetWindow = window.parent;
    }
    
    // Check for Electron-specific APIs
    if ((window as any).electronAPI) {
      debugInfo += "✅ Electron API available\n";
    }
    
    if ((window as any).require) {
      debugInfo += "✅ Node.js require available\n";
    }
    
    // Try to find elements in current window
    const currentClippy = document.querySelector('.app-no-select') as HTMLElement;
    if (currentClippy) {
      const rect = currentClippy.getBoundingClientRect();
      debugInfo += `✅ Found Clippy in current window:\n`;
      debugInfo += `   Position: (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)})\n`;
      debugInfo += `   Size: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}\n`;
      debugInfo += `   Is visible: ${rect.width > 0 && rect.height > 0}\n\n`;
    } else {
      debugInfo += "❌ No Clippy in current window\n\n";
    }
    
    // Try to find elements in parent window
    if (targetWindow !== window) {
      try {
        const parentClippy = targetWindow.document.querySelector('.app-no-select') as HTMLElement;
        if (parentClippy) {
          const rect = parentClippy.getBoundingClientRect();
          debugInfo += `✅ Found Clippy in parent window:\n`;
          debugInfo += `   Position: (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)})\n`;
          debugInfo += `   Size: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}\n`;
          debugInfo += `   Is visible: ${rect.width > 0 && rect.height > 0}\n\n`;
        }
      } catch (error) {
        debugInfo += `❌ Cannot access parent window: ${error.message}\n\n`;
      }
    }
    
    // Look for chat elements in all accessible windows
    const allWindows: any[] = [window];
    if (window.parent !== window) allWindows.push(window.parent);
    if ((window as any).opener) allWindows.push((window as any).opener);
    
    let chatFound = false;
    allWindows.forEach((win, index) => {
      try {
        const allDivs = win.document.querySelectorAll('div');
        const largeDivs = Array.from(allDivs).filter(div => {
          const rect = div.getBoundingClientRect();
          return rect.width > 300 && rect.height > 400;
        });
        
        if (largeDivs.length > 0) {
          debugInfo += `✅ Found ${largeDivs.length} large divs in window ${index}:\n`;
          largeDivs.forEach((div, i) => {
            const rect = div.getBoundingClientRect();
            debugInfo += `   ${i + 1}. Size: ${rect.width.toFixed(0)}x${rect.height.toFixed(0)}\n`;
            debugInfo += `      Class: "${div.className}"\n`;
            debugInfo += `      Position: (${rect.left.toFixed(0)}, ${rect.top.toFixed(0)})\n`;
          });
          chatFound = true;
        }
      } catch (error) {
        debugInfo += `❌ Cannot access window ${index}: ${error.message}\n`;
      }
    });
    
    if (!chatFound) {
      debugInfo += "❌ No large divs found in any accessible window\n";
    }
    
    return debugInfo;
  };

  return (
    <div style={{ padding: "16px" }}>
      <h3>Audio & Speech Settings</h3>
      
      {/* TTS Section */}
      <div style={{ marginBottom: "20px" }}>
        <h4>Text-to-Speech</h4>
        
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="checkbox"
              checked={settings.enableTTS || false}
              onChange={(e) => handleSettingChange("enableTTS", e.target.checked)}
            />
            Enable Text-to-Speech
          </label>
          {!isTTSSupported && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
              TTS is not supported in this browser
            </div>
          )}
        </div>

        {settings.enableTTS && isTTSSupported && (
          <>
            <div style={{ marginBottom: "10px" }}>
              <label>
                Voice:
                <select
                  value={settings.ttsVoice || ""}
                  onChange={(e) => handleSettingChange("ttsVoice", e.target.value)}
                  style={{ marginLeft: "8px" }}
                >
                  <option value="">Default</option>
                  {availableVoices.map((voice) => (
                    <option key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>
                Speech Rate: {settings.ttsRate || 1.0}
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.ttsRate || 1.0}
                  onChange={(e) => handleSettingChange("ttsRate", parseFloat(e.target.value))}
                  style={{ marginLeft: "8px", width: "100px" }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>
                Pitch: {settings.ttsPitch || 1.0}
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={settings.ttsPitch || 1.0}
                  onChange={(e) => handleSettingChange("ttsPitch", parseFloat(e.target.value))}
                  style={{ marginLeft: "8px", width: "100px" }}
                />
              </label>
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>
                Volume: {settings.ttsVolume || 0.8}
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={settings.ttsVolume || 0.8}
                  onChange={(e) => handleSettingChange("ttsVolume", parseFloat(e.target.value))}
                  style={{ marginLeft: "8px", width: "100px" }}
                />
              </label>
            </div>

            <button onClick={testTTS} style={{ marginTop: "8px" }}>
              Test TTS
            </button>
            <button onClick={testTTSWithSpecialChars} style={{ marginTop: "8px", marginLeft: "8px" }}>
              Test TTS with Special Chars
            </button>
            <button onClick={testTTSQueue} style={{ marginTop: "8px", marginLeft: "8px" }}>
              Test TTS Queue
            </button>
            
            {/* Enhanced Animation System Test */}
            <div style={{ marginTop: "16px", padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>🎭 Enhanced Animation System Test</h4>
              <p style={{ fontSize: "11px", margin: "0 0 8px 0", color: "#666" }}>
                Test the new animation system with different content types:
              </p>
              
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                <button 
                  onClick={() => testAnimationWithContent("I found an error in the code!")}
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  title="Should trigger Alert animation"
                >
                  🚨 Error Test
                </button>
                
                <button 
                  onClick={() => testAnimationWithContent("Let me check what's happening here...")}
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  title="Should trigger CheckingSomething animation"
                >
                  🔍 Check Test
                </button>
                
                <button 
                  onClick={() => testAnimationWithContent("Here's how to fix this problem:")}
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  title="Should trigger Explain animation"
                >
                  📚 Explain Test
                </button>
                
                <button 
                  onClick={() => testAnimationWithContent("Congratulations! You did it!")}
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  title="Should trigger Congratulate animation"
                >
                  🎉 Congrats Test
                </button>
                
                <button 
                  onClick={() => testAnimationWithContent("function calculateTotal() { return sum; }")}
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  title="Should trigger GetTechy animation (but this might be wrong - let's test!)"
                >
                  💻 Tech Test
                </button>
                
                <button 
                  onClick={() => testAnimationWithContent("Let's listen to some music!")}
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  title="Should trigger GetTechy animation (headphones/music)"
                >
                  🎧 Music Test
                </button>
                
                <button 
                  onClick={() => testAnimationWithContent("Let's create a beautiful design!")}
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  title="Should trigger GetArtsy animation"
                >
                  🎨 Creative Test
                </button>
                
                <button 
                  onClick={() => testAnimationWithContent("Hello! How can I help you today?")}
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  title="Should trigger Greeting animation"
                >
                  👋 Greeting Test
                </button>
                
                <button 
                  onClick={() => testAnimationWithContent("I'm searching for the best solution...")}
                  style={{ fontSize: "10px", padding: "4px 8px" }}
                  title="Should trigger Searching animation"
                >
                  🔎 Search Test
                </button>
              </div>
            </div>

            {/* Animation Debug Panel */}
            <div style={{ marginTop: "16px", padding: "12px", border: "1px solid #ff6b6b", borderRadius: "4px", backgroundColor: "#fff5f5" }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#d63031" }}>🔧 Animation Debug Panel - All 23 Animations</h4>
              <p style={{ fontSize: "11px", margin: "0 0 8px 0", color: "#666" }}>
                Test all 23 animations to see what they actually show. Click each button and observe Clippy's behavior:
              </p>
              
                        {/* Chat Position Test */}
          <div style={{ marginBottom: "12px" }}>
            <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#d63031" }}>👀 Clock-Based Chat Position Test:</h5>
            <div style={{ fontSize: "10px", marginBottom: "8px", color: "#666" }}>
              🕐 Clock System: 12=Up, 3=Right, 6=Down, 9=Left
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>

              
              <button 
                onClick={() => {
                  try {
                    console.log("Testing REAL chat position detection...");
                    
                    // Use robust element discovery
                    const { clippyElement, chatElement } = findElements();
                    
                    if (!clippyElement || !chatElement) {
                      alert("❌ Could not find Clippy or chat elements in the DOM\n\nMake sure:\n1. Clippy is visible\n2. Chat window is open\n3. Both elements are rendered\n\nTried multiple selectors and fallback methods.");
                      return;
                    }
                    
                    const clippyRect = clippyElement.getBoundingClientRect();
                    const chatRect = chatElement.getBoundingClientRect();
                    
                    // Use center points for more accurate direction
                    const clippyCenter = {
                      x: clippyRect.left + clippyRect.width / 2,
                      y: clippyRect.top + clippyRect.height / 2,
                    };
                    
                    const chatCenter = {
                      x: chatRect.left + chatRect.width / 2,
                      y: chatRect.top + chatRect.height / 2,
                    };
                    
                    console.log("Clippy center:", clippyCenter);
                    console.log("Chat center:", chatCenter);
                    
                    // Calculate direction using simple geometry
                    const result = calculateDirectionWithDebug(clippyCenter, chatCenter);
                    
                    if (result.direction) {
                      console.log(`Chat direction: ${result.direction}`);
                      triggerAnimation(result.direction);
                      alert(`✅ REAL POSITION TEST:\n\nClippy: (${clippyCenter.x.toFixed(0)}, ${clippyCenter.y.toFixed(0)})\nChat: (${chatCenter.x.toFixed(0)}, ${chatCenter.y.toFixed(0)})\n\n${result.debug}\n\n🎯 Clippy should now be looking: ${result.direction}`);
                    } else {
                      alert(`❌ Chat too far away:\n\nClippy: (${clippyCenter.x.toFixed(0)}, ${clippyCenter.y.toFixed(0)})\nChat: (${chatCenter.x.toFixed(0)}, ${chatCenter.y.toFixed(0)})\n\n${result.debug}\n\n💡 Try moving Clippy closer to the chat window`);
                    }
                  } catch (error) {
                    console.error("Real position test failed:", error);
                    alert("❌ Real position test failed: " + error.message);
                  }
                }}
                style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                title="Test Clippy looking at the REAL chat position"
              >
                Test Real Chat Position
              </button>
              
              <button 
                onClick={() => {
                  try {
                    console.log("Testing all 8 directions with real positions...");
                    
                    // Use robust element discovery
                    const { clippyElement, chatElement } = findElements();
                    
                    if (!clippyElement || !chatElement) {
                      alert("❌ Could not find Clippy or chat elements\n\nTried multiple selectors and fallback methods.");
                      return;
                    }
                    
                    const clippyRect = clippyElement.getBoundingClientRect();
                    const chatRect = chatElement.getBoundingClientRect();
                    
                    const clippyCenter = {
                      x: clippyRect.left + clippyRect.width / 2,
                      y: clippyRect.top + clippyRect.height / 2,
                    };
                    
                    const chatCenter = {
                      x: chatRect.left + chatRect.width / 2,
                      y: chatRect.top + chatRect.height / 2,
                    };
                    
                    // Test all 8 directions by temporarily moving chat to different positions
                    const directions = [
                      { name: "Up", offset: { x: 0, y: -200 } },
                      { name: "Up-Right", offset: { x: 200, y: -200 } },
                      { name: "Right", offset: { x: 200, y: 0 } },
                      { name: "Down-Right", offset: { x: 200, y: 200 } },
                      { name: "Down", offset: { x: 0, y: 200 } },
                      { name: "Down-Left", offset: { x: -200, y: 200 } },
                      { name: "Left", offset: { x: -200, y: 0 } },
                      { name: "Up-Left", offset: { x: -200, y: -200 } },
                    ];
                    
                    let results = "🧭 All 8 Directions Test:\n\n";
                    let testIndex = 0;
                    
                    const runTest = () => {
                      if (testIndex >= directions.length) {
                        alert(results);
                        return;
                      }
                      
                      const test = directions[testIndex];
                      const testChatPos = {
                        x: clippyCenter.x + test.offset.x,
                        y: clippyCenter.y + test.offset.y,
                      };
                      
                      const result = calculateDirectionWithDebug(clippyCenter, testChatPos);
                      const status = result.direction ? "✅" : "❌";
                      results += `${status} ${test.name}: ${result.direction || "null"}\n`;
                      
                      if (result.direction) {
                        triggerAnimation(result.direction);
                        setTimeout(() => {
                          testIndex++;
                          runTest();
                        }, 1000); // Wait 1 second between tests
                      } else {
                        testIndex++;
                        runTest();
                      }
                    };
                    
                    runTest();
                    
                  } catch (error) {
                    console.error("8 directions test failed:", error);
                    alert("❌ 8 directions test failed: " + error.message);
                  }
                }}
                style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e17055", color: "white" }}
                title="Test all 8 look directions"
              >
                Test All 8 Directions
              </button>
              
              <button 
                onClick={() => {
                  try {
                    console.log("🔍 DOM Structure Debug...");
                    
                    // Log all elements with potential identifiers
                    const allElements = document.querySelectorAll('*');
                    let debugInfo = "🔍 DOM Structure Analysis:\n\n";
                    
                    // Find elements with specific characteristics
                    const clippyCandidates: Array<{ element: Element; id: string; className: string; index: number }> = [];
                    const chatCandidates: Array<{ element: Element; id: string; className: string; index: number }> = [];
                    
                    allElements.forEach((element, index) => {
                      const tag = element.tagName.toLowerCase();
                      const id = element.id;
                      const className = element.className;
                      const style = (element as HTMLElement).style;
                      
                      // Look for Clippy candidates
                      if (tag === 'img') {
                        const imgElement = element as HTMLImageElement;
                        if (imgElement.src.includes('animation') || imgElement.src.includes('clippy')) {
                          clippyCandidates.push({ element, id, className, index });
                        }
                      }
                      
                      if (tag === 'div' && style.position === 'absolute' && style.zIndex) {
                        const hasImage = element.querySelector('img');
                        if (hasImage) {
                          clippyCandidates.push({ element, id, className, index });
                        }
                      }
                      
                      // Look for chat candidates
                      if (tag === 'div' && (style.width === '450px' || style.width === '450px')) {
                        chatCandidates.push({ element, id, className, index });
                      }
                      
                      if (tag === 'div' && (className.includes('bubble') || className.includes('chat') || className.includes('window'))) {
                        chatCandidates.push({ element, id, className, index });
                      }
                    });
                    
                    debugInfo += `📊 Found ${clippyCandidates.length} Clippy candidates:\n`;
                    clippyCandidates.forEach((candidate, i) => {
                      debugInfo += `${i + 1}. ID: "${candidate.id}", Class: "${candidate.className}", Index: ${candidate.index}\n`;
                    });
                    
                    debugInfo += `\n📊 Found ${chatCandidates.length} Chat candidates:\n`;
                    chatCandidates.forEach((candidate, i) => {
                      debugInfo += `${i + 1}. ID: "${candidate.id}", Class: "${candidate.className}", Index: ${candidate.index}\n`;
                    });
                    
                    debugInfo += `\n🔍 Total elements in DOM: ${allElements.length}`;
                    
                    console.log(debugInfo);
                    alert(debugInfo);
                    
                  } catch (error) {
                    console.error("DOM debug failed:", error);
                    alert("❌ DOM debug failed: " + error.message);
                  }
                }}
                style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#9b59b6", color: "white" }}
                title="Debug DOM structure to find correct selectors"
              >
                Debug DOM Structure
              </button>

              <button 
                onClick={() => {
                  try {
                    console.log("🔧 React Refs Alternative Test...");
                    
                    // Try to get elements through React context or parent refs
                    // This is a more reliable approach than DOM queries
                    
                    let debugInfo = "🔧 React Refs Alternative:\n\n";
                    
                    // Check if we can access elements through React context
                    const reactRoot = document.querySelector('#root') || document.querySelector('[data-reactroot]');
                    if (reactRoot) {
                      debugInfo += "✅ Found React root element\n";
                      
                      // Look for elements with React-specific attributes
                      const reactElements = reactRoot.querySelectorAll('[data-testid], [data-component], [class*="react"]');
                      debugInfo += `Found ${reactElements.length} React-specific elements\n`;
                      
                      // Look for our specific components
                      const clippyReact = reactRoot.querySelector('[data-component="clippy"], [data-testid="clippy"], .clippy-component');
                      const chatReact = reactRoot.querySelector('[data-component="chat"], [data-testid="chat"], .chat-component');
                      
                      if (clippyReact) {
                        debugInfo += "✅ Found Clippy through React selectors\n";
                        console.log("Clippy React element:", clippyReact);
                      }
                      
                      if (chatReact) {
                        debugInfo += "✅ Found Chat through React selectors\n";
                        console.log("Chat React element:", chatReact);
                      }
                    } else {
                      debugInfo += "❌ No React root found\n";
                    }
                    
                    // Try window-based approach (for Electron)
                    if ((window as any).__CLIPPY_REF__) {
                      debugInfo += "✅ Found Clippy ref in window object\n";
                    }
                    
                    if ((window as any).__CHAT_REF__) {
                      debugInfo += "✅ Found Chat ref in window object\n";
                    }
                    
                    debugInfo += "\n💡 Suggestion: Add data attributes to components for easier selection";
                    
                    console.log(debugInfo);
                    alert(debugInfo);
                    
                  } catch (error) {
                    console.error("React refs test failed:", error);
                    alert("❌ React refs test failed: " + error.message);
                  }
                }}
                style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e67e22", color: "white" }}
                title="Try React refs approach instead of DOM queries"
              >
                React Refs Test
              </button>

              <button 
                onClick={() => {
                  try {
                    console.log("🔍 Chat Window Structure Analysis...");
                    
                    // First, try to find Clippy with the correct selector
                    const clippyElement = document.querySelector('.app-no-select') as HTMLElement;
                    let debugInfo = "🔍 Chat Window Analysis:\n\n";
                    
                    if (clippyElement) {
                      debugInfo += "✅ Found Clippy with .app-no-select\n";
                      const clippyRect = clippyElement.getBoundingClientRect();
                      debugInfo += `Clippy position: (${clippyRect.left.toFixed(0)}, ${clippyRect.top.toFixed(0)})\n`;
                      debugInfo += `Clippy size: ${clippyRect.width.toFixed(0)}x${clippyRect.height.toFixed(0)}\n\n`;
                    } else {
                      debugInfo += "❌ Clippy not found\n\n";
                    }
                    
                    // Analyze all divs to find potential chat windows
                    const allDivs = document.querySelectorAll('div');
                    const potentialChats: Array<{
                      index: number;
                      className: string;
                      id: string;
                      width: number;
                      height: number;
                      left: number;
                      top: number;
                      position: string;
                      zIndex: string;
                      backgroundColor: string;
                      border: string;
                    }> = [];
                    
                    allDivs.forEach((div, index) => {
                      const rect = div.getBoundingClientRect();
                      const style = div.style;
                      
                      // Look for elements that could be chat windows
                      if (rect.width > 200 && rect.height > 300) {
                        potentialChats.push({
                          index,
                          className: div.className,
                          id: div.id,
                          width: rect.width,
                          height: rect.height,
                          left: rect.left,
                          top: rect.top,
                          position: style.position,
                          zIndex: style.zIndex,
                          backgroundColor: style.backgroundColor,
                          border: style.border
                        });
                      }
                    });
                    
                    debugInfo += `📊 Found ${potentialChats.length} potential chat elements:\n\n`;
                    potentialChats.forEach((chat, i) => {
                      debugInfo += `${i + 1}. Index: ${chat.index}\n`;
                      debugInfo += `   Class: "${chat.className}"\n`;
                      debugInfo += `   ID: "${chat.id}"\n`;
                      debugInfo += `   Size: ${chat.width.toFixed(0)}x${chat.height.toFixed(0)}\n`;
                      debugInfo += `   Position: (${chat.left.toFixed(0)}, ${chat.top.toFixed(0)})\n`;
                      debugInfo += `   Style: position=${chat.position}, z-index=${chat.zIndex}\n\n`;
                    });
                    
                    console.log(debugInfo);
                    alert(debugInfo);
                    
                  } catch (error) {
                    console.error("Chat window analysis failed:", error);
                    alert("❌ Chat window analysis failed: " + error.message);
                  }
                }}
                style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#3498db", color: "white" }}
                title="Analyze chat window structure specifically"
              >
                Chat Window Analysis
              </button>

              <button 
                onClick={() => {
                  try {
                    const debugInfo = findElementsElectron();
                    console.log(debugInfo);
                    alert(debugInfo);
                  } catch (error) {
                    console.error("Electron analysis failed:", error);
                    alert("❌ Electron analysis failed: " + error.message);
                  }
                }}
                style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#f39c12", color: "white" }}
                title="Analyze Electron multi-window structure"
              >
                Electron Multi-Window Test
              </button>

              <button 
                onClick={() => {
                  try {
                    console.log("🔧 IPC Position Test...");
                    
                    // Try to get positions through IPC (if available)
                    let debugInfo = "🔧 IPC Position Test:\n\n";
                    
                    // Check if we have access to Electron IPC
                    if ((window as any).electronAPI) {
                      debugInfo += "✅ Electron API available\n";
                      
                      // Try to get window info
                      if ((window as any).electronAPI.getCurrentWindow) {
                        debugInfo += "✅ getCurrentWindow available\n";
                      }
                      
                      if ((window as any).electronAPI.getWindowBounds) {
                        debugInfo += "✅ getWindowBounds available\n";
                      }
                    } else {
                      debugInfo += "❌ Electron API not available\n";
                    }
                    
                    // Try to get window bounds directly
                    if ((window as any).electron?.webContents?.getOwnerBrowserWindow) {
                      debugInfo += "✅ electron.webContents available\n";
                    }
                    
                    // Check if we're in a BrowserWindow
                    if ((window as any).require) {
                      try {
                        const { remote } = (window as any).require('electron');
                        if (remote) {
                          const currentWindow = remote.getCurrentWindow();
                          const bounds = currentWindow.getBounds();
                          debugInfo += `✅ Current window bounds: ${bounds.x}, ${bounds.y}, ${bounds.width}x${bounds.height}\n`;
                        }
                      } catch (error) {
                        debugInfo += `❌ Remote access failed: ${error.message}\n`;
                      }
                    }
                    
                    // Try to get screen coordinates
                    const screenX = window.screenX || (window as any).screenLeft;
                    const screenY = window.screenY || (window as any).screenTop;
                    debugInfo += `Screen position: (${screenX}, ${screenY})\n`;
                    
                    // Try to get viewport size
                    debugInfo += `Viewport size: ${window.innerWidth}x${window.innerHeight}\n`;
                    
                    console.log(debugInfo);
                    alert(debugInfo);
                    
                  } catch (error) {
                    console.error("IPC test failed:", error);
                    alert("❌ IPC test failed: " + error.message);
                  }
                }}
                style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#8e44ad", color: "white" }}
                title="Test IPC-based position detection"
              >
                IPC Position Test
              </button>

              <button 
                onClick={async () => {
                  try {
                    console.log("🎯 IPC Window Position Test...");
                    
                    // Get all window positions from main process
                    const windowPositions = await (window as any).clippy.getWindowPositions();
                    const screenInfo = await (window as any).clippy.getScreenInfo();
                    
                    let debugInfo = "🎯 IPC Window Position Test:\n\n";
                    
                    if (windowPositions && windowPositions.length > 0) {
                      debugInfo += `✅ Found ${windowPositions.length} windows:\n\n`;
                      
                      windowPositions.forEach((window: any, index: number) => {
                        debugInfo += `${index + 1}. "${window.title}"\n`;
                        debugInfo += `   Position: (${window.x}, ${window.y})\n`;
                        debugInfo += `   Size: ${window.width}x${window.height}\n`;
                        debugInfo += `   Visible: ${window.isVisible}\n`;
                        debugInfo += `   Focused: ${window.isFocused}\n\n`;
                      });
                      
                      // Try to identify Clippy and chat windows
                      const clippyWindow = windowPositions.find((w: any) => 
                        w.title.toLowerCase().includes('clippy') && !w.title.toLowerCase().includes('chat') ||
                        w.width < 200 // Small window likely to be Clippy
                      );
                      
                      const chatWindow = windowPositions.find((w: any) => 
                        w.title.toLowerCase().includes('chat') ||
                        w.width > 400 // Large window likely to be chat
                      );
                      
                      if (clippyWindow && chatWindow) {
                        debugInfo += "🎯 Found Clippy and Chat windows!\n\n";
                        
                        debugInfo += `Clippy window: "${clippyWindow.title}" at (${clippyWindow.x}, ${clippyWindow.y}) size ${clippyWindow.width}x${clippyWindow.height}\n`;
                        debugInfo += `Chat window: "${chatWindow.title}" at (${chatWindow.x}, ${chatWindow.y}) size ${chatWindow.width}x${chatWindow.height}\n\n`;
                        
                        // Calculate center points
                        const clippyCenter = {
                          x: clippyWindow.x + clippyWindow.width / 2,
                          y: clippyWindow.y + clippyWindow.height / 2
                        };
                        
                        const chatCenter = {
                          x: chatWindow.x + chatWindow.width / 2,
                          y: chatWindow.y + chatWindow.height / 2
                        };
                        
                        debugInfo += `Clippy center: (${clippyCenter.x.toFixed(0)}, ${clippyCenter.y.toFixed(0)})\n`;
                        debugInfo += `Chat center: (${chatCenter.x.toFixed(0)}, ${chatCenter.y.toFixed(0)})\n\n`;
                        
                        // Calculate direction using main process
                        const directionResult = await (window as any).clippy.calculateDirection(clippyCenter, chatCenter);
                        
                        if (directionResult.direction) {
                          debugInfo += `🎯 Direction: ${directionResult.direction}\n`;
                          debugInfo += `Distance: ${directionResult.distance.toFixed(0)}px\n`;
                          debugInfo += `Angle: ${directionResult.angleDegrees?.toFixed(1)}°\n\n`;
                          
                          // Trigger the animation
                          triggerAnimation(directionResult.direction);
                          debugInfo += "✅ Animation triggered!\n";
                        } else {
                          debugInfo += `❌ Too far away: ${directionResult.distance.toFixed(0)}px\n`;
                        }
                      } else {
                        debugInfo += "❌ Could not identify Clippy and Chat windows\n";
                        if (!clippyWindow) debugInfo += "   - Clippy window not found\n";
                        if (!chatWindow) debugInfo += "   - Chat window not found\n";
                        
                        // Fallback: manually identify based on size and position
                        debugInfo += "\n🔄 Trying fallback identification...\n";
                        
                        const smallWindow = windowPositions.find((w: any) => w.width < 200);
                        const largeWindow = windowPositions.find((w: any) => w.width > 400);
                        
                        if (smallWindow && largeWindow) {
                          debugInfo += "✅ Found windows by size fallback!\n\n";
                          
                          debugInfo += `Small window (Clippy): "${smallWindow.title}" at (${smallWindow.x}, ${smallWindow.y}) size ${smallWindow.width}x${smallWindow.height}\n`;
                          debugInfo += `Large window (Chat): "${largeWindow.title}" at (${largeWindow.x}, ${largeWindow.y}) size ${largeWindow.width}x${largeWindow.height}\n\n`;
                          
                          // Calculate center points
                          const clippyCenter = {
                            x: smallWindow.x + smallWindow.width / 2,
                            y: smallWindow.y + smallWindow.height / 2
                          };
                          
                          const chatCenter = {
                            x: largeWindow.x + largeWindow.width / 2,
                            y: largeWindow.y + largeWindow.height / 2
                          };
                          
                          debugInfo += `Clippy center: (${clippyCenter.x.toFixed(0)}, ${clippyCenter.y.toFixed(0)})\n`;
                          debugInfo += `Chat center: (${chatCenter.x.toFixed(0)}, ${chatCenter.y.toFixed(0)})\n\n`;
                          
                          // Calculate direction using main process
                          const directionResult = await (window as any).clippy.calculateDirection(clippyCenter, chatCenter);
                          
                          if (directionResult.direction) {
                            debugInfo += `🎯 Direction: ${directionResult.direction}\n`;
                            debugInfo += `Distance: ${directionResult.distance.toFixed(0)}px\n`;
                            debugInfo += `Angle: ${directionResult.angleDegrees?.toFixed(1)}°\n\n`;
                            
                            // Trigger the animation
                            triggerAnimation(directionResult.direction);
                            debugInfo += "✅ Animation triggered!\n";
                          } else {
                            debugInfo += `❌ Too far away: ${directionResult.distance.toFixed(0)}px\n`;
                          }
                        } else {
                          debugInfo += "❌ Fallback identification also failed\n";
                        }
                      }
                    } else {
                      debugInfo += "❌ No windows found\n";
                    }
                    
                    if (screenInfo) {
                      debugInfo += `\n📺 Screen Info:\n`;
                      debugInfo += `Primary display: ${screenInfo.primaryDisplay.bounds.width}x${screenInfo.primaryDisplay.bounds.height}\n`;
                      debugInfo += `Cursor position: (${screenInfo.cursorPoint.x}, ${screenInfo.cursorPoint.y})\n`;
                    }
                    
                    console.log(debugInfo);
                    alert(debugInfo);
                    
                  } catch (error) {
                    console.error("IPC window position test failed:", error);
                    alert("❌ IPC window position test failed: " + error.message);
                  }
                }}
                style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e74c3c", color: "white" }}
                title="Test IPC-based window position tracking and direction calculation"
              >
                IPC Window Position Test
              </button>

              <button 
                onClick={async () => {
                  try {
                    console.log("🧪 Manual Position Test...");
                    
                    // Use the exact positions from the debug output
                    const clippyPos = { x: 640 + 127/2, y: 396 + 101/2 }; // Clippy center
                    const chatPos = { x: 156 + 453/2, y: 105 + 653/2 }; // Chat center
                    
                    let debugInfo = "🧪 Manual Position Test:\n\n";
                    debugInfo += `Clippy center: (${clippyPos.x.toFixed(0)}, ${clippyPos.y.toFixed(0)})\n`;
                    debugInfo += `Chat center: (${chatPos.x.toFixed(0)}, ${chatPos.y.toFixed(0)})\n\n`;
                    
                    // Calculate direction using main process
                    const directionResult = await (window as any).clippy.calculateDirection(clippyPos, chatPos);
                    
                    if (directionResult.direction) {
                      debugInfo += `🎯 Direction: ${directionResult.direction}\n`;
                      debugInfo += `Distance: ${directionResult.distance.toFixed(0)}px\n`;
                      debugInfo += `Angle: ${directionResult.angleDegrees?.toFixed(1)}°\n`;
                      debugInfo += `Delta X: ${directionResult.deltaX?.toFixed(0)}\n`;
                      debugInfo += `Delta Y: ${directionResult.deltaY?.toFixed(0)}\n\n`;
                      
                      // Trigger the animation
                      triggerAnimation(directionResult.direction);
                      debugInfo += "✅ Animation triggered!\n";
                    } else {
                      debugInfo += `❌ Too far away: ${directionResult.distance.toFixed(0)}px\n`;
                    }
                    
                    console.log(debugInfo);
                    alert(debugInfo);
                    
                  } catch (error) {
                    console.error("Manual position test failed:", error);
                    alert("❌ Manual position test failed: " + error.message);
                  }
                }}
                style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#2c3e50", color: "white" }}
                title="Test with exact positions from debug output"
              >
                Manual Position Test
              </button>

            </div>
          </div>

              {/* Core Animations */}
              <div style={{ marginBottom: "12px" }}>
                <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#d63031" }}>🎯 Core Animations (Tested):</h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                      <button 
                      onClick={() => testIndividualAnimation("Alert")}
                      style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#ff6b6b", color: "white" }}
                      title="Alert - Now shows tapping on glass (FIXED - file renamed)"
                    >
                      Alert
                    </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("GetTechy")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#74b9ff", color: "white" }}
                    title="GetTechy - Shows atom (duplicate with Thinking?)"
                  >
                    GetTechy
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("CheckingSomething")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#55a3ff", color: "white" }}
                    title="CheckingSomething - Glasses reading paper (CORRECT)"
                  >
                    CheckingSomething
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("GetArtsy")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#fd79a8", color: "white" }}
                    title="GetArtsy - Turns into art (CORRECT)"
                  >
                    GetArtsy
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("GetWizardy")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#a29bfe", color: "white" }}
                    title="GetWizardy - Shows checkmark (should be 'checkmark' or 'ok')"
                  >
                    GetWizardy
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Hearing 1")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                    title="Hearing 1 - Shows headphones (CORRECT)"
                  >
                    Hearing 1
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Explain")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#fdcb6e", color: "white" }}
                    title="Explain - Mapped to multiple animations (NEEDS FIX)"
                  >
                    Explain
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Congratulate")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00cec9", color: "white" }}
                    title="Congratulate - Shows checkmark (duplicate with GetWizardy?)"
                  >
                    Congratulate
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Thinking")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#6c5ce7", color: "white" }}
                    title="Thinking - Shows atom (duplicate with GetTechy?)"
                  >
                    Thinking
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Processing")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e17055", color: "white" }}
                    title="Processing - Shows shovel (CORRECT)"
                  >
                    Processing
                  </button>
                </div>
              </div>

              {/* File Operations */}
              <div style={{ marginBottom: "12px" }}>
                <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#d63031" }}>📁 File Operations:</h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  <button 
                    onClick={() => testIndividualAnimation("Print")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#2d3436", color: "white" }}
                    title="Print - Should show printer animation"
                  >
                    Print
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Save")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#2d3436", color: "white" }}
                    title="Save - Should show saving animation"
                  >
                    Save
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("SendMail")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#2d3436", color: "white" }}
                    title="SendMail - Should show email animation"
                  >
                    SendMail
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("EmptyTrash")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#2d3436", color: "white" }}
                    title="EmptyTrash - Should show trash animation"
                  >
                    EmptyTrash
                  </button>
                </div>
              </div>

              {/* Gestures and Movements */}
              <div style={{ marginBottom: "12px" }}>
                <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#d63031" }}>👆 Gestures & Movements:</h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  <button 
                    onClick={() => testIndividualAnimation("GestureUp")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#0984e3", color: "white" }}
                    title="GestureUp - Should point up"
                  >
                    GestureUp
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("GestureDown")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#0984e3", color: "white" }}
                    title="GestureDown - Should point down"
                  >
                    GestureDown
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("GestureLeft")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#0984e3", color: "white" }}
                                         title="GestureLeft - Should point left (FIXED - files renamed)"
                   >
                     GestureLeft
                   </button>
                   
                   <button 
                     onClick={() => testIndividualAnimation("GestureRight")}
                     style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#0984e3", color: "white" }}
                     title="GestureRight - Should point right (FIXED - files renamed)"
                   >
                     GestureRight
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Wave")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#0984e3", color: "white" }}
                    title="Wave - Should wave"
                  >
                    Wave
                  </button>
                </div>
              </div>

              {/* Looking Animations */}
              <div style={{ marginBottom: "12px" }}>
                <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#d63031" }}>👀 Looking Animations:</h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  <button 
                    onClick={() => testIndividualAnimation("LookUp")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                    title="LookUp - Should look up"
                  >
                    LookUp
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("LookDown")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                    title="LookDown - Should look down"
                  >
                    LookDown
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("LookLeft")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                                         title="LookLeft - Should look left (FIXED - files renamed)"
                   >
                     LookLeft
                   </button>
                   
                   <button 
                     onClick={() => testIndividualAnimation("LookRight")}
                     style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                     title="LookRight - Should look right (FIXED - files renamed)"
                   >
                     LookRight
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("LookUpLeft")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                                         title="LookUpLeft - Should look up-left (FIXED - files renamed)"
                   >
                     LookUpLeft
                   </button>
                   
                   <button 
                     onClick={() => testIndividualAnimation("LookUpRight")}
                     style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                     title="LookUpRight - Should look up-right (FIXED - files renamed)"
                   >
                     LookUpRight
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("LookDownLeft")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                                         title="LookDownLeft - Should look down-left (FIXED - files renamed)"
                   >
                     LookDownLeft
                   </button>
                   
                   <button 
                     onClick={() => testIndividualAnimation("LookDownRight")}
                     style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#00b894", color: "white" }}
                     title="LookDownRight - Should look down-right (FIXED - files renamed)"
                   >
                     LookDownRight
                  </button>
                </div>
              </div>

              {/* Idle Animations */}
              <div style={{ marginBottom: "12px" }}>
                <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#d63031" }}>😴 Idle Animations:</h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  <button 
                    onClick={() => testIndividualAnimation("Idle1 1")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#636e72", color: "white" }}
                    title="Idle1 1 - Basic idle"
                  >
                    Idle1 1
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("IdleAtom")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#636e72", color: "white" }}
                    title="IdleAtom - Atom idle (duplicate with GetTechy?)"
                  >
                    IdleAtom
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("IdleEyeBrowRaise")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#636e72", color: "white" }}
                    title="IdleEyeBrowRaise - Raises eyebrow"
                  >
                    IdleEyeBrowRaise
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("IdleFingerTap")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#636e72", color: "white" }}
                    title="IdleFingerTap - Taps finger"
                  >
                    IdleFingerTap
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("IdleHeadScratch")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#636e72", color: "white" }}
                    title="IdleHeadScratch - Scratches head"
                  >
                    IdleHeadScratch
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("IdleRopePile")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#636e72", color: "white" }}
                    title="IdleRopePile - Rope pile idle"
                  >
                    IdleRopePile
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("IdleSideToSide")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#636e72", color: "white" }}
                    title="IdleSideToSide - Moves side to side"
                  >
                    IdleSideToSide
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("IdleSnooze")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#636e72", color: "white" }}
                    title="IdleSnooze - Sleeping/snoozing"
                  >
                    IdleSnooze
                  </button>
                </div>
              </div>

              {/* Other Animations */}
              <div style={{ marginBottom: "12px" }}>
                <h5 style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#d63031" }}>🎭 Other Animations:</h5>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  <button 
                    onClick={() => testIndividualAnimation("Writing")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e84393", color: "white" }}
                    title="Writing - Should write on paper"
                  >
                    Writing
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Searching")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e84393", color: "white" }}
                    title="Searching - Should search/look around"
                  >
                    Searching
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Greeting")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e84393", color: "white" }}
                    title="Greeting - Should greet"
                  >
                    Greeting
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("GoodBye")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e84393", color: "white" }}
                    title="GoodBye - Should say goodbye"
                  >
                    GoodBye
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("GetAttention")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e84393", color: "white" }}
                    title="GetAttention - Should get attention"
                  >
                    GetAttention
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Show")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e84393", color: "white" }}
                    title="Show - Should appear"
                  >
                    Show
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Hide")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e84393", color: "white" }}
                    title="Hide - Should disappear"
                  >
                    Hide
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("Default")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e84393", color: "white" }}
                    title="Default - Default pose"
                  >
                    Default
                  </button>
                  
                  <button 
                    onClick={() => testIndividualAnimation("RestPose")}
                    style={{ fontSize: "10px", padding: "4px 8px", backgroundColor: "#e84393", color: "white" }}
                    title="RestPose - Rest pose"
                  >
                    RestPose
                  </button>
                </div>
              </div>
              
              <div style={{ marginTop: "8px", fontSize: "10px", color: "#666" }}>
                <strong>Instructions:</strong> Click each button to see what the animation actually shows. Report back what each one does so we can create the correct mappings!
              </div>
            </div>
            <button onClick={stopTTS} style={{ marginTop: "8px", marginLeft: "8px" }}>
              Stop TTS
            </button>
          </>
        )}
      </div>

      {/* Sound Effects Section */}
      <div style={{ marginBottom: "20px" }}>
        <h4>Sound Effects</h4>
        
        <div style={{ marginBottom: "10px" }}>
          <label>
            <input
              type="checkbox"
              checked={settings.enableSoundEffects || false}
              onChange={(e) => handleSettingChange("enableSoundEffects", e.target.checked)}
            />
            Enable Sound Effects
          </label>
          {!isAudioSupported && (
            <div style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
              Audio is not supported in this browser
            </div>
          )}
        </div>

        {settings.enableSoundEffects && isAudioSupported && (
          <button onClick={testSoundEffect} style={{ marginTop: "8px" }}>
            Test Sound Effect
          </button>
        )}
      </div>

      {/* Voice Presets Section */}
      {settings.enableTTS && isTTSSupported && (
        <div style={{ marginBottom: "20px" }}>
          <h4>Voice Presets</h4>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
            Quick voice presets for different moods:
          </p>
          
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                handleSettingChange("ttsRate", 0.9);
                handleSettingChange("ttsPitch", 1.1);
                handleSettingChange("ttsVolume", 0.8);
              }}
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Classic Clippy
            </button>
            
            <button
              onClick={() => {
                handleSettingChange("ttsRate", 1.0);
                handleSettingChange("ttsPitch", 1.0);
                handleSettingChange("ttsVolume", 1.0);
              }}
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Modern
            </button>
            
            <button
              onClick={() => {
                handleSettingChange("ttsRate", 1.2);
                handleSettingChange("ttsPitch", 1.3);
                handleSettingChange("ttsVolume", 0.9);
              }}
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Excited
            </button>
            
            <button
              onClick={() => {
                handleSettingChange("ttsRate", 0.8);
                handleSettingChange("ttsPitch", 0.9);
                handleSettingChange("ttsVolume", 0.7);
              }}
              style={{ fontSize: "11px", padding: "4px 8px" }}
            >
              Calm
            </button>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div style={{ marginBottom: "20px" }}>
        <h4>Information</h4>
        <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
          <li>Text-to-Speech uses your system's built-in voices</li>
          <li>Sound effects are generated using Web Audio API</li>
          <li>Animations will automatically trigger appropriate sounds</li>
          <li>You can test both TTS and sound effects using the buttons above</li>
          <li><strong>TTS Controls:</strong> Press <kbd>Escape</kbd> or click the "Stop" button to stop TTS while speaking</li>
          <li>Special characters like bullet points (•) and asterisks (*) are automatically cleaned up for better speech</li>
        </ul>
      </div>
      <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>ℹ️ Information</h4>
        <ul style={{ fontSize: "11px", margin: "0", paddingLeft: "16px", color: "#666" }}>
          <li>Press <strong>Escape</strong> to stop TTS playback</li>
          <li>Special characters (•, *, _) are automatically cleaned for better pronunciation</li>
          <li>TTS uses a queue system to prevent overlapping speech</li>
          <li>Voice presets automatically adjust based on content type</li>
          <li><strong>Enhanced Animation System:</strong> 23 animations with smart content analysis</li>
          <li>Animations automatically match content (errors → Alert, tech → GetTechy, etc.)</li>
          <li>Use the test buttons above to see different animations in action</li>
        </ul>
      </div>
    </div>
  );
}; 