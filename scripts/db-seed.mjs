#!/usr/bin/env node
// ============================================================================
// Demo data seed — a realistic menu, staff, customers with Metro Manila
// addresses, and a month of pickup orders, payments and reviews, so every
// screen (menu, KDS, dashboard, reports, order history) has something
// believable on it during testing. The shop is pickup-only (issue #114).
//
//   npm run db:seed              add the demo data (refuses if already there)
//   npm run db:seed -- --reset   remove the previous demo data first, then add
//
// Every value passes the field rules in lib/validation/fields.ts and the
// CHECK constraints from the atomic-fields migration: split first/last names,
// +63 mobile numbers, five-part NCR addresses with real barangays and ZIPs,
// LTO-format licence numbers.
//
// Demo accounts are marked with user_metadata.seeded = true, and customers use
// the @yangs-demo.ph domain so they can never collide with a real person's
// address. Menu items are matched by name: re-running updates them in place
// instead of duplicating them.
//
// Randomness is seeded, so every run produces the same data.
// ============================================================================

import {
  createAdmin,
  hasFlag,
  check,
  listAllAuthUsers,
  deleteCustomersCascade,
  deleteEmployeesCascade,
} from "./lib/admin.mjs";

const RESET = hasFlag("--reset");
const DEMO_PASSWORD = process.env.SEED_PASSWORD || "YangsDemo2026!";
const CUSTOMER_DOMAIN = "yangs-demo.ph";

// ---- deterministic randomness ----------------------------------------------
let seed = 20260924;
function random() {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = (list) => list[Math.floor(random() * list.length)];
const between = (min, max) => min + Math.floor(random() * (max - min + 1));
const money = (n) => Math.round(n * 100) / 100;

// ---- the data ----------------------------------------------------------------
const MENU = {
  "Fried Rice": [
    ["Yang Chow Fried Rice", 185, "Char siu, shrimp, egg and spring onion — the house classic that started it all."],
    ["Salted Fish & Chicken Fried Rice", 195, "Diced chicken and crisp salted fish tossed with egg and lettuce."],
    ["Garlic Beef Fried Rice", 215, "Tender beef strips, toasted garlic and a fried egg on top."],
    ["Kimchi Pork Fried Rice", 205, "Spicy house kimchi, pork belly and sesame, finished with nori."],
    ["Shrimp & Egg Fried Rice", 225, "Plump shrimp, soft-scrambled egg and scallion oil."],
    ["Vegetable Fried Rice", 155, "Carrots, corn, peas, cabbage and shiitake — no meat, all flavour."],
  ],
  Noodles: [
    ["Beef Chow Fun", 235, "Wide rice noodles seared with beef, bean sprouts and soy."],
    ["Pancit Canton Special", 195, "Egg noodles with pork, shrimp, squid balls and vegetables."],
    ["Wonton Noodles", 175, "Springy egg noodles with pork-and-shrimp wontons in clear broth."],
    ["Seafood Hofan", 265, "Flat noodles in silky egg gravy with shrimp, squid and fish."],
  ],
  "Dim Sum": [
    ["Pork Siomai (4 pcs)", 95, "Steamed pork and shrimp dumplings with chili-garlic on the side."],
    ["Hakaw (4 pcs)", 125, "Crystal-skin shrimp dumplings, steamed to order."],
    ["Xiao Long Bao (6 pcs)", 165, "Soup dumplings with pork filling and black vinegar."],
    ["Lumpiang Shanghai (8 pcs)", 120, "Crisp pork spring rolls with sweet chili dip."],
    ["Chicken Feet in Black Bean", 110, "Braised until tender in fermented black bean sauce."],
  ],
  Soups: [
    ["Hot & Sour Soup", 145, "Tofu, bamboo shoots and wood ear in a peppery, tangy broth."],
    ["Wonton Soup", 135, "Six pork-and-shrimp wontons in chicken broth."],
    ["Corn & Crab Soup", 155, "Sweet corn and crab meat in a light egg-drop soup."],
  ],
  Drinks: [
    ["Iced Milk Tea", 75, "Black tea with fresh milk, lightly sweet."],
    ["Calamansi Juice", 65, "Freshly squeezed and served cold."],
    ["Hot Jasmine Tea", 45, "A pot of jasmine green tea."],
    ["Sago't Gulaman", 60, "Brown-sugar syrup with tapioca pearls and gelatin."],
    ["Bottled Water", 30, null],
  ],
  Desserts: [
    ["Mango Sago", 95, "Ripe mango, sago pearls and coconut cream."],
    ["Buchi (4 pcs)", 85, "Sesame balls filled with sweet red bean."],
    ["Almond Jelly", 80, "Chilled almond jelly with fruit cocktail."],
  ],
};

const ADD_ONS = {
  "Fried Rice": [["Extra Egg", 20], ["Extra Char Siu", 45], ["Upsize (+50%)", 55]],
  Noodles: [["Extra Noodles", 40], ["Chili Oil", 15]],
  "Dim Sum": [["Chili Garlic Sauce", 15]],
  Soups: [["Extra Wonton (3 pcs)", 45]],
  Drinks: [["Tapioca Pearls", 20], ["Nata de Coco", 20]],
  Desserts: [],
};

const EMPLOYEES = [
  { first: "Ramon", last: "Tan", email: "ramon.tan@yangs.ph", role: "MANAGER", shift: "Mon-Fri – 8-4PM", phone: "+639171110001", dob: "1984-03-12" },
  { first: "Grace", last: "Lim", email: "grace.lim@yangs.ph", role: "STAFF", shift: "MWF – 12-3PM", phone: "+639171110002", dob: "1996-07-21" },
  { first: "Paolo", last: "Dizon", email: "paolo.dizon@yangs.ph", role: "STAFF", shift: "TThS – 9-5PM", phone: "+639171110003", dob: "1999-11-02" },
  { first: "Anna Mae", last: "Santos", email: "annamae.santos@yangs.ph", role: "STAFF", shift: "Weekends – 10-10PM", phone: "+639171110004", dob: "2001-01-30" },
];

// [first, last, [buildingNo, street, barangay, city, zip], note]
const CUSTOMERS = [
  ["Liza", "Reyes", ["21", "Mabini St.", "Malate", "Manila", "1004"], "Gate on the left, ring twice."],
  ["Carlo", "Mendoza", ["Unit 12B", "Ayala Avenue", "Bel-Air", "Makati", "1209"], "Leave with the lobby guard."],
  ["Bea", "Santos", ["45", "Katipunan Avenue", "Loyola Heights", "Quezon City", "1108"], null],
  ["Miguel", "Garcia", ["8", "Kalayaan Avenue", "Pinagsama", "Taguig", "1630"], "Blue gate beside the sari-sari store."],
  ["Andrea", "Villanueva", ["1203", "Shaw Boulevard", "Wack-Wack Greenhills", "Mandaluyong", "1555"], null],
  ["Joshua", "Ramos", ["17", "Ortigas Avenue", "Ugong", "Pasig", "1604"], "Call when outside."],
  ["Kristine", "Aquino", ["32", "Aurora Boulevard", "Socorro", "Quezon City", "1109"], null],
  ["Paolo", "Fernandez", ["9", "J.P. Rizal St.", "Poblacion", "Makati", "1210"], null],
  ["Camille", "dela Cruz", ["55", "Taft Avenue", "Barangay 76", "Pasay", "1300"], "Third floor, room 3C."],
  ["Rafael", "Lim", ["101", "Banawe St.", "Sto. Domingo", "Quezon City", "1114"], null],
  ["Nicole", "Tan", ["4", "Tomas Morato Avenue", "South Triangle", "Quezon City", "1103"], "Beside the coffee shop."],
  ["Enrico", "Bautista", ["220", "Quirino Avenue", "Tambo", "Parañaque", "1701"], null],
  ["Sofia", "Navarro", ["14", "Pioneer St.", "Buayang Bato", "Mandaluyong", "1550"], null],
  ["Gabriel", "Castillo", ["7", "E. Rodriguez Sr. Avenue", "Kristong Hari", "Quezon City", "1112"], "Yellow house, green gate."],
  ["Isabel", "Ocampo", ["3", "Wilson St.", "Greenhills", "San Juan", "1502"], null],
];

const REVIEW_COMMENTS = {
  5: ["Hot and fast — the Yang Chow is still the best in the city.", "Staff were friendly and the food was piping hot.", "Perfect as always. The siomai never misses!", "Generous servings, will order again."],
  4: ["Really good, just a little late tonight.", "Tasty fried rice, wish there was a bit more shrimp.", "Solid order, packaging kept everything warm."],
  3: ["Food was fine but arrived lukewarm.", "Okay overall — the noodles were a bit soggy."],
};

// ---- helpers -----------------------------------------------------------------
const db = createAdmin();

function emailFor(first, last) {
  return `${first}.${last}`.toLowerCase().replace(/[^a-z.]/g, "") + `@${CUSTOMER_DOMAIN}`;
}

async function createAuthUser(email, name, extra = {}) {
  const { data, error } = await db.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name, seeded: true, ...extra },
  });
  if (error) throw new Error(`create auth user ${email}: ${error.message}`);
  return data.user.id;
}

function formatAddress([buildingNo, street, barangay, city, zip]) {
  return `${buildingNo} ${street}, ${barangay}, ${city} ${zip}`;
}

// ---- reset -------------------------------------------------------------------
console.log(`\nYang's Fried Rice — demo seed${RESET ? " (reset)" : ""}\n`);
const seededUsers = (await listAllAuthUsers(db)).filter((u) => u.user_metadata?.seeded === true);
if (seededUsers.length > 0 && !RESET) {
  console.log(`Demo data is already present (${seededUsers.length} demo accounts). Run with --reset to replace it.\n`);
  process.exit(0);
}
if (RESET && seededUsers.length > 0) {
  const ids = seededUsers.map((u) => u.id);
  const [{ data: custRows }, { data: empRows }] = await Promise.all([
    db.from("customer").select("customer_id").in("customer_id", ids),
    db.from("employee").select("employee_id").in("employee_id", ids),
  ]);
  const customerIds = (custRows ?? []).map((r) => r.customer_id);
  const employeeIds = (empRows ?? []).map((r) => r.employee_id);
  await deleteCustomersCascade(db, customerIds);
  await deleteEmployeesCascade(db, employeeIds);
  for (const u of seededUsers.filter((u) => !customerIds.includes(u.id) && !employeeIds.includes(u.id))) {
    await db.auth.admin.deleteUser(u.id);
  }
  console.log(`Removed ${customerIds.length} demo customers and ${employeeIds.length} demo employees.`);
}

// ---- menu --------------------------------------------------------------------
const products = []; // { product_id, name, price, category, addOns: [{addon_id, name, price}] }
for (const [categoryName, items] of Object.entries(MENU)) {
  let { data: category } = await db.from("categories").select("category_id").eq("category_name", categoryName).maybeSingle();
  if (!category) {
    category = check(await db.from("categories").insert({ category_name: categoryName }).select("category_id").single(), `category ${categoryName}`);
  }
  for (const [name, price, details] of items) {
    const row = { category_id: category.category_id, product_name: name, product_price: price, product_details: details, is_available: true };
    let { data: product } = await db.from("product").select("product_id").eq("product_name", name).maybeSingle();
    if (product) {
      check(await db.from("product").update(row).eq("product_id", product.product_id), `update ${name}`);
    } else {
      product = check(await db.from("product").insert(row).select("product_id").single(), `insert ${name}`);
    }
    const existingAddOns = check(await db.from("add_on").select("addon_id, name, price").eq("product_id", product.product_id), `add-ons of ${name}`);
    const addOns = [...existingAddOns];
    for (const [addOnName, addOnPrice] of ADD_ONS[categoryName]) {
      if (addOns.some((a) => a.name === addOnName)) continue;
      addOns.push(check(await db.from("add_on").insert({ product_id: product.product_id, name: addOnName, price: addOnPrice }).select("addon_id, name, price").single(), `add-on ${addOnName}`));
    }
    products.push({ product_id: product.product_id, name, price, category: categoryName, addOns });
  }
}
console.log(`Menu: ${Object.keys(MENU).length} categories, ${products.length} products.`);

// ---- employees ---------------------------------------------------------------
for (const e of EMPLOYEES) {
  const id = await createAuthUser(e.email, `${e.first} ${e.last}`);
  check(await db.from("employee").insert({
    employee_id: id,
    first_name: e.first,
    last_name: e.last,
    email: e.email,
    role: e.role,
    schedule_shift: e.shift,
    phone_number: e.phone,
    date_of_birth: e.dob,
  }), `employee ${e.email}`);
}
console.log(`Employees: ${EMPLOYEES.length}.`);

// ---- customers ---------------------------------------------------------------
const customers = []; // { id, address }
for (const [index, [first, last, parts, note]] of CUSTOMERS.entries()) {
  const email = emailFor(first, last);
  const id = await createAuthUser(email, `${first} ${last}`);
  const phone = `+63917${String(2200000 + index * 7919).padStart(7, "0")}`;
  const year = between(1975, 2004);
  check(await db.from("customer").insert({
    customer_id: id,
    first_name: first,
    last_name: last,
    email,
    phone_number: phone,
    date_of_birth: `${year}-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`,
  }), `customer ${email}`);
  const [buildingNo, street, barangay, city, zip] = parts;
  check(await db.from("customer_address").insert({
    customer_id: id,
    label: "Home",
    building_no: buildingNo,
    street,
    barangay,
    city,
    zip_code: zip,
    address_note: note,
    is_default: true,
  }), `address for ${email}`);
  customers.push({ id, address: formatAddress(parts) });
}
console.log(`Customers: ${customers.length}, each with a Metro Manila address.`);

// ---- orders ------------------------------------------------------------------
const now = Date.now();
let orderCount = 0;
let reviewCount = 0;

async function createOrder({ customer, createdAt, status, orderType }) {
  const lines = [];
  for (let i = 0, n = between(1, 4); i < n; i += 1) {
    const product = pick(products);
    const quantity = between(1, 3);
    const addOn = product.addOns.length && random() < 0.35 ? pick(product.addOns) : null;
    lines.push({ product, quantity, addOn });
  }
  const completedAt = status === "completed" ? new Date(createdAt.getTime() + between(25, 55) * 60000) : null;
  const cancelled = status === "cancelled";

  const order = check(await db.from("order").insert({
    customer_id: customer.id,
    order_type: orderType,
    order_status: status,
    delivery_fee: 0,
    delivery_address: null,
    created_at: createdAt.toISOString(),
    completed_at: completedAt?.toISOString() ?? null,
    cancelled_at: cancelled ? new Date(createdAt.getTime() + 5 * 60000).toISOString() : null,
    cancellation_reason: cancelled ? pick(["Ordered the wrong items.", "Changed my mind.", "Store was about to close."]) : null,
    special_instructions: random() < 0.2 ? pick(["No onions please.", "Extra chili on the side.", "Please include utensils."]) : null,
  }).select("order_id").single(), "order");

  let subtotal = 0;
  for (const line of lines) {
    const unit = line.product.price + (line.addOn ? Number(line.addOn.price) : 0);
    const lineTotal = money(unit * line.quantity);
    subtotal += lineTotal;
    const item = check(await db.from("order_item").insert({
      order_id: order.order_id,
      product_id: line.product.product_id,
      quantity: line.quantity,
      subtotal: lineTotal,
      product_name: line.product.name,
      unit_price: unit,
    }).select("order_item_id").single(), "order item");
    if (line.addOn) {
      check(await db.from("order_item_add_on").insert({ order_item_id: item.order_item_id, addon_id: line.addOn.addon_id }), "order item add-on");
    }
  }

  const paid = status === "completed";
  const method = random() < 0.6 ? "pay_in_store" : "paymongo";
  check(await db.from("transaction").insert({
    order_id: order.order_id,
    payment_method: method,
    payment_status: cancelled ? (method === "paymongo" ? "refunded" : "failed") : paid ? "paid" : "pending",
    subtotal: money(subtotal),
    tax_amount: 0,
    discount_amount: 0,
    total_paid: paid ? money(subtotal) : 0,
    transaction_date: createdAt.toISOString(),
  }), "transaction");

  if (status === "completed" && random() < 0.55) {
    const rating = pick([5, 5, 5, 4, 4, 3]);
    check(await db.from("review").insert({
      customer_id: customer.id,
      order_id: order.order_id,
      rating,
      comment: pick(REVIEW_COMMENTS[rating]),
      created_at: new Date(completedAt.getTime() + between(10, 180) * 60000).toISOString(),
    }), "review");
    reviewCount += 1;
  }
  orderCount += 1;
}

// A month of history: 2–5 orders a day, during store hours (10:00–21:00).
for (let daysAgo = 30; daysAgo >= 1; daysAgo -= 1) {
  for (let i = 0, n = between(2, 5); i < n; i += 1) {
    const createdAt = new Date(now - daysAgo * 86400000);
    createdAt.setHours(between(10, 20), between(0, 59), 0, 0);
    await createOrder({
      customer: pick(customers),
      createdAt,
      status: random() < 0.08 ? "cancelled" : "completed",
      orderType: random() < 0.85 ? "take_out" : "dine_in",
    });
  }
}
// Today's live queue, so the KDS and orders screens have work on them.
for (const status of ["pending", "pending", "preparing", "preparing", "ready", "ready"]) {
  await createOrder({
    customer: pick(customers),
    createdAt: new Date(now - between(5, 50) * 60000),
    status,
    orderType: "take_out",
  });
}
console.log(`Orders: ${orderCount} (30 days of history + today's queue), ${reviewCount} reviews.`);

console.log(`
Demo sign-ins (password for all: ${DEMO_PASSWORD})
  Manager   ramon.tan@yangs.ph            → /employee/login
  Staff     grace.lim@yangs.ph            → /employee/login
  Customer  ${emailFor("Liza", "Reyes").padEnd(29)} → /login
`);
