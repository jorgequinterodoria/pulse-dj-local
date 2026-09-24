export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  energy: number;
  rating: number;
  location?: string; // NUEVO: Ruta física del archivo
}

export type DjMode = "MyStyle" | "PulseDJ";

export interface FilterCriteria {
    key: string;
    bpm: number;
    bpm_tolerance_percent: number;
    allow_half_double_time: boolean;
    strict_harmonic: boolean;
}

export interface HudState {
    currentTrack: Track | null;
    recommendations: Track[];
    isCollapsed: boolean;
    selectedMode: DjMode;
    myStyleCount: number;
    filterArmonico: boolean;
    bpmTolerance: number;
    allowHalfDouble: boolean;
}