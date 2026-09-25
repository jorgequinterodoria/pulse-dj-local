import React from "react";
import { Track } from "../types";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { ChevronUp, ChevronDown, X, Minus, Maximize2, Menu } from "lucide-react";

interface HudHeaderProps { track: Track | null; isCollapsed: boolean; onToggleCollapse: () => void; dict: any; }

export const HudHeader: React.FC<HudHeaderProps> = ({ track, isCollapsed, onToggleCollapse, dict }) => {
  const appWindow = getCurrentWindow();
  const openSettings = async () => { try { await invoke('open_settings_window'); } catch (error) { console.error(error); } };

  const parsedBpm = track ? Number(track.bpm) : 126;
  const displayBpm = !isNaN(parsedBpm) && parsedBpm > 0 ? Math.round(parsedBpm) : 126;
  const displayKey = track && track.key && track.key !== "NaN" ? track.key : "8A";

  return (
    <div className="flex flex-col border-b border-[#1a231f] bg-[#121815] shadow-sm relative" data-tauri-drag-region>
      <div className="flex items-center justify-between px-3 py-2" data-tauri-drag-region>
        <div className="flex items-center space-x-2 z-10">
          <button onClick={() => appWindow.close()} className="w-3 h-3 rounded-full bg-[#ff5f56] flex items-center justify-center group"><X size={8} className="opacity-0 group-hover:opacity-100 text-black/50" /></button>
          <button onClick={() => appWindow.minimize()} className="w-3 h-3 rounded-full bg-[#ffbd2e] flex items-center justify-center group"><Minus size={8} className="opacity-0 group-hover:opacity-100 text-black/50" /></button>
          <button onClick={() => appWindow.toggleMaximize()} className="w-3 h-3 rounded-full bg-[#27c93f] flex items-center justify-center group"><Maximize2 size={8} className="opacity-0 group-hover:opacity-100 text-black/50" /></button>
        </div>
        <button onClick={onToggleCollapse} className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-4 bg-[#1a231f] rounded-full hover:bg-[#27382f] transition-colors z-10 text-[#7f948c] hover:text-white border border-[#27382f]">
          {isCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        </button>
        <div className="w-[52px] flex items-center justify-end z-10">
          <button onClick={openSettings} className="text-[#7f948c] hover:text-white transition-colors cursor-pointer"><Menu size={15} /></button>
        </div>
      </div>

      {!track ? (
        <div className="flex items-center justify-center px-3 pb-4 pt-1" data-tauri-drag-region>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full animate-pulse bg-[var(--pulse-color)]"></div>
            <span className="text-[#52635d] text-xs font-medium tracking-widest">{dict.waiting}</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col px-3 pb-3 pt-1" data-tauri-drag-region>
          <div className="text-[10px] font-bold tracking-wider mb-1 flex items-center space-x-1.5 pointer-events-none text-[var(--pulse-color)]">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[var(--pulse-color)]"></div>
            <span>{dict.nowPlaying}</span>
          </div>
          <div className="flex items-center justify-between pointer-events-none">
            <div className="flex flex-col overflow-hidden w-full pr-3">
              <span className="text-white text-[14px] font-bold truncate tracking-tight">{track.title || dict.unknown}</span>
              <span className="text-[#7f948c] text-[12px] truncate">{track.artist || dict.unknown}</span>
            </div>
            <div className="flex items-center space-x-3 text-[12px] bg-[#1a231f] px-2.5 py-1.5 rounded border border-[#27382f] shrink-0">
              <span className="text-[#a0b0a8] font-bold w-6 text-center">{displayKey}</span>
              <span className="font-mono tabular-nums text-[var(--pulse-color)]">{displayBpm}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};