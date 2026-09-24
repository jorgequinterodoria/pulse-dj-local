import React from "react";
import { DjMode } from "../types";
import { PulseLogo } from "./PulseLogo";

interface ModeSelectorProps {
  selectedMode: DjMode;
  onSelectMode: (mode: DjMode) => void;
  myStyleCount: number;
  onCenterIconClick: () => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
  myStyleCount,
  onCenterIconClick,
}) => {
  return (
    <div className="flex items-center justify-center space-x-2 py-2 px-3 bg-[#111614]">
      {/* Botón My Style */}
      <button
        type="button"
        onClick={() => onSelectMode("MyStyle")}
        className={`relative flex items-center justify-center px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
          selectedMode === "MyStyle"
            ? "bg-[#18231e] text-white border border-[#2b3d35]"
            : "bg-[#141a18] text-[#70827b] hover:text-white"
        }`}
      >
        <span className="absolute -top-1.5 right-2 bg-[#00a352] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
          {myStyleCount}
        </span>
        My Style
      </button>

      {/* Ícono central: Al dar clic colapsa/cierra la ventana en la píldora flotante */}
      <button
        type="button"
        data-testid="center-collapse-trigger"
        onClick={onCenterIconClick}
        className="p-1 rounded-full hover:scale-105 active:scale-95 transition-transform"
        title="Colapsar a widget flotante"
      >
        <PulseLogo size={34} />
      </button>

      {/* Botón PulseDJ */}
      <button
        type="button"
        onClick={() => onSelectMode("PulseDJ")}
        className={`flex items-center justify-center px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all ${
          selectedMode === "PulseDJ"
            ? "bg-[#00e676] text-[#0a120e]"
            : "bg-[#141a18] text-[#70827b] hover:text-white"
        }`}
      >
        PulseDJ
      </button>
    </div>
  );
};