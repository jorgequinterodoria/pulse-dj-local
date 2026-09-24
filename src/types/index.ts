export interface Track {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  key: string;
  energy: number;
  rating?: number;
}

export type DjMode = "MyStyle" | "PulseDJ";

export interface HudState {
  currentTrack: Track | null;
  recommendations: Track[];
  isCollapsed: boolean;
  selectedMode: DjMode;
  myStyleCount: number;
  filterArmonico: boolean;
}