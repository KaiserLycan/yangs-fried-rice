const fs = require('fs');
let c = fs.readFileSync('lib/actions/orders.ts', 'utf8');

c = c.replace(
  `if (order.order_status === "ready" && order.order_type === "take_out" && isCash && order.ready_at) {`,
  `if (order.order_status === "ready" && (order.order_type === "take_out" || order.order_type === "pickup") && isCash && order.ready_at) {`
);

fs.writeFileSync('lib/actions/orders.ts', c);
