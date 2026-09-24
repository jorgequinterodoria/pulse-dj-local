import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CollapsedWidget } from "../CollapsedWidget";

describe("CollapsedWidget Component", () => {
  it("debe emitir onExpand al ser presionado", () => {
    const handleExpand = vi.fn();
    render(<CollapsedWidget onExpand={handleExpand} />);

    const trigger = screen.getByTestId("collapsed-expand-trigger");
    fireEvent.click(trigger);

    expect(handleExpand).toHaveBeenCalledTimes(1);
  });
});