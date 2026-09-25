import React, { useState } from "react";
import { Music, ChevronUp, Zap, Shuffle, Archive, EyeOff, Sparkles, Activity, Equal } from "lucide-react";
import { FilterState } from "../types";

interface FilterBarProps {
  filters: FilterState;
  onToggleFilter: (key: keyof FilterState) => void;
  onCycleBpm: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onToggleFilter, onCycleBpm }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const getBtnClass = (isActive: boolean) => 
    `flex items-center justify-center space-x-1 rounded py-1.5 transition-colors border ${
      isActive 
        ? "bg-[#23302a] border-[#405249] text-[#00e676]" 
        : "bg-[#1a231f] border-[#27382f] text-[#7f948c] hover:text-white hover:bg-[#23302a]"
    }`;

  return (
    <div className="relative flex flex-col bg-[#121815] border-y border-[#1a231f] text-[12px] text-[#7f948c]">
      <div className="flex items-center justify-end px-3 py-2">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors shadow-sm"
        >
          <Music size={12} />
          <span>Filtros Activos ({Object.values(filters).filter(v => v === true).length})</span>
          <ChevronUp size={14} className={menuOpen ? "" : "rotate-180 transition-transform"} />
        </button>
      </div>

      {menuOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-[#1a231f] bg-[#121815]">
          <div className="text-[10px] text-[#52635d] font-bold tracking-wider mb-2 mt-1">
            ALL FILTERS
          </div>
          
          <div className="flex flex-col space-y-1.5 text-[11px]">
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => onToggleFilter('similar')} className={getBtnClass(filters.similar)}>
                <Equal size={12} className="rotate-90" /> <span>Similar</span>
              </button>
              <button onClick={() => onToggleFilter('fresh')} className={getBtnClass(filters.fresh)}>
                <Sparkles size={12} /> <span>Fresh</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={onCycleBpm} className={getBtnClass(true)}>
                <Activity size={12} /> <span className="text-white">BPM ±{filters.bpmTolerance}</span>
              </button>
              <button onClick={() => onToggleFilter('harmonic')} className={getBtnClass(filters.harmonic)}>
                <Music size={12} /> <span>Coincidencia armónica</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => onToggleFilter('curveball')} className={getBtnClass(filters.curveball)}>
                <Zap size={12} /> <span>Curveball</span>
              </button>
              <button onClick={() => onToggleFilter('randomize')} className={getBtnClass(filters.randomize)}>
                <Shuffle size={12} /> <span>Aleatorizar</span>
              </button>
            </div>
            
            {/* Botones visuales / Placeholders */}
            <div className="grid grid-cols-2 gap-1.5">
              <button className="flex items-center justify-center space-x-1 bg-[#1a231f] border border-[#27382f] rounded py-1.5 text-[#52635d] cursor-not-allowed">
                <Archive size={12} /> <span>Crates</span>
              </button>
              <button className="flex items-center justify-center space-x-1 bg-[#1a231f] border border-[#27382f] rounded py-1.5 text-[#52635d] cursor-not-allowed">
                <EyeOff size={12} /> <span>Removed tracks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};