/**
 * Utility for determining if the restaurant is open based on Manila time.
 * Restaurant hours are 8am - 6pm (08:00 to 17:59).
 */
export function isRestaurantOpen(): boolean {
  const now = new Date();
  const manilaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Manila" })
  );
  const hour = manilaTime.getHours();
  // Open from 08:00 to 17:59
  return hour >= 8 && hour < 18;
}
