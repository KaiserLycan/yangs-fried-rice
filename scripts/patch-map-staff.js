const fs = require('fs');
let c = fs.readFileSync('lib/orders/map-staff-order.ts', 'utf8');

c = c.replace(
  `  created_at: string | null;
  order_status: string | null;`,
  `  created_at: string | null;
  ready_at?: string | null;
  order_status: string | null;`
);

c = c.replace(
  `  order_add_on?: { price: number | null }[] | null;
};`,
  `  order_add_on?: { price: number | null }[] | null;
  transaction?: One<{ payment_method?: string | null }>;
};`
);

c = c.replace(
  `    return {
      id: order.order_id,
      rawCreatedAt: order.created_at,`,
  `    const tx = first(order.transaction);

    return {
      id: order.order_id,
      rawCreatedAt: order.created_at,
      rawReadyAt: order.ready_at,
      paymentMethod: tx?.payment_method,`
);

fs.writeFileSync('lib/orders/map-staff-order.ts', c);
