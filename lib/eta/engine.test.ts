import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistanceKm,
  calculateKitchenPrepMinutes,
  calculateTransitMinutes,
  isWithinNcrBoundary,
  calculateOrderEta,
  STORE_LOCATION,
  MAX_DELIVERY_RADIUS_KM,
} from "./engine";

describe("ETA Engine", () => {
  describe("calculateHaversineDistanceKm", () => {
    it("returns 0 for identical coordinates", () => {
      const distance = calculateHaversineDistanceKm(STORE_LOCATION, STORE_LOCATION);
      expect(distance).toBe(0);
    });

    it("calculates accurate distance from Malate to Makati (~5 km)", () => {
      const makati = { latitude: 14.5547, longitude: 121.0244 };
      const distance = calculateHaversineDistanceKm(STORE_LOCATION, makati);
      expect(distance).toBeGreaterThan(4);
      expect(distance).toBeLessThan(6);
    });

    it("calculates accurate distance from Malate to Quezon City Memorial Circle (~11.4 km straight-line)", () => {
      const qc = { latitude: 14.6517, longitude: 121.0494 };
      const distance = calculateHaversineDistanceKm(STORE_LOCATION, qc);
      expect(distance).toBeGreaterThan(10);
      expect(distance).toBeLessThan(15);
    });

    it("calculates accurate distance from Malate to Calamba, Laguna (>45 km)", () => {
      const laguna = { latitude: 14.2117, longitude: 121.1656 };
      const distance = calculateHaversineDistanceKm(STORE_LOCATION, laguna);
      expect(distance).toBeGreaterThan(40);
    });
  });

  describe("calculateKitchenPrepMinutes", () => {
    it("returns base 15 minutes when 0 orders ahead in queue", () => {
      expect(calculateKitchenPrepMinutes(0)).toBe(15);
    });

    it("scales prep time by +3 minutes per order ahead", () => {
      expect(calculateKitchenPrepMinutes(1)).toBe(18);
      expect(calculateKitchenPrepMinutes(3)).toBe(24);
      expect(calculateKitchenPrepMinutes(5)).toBe(30);
    });

    it("caps kitchen prep time at 60 minutes during heavy congestion", () => {
      expect(calculateKitchenPrepMinutes(20)).toBe(60);
      expect(calculateKitchenPrepMinutes(100)).toBe(60);
    });

    it("handles negative queue count gracefully", () => {
      expect(calculateKitchenPrepMinutes(-5)).toBe(15);
    });
  });

  describe("calculateTransitMinutes", () => {
    it("returns 0 for take_out and dine_in orders", () => {
      expect(calculateTransitMinutes(5, "take_out")).toBe(0);
      expect(calculateTransitMinutes(10, "dine_in")).toBe(0);
    });

    it("calculates 5 min buffer + 3 min/km for delivery", () => {
      // 5km -> 5 + (5 * 3) = 20 mins
      expect(calculateTransitMinutes(5, "delivery")).toBe(20);
      // 2km -> 5 + (2 * 3) = 11 mins
      expect(calculateTransitMinutes(2, "delivery")).toBe(11);
    });

    it("returns default transit time (15 mins) when distance is null", () => {
      expect(calculateTransitMinutes(null, "delivery")).toBe(15);
    });
  });

  describe("isWithinNcrBoundary", () => {
    it("returns isDeliverable: true for addresses within 15 km (NCR)", () => {
      const makati = { latitude: 14.5547, longitude: 121.0244 };
      const result = isWithinNcrBoundary(makati);
      expect(result.isDeliverable).toBe(true);
      expect(result.distanceKm).toBeLessThanOrEqual(MAX_DELIVERY_RADIUS_KM);
    });

    it("returns isDeliverable: false for addresses outside NCR (>15 km)", () => {
      const laguna = { latitude: 14.2117, longitude: 121.1656 };
      const result = isWithinNcrBoundary(laguna);
      expect(result.isDeliverable).toBe(false);
      expect(result.distanceKm).toBeGreaterThan(MAX_DELIVERY_RADIUS_KM);
    });
  });

  describe("calculateOrderEta", () => {
    it("calculates full delivery ETA with active kitchen queue and delivery distance", () => {
      const customerCoords = { latitude: 14.5547, longitude: 121.0244 }; // Makati (~4.4 km)
      const eta = calculateOrderEta({
        orderId: "order-123",
        orderType: "delivery",
        activeOrdersAhead: 2, // 15 + 2*3 = 21 mins prep
        customerCoordinates: customerCoords,
      });

      expect(eta.orderId).toBe("order-123");
      expect(eta.kitchenPrepMinutes).toBe(21);
      expect(eta.isDeliverable).toBe(true);
      expect(eta.distanceKm).toBeGreaterThan(4);
      expect(eta.transitMinutes).toBeGreaterThan(15);
      expect(eta.totalEstimatedMinutes).toBe(eta.kitchenPrepMinutes + eta.transitMinutes);
      expect(eta.arrivalWindow).toMatch(/\d+–\d+ mins/);
      expect(eta.estimatedArrivalTimestamp).toBeDefined();
    });

    it("formats pickup orders with 'Ready in X–Y mins' and zero transit", () => {
      const eta = calculateOrderEta({
        orderId: "order-pickup",
        orderType: "take_out",
        activeOrdersAhead: 1, // 18 mins prep
      });

      expect(eta.transitMinutes).toBe(0);
      expect(eta.kitchenPrepMinutes).toBe(18);
      expect(eta.totalEstimatedMinutes).toBe(18);
      expect(eta.arrivalWindow).toBe("Ready in 13–23 mins");
    });

    it("flags non-deliverable orders outside NCR", () => {
      const laguna = { latitude: 14.2117, longitude: 121.1656 };
      const eta = calculateOrderEta({
        orderId: "order-outside",
        orderType: "delivery",
        activeOrdersAhead: 0,
        customerCoordinates: laguna,
      });

      expect(eta.isDeliverable).toBe(false);
      expect(eta.message).toContain("Delivery is currently restricted to Metro Manila (NCR)");
    });

    it("skips kitchen prep time if order is already in transit (delivering)", () => {
      const eta = calculateOrderEta({
        orderId: "order-delivering",
        orderType: "delivery",
        activeOrdersAhead: 5,
        deliveryStatus: "delivering",
        customerCoordinates: { latitude: 14.56, longitude: 120.99 },
      });

      expect(eta.kitchenPrepMinutes).toBe(0);
      expect(eta.totalEstimatedMinutes).toBe(eta.transitMinutes);
    });

    it("returns None arrivalWindow and completion message for completed delivery orders", () => {
      const eta = calculateOrderEta({
        orderId: "order-completed-deliv",
        orderType: "delivery",
        activeOrdersAhead: 3,
        orderStatus: "completed",
        deliveryStatus: "delivered",
      });

      expect(eta.arrivalWindow).toBe("None");
      expect(eta.totalEstimatedMinutes).toBe(0);
      expect(eta.kitchenPrepMinutes).toBe(0);
      expect(eta.transitMinutes).toBe(0);
      expect(eta.message).toBe("Order has been completed and delivered.");
    });

    it("returns None arrivalWindow and completion message for completed pickup orders", () => {
      const eta = calculateOrderEta({
        orderId: "order-completed-pickup",
        orderType: "take_out",
        activeOrdersAhead: 3,
        orderStatus: "completed",
      });

      expect(eta.arrivalWindow).toBe("None");
      expect(eta.totalEstimatedMinutes).toBe(0);
      expect(eta.kitchenPrepMinutes).toBe(0);
      expect(eta.transitMinutes).toBe(0);
      expect(eta.message).toBe("Order has been completed and picked up.");
    });

    it("returns None arrivalWindow for cancelled orders", () => {
      const eta = calculateOrderEta({
        orderId: "order-cancelled",
        orderType: "delivery",
        activeOrdersAhead: 3,
        orderStatus: "cancelled",
      });

      expect(eta.arrivalWindow).toBe("None");
      expect(eta.totalEstimatedMinutes).toBe(0);
      expect(eta.message).toBe("Order was cancelled.");
    });

    it("returns 'Ready for pickup' for ready take-out orders", () => {
      const eta = calculateOrderEta({
        orderId: "order-ready",
        orderType: "take_out",
        activeOrdersAhead: 2,
        orderStatus: "ready",
      });

      expect(eta.arrivalWindow).toBe("Ready for pickup");
      expect(eta.kitchenPrepMinutes).toBe(0);
      expect(eta.transitMinutes).toBe(0);
      expect(eta.message).toBe("Your order is ready for pickup at the counter.");
    });
  });
});
