import React, { useState } from "react";
import { 
  Music, 
  ChevronUp, 
  Zap, 
  Shuffle, 
  Archive, 
  EyeOff, 
  Sparkles,
  Activity,
  Equal
} from "lucide-react";

interface FilterBarProps {
  filterArmonico: boolean;
  bpmTolerance: number;
  allowHalfDouble: boolean;
  onToggleFilter: () => void;
  onSetBpmTolerance: (tolerance: number) => void;
  onToggleHalfDouble: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterArmonico,
  bpmTolerance,
  onToggleFilter,
  onSetBpmTolerance,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleBpmCycle = () => {
    if (bpmTolerance === 3) onSetBpmTolerance(6);
    else if (bpmTolerance === 6) onSetBpmTolerance(10);
    else onSetBpmTolerance(3);
  };

  return (
    <div className="relative flex flex-col bg-[#121815] border-y border-[#1a231f] text-[12px] text-[#7f948c]">
      <div className="flex items-center justify-end px-3 py-2">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors shadow-sm"
        >
          <Music size={12} />
          <span>Coincidencia armónica</span>
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
              <button className="flex items-center justify-center space-x-1 bg-[#1a231f] border border-[#27382f] rounded py-1.5 text-[#7f948c] hover:text-white hover:bg-[#23302a] transition-colors">
                <Equal size={12} className="rotate-90" /> <span>Similar</span>
              </button>
              <button className="flex items-center justify-center space-x-1 bg-[#1a231f] border border-[#27382f] rounded py-1.5 text-[#7f948c] hover:text-white hover:bg-[#23302a] transition-colors">
                <Sparkles size={12} /> <span>Fresh</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button 
                onClick={handleBpmCycle}
                className="flex items-center justify-center space-x-1 bg-[#1a231f] border border-[#27382f] rounded py-1.5 text-[#7f948c] hover:text-white hover:bg-[#23302a] transition-colors"
              >
                <Activity size={12} /> <span>BPM ±{bpmTolerance}</span>
              </button>
              <button 
                onClick={onToggleFilter}
                className={`flex items-center justify-center space-x-1 rounded py-1.5 transition-colors ${
                  filterArmonico 
                    ? "bg-[#23302a] border border-[#405249] text-white" 
                    : "bg-[#1a231f] border border-[#27382f] text-[#7f948c] hover:text-white"
                }`}
              >
                <Music size={12} /> <span>Coincidencia armónica</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button className="flex items-center justify-center space-x-1 bg-[#1a231f] border border-[#27382f] rounded py-1.5 text-[#7f948c] hover:text-white hover:bg-[#23302a] transition-colors">
                <Zap size={12} /> <span>Curveball</span>
              </button>
              <button className="flex items-center justify-center space-x-1 bg-[#1a231f] border border-[#27382f] rounded py-1.5 text-[#7f948c] hover:text-white hover:bg-[#23302a] transition-colors">
                <Shuffle size={12} /> <span>Aleatorizar</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button className="flex items-center justify-center space-x-1 bg-[#1a231f] border border-[#27382f] rounded py-1.5 text-[#7f948c] hover:text-white hover:bg-[#23302a] transition-colors">
                <Archive size={12} /> <span>Crates</span>
              </button>
              <button className="flex items-center justify-center space-x-1 bg-[#1a231f] border border-[#27382f] rounded py-1.5 text-[#7f948c] hover:text-white hover:bg-[#23302a] transition-colors">
                <EyeOff size={12} /> <span>Removed tracks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};