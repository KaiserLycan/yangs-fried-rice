const fs = require('fs');

let validationTs = fs.readFileSync('lib/validation/orders.ts', 'utf8');

if (!validationTs.includes('customer_id: z.string().optional()')) {
  validationTs = validationTs.replace(
    `customer_name: z.string().optional(),`,
    `customer_name: z.string().optional(),\n  customer_id: z.string().optional(),`
  );
  fs.writeFileSync('lib/validation/orders.ts', validationTs);
}
