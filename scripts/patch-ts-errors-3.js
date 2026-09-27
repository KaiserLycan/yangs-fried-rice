const fs = require('fs');

let ordersTs = fs.readFileSync('lib/actions/orders.ts', 'utf8');

// For Kds:
ordersTs = ordersTs.replace(
  /export async function getPaymentIssuesForKds\(\)[\s\S]*?return _fetchPaymentIssuesBase\(supabase\);/g,
  (match) => match.replace('return _fetchPaymentIssuesBase(supabase);', 'return _fetchPaymentIssuesBase(supabase, true);')
);

// For Admin:
ordersTs = ordersTs.replace(
  /export async function getPaymentIssuesForAdmin\(\)[\s\S]*?return _fetchPaymentIssuesBase\(supabase\);/g,
  (match) => match.replace('return _fetchPaymentIssuesBase(supabase);', 'return _fetchPaymentIssuesBase(supabase, false);')
);

// The `_fetchPaymentIssuesBase` inside itself... wait, it recursively calls itself?
ordersTs = ordersTs.replace(
  /async function _fetchPaymentIssuesBase\(supabase: ReturnType<typeof createClient>, isKds: boolean\): Promise<ActionResult<PaymentIssueOrder\[\]>> {[\s\S]*?return _fetchPaymentIssuesBase\(supabase\);/g,
  (match) => match.replace('return _fetchPaymentIssuesBase(supabase);', 'return _fetchPaymentIssuesBase(supabase, isKds);')
);

fs.writeFileSync('lib/actions/orders.ts', ordersTs);
