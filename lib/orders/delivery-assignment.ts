/**
 * Who may take a delivery, and who may hand it back.
 *
 * A rider can carry as many deliveries as they accept — nothing here limits
 * the count — and can release any one of them again until it is delivered, so
 * an accidental tap is undone rather than stranding an order with a rider who
 * isn't going to take it. A released delivery becomes unassigned, which puts
 * it straight back in front of every other rider.
 *
 * Pure functions, shared by `lib/actions/delivery.ts` and the rider's screens,
 * so the button a rider sees and the rule the server enforces cannot disagree.
 */

/** The delivery is over; there is nothing left to accept or hand back. */
const FINISHED_STATUSES = new Set(["delivered", "completed", "failed", "cancelled", "canceled"]);

export type DeliveryAssignment = {
  /** `delivery.rider_id`, or null when nobody has taken it. */
  assignedRiderId: string | null;
  /** `delivery.delivery_status` — free text, so it is folded before comparing. */
  status: string | null;
};

function fold(status: string | null | undefined): string {
  return (status ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function isDeliveryFinished(assignment: DeliveryAssignment): boolean {
  return FINISHED_STATUSES.has(fold(assignment.status));
}

/** Nobody has taken it yet. */
export function isDeliveryUnassigned(assignment: DeliveryAssignment): boolean {
  return assignment.assignedRiderId === null;
}

/** This rider is the one carrying it. */
export function isAssignedTo(assignment: DeliveryAssignment, riderId: string): boolean {
  return assignment.assignedRiderId !== null && assignment.assignedRiderId === riderId;
}

/**
 * Free to accept: still unassigned and not finished. A rider already carrying
 * other deliveries is not blocked — taking several at once is the point.
 */
export function canAcceptDelivery(assignment: DeliveryAssignment): boolean {
  return isDeliveryUnassigned(assignment) && !isDeliveryFinished(assignment);
}

/** Only the rider carrying it, and only before it is delivered. */
export function canReleaseDelivery(
  assignment: DeliveryAssignment,
  riderId: string,
): boolean {
  return isAssignedTo(assignment, riderId) && !isDeliveryFinished(assignment);
}

/**
 * Why a release was refused, phrased for the rider, or null when it is
 * allowed. Kept beside the rule so the message can't drift from the check.
 */
export function releaseRefusalReason(
  assignment: DeliveryAssignment,
  riderId: string,
): string | null {
  if (canReleaseDelivery(assignment, riderId)) return null;

  if (isDeliveryFinished(assignment)) {
    return "This delivery is already finished, so it can't be handed back.";
  }
  if (isDeliveryUnassigned(assignment)) {
    return "You haven't accepted this delivery, so there is nothing to hand back.";
  }
  return "This delivery belongs to another rider.";
}

/** What a released delivery goes back to: unassigned and waiting. */
export const RELEASED_DELIVERY_STATUS = "pending";
