export type OrderStatus = "QUEUE" | "PREP" | "DELIVERY" | "COMPLETED" | "CANCELED";

export type OrderData = {
  id: string;
  orderNumber: string;
  time: string;
  status: OrderStatus;
  timer?: string;
  items: {
    quantity: number;
    name: string;
    addons?: string;
    price: number;
  }[];
  contactInfo: {
    name: string;
    address: string;
    phone: string;
  };
  orderInfo: {
    type: string;
    specialInstructions?: string;
  };
  deliveryFee: number;
  total: number;
};

export const MOCK_ORDERS: OrderData[] = [
  {
    id: "1",
    orderNumber: "2000",
    time: "12:00AM",
    status: "PREP",
    timer: "5:00",
    contactInfo: { name: "Liza Reyes", address: "21 Mabini St., Malate, Manila. Gate on the left, ring twice.", phone: "+63 976 202 8873" },
    orderInfo: { type: "Take-Out", specialInstructions: "On delivery hand the package to the guard and he'll pay for me." },
    deliveryFee: 95.00,
    total: 565.00,
    items: [
      { quantity: 2, name: "Yangzhou Special", addons: "Extra egg", price: 380.00 },
      { quantity: 1, name: "Lumpia (12pc)", price: 90.00 }
    ]
  },
  {
    id: "2",
    orderNumber: "0001",
    time: "12:05AM",
    status: "PREP",
    timer: "4:00",
    contactInfo: { name: "John Doe", address: "123 Taft Ave., Malate, Manila.", phone: "+63 917 123 4567" },
    orderInfo: { type: "Dine-In" },
    deliveryFee: 0,
    total: 250.00,
    items: [
      { quantity: 1, name: "Spring Rolls", addons: "Sweet chili sauce", price: 250.00 }
    ]
  },
  {
    id: "3",
    orderNumber: "0002",
    time: "12:10AM",
    status: "CANCELED",
    contactInfo: { name: "Jane Smith", address: "456 Roxas Blvd.", phone: "+63 999 987 6543" },
    orderInfo: { type: "Delivery" },
    deliveryFee: 95.00,
    total: 380.00,
    items: [
      { quantity: 2, name: "Yangzhou Special", price: 380.00 }
    ]
  },
  {
    id: "4",
    orderNumber: "0003",
    time: "12:15AM",
    status: "DELIVERY",
    timer: "15:00",
    contactInfo: { name: "Alice Brown", address: "789 Pedro Gil St.", phone: "+63 908 111 2233" },
    orderInfo: { type: "Delivery" },
    deliveryFee: 95.00,
    total: 565.00,
    items: [
      { quantity: 2, name: "Yangzhou Special", price: 380.00 },
      { quantity: 1, name: "Lumpia (12pc)", price: 90.00 }
    ]
  },
  {
    id: "5",
    orderNumber: "0004",
    time: "12:20AM",
    status: "COMPLETED",
    contactInfo: { name: "Bob White", address: "321 Quirino Ave.", phone: "+63 922 333 4455" },
    orderInfo: { type: "Take-Out" },
    deliveryFee: 0,
    total: 90.00,
    items: [
      { quantity: 1, name: "Lumpia (12pc)", price: 90.00 }
    ]
  },
  {
    id: "6",
    orderNumber: "0005",
    time: "12:25AM",
    status: "QUEUE",
    timer: "1:00",
    contactInfo: { name: "Eve Black", address: "654 UN Ave.", phone: "+63 919 555 6677" },
    orderInfo: { type: "Delivery" },
    deliveryFee: 95.00,
    total: 565.00,
    items: [
      { quantity: 2, name: "Yangzhou Special", price: 380.00 },
      { quantity: 1, name: "Lumpia (12pc)", price: 90.00 }
    ]
  },
];
