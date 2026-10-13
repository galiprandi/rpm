/**
 * Pure helpers for the work-orders kanban drag & drop flow.
 * Fixes the "ghost OT" bug: optimistic moves that never reached the server
 * are now reverted when the drop is invalid or the drag is cancelled.
 */

export interface DraggableOrder {
  id: string;
  status: string;
}

interface OverData {
  data?: {
    current?: {
      type?: string;
      statusId?: string;
      wo?: { status?: string };
    };
  };
}

export function applyOptimisticStatus<T extends DraggableOrder>(
  orders: T[],
  id: string,
  status: string,
): T[] {
  return orders.map((o) => (o.id === id ? { ...o, status } : o));
}

export function restoreStatus<T extends DraggableOrder>(
  orders: T[],
  id: string,
  status: string,
): T[] {
  return applyOptimisticStatus(orders, id, status);
}

export type DropResult =
  | { action: "update"; status: string }
  | { action: "revert" };

/**
 * Resolves the outcome of a drag end/cancel.
 * The new status is derived from `over` (the actual drop target), not from
 * the optimistically-mutated state — avoids stale-closure races.
 * Any outcome that isn't a real status change reverts the optimistic move.
 */
export function resolveDrop(args: {
  orders: DraggableOrder[];
  activeId: string;
  originalStatus: string | null;
  over: OverData | null | undefined;
  currentStatus: string | undefined;
  cancelled?: boolean;
}): DropResult {
  const { originalStatus, over, cancelled } = args;

  if (cancelled || !over) return { action: "revert" };

  let newStatus: string | undefined;
  if (over.data?.current?.type === "WorkOrder") {
    newStatus = over.data.current.wo?.status;
  } else if (over.data?.current?.type === "Column") {
    newStatus = over.data.current.statusId;
  }

  if (!newStatus || newStatus === originalStatus) return { action: "revert" };

  return { action: "update", status: newStatus };
}
