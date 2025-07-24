import "./css/App.css";
import "../../../node_modules/98.css/dist/98.css";
import "./css/98.extended.css";
import "./css/Theme.css";

import { useRef } from "react";
import { Clippy } from "./Clippy";
import { ChatProvider } from "../contexts/ChatContext";
import { WindowPortal } from "./WindowPortal";
import { Bubble } from "./BubbleWindow";
import { SharedStateProvider } from "../contexts/SharedStateContext";
import { BubbleViewProvider } from "../contexts/BubbleViewContext";
import { DebugProvider } from "../contexts/DebugContext";
import { AnimationProvider } from "../contexts/AnimationContext";

export function App() {
  const chatWindowRef = useRef<HTMLDivElement>(null);

  return (
    <DebugProvider>
      <SharedStateProvider>
        <ChatProvider>
          <AnimationProvider>
            <BubbleViewProvider>
              <div
                className="clippy"
                style={{
                  position: "fixed",
                  bottom: 0,
                  right: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  justifyContent: "flex-end",
                  width: "100%",
                  height: "100%",
                }}
              >
                <Clippy chatWindowRef={chatWindowRef} />
                <WindowPortal width={450} height={650}>
                  <div ref={chatWindowRef}>
                    <Bubble />
                  </div>
                </WindowPortal>
              </div>
            </BubbleViewProvider>
          </AnimationProvider>
        </ChatProvider>
      </SharedStateProvider>
    </DebugProvider>
  );
}
