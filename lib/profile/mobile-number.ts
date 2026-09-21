/**
 * Phone-number display helpers.
 *
 * The implementation moved to `lib/validation/phone.ts`, which is the single
 * definition of a phone number for customers, managers, staff and riders.
 * This module stays as the import path the profile screens already use.
 */
export {
  formatMobileNumber,
  toInternationalMobile,
  phoneDigitsOf,
} from "@/lib/validation/phone";
