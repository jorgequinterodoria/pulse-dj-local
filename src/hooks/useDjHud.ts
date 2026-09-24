import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Track, DjMode, HudState } from "../types";

export function useDjHud() {
  const [state, setState] = useState<HudState>({
    currentTrack: null,
    recommendations: [],
    isCollapsed: false,
    selectedMode: "PulseDJ",
    myStyleCount: 7,
    filterArmonico: true,
  });

  const loadData = useCallback(async () => {
    try {
      const current = await invoke<Track | null>("get_current_track");
      const recs = await invoke<Track[]>("get_recommendations");
      setState((prev) => ({
        ...prev,
        currentTrack: current,
        recommendations: recs,
      }));
    } catch {
      // Fallback para pruebas fuera de Tauri
      setState((prev) => ({
        ...prev,
        currentTrack: {
          id: "demo",
          title: "Shine On",
          artist: "R.I.O",
          bpm: 128,
          key: "8A",
          energy: 7,
        },
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCollapse = useCallback(async () => {
    const nextState = !state.isCollapsed;
    setState((prev) => ({ ...prev, isCollapsed: nextState }));

    try {
      await invoke("set_hud_collapsed", { collapsed: nextState });
    } catch {
      // Ignorado si corre en navegador web
    }
  }, [state.isCollapsed]);

  const setMode = useCallback((mode: DjMode) => {
    setState((prev) => ({ ...prev, selectedMode: mode }));
  }, []);

  const toggleFilter = useCallback(() => {
    setState((prev) => ({ ...prev, filterArmonico: !prev.filterArmonico }));
  }, []);

  return {
    state,
    toggleCollapse,
    setMode,
    toggleFilter,
    reload: loadData,
  };
}