const fs = require('fs');

let ordersTs = fs.readFileSync('lib/actions/orders.ts', 'utf8');

if (!ordersTs.includes('requireRole')) {
  ordersTs = ordersTs.replace(
    `import { resolveEmployeeRole, canAccessManage, type EmployeeRole } from "@/lib/auth/roles";`,
    `import { resolveEmployeeRole, canAccessManage, type EmployeeRole } from "@/lib/auth/roles";\nimport { requireRole } from "@/lib/actions/admin";`
  );
}

// Fix Date issues:
ordersTs = ordersTs.replace(
  `const elapsedMins = (now - new Date(order.created_at).getTime()) / 60000;`,
  `const elapsedMins = (now - new Date(order.created_at as string).getTime()) / 60000;`
);

ordersTs = ordersTs.replace(
  `const elapsedMins = (now - new Date(order.ready_at!).getTime()) / 60000;`,
  `const elapsedMins = (now - new Date(order.ready_at as string).getTime()) / 60000;`
);

fs.writeFileSync('lib/actions/orders.ts', ordersTs);
