const fs = require('fs');
let c = fs.readFileSync('lib/actions/orders.ts', 'utf8');

c = c.replace(
  `const elapsedMins = (now - new Date(order.ready_at).getTime()) / 60000;`,
  `const elapsedMins = (now - new Date(order.ready_at!).getTime()) / 60000;`
);

fs.writeFileSync('lib/actions/orders.ts', c);
