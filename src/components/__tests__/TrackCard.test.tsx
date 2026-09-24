import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TrackCard } from "../TrackCard";
import { Track } from "../../types";

describe("TrackCard Component", () => {
  const mockTrack: Track = {
    id: "1",
    title: "Pepas",
    artist: "Farruko",
    bpm: 121,
    key: "1B",
    energy: 9,
  };

  it("debe mostrar correctamente el título, artista, tono Camelot y BPM", () => {
    render(<TrackCard track={mockTrack} />);

    expect(screen.getByText("Pepas")).toBeInTheDocument();
    expect(screen.getByText("Farruko")).toBeInTheDocument();
    expect(screen.getByText("1B")).toBeInTheDocument();
    expect(screen.getByText("121")).toBeInTheDocument();
  });
});