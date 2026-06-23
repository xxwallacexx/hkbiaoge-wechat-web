/**
 * Pure premium helpers shared across plan types (saving, coupon, …). Kept out of the
 * per-type API modules so any plan's param screen can reuse them.
 */

/** The largest premium we'll send to a cal endpoint (mirrors the mobile guard). */
export const MAX_EXPECTED_INSTAL = 2 ** 32;

/** True when `value` exceeds what the backend will accept. */
export function isExpectedInstalTooLarge(value: string): boolean {
  return Number(value) > MAX_EXPECTED_INSTAL;
}
