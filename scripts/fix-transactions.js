const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching orders...');
  const { data: allOrders, error: err1 } = await supabase
    .from('order')
    .select(`
      order_id, 
      order_status, 
      delivery_fee,
      transaction ( transaction_id, total_paid, payment_status ),
      order_item ( 
        order_item_id,
        subtotal, 
        quantity,
        product ( product_price ),
        order_item_add_on ( add_on ( price ) )
      )
    `);

  if (err1) {
    console.error('Error fetching orders:', err1);
    return;
  }

  // Fetch order_add_ons separately to avoid relation errors
  const { data: allOrderAddOns } = await supabase.from('order_add_on').select('*');

  const missing = allOrders.filter(o => !o.transaction || (Array.isArray(o.transaction) && o.transaction.length === 0));
  console.log(`Found ${missing.length} orders missing transactions.`);

  let insertedCount = 0;

  for (const order of missing) {
    let subtotal = 0;
    
    // Calculate from order_items
    for (const item of (order.order_item || [])) {
      subtotal += item.subtotal || 0;
      for (const ioa of (item.order_item_add_on || [])) {
        subtotal += (ioa.add_on?.price || 0);
      }
    }

    // Calculate from order_add_ons
    const orderAddOns = (allOrderAddOns || []).filter(oa => oa.order_id === order.order_id);
    for (const oa of orderAddOns) {
      subtotal += (oa.price || 0);
    }

    subtotal += (order.delivery_fee || 0);

    const paymentStatus = order.order_status === 'completed' ? 'paid' : 'pending';
    const totalPaid = order.order_status === 'completed' ? subtotal : 0;

    const transactionToInsert = {
      transaction_id: crypto.randomUUID(),
      order_id: order.order_id,
      payment_method: 'cash_on_delivery',
      payment_status: paymentStatus,
      subtotal: subtotal,
      tax_amount: 0,
      discount_amount: 0,
      total_paid: totalPaid,
      transaction_date: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase.from('transaction').insert(transactionToInsert);
    if (insertErr) {
      console.error(`Error inserting transaction for order ${order.order_id}:`, insertErr);
    } else {
      insertedCount++;
    }
  }

  console.log(`Successfully inserted ${insertedCount} missing transactions.`);

  const zeroTx = allOrders.filter(o => o.transaction && o.transaction[0] && o.transaction[0].total_paid === 0);
  
  let updatedCount = 0;
  for (const order of zeroTx) {
    let subtotal = 0;
    for (const item of (order.order_item || [])) {
      subtotal += item.subtotal || 0;
      for (const ioa of (item.order_item_add_on || [])) {
        subtotal += (ioa.add_on?.price || 0);
      }
    }
    const orderAddOns = (allOrderAddOns || []).filter(oa => oa.order_id === order.order_id);
    for (const oa of orderAddOns) {
      subtotal += (oa.price || 0);
    }
    subtotal += (order.delivery_fee || 0);

    const txId = order.transaction[0].transaction_id;
    const { error: updateErr } = await supabase
      .from('transaction')
      .update({ total_paid: subtotal, subtotal: subtotal })
      .eq('transaction_id', txId);
      
    if (updateErr) {
      console.error(`Error updating transaction ${txId}:`, updateErr);
    } else {
      updatedCount++;
    }
  }
  
  console.log(`Successfully updated ${updatedCount} 0php transactions.`);
}

run();
