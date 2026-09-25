import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalSize } from '@tauri-apps/api/dpi';
import { Track, FilterState } from './types';
import { getCompatibleKeys } from './utils/mathEngine';
import { FilterBar } from './components/FilterBar';
import { TrackCard } from './components/TrackCard';
import { HudHeader } from './components/HudHeader';
import { CollapsedWidget } from './components/CollapsedWidget'; // Importamos tu widget azul

export default function App() {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    harmonic: true,
    bpmTolerance: 3,
    similar: false,
    fresh: false,
    curveball: false,
    randomize: false,
  });

  useEffect(() => {
    const unlisten = listen<Track>('track-changed', (event) => {
      setCurrentTrack(event.payload);
    });
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  useEffect(() => {
    if (!currentTrack) return;
    
    let allowedKeys: string[] = [];
    if (filters.harmonic || filters.curveball) {
      allowedKeys = getCompatibleKeys(currentTrack.key, filters.curveball);
    }

    let tolerance = filters.bpmTolerance;
    if (filters.similar) tolerance = 1;
    if (filters.curveball) tolerance = 15;

    const minBpm = currentTrack.bpm - tolerance;
    const maxBpm = currentTrack.bpm + tolerance;

    invoke('get_filtered_tracks', {
      minBpm,
      maxBpm,
      allowedKeys,
      randomize: filters.randomize,
      fresh: filters.fresh
    })
    .then((recs: any) => setRecommendations(recs))
    .catch(console.error);

  }, [currentTrack, filters]);

  // CONTROLADOR NATIVO DEL WIDGET
  const handleToggleCollapse = async () => {
    const appWindow = getCurrentWindow();
    try {
      if (isCollapsed) {
        // Expandir al tamaño completo del HUD
        await appWindow.setSize(new LogicalSize(380, 600));
        setIsCollapsed(false);
      } else {
        // Contraer al tamaño exacto de tu botón azul (80x80 píxeles)
        await appWindow.setSize(new LogicalSize(80, 80));
        setIsCollapsed(true);
      }
    } catch (error) {
      console.error("Error al redimensionar:", error);
      setIsCollapsed(!isCollapsed);
    }
  };

  const toggleFilter = (key: keyof FilterState) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const cycleBpm = () => {
    setFilters(prev => ({
      ...prev,
      bpmTolerance: prev.bpmTolerance === 3 ? 6 : prev.bpmTolerance === 6 ? 10 : 3
    }));
  };

  // VISTA 1: MODO WIDGET (Solo el botón azul)
  if (isCollapsed) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent p-2" data-tauri-drag-region>
        <CollapsedWidget onExpand={handleToggleCollapse} />
      </div>
    );
  }

  // VISTA 2: MODO HUD COMPLETO
  return (
    <div className="flex flex-col h-screen bg-[#0a0f0d] text-white overflow-hidden rounded-lg border border-[#1a231f]">
      
      <HudHeader 
        track={currentTrack} 
        isCollapsed={isCollapsed} 
        onToggleCollapse={handleToggleCollapse} 
      />
      
      <FilterBar 
        filters={filters} 
        onToggleFilter={toggleFilter} 
        onCycleBpm={cycleBpm} 
      />

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {recommendations.map((track, idx) => (
          <TrackCard key={track.id} track={track} index={idx} />
        ))}
      </div>
    </div>
  );
}