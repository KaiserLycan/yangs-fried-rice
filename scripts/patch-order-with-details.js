const fs = require('fs');
let c = fs.readFileSync('lib/actions/orders.ts', 'utf8');

c = c.replace(
  `type OrderWithDetails = Order & {`,
  `type OrderWithDetails = Order & { ready_at?: string | null;`
);

fs.writeFileSync('lib/actions/orders.ts', c);
