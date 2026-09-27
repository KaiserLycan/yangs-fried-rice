const fs = require('fs');

let ordersTs = fs.readFileSync('lib/actions/orders.ts', 'utf8');

if (!ordersTs.includes('import { requireRole }')) {
  ordersTs = ordersTs.replace(
    `import { resolveEmployeeRole, canAccessManage, type EmployeeRole } from "@/lib/auth/roles";`,
    `import { resolveEmployeeRole, canAccessManage, type EmployeeRole } from "@/lib/auth/roles";\nimport { requireRole } from "@/lib/actions/admin";`
  );
}

ordersTs = ordersTs.replace(
  `return _fetchPaymentIssuesBase(supabase);
}

export async function getPaymentIssuesForAdmin(): Promise<ActionResult<PaymentIssueOrder[]>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };
  const supabase = createClient();
  return _fetchPaymentIssuesBase(supabase);
}`,
  `return _fetchPaymentIssuesBase(supabase, true);
}

export async function getPaymentIssuesForAdmin(): Promise<ActionResult<PaymentIssueOrder[]>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };
  const supabase = createClient();
  return _fetchPaymentIssuesBase(supabase, false);
}`
);

fs.writeFileSync('lib/actions/orders.ts', ordersTs);
