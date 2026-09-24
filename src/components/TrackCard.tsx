import React from "react";
import { Track } from "../types";

interface TrackCardProps {
  track: Track;
  index: number;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, index }) => {
  const handleDragStart = (e: React.DragEvent<HTMLAnchorElement>) => {
    e.stopPropagation();

    // 1. Validar que la pista tenga una ruta extraída de djay Pro
    if (!track.location || track.location === "") {
      e.preventDefault();
      console.warn("No se encontró la ruta física de:", track.title);
      return;
    }

    // 2. CORRECCIÓN DE DOBLE CODIFICACIÓN (El causante del bloqueo en macOS)
    // Decodificamos primero para limpiar cualquier formato previo de Algoriddim
    const decodedPath = decodeURIComponent(track.location);
    
    // Aseguramos el esquema file://
    const finalPath = decodedPath.startsWith("file://") 
      ? decodedPath 
      : `file://${decodedPath.startsWith("/") ? "" : "/"}${decodedPath}`;

    // Codificamos de forma limpia y estándar para el Finder de Apple
    const safeMacUri = encodeURI(finalPath);

    e.dataTransfer.effectAllowed = "copy";
    
    // 3. Inyección directa al Pasteboard de macOS
    e.dataTransfer.setData("text/uri-list", `${safeMacUri}\r\n`);
    e.dataTransfer.setData("text/plain", safeMacUri);
    
    // Force Hook para Safari/WebKit
    const fileName = safeMacUri.split('/').pop() || "track.mp3";
    e.dataTransfer.setData("DownloadURL", `audio/mpeg:${fileName}:${safeMacUri}`);
  };

  const parsedBpm = Number(track.bpm);
  const displayBpm = !isNaN(parsedBpm) && parsedBpm > 0 ? Math.round(parsedBpm) : 126;
  const displayKey = track.key && track.key !== "NaN" ? track.key : "8A";

  return (
    <div className="flex items-center justify-between p-2.5 hover:bg-[#1a231f] border-l-2 border-transparent hover:border-[#00e676] group transition-all">
      <div className="flex items-center space-x-3 overflow-hidden flex-1">
        
        {/* ZONA DE ARRASTRE */}
        <a
          href="#"
          draggable
          onDragStart={handleDragStart}
          onClick={(e) => e.preventDefault()}
          style={{ WebkitUserDrag: "element" } as any}
          className="w-6 h-6 flex items-center justify-center bg-[#27382f] text-[#7f948c] text-[10px] font-mono rounded cursor-grab active:cursor-grabbing hover:bg-[#32483d] hover:text-white transition-colors shadow-sm shrink-0"
          title={track.location ? "Arrastra a djay Pro" : "Ruta no encontrada"}
        >
          {index + 1}
        </a>
        
        <div className="flex flex-col overflow-hidden w-full">
          <span className="text-white text-[13px] font-medium truncate tracking-tight">
            {track.title || "Desconocido"}
          </span>
          <span className="text-[#7f948c] text-[11px] truncate">
            {track.artist || "Desconocido"}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 text-[11px] pl-2 min-w-[70px] justify-end shrink-0">
        <span className="text-[#a0b0a8] font-semibold w-7 text-right">
          {displayKey}
        </span>
        <span className="text-[#52635d] font-mono text-right tabular-nums">
          {displayBpm}
        </span>
      </div>
    </div>
  );
};