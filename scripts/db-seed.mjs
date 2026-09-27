#!/usr/bin/env node
// ============================================================================
// Demo data seed — a realistic menu, staff, customers and a month of pickup
// orders with payments, status timelines and ratings, so every screen (menu,
// KDS, dashboard, reports, order history) has something believable on it
// during testing. The shop is pickup-only (issue #114).
//
//   npm run db:seed              add the demo data (refuses if already there)
//   npm run db:seed -- --reset   remove the previous demo data first, then add
//
// Every value passes the field rules in lib/validation/fields.ts and the
// CHECK constraints: split first/last names, +63 mobile numbers, take-out
// orders, and the payment vocabulary (pay_in_store, gcash, paymaya).
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
  { first: "Ramon", last: "Tan", email: "ramon.tan@yangs.ph", role: "MANAGER", shift: "Mon-Fri – 8-4PM", phone: "+639171110001" },
  { first: "Grace", last: "Lim", email: "grace.lim@yangs.ph", role: "STAFF", shift: "MWF – 12-3PM", phone: "+639171110002" },
  { first: "Paolo", last: "Dizon", email: "paolo.dizon@yangs.ph", role: "STAFF", shift: "TThS – 9-5PM", phone: "+639171110003" },
  { first: "Anna Mae", last: "Santos", email: "annamae.santos@yangs.ph", role: "STAFF", shift: "Weekends – 10-10PM", phone: "+639171110004" },
];

const CUSTOMERS = [
  ["Liza", "Reyes"],
  ["Carlo", "Mendoza"],
  ["Bea", "Santos"],
  ["Miguel", "Garcia"],
  ["Andrea", "Villanueva"],
  ["Joshua", "Ramos"],
  ["Kristine", "Aquino"],
  ["Paolo", "Fernandez"],
  ["Camille", "dela Cruz"],
  ["Rafael", "Lim"],
  ["Nicole", "Tan"],
  ["Enrico", "Bautista"],
  ["Sofia", "Navarro"],
  ["Gabriel", "Castillo"],
  ["Isabel", "Ocampo"],
];

const REVIEW_COMMENTS = {
  5: ["Hot and fast — the Yang Chow is still the best in the city.", "Staff were friendly and the food was piping hot.", "Perfect as always. The siomai never misses!", "Generous servings, will order again."],
  4: ["Really good, just a little late tonight.", "Tasty fried rice, wish there was a bit more shrimp.", "Solid order, packaging kept everything warm."],
  3: ["Food was fine but a bit lukewarm by the time I got home.", "Okay overall — the noodles were a bit soggy."],
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
  }), `employee ${e.email}`);
}
console.log(`Employees: ${EMPLOYEES.length}.`);

// ---- customers ---------------------------------------------------------------
const customers = []; // { id }
for (const [index, [first, last]] of CUSTOMERS.entries()) {
  const email = emailFor(first, last);
  const id = await createAuthUser(email, `${first} ${last}`);
  const phone = `+63917${String(2200000 + index * 7919).padStart(7, "0")}`;
  check(await db.from("customer").insert({
    customer_id: id,
    first_name: first,
    last_name: last,
    email,
    phone_number: phone,
  }), `customer ${email}`);
  customers.push({ id });
}
console.log(`Customers: ${customers.length}.`);

// ---- orders ------------------------------------------------------------------
const now = Date.now();
let orderCount = 0;
let reviewCount = 0;

const minutes = (date, n) => new Date(date.getTime() + n * 60000);

/**
 * One order, written the way the app would have left it: status timeline in
 * `order_status_log`, the ready-by promise and when it was actually ready,
 * a payment row in the current vocabulary, and sometimes a rating.
 */
async function createOrder({ customer, createdAt, status, noShow = false }) {
  const lines = [];
  for (let i = 0, n = between(1, 4); i < n; i += 1) {
    const product = pick(products);
    const quantity = between(1, 3);
    const addOn = product.addOns.length && random() < 0.35 ? pick(product.addOns) : null;
    lines.push({ product, quantity, addOn });
  }

  // Accepted a few minutes in; ready around the promise (some late, so the
  // on-time report has something to say); collected soon after.
  const promisedAt = minutes(createdAt, between(15, 25));
  const acceptedAt = minutes(createdAt, between(1, 5));
  const readyAt = minutes(promisedAt, pick([-6, -4, -3, -2, -1, 0, 0, 2, 5, 9]));
  const completedAt = minutes(readyAt, between(3, 20));
  const cancelled = status === "cancelled";
  const cancelledAt = noShow ? minutes(readyAt, 95) : minutes(createdAt, between(2, 8));
  const reached = { pending: 0, preparing: 1, ready: 2, completed: 3, cancelled: noShow ? 2 : 0 }[status];

  const method = random() < 0.55 ? "pay_in_store" : random() < 0.55 ? "gcash" : "paymaya";
  const order = check(await db.from("order").insert({
    customer_id: customer.id,
    order_type: "take_out",
    order_status: status,
    fulfillment_method: random() < 0.1 ? "3rd_party_courier" : "self_pickup",
    delivery_fee: 0,
    created_at: createdAt.toISOString(),
    pending_at: createdAt.toISOString(),
    promised_at: promisedAt.toISOString(),
    ready_at: reached >= 2 ? readyAt.toISOString() : null,
    completed_at: status === "completed" ? completedAt.toISOString() : null,
    cancelled_at: cancelled ? cancelledAt.toISOString() : null,
    cancellation_reason: !cancelled
      ? null
      : noShow
        ? "Customer did not pick up the order."
        : pick(["Ordered the wrong items.", "Changed my mind.", "Out of stock"]),
    no_show_reason: noShow ? "no_show" : null,
    special_instructions: random() < 0.2 ? pick(["No onions please.", "Extra chili on the side.", "Please include utensils."]) : null,
  }).select("order_id").single(), "order");

  // The insert trigger logged one row stamped now(); replace it with the
  // order's real path so the tracking timeline and history read true.
  check(await db.from("order_status_log").delete().eq("order_id", order.order_id), "clear seeded status log");
  const path = [{ to: "pending", at: createdAt }];
  if (reached >= 1) path.push({ to: "preparing", at: acceptedAt });
  if (reached >= 2) path.push({ to: "ready", at: readyAt });
  if (status === "completed") path.push({ to: "completed", at: completedAt });
  if (cancelled) path.push({ to: "cancelled", at: cancelledAt });
  check(await db.from("order_status_log").insert(
    path.map((step, i) => ({
      order_id: order.order_id,
      from_status: i === 0 ? null : path[i - 1].to,
      to_status: step.to,
      changed_at: step.at.toISOString(),
    })),
  ), "status log");

  let subtotal = 0;
  const dishes = new Map();
  for (const line of lines) {
    const unit = line.product.price + (line.addOn ? Number(line.addOn.price) : 0);
    const lineTotal = money(unit * line.quantity);
    subtotal += lineTotal;
    dishes.set(line.product.product_id, line.product);
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

  // Wallet orders are paid before the kitchen sees them; cash is settled at
  // pickup. A cancelled wallet order was refunded; cancelled cash never paid.
  const tip = status === "completed" && random() < 0.2 ? pick([10, 20, 50]) : 0;
  const wallet = method !== "pay_in_store";
  const paid = status === "completed" || (wallet && !cancelled);
  check(await db.from("transaction").insert({
    order_id: order.order_id,
    payment_method: method,
    payment_status: cancelled ? (wallet ? "refunded" : "failed") : paid ? "paid" : "pending",
    subtotal: money(subtotal),
    tax_amount: money((subtotal * 12) / 112),
    discount_amount: 0,
    tip_amount: tip,
    total_paid: paid ? money(subtotal + tip) : 0,
    transaction_date: createdAt.toISOString(),
    refunded_at: cancelled && wallet ? minutes(cancelledAt, 5).toISOString() : null,
  }), "transaction");

  if (status === "completed" && random() < 0.55) {
    const rating = pick([5, 5, 5, 4, 4, 3]);
    const reviewedAt = minutes(completedAt, between(10, 180)).toISOString();
    check(await db.from("review").insert({
      customer_id: customer.id,
      order_id: order.order_id,
      rating,
      service_rating: random() < 0.8 ? Math.max(1, Math.min(5, rating + pick([-1, 0, 0, 1]))) : null,
      comment: pick(REVIEW_COMMENTS[rating]),
      created_at: reviewedAt,
    }), "review");
    // Some rate each dish too (FINALE 2.3).
    if (random() < 0.4) {
      for (const product of dishes.values()) {
        check(await db.from("review").insert({
          customer_id: customer.id,
          order_id: order.order_id,
          product_id: product.product_id,
          rating: Math.max(1, Math.min(5, rating + pick([-1, 0, 0, 0, 1]))),
          created_at: reviewedAt,
        }), "dish review");
      }
    }
    reviewCount += 1;
  }
  orderCount += 1;
}

// A month of history: 2–5 orders a day, inside store hours (08:00–18:00).
for (let daysAgo = 30; daysAgo >= 1; daysAgo -= 1) {
  for (let i = 0, n = between(2, 5); i < n; i += 1) {
    const createdAt = new Date(now - daysAgo * 86400000);
    createdAt.setHours(between(8, 16), between(0, 59), 0, 0);
    const roll = random();
    await createOrder({
      customer: pick(customers),
      createdAt,
      status: roll < 0.08 ? "cancelled" : "completed",
      noShow: roll < 0.015,
    });
  }
}
// Today's live queue, so the KDS and orders screens have work on them.
for (const status of ["pending", "pending", "preparing", "preparing", "ready", "ready"]) {
  await createOrder({
    customer: pick(customers),
    createdAt: new Date(now - between(5, 50) * 60000),
    status,
  });
}
console.log(`Orders: ${orderCount} (30 days of history + today's queue), ${reviewCount} reviews.`);

console.log(`
Demo sign-ins (password for all: ${DEMO_PASSWORD})
  Manager   ramon.tan@yangs.ph            → /employee/login
  Staff     grace.lim@yangs.ph            → /employee/login
  Customer  ${emailFor("Liza", "Reyes").padEnd(29)} → /login
`);
