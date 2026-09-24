import React from "react";
import { GripVertical, Music, ChevronDown } from "lucide-react";

interface FilterBarProps {
  filterArmonico: boolean;
  onToggleFilter: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filterArmonico, onToggleFilter }) => {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-[#121815] border-y border-[#1a231f] text-[12px] text-[#7f948c]">
      <div
        data-tauri-drag-region
        className="flex items-center space-x-1 cursor-grab active:cursor-grabbing hover:text-white"
      >
        <GripVertical size={13} />
        <span>Draggable</span>
      </div>

      <button
        type="button"
        onClick={onToggleFilter}
        className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors ${
          filterArmonico ? "text-[#00e676]" : "text-[#7f948c] hover:text-white"
        }`}
      >
        <Music size={12} />
        <span>Coincidencia armónica</span>
        <ChevronDown size={12} />
      </button>
    </div>
  );
};