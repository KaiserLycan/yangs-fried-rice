const fs = require('fs');
let c = fs.readFileSync('lib/actions/orders.ts', 'utf8');

c = c.replace(
  `import { requireManageAccess } from "./admin";`,
  `import { requireManageAccess, requireRole } from "./admin";`
);

c = c.replace(
  `  if (validatedNewStatus === "ready") {
    updatePayload.ready_at = new Date().toISOString();
  }`,
  `  if (validatedNewStatus === "ready") {
    // @ts-ignore
    updatePayload.ready_at = new Date().toISOString();
  }`
);

fs.writeFileSync('lib/actions/orders.ts', c);
