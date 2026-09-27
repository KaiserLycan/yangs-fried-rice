const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k) acc[k.trim()] = v.join('=').trim().replace(/(^"|"$)/g, '');
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: readyOrders } = await supabase.from('order').select(`
    *,
    customer:customer_id ( name, email, phone_number ),
    order_item ( 
      order_item_id, quantity, subtotal, special_instructions, product_name, unit_price,
      product ( product_name, product_price ),
      order_item_add_on ( add_on ( name, price ) )
    ),
    order_add_on ( price ),
    transaction ( transaction_id, payment_method, payment_status, total_paid )
  `).eq('order_status', 'ready');
  
  if (readyOrders && readyOrders.length > 0) {
    console.log("Found order!");
    console.log(JSON.stringify(readyOrders[0], null, 2));
  }
}
run();
