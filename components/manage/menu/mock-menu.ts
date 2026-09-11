export type MenuCategory = "All" | "Fried Rice" | "Add-Ons" | "Chicken" | "Sides" | "Drinks";

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  category: MenuCategory;
  image: string;
}

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: "1",
    name: "Yangzhou Special",
    description: "Shrimp, char siu, egg, spring onion. The house original.",
    price: 180.00,
    rating: 4.9,
    category: "Fried Rice",
    image: "/mock/yangzhou-special.png", // We will use placeholder images if real ones are missing
  },
  {
    id: "2",
    name: "Chili Garlic Fried Rice",
    description: "Product Description",
    price: 165.00,
    rating: 4.9,
    category: "Fried Rice",
    image: "/mock/chili-garlic.png",
  },
  {
    id: "3",
    name: "Salted Fish & Shrimp",
    description: "Salted fish, plump shrimp, a hard sear in the wok.",
    price: 210.00,
    rating: 4.9,
    category: "Fried Rice",
    image: "/mock/salted-fish-shrimp.png",
  },
  {
    id: "4",
    name: "Beef Tapa Fried Rice",
    description: "Sweet cured beef, fried egg on top, atchara on the side.",
    price: 195.00,
    rating: 4.9,
    category: "Fried Rice",
    image: "/mock/beef-tapa.png",
  },
  {
    id: "5",
    name: "Fried Chicken (3pc)",
    description: "Brined overnight, double fried, house chili oil.",
    price: 230.00,
    rating: 4.9,
    category: "Chicken",
    image: "/mock/fried-chicken.png",
  },
  {
    id: "6",
    name: "Chicken Chop",
    description: "Butterflied thigh, five-spice crust, lemon.",
    price: 190.00,
    rating: 4.9,
    category: "Chicken",
    image: "/mock/chicken-chop.png",
  },
  {
    id: "7",
    name: "Lumpia (5pc)",
    description: "Pork and shrimp rolls, sweet vinegar dip.",
    price: 90.00,
    rating: 4.9,
    category: "Sides",
    image: "/mock/lumpia.png",
  },
  {
    id: "8",
    name: "Salted Egg Tofu",
    description: "Silken tofu, salted egg custard, curry leaf.",
    price: 120.00,
    rating: 4.9,
    category: "Sides",
    image: "/mock/salted-egg-tofu.png",
  },
  {
    id: "9",
    name: "Iced Tea Pitcher",
    description: "House brewed, lightly sweet, serves three.",
    price: 110.00,
    rating: 4.9,
    category: "Drinks",
    image: "/mock/iced-tea.png",
  },
];

export const MOCK_CATEGORIES: MenuCategory[] = [
  "All",
  "Fried Rice",
  "Add-Ons",
  "Chicken",
  "Sides",
  "Drinks",
];
