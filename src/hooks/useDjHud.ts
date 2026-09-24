import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { Track, DjMode, HudState, FilterCriteria } from "../types";

export function useDjHud() {
  const [state, setState] = useState<HudState>({
    currentTrack: null,
    recommendations: [],
    isCollapsed: false,
    selectedMode: "PulseDJ",
    myStyleCount: 0,
    filterArmonico: true,
    bpmTolerance: 6,
    allowHalfDouble: false,
  });

  const queryRecommendations = useCallback(
    async (
      current: Track | null,
      harmonic: boolean,
      tolerance: number,
      halfDouble: boolean,
      mode: DjMode
    ) => {
      if (!current) return;

      try {
        const myStyleRecs = await invoke<Track[]>("get_my_style_recommendations", {
          currentTrackId: current.id,
        });

        if (mode === "MyStyle") {
          setState((prev) => ({
            ...prev,
            currentTrack: current,
            recommendations: myStyleRecs,
            myStyleCount: myStyleRecs.length,
          }));
        } else {
          const criteria: FilterCriteria = {
            key: current.key,
            bpm: current.bpm,
            bpm_tolerance_percent: tolerance,
            allow_half_double_time: halfDouble,
            strict_harmonic: harmonic,
          };

          const globalRecs = await invoke<Track[]>("get_compatible_recommendations", { criteria });
          setState((prev) => ({
            ...prev,
            currentTrack: current,
            recommendations: globalRecs,
            myStyleCount: myStyleRecs.length,
          }));
        }
      } catch {
        setState((prev) => ({ ...prev, currentTrack: current, myStyleCount: 0 }));
      }
    },
    []
  );

  // Carga inicial al abrir la app
  const loadData = useCallback(async () => {
    try {
      const current = await invoke<Track | null>("get_current_track");
      if (current) {
        await queryRecommendations(
          current,
          state.filterArmonico,
          state.bpmTolerance,
          state.allowHalfDouble,
          state.selectedMode
        );
      }
    } catch {
      // Fallback
    }
  }, [
    queryRecommendations,
    state.filterArmonico,
    state.bpmTolerance,
    state.allowHalfDouble,
    state.selectedMode,
  ]);

  // Hook para escuchar el File System Watcher de Rust en tiempo real
  useEffect(() => {
    loadData();

    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<Track>("track-changed", (event) => {
        const newTrack = event.payload;
        // Al recibir un track nuevo, forzamos la actualización de recomendaciones
        setState((prev) => {
          queryRecommendations(
            newTrack,
            prev.filterArmonico,
            prev.bpmTolerance,
            prev.allowHalfDouble,
            prev.selectedMode
          );
          return { ...prev, currentTrack: newTrack };
        });
      });
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [loadData, queryRecommendations]);

  const toggleCollapse = useCallback(async () => {
    const nextState = !state.isCollapsed;
    setState((prev) => ({ ...prev, isCollapsed: nextState }));

    try {
      await invoke("set_hud_collapsed", { collapsed: nextState });
    } catch {}
  }, [state.isCollapsed]);

  const setMode = useCallback(
    (mode: DjMode) => {
      setState((prev) => {
        queryRecommendations(
          prev.currentTrack,
          prev.filterArmonico,
          prev.bpmTolerance,
          prev.allowHalfDouble,
          mode
        );
        return { ...prev, selectedMode: mode };
      });
    },
    [queryRecommendations]
  );

  const toggleFilter = useCallback(() => {
    setState((prev) => {
      const nextFilter = !prev.filterArmonico;
      queryRecommendations(
        prev.currentTrack,
        nextFilter,
        prev.bpmTolerance,
        prev.allowHalfDouble,
        prev.selectedMode
      );
      return { ...prev, filterArmonico: nextFilter };
    });
  }, [queryRecommendations]);

  const setBpmTolerance = useCallback(
    (tolerance: number) => {
      setState((prev) => {
        queryRecommendations(
          prev.currentTrack,
          prev.filterArmonico,
          tolerance,
          prev.allowHalfDouble,
          prev.selectedMode
        );
        return { ...prev, bpmTolerance: tolerance };
      });
    },
    [queryRecommendations]
  );

  const toggleHalfDouble = useCallback(() => {
    setState((prev) => {
      const nextHalf = !prev.allowHalfDouble;
      queryRecommendations(
        prev.currentTrack,
        prev.filterArmonico,
        prev.bpmTolerance,
        nextHalf,
        prev.selectedMode
      );
      return { ...prev, allowHalfDouble: nextHalf };
    });
  }, [queryRecommendations]);

  return {
    state,
    toggleCollapse,
    setMode,
    toggleFilter,
    setBpmTolerance,
    toggleHalfDouble,
  };
}