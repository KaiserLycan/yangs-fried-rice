export type OrderStatus = "ready" | "delivering" | "completed";

export interface DeliveryLocation {
  lat: number;
  lng: number;
}

export interface DeliveryItem {
  qty: number;
  name: string;
}

export interface DeliveryData {
  id: string;
  customer: string;
  address: string;
  phone: string;
  notes: string;
  items: DeliveryItem[];
  total: string;
  paymentMethod: string;
  status: OrderStatus;
  distance: string;
  origin: DeliveryLocation; // Restaurant location
  destination: DeliveryLocation;
}

// Yang's Fried Rice Restaurant (mock origin in Malate, Manila)
export const RESTAURANT_LOCATION: DeliveryLocation = {
  lat: 14.5694, 
  lng: 120.9856
};

export const MOCK_DELIVERIES: DeliveryData[] = [
  {
    id: "0000",
    customer: "LIZA REYES",
    address: "21 Mabini St, Malate, Manila",
    phone: "09763026873",
    notes: "Gate on the left, ring twice.",
    items: [
      { qty: 2, name: "Yang's Original Fried Rice" },
      { qty: 1, name: "Pork Dumplings (6pcs)" }
    ],
    total: "₱545.00",
    paymentMethod: "Cash on delivery",
    status: "ready",
    distance: "1.2 km",
    origin: RESTAURANT_LOCATION,
    destination: { lat: 14.5670, lng: 120.9850 } // Shifted East to Malate inland
  },
  {
    id: "1043",
    customer: "JOHN DOE",
    address: "456 Roxas Blvd, Ermita, Manila",
    phone: "0917 123 4567",
    notes: "Leave at the lobby reception.",
    items: [
      { qty: 1, name: "Yang's Original Fried Rice" },
      { qty: 1, name: "Spring Rolls" }
    ],
    total: "₱250.00",
    paymentMethod: "GCash",
    status: "delivering",
    distance: "2.5 km",
    origin: RESTAURANT_LOCATION,
    destination: { lat: 14.5750, lng: 120.9830 } // Shifted East to Ermita inland
  },
  {
    id: "1044",
    customer: "JANE SMITH",
    address: "789 Taft Ave, Malate, Manila",
    phone: "0999 987 6543",
    notes: "Call upon arrival.",
    items: [
      { qty: 3, name: "Yang's Original Fried Rice" }
    ],
    total: "₱450.00",
    paymentMethod: "Credit Card",
    status: "completed",
    distance: "0.8 km",
    origin: RESTAURANT_LOCATION,
    destination: { lat: 14.5640, lng: 120.9930 }
  }
];
