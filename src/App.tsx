import React from "react";
import { useDjHud } from "./hooks/useDjHud";
import { HudHeader } from "./components/HudHeader";
import { ModeSelector } from "./components/ModeSelector";
import { FilterBar } from "./components/FilterBar";
import { TrackCard } from "./components/TrackCard";
import { CollapsedWidget } from "./components/CollapsedWidget";

export const App: React.FC = () => {
  const {
    state,
    toggleCollapse,
    setMode,
    toggleFilter,
    setBpmTolerance,
    toggleHalfDouble,
  } = useDjHud();

  if (state.isCollapsed) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-transparent">
        <CollapsedWidget onExpand={toggleCollapse} />
      </div>
    );
  }

  return (
    <div className="w-[340px] h-[580px] flex flex-col bg-[#0f1412] border border-[#1b2621] rounded-2xl shadow-2xl overflow-hidden font-sans">
      {/* Cabecera con controles y canción en reproducción */}
      <HudHeader currentTrack={state.currentTrack} onCollapse={toggleCollapse} />

      {/* Selector de modo y botón central de colapso */}
      <ModeSelector
        selectedMode={state.selectedMode}
        onSelectMode={setMode}
        myStyleCount={state.myStyleCount}
        onCenterIconClick={toggleCollapse}
      />

      {/* Barra de utilidades, menú de tempo y filtro armónico */}
      <FilterBar
        filterArmonico={state.filterArmonico}
        bpmTolerance={state.bpmTolerance}
        allowHalfDouble={state.allowHalfDouble}
        onToggleFilter={toggleFilter}
        onSetBpmTolerance={setBpmTolerance}
        onToggleHalfDouble={toggleHalfDouble}
      />

      {/* Lista de temas recomendados compatibles */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
        {state.recommendations.map((track, idx) => (
          <TrackCard key={track.id} track={track} isFirst={idx === 0} />
        ))}
      </div>
    </div>
  );
};

export default App;