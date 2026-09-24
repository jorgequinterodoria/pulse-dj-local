import React, { useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { PulseLogo } from "./PulseLogo";

interface CollapsedWidgetProps {
  onExpand: () => void;
}

export const CollapsedWidget: React.FC<CollapsedWidgetProps> = ({ onExpand }) => {
  const isDragging = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 0) {
      isDragging.current = false;
      try {
        getCurrentWindow().startDragging();
      } catch {}
    }
  };

  const handlePointerMove = () => {
    isDragging.current = true;
  };

  const handleClick = () => {
    if (!isDragging.current) {
      onExpand();
    }
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onClick={handleClick}
      className="w-[72px] h-[72px] rounded-full bg-[#0d1210]/95 border-2 border-[#1c2b23] shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform group backdrop-blur-md select-none"
      title="Arrastra para mover. Clic para expandir"
    >
      <div className="p-1 rounded-full bg-[#131b17] group-hover:bg-[#18241e] transition-colors pointer-events-none">
        <PulseLogo size={42} className="drop-shadow-[0_0_8px_rgba(0,230,118,0.4)]" />
      </div>
    </div>
  );
};