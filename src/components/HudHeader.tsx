import React from "react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ChevronLeft, ChevronRight, Search, Menu, Minimize2 } from "lucide-react";
import { Track } from "../types";

interface HudHeaderProps {
  currentTrack: Track | null;
  onCollapse: () => void;
}

export const HudHeader: React.FC<HudHeaderProps> = ({ currentTrack, onCollapse }) => {
  const handleClose = async () => {
    try {
      const win = getCurrentWebviewWindow();
      await win.close();
    } catch {
      // Ignorado en entorno web de pruebas
    }
  };

  const handleMinimize = async () => {
    try {
      const win = getCurrentWebviewWindow();
      await win.minimize();
    } catch {
      // Ignorado en entorno web de pruebas
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="flex flex-col bg-[#111614] border-b border-[#1b2420] px-3 pt-2.5 pb-2 rounded-t-2xl cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-center justify-between">
        {/* Controles estilo macOS */}
        <div className="flex items-center space-x-1.5" data-tauri-drag-region="false">
          <button
            onClick={handleClose}
            className="w-3 h-3 rounded-full bg-[#ff5f56] hover:brightness-110 flex items-center justify-center transition-opacity"
            title="Cerrar"
          />
          <button
            onClick={handleMinimize}
            className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:brightness-110 flex items-center justify-center transition-opacity"
            title="Minimizar"
          />
        </div>

        {/* Acciones del HUD */}
        <div className="flex items-center space-x-2 text-[#7f948c]">
          <span className="text-[11px] font-bold bg-[#1d2723] px-1.5 py-0.5 rounded text-[#00e676]">
            10
          </span>
          <button
            onClick={onCollapse}
            className="hover:text-white transition-colors"
            title="Colapsar widget"
          >
            <Minimize2 size={14} />
          </button>
          <button className="hover:text-white transition-colors" title="Buscar">
            <Search size={14} />
          </button>
          <button className="hover:text-white transition-colors" title="Menú">
            <Menu size={14} />
          </button>
        </div>
      </div>

      {/* Título de la canción actual en reproducción */}
      <div className="flex items-center justify-between mt-2 px-1">
        <button className="text-[#52635d] hover:text-white transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-white text-[15px] font-semibold tracking-wide truncate max-w-[210px] text-center">
          {currentTrack ? `${currentTrack.title} - ${currentTrack.artist}` : "Sin reproducción activa"}
        </span>
        <button className="text-[#52635d] hover:text-white transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};