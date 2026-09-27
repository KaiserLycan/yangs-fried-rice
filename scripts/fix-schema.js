const fs = require('fs');
let c = fs.readFileSync('lib/validation/orders.ts', 'utf8');
c = c.replace(
  /export const orderFilterSchema = z\.object\(\{[\s\S]*?offset: z\.coerce\.number\(\)\.int\(\)\.min\(0\)\.default\(0\),\r?\n\}\);/,
  `export const orderFilterSchema = z.object({
  status: z
    .union([orderStatusSchema, z.array(orderStatusSchema)])
    .optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  search: z.string().max(40).optional(),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  payment_method: z.string().optional(),
  include_unpaid: z.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});`
);
fs.writeFileSync('lib/validation/orders.ts', c);
