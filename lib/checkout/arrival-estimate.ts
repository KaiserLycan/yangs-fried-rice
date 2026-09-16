/**
 * "35–45 min", the range both checkout frames print.
 *
 * Nothing computes it. There is no kitchen queue to read and no distance
 * calculation, so this is the designer's copy rather than a number the app
 * worked out — kept hedged as an estimate and recorded in
 * `docs/reference/ordering-flow-handoff.md` as something a real estimate
 * should replace.
 *
 * Lives here rather than inside one component because two screens now print
 * it: the checkout summary and the confirmation that follows it. A customer
 * who is told "35–45 min" while reviewing and something else a second later
 * on the receipt has been told the app is guessing.
 */
export const ARRIVAL_ESTIMATE = "35–45 min";
