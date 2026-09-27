const fs = require('fs');
let c = fs.readFileSync('lib/actions/orders.ts', 'utf8');

c = c.replace(
  `async function _fetchPaymentIssuesBase(supabase: ReturnType<typeof createClient>): Promise<ActionResult<PaymentIssueOrder[]>> {`,
  `async function _fetchPaymentIssuesBase(supabase: ReturnType<typeof createClient>, isKds: boolean): Promise<ActionResult<PaymentIssueOrder[]>> {`
);

c = c.replace(
  `  const { data, error } = await supabase
    .from("order")
    .select(\`
      *,
      customer:customer_id ( name, email, phone_number ),
      order_item ( 
        order_item_id, 
        quantity, 
        subtotal, 
        product ( product_name, image_url ),
        order_item_add_on (
          order_item_add_on_id,
          add_on ( add_on_name, price )
        )
      ),
      transaction ( transaction_id, payment_method, payment_status, total_paid )
    \`)
    .order("created_at", { ascending: true });`,
  `  const selectQuery = isKds ? \`
      order_id, created_at, ready_at, order_status, order_type, special_instructions, fulfillment_method, delivery_fee, delivery_address,
      order_item ( 
        order_item_id, quantity, subtotal, special_instructions, product_name, unit_price,
        product ( product_name, product_price ),
        order_item_add_on ( add_on ( name, price ) )
      ),
      order_add_on ( price ),
      transaction ( payment_method, total_paid )
    \` : \`
      *,
      customer:customer_id ( name, email, phone_number ),
      order_item ( 
        order_item_id, quantity, subtotal, special_instructions, product_name, unit_price,
        product ( product_name, product_price, image_url ),
        order_item_add_on ( add_on ( name, price ) )
      ),
      order_add_on ( price ),
      transaction ( transaction_id, payment_method, payment_status, total_paid )
    \`;

  const { data, error } = await supabase
    .from("order")
    .select(selectQuery)
    .order("created_at", { ascending: true });`
);

c = c.replace(
  `  return _fetchPaymentIssuesBase(supabase);
}`,
  `  return _fetchPaymentIssuesBase(supabase, true);
}`
);

c = c.replace(
  `export async function getPaymentIssuesForAdmin(): Promise<ActionResult<PaymentIssueOrder[]>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };
  const supabase = createClient();
  return _fetchPaymentIssuesBase(supabase);
}`,
  `export async function getPaymentIssuesForAdmin(): Promise<ActionResult<PaymentIssueOrder[]>> {
  const auth = await requireRole("MANAGER");
  if (!auth.data) return { data: null, error: auth.error };
  const supabase = createClient();
  return _fetchPaymentIssuesBase(supabase, false);
}`
);

fs.writeFileSync('lib/actions/orders.ts', c);
