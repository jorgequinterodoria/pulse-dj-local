import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ModeSelector } from "../ModeSelector";

describe("ModeSelector Component", () => {
  it("debe renderizar los modos My Style y PulseDJ junto con el contador", () => {
    render(
      <ModeSelector
        selectedMode="PulseDJ"
        onSelectMode={vi.fn()}
        myStyleCount={7}
        onCenterIconClick={vi.fn()}
      />
    );

    expect(screen.getByText("My Style")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("PulseDJ")).toBeInTheDocument();
  });

  it("debe ejecutar onCenterIconClick al hacer clic en el isotipo central para colapsar", () => {
    const handleCollapse = vi.fn();
    render(
      <ModeSelector
        selectedMode="PulseDJ"
        onSelectMode={vi.fn()}
        myStyleCount={7}
        onCenterIconClick={handleCollapse}
      />
    );

    const centerTrigger = screen.getByTestId("center-collapse-trigger");
    fireEvent.click(centerTrigger);

    expect(handleCollapse).toHaveBeenCalledTimes(1);
  });

  it("debe cambiar el modo seleccionado al hacer clic", () => {
    const handleSelectMode = vi.fn();
    render(
      <ModeSelector
        selectedMode="PulseDJ"
        onSelectMode={handleSelectMode}
        myStyleCount={7}
        onCenterIconClick={vi.fn()}
      />
    );

    const myStyleBtn = screen.getByText("My Style");
    fireEvent.click(myStyleBtn);

    expect(handleSelectMode).toHaveBeenCalledWith("MyStyle");
  });
});