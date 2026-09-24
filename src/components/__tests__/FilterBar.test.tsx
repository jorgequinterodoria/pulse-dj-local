import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FilterBar } from "../FilterBar";

describe("FilterBar Component", () => {
  it("debe mostrar el estado activo de coincidencia armónica y conmutar", () => {
    const handleToggle = vi.fn();
    render(
      <FilterBar
        filterArmonico={true}
        bpmTolerance={6}
        allowHalfDouble={false}
        onToggleFilter={handleToggle}
        onSetBpmTolerance={vi.fn()}
        onToggleHalfDouble={vi.fn()}
      />
    );

    const toggleBtn = screen.getByTestId("toggle-filter-btn");
    expect(toggleBtn).toHaveClass("text-[#00e676]");

    fireEvent.click(toggleBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("debe desplegar el menú de tolerancia BPM y seleccionar un nuevo margen", () => {
    const handleBpmChange = vi.fn();
    render(
      <FilterBar
        filterArmonico={true}
        bpmTolerance={6}
        allowHalfDouble={false}
        onToggleFilter={vi.fn()}
        onSetBpmTolerance={handleBpmChange}
        onToggleHalfDouble={vi.fn()}
      />
    );

    const dropdownTrigger = screen.getByTestId("filter-dropdown-trigger");
    fireEvent.click(dropdownTrigger);

    expect(screen.getByTestId("filter-menu-popover")).toBeInTheDocument();

    const bpm10Btn = screen.getByText("±10%");
    fireEvent.click(bpm10Btn);

    expect(handleBpmChange).toHaveBeenCalledWith(10);
  });
});