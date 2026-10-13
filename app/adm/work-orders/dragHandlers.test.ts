/**
 * Regression test for the "ghost work order" bug:
 * dragging a kanban card optimistically moves it in local state, but when
 * the drop is invalid (over === null), cancelled (touch scroll on mobile)
 * or resolves to the original status, the card stays visually moved while
 * no PUT ever reaches the server — the OT "vuelve" on the next reload.
 */
import { describe, it, expect } from "vitest";
import {
  applyOptimisticStatus,
  restoreStatus,
  resolveDrop,
} from "./dragHandlers";

const orders = [
  { id: "wo-1", status: "WAITING", vehicle: { identifier: "NBP152" } },
  { id: "wo-2", status: "READY", vehicle: { identifier: "ABC123" } },
];

describe("kanban drag handlers — ghost OT regression", () => {
  it("applyOptimisticStatus moves the card in state", () => {
    const next = applyOptimisticStatus(orders, "wo-1", "DELIVERED");
    expect(next.find((o) => o.id === "wo-1")?.status).toBe("DELIVERED");
  });

  it("restoreStatus reverts the optimistic move", () => {
    const moved = applyOptimisticStatus(orders, "wo-1", "DELIVERED");
    const reverted = restoreStatus(moved, "wo-1", "WAITING");
    expect(reverted.find((o) => o.id === "wo-1")?.status).toBe("WAITING");
  });

  it("drop over nothing after an optimistic move must revert, not commit", () => {
    // Simulates: dragOver moved card to DELIVERED, dragEnd got over === null
    const result = resolveDrop({
      orders,
      activeId: "wo-1",
      originalStatus: "WAITING",
      over: null,
      currentStatus: "DELIVERED", // status already mutated by handleDragOver
    });
    expect(result.action).toBe("revert");
  });

  it("drop on the same original status must revert the optimistic state", () => {
    const result = resolveDrop({
      orders,
      activeId: "wo-1",
      originalStatus: "WAITING",
      over: { data: { current: { type: "Column", statusId: "WAITING" } } },
      currentStatus: "WAITING",
    });
    expect(result.action).toBe("revert");
  });

  it("cancelled drag (mobile scroll) must revert the optimistic move", () => {
    const result = resolveDrop({
      orders,
      activeId: "wo-1",
      originalStatus: "WAITING",
      over: null,
      currentStatus: "DELIVERED",
      cancelled: true,
    });
    expect(result.action).toBe("revert");
  });

  it("valid drop on another column resolves to update with that status", () => {
    const result = resolveDrop({
      orders,
      activeId: "wo-1",
      originalStatus: "WAITING",
      over: { data: { current: { type: "Column", statusId: "DELIVERED" } } },
      currentStatus: "DELIVERED",
    });
    expect(result).toEqual({ action: "update", status: "DELIVERED" });
  });

  it("valid drop over a card in another column resolves to that card status", () => {
    const result = resolveDrop({
      orders,
      activeId: "wo-1",
      originalStatus: "WAITING",
      over: {
        data: { current: { type: "WorkOrder", wo: { status: "READY" } } },
      },
      currentStatus: "READY",
    });
    expect(result).toEqual({ action: "update", status: "READY" });
  });
});
