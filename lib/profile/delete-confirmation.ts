/**
 * The gate on the delete-account dialog (Cust5).
 *
 * The dialog asks the customer to type a word before the destructive button
 * becomes usable. That is the whole point of the control: deleting an account
 * removes the profile and every saved address, so the interaction should cost
 * a deliberate act rather than one mis-aimed click.
 */
export const DELETE_CONFIRMATION_WORD = "DELETE";

/**
 * Whether what the customer typed unlocks the destructive button.
 *
 * Surrounding whitespace is forgiven because a paste or an over-eager mobile
 * keyboard leaves it behind and it is not what the gate is testing for. Case
 * is not forgiven: matching exactly is what makes this a deliberate act
 * rather than a reflex.
 */
export function isDeleteConfirmed(typed: string): boolean {
  return typed.trim() === DELETE_CONFIRMATION_WORD;
}
