import React from "react";
import { GripVertical } from "lucide-react";
import { Track } from "../types";

interface TrackCardProps {
  track: Track;
  isFirst?: boolean;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
  // Determinamos el color de la barra lateral según la energía
  const getBarColor = (energy: number) => {
    if (energy >= 8) return "bg-[#00e676]";
    if (energy >= 6) return "bg-[#10b981]";
    return "bg-[#047857]";
  };

  return (
    <div className="group flex items-center justify-between px-2.5 py-2 hover:bg-[#18221e] rounded-lg transition-colors cursor-pointer select-none">
      <div className="flex items-center space-x-2 truncate">
        {/* Barra vertical de compatibilidad/energía */}
        <div className={`w-1 h-7 rounded-full ${getBarColor(track.energy)} flex-shrink-0`} />

        {/* Agarre de arrastre */}
        <div className="text-[#3b4b44] group-hover:text-[#7f948c] cursor-grab flex-shrink-0">
          <GripVertical size={13} />
        </div>

        {/* Información del tema */}
        <div className="flex flex-col truncate pr-2">
          <span className="text-[13px] font-medium text-[#dce4e0] truncate group-hover:text-white">
            {track.title}
          </span>
          <span className="text-[11px] text-[#6d7f77] truncate">
            {track.artist}
          </span>
        </div>
      </div>

      {/* Metadatos Camelot & BPM */}
      <div className="flex items-center space-x-3 text-[12px] font-mono flex-shrink-0">
        <span className="text-[#596d64] group-hover:text-[#8ea49a]">{track.key}</span>
        <span className="text-[#495b53] group-hover:text-[#6f847a] w-7 text-right">{track.bpm}</span>
      </div>
    </div>
  );
};