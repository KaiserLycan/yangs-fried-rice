const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBackfill() {
  const { data, error, count } = await supabase
    .from('transaction')
    .select('transaction_id, total_paid, payment_method, order!inner(order_status)', { count: 'exact', head: true })
    .eq('order.order_status', 'completed')
    .eq('total_paid', 0)
    .in('payment_method', ['pay_in_store', 'pay-in-store', 'cash']);
  
  if (error) {
    console.error(error);
  } else {
    console.log(`Rows needing backfill: ${count}`);
  }
}

checkBackfill();
