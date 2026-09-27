const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k) acc[k.trim()] = v.join('=').trim().replace(/(^"|"$)/g, '');
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const result = await supabase
    .from("order")
    .select(`
      *,
      customer:customer_id ( name, email, phone_number ),
      order_item ( 
        order_item_id, 
        quantity, 
        subtotal, 
        special_instructions,
        product_name,
        unit_price,
        product ( product_name, product_price ),
        order_item_add_on (
          order_item_add_on_id,
          add_on ( name, price )
        )
      ),
      order_add_on (
        order_add_on_id,
        price,
        addon_id,
        add_on ( name, price )
      ),
      transaction ( transaction_id, payment_method, payment_status, provider_reference_id, total_paid, subtotal, tax_amount )
    `)
    .in("order_status", ["ready"])
    .order("created_at", { ascending: false })
    .range(0, 99);
    
  console.log("Found:", result.data?.length);
  if (result.error) console.error(result.error);
}
run();
