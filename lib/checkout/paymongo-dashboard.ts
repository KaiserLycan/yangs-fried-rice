/**
 * Where a manager refunds a payment by hand when the automatic refund fails
 * (FINALE 9.4). PayMongo payment ids look like `pay_…`; anything else — a
 * missing id, or a value that is not one — falls back to the payments list,
 * so the link can only ever point at PayMongo's own dashboard.
 */
const PAYMONGO_PAYMENTS = "https://dashboard.paymongo.com/payments";

export function paymongoPaymentUrl(paymentId: string | null | undefined): string {
  return paymentId && /^pay_[A-Za-z0-9]+$/.test(paymentId)
    ? `${PAYMONGO_PAYMENTS}/${paymentId}`
    : PAYMONGO_PAYMENTS;
}
