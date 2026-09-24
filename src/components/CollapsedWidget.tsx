import React from "react";
import { PulseLogo } from "./PulseLogo";

interface CollapsedWidgetProps {
  onExpand: () => void;
}

export const CollapsedWidget: React.FC<CollapsedWidgetProps> = ({ onExpand }) => {
  return (
    <div
      data-tauri-drag-region
      onClick={onExpand}
      data-testid="collapsed-expand-trigger"
      className="w-[72px] h-[72px] rounded-full bg-[#0d1210]/95 border-2 border-[#1c2b23] shadow-2xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all group backdrop-blur-md"
      title="Haga clic para expandir Pulse DJ"
    >
      <div className="p-1 rounded-full bg-[#131b17] group-hover:bg-[#18241e] transition-colors">
        <PulseLogo size={42} className="drop-shadow-[0_0_8px_rgba(0,230,118,0.4)]" />
      </div>
    </div>
  );
};