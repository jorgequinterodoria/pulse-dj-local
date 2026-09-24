import React, { useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { GripVertical, Music, ChevronDown, SlidersHorizontal, Check } from "lucide-react";

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
  allowHalfDouble,
  onToggleFilter,
  onSetBpmTolerance,
  onToggleHalfDouble,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const startDrag = () => {
    try {
      getCurrentWindow().startDragging();
    } catch {}
  };

  return (
    <div className="relative flex flex-col bg-[#121815] border-y border-[#1a231f] text-[12px] text-[#7f948c]">
      <div className="flex items-center justify-between px-3 py-2">
        
        {/* API nativa de arrastre para la zona central */}
        <div
          onPointerDown={startDrag}
          className="flex items-center space-x-1 cursor-grab active:cursor-grabbing hover:text-white"
        >
          <GripVertical size={13} />
          <span>Draggable</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Botón principal de coincidencia armónica */}
          <button
            type="button"
            data-testid="toggle-filter-btn"
            onClick={onToggleFilter}
            className={`flex items-center space-x-1 px-2 py-0.5 rounded transition-colors ${
              filterArmonico ? "text-[#00e676]" : "text-[#7f948c] hover:text-white"
            }`}
          >
            <Music size={12} />
            <span>Coincidencia armónica</span>
          </button>

          {/* Menú de configuración de rangos */}
          <button
            type="button"
            data-testid="filter-dropdown-trigger"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1 hover:text-white transition-colors"
            title="Configuración de tolerancia armónica y BPM"
          >
            <ChevronDown size={12} className={menuOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
        </div>
      </div>

      {/* Menú desplegable flotante de filtros */}
      {menuOpen && (
        <div
          data-testid="filter-menu-popover"
          className="absolute top-9 right-2 w-52 bg-[#16201b] border border-[#27382f] rounded-lg p-2.5 z-50 shadow-xl space-y-2 text-[11px]"
        >
          <div className="flex items-center space-x-1 text-[#00e676] font-semibold border-b border-[#27382f] pb-1">
            <SlidersHorizontal size={12} />
            <span>Rango de tempo (BPM)</span>
          </div>

          <div className="flex justify-between items-center">
            <span>Margen de BPM:</span>
            <div className="flex space-x-1">
              {[3, 6, 10].map((tol) => (
                <button
                  key={tol}
                  type="button"
                  onClick={() => onSetBpmTolerance(tol)}
                  className={`px-1.5 py-0.5 rounded ${
                    bpmTolerance === tol
                      ? "bg-[#00e676] text-[#0d1210] font-bold"
                      : "bg-[#1f2b25] text-white hover:bg-[#2b3a33]"
                  }`}
                >
                  ±{tol}%
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-[#27382f]/60">
            <span>Permitir Half/Double BPM:</span>
            <button
              type="button"
              onClick={onToggleHalfDouble}
              className={`w-4 h-4 rounded flex items-center justify-center border ${
                allowHalfDouble
                  ? "bg-[#00e676] border-[#00e676] text-black"
                  : "border-[#405249] bg-transparent"
              }`}
            >
              {allowHalfDouble && <Check size={10} strokeWidth={3} />}
            </button>
          </label>
        </div>
      )}
    </div>
  );
};