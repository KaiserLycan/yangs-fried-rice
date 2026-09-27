const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k) acc[k.trim()] = v.join('=').trim().replace(/(^"|"$)/g, '');
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: readyOrders } = await supabase.from('order').select('order_id, order_type, order_status, created_at, ready_at, transaction(payment_method)').eq('order_status', 'ready');
  console.log(JSON.stringify(readyOrders, null, 2));
}
run();
