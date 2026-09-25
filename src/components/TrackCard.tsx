import React from "react";
import { Track } from "../types";

interface TrackCardProps { track: Track; index?: number; dict: any; }

export const TrackCard: React.FC<TrackCardProps> = ({ track, index = 0, dict }) => {
  const safeIndex = isNaN(Number(index)) ? 0 : Number(index);
  const parsedBpm = Number(track.bpm);
  const displayBpm = !isNaN(parsedBpm) && parsedBpm > 0 ? Math.round(parsedBpm) : 126; 
  const displayKey = track.key && track.key !== "NaN" ? track.key : "8A";

  return (
    // Aplicamos el color al hover usando la variable CSS inyectada desde App.tsx
    <div className="flex items-center justify-between p-2.5 hover:bg-[#1a231f] border-l-2 border-transparent hover:border-[var(--pulse-color)] group transition-all">
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        <div className="w-6 h-6 flex items-center justify-center bg-[#27382f] text-[#7f948c] text-[10px] font-mono rounded shrink-0">
          {safeIndex + 1}
        </div>
        <div className="flex flex-col overflow-hidden w-full">
          <span className="text-white text-[13px] font-medium truncate tracking-tight">{track.title || dict.unknown}</span>
          <span className="text-[#7f948c] text-[11px] truncate">{track.artist || dict.unknown}</span>
        </div>
      </div>
      <div className="flex items-center space-x-2 text-[11px] pl-2 min-w-[70px] justify-end shrink-0">
        <span className="text-[#a0b0a8] font-semibold w-7 text-right">{displayKey}</span>
        <span className="text-[#52635d] font-mono text-right tabular-nums">{displayBpm}</span>
      </div>
    </div>
  );
};