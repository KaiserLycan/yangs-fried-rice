const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  // Get Yang Special Fried Rice
  const { data: product1 } = await supabase.from('product').select('product_id').ilike('product_name', '%Yang Special%').limit(1).single();
  const { data: product2 } = await supabase.from('product').select('product_id').ilike('product_name', '%Haloo%').limit(1).single();
  
  // Create a fake customer
  const customerId = '00000000-0000-0000-0000-000000000000'; // Or just grab any existing customer
  const { data: customer } = await supabase.from('customer').select('customer_id').limit(1).single();
  const cid = customer ? customer.customer_id : null;
  
  if (!cid) {
    console.log("No customers found");
    return;
  }
  
  // Fake order id
  const { data: order } = await supabase.from('order').select('order_id').eq('customer_id', cid).limit(1).single();
  if (!order) {
    console.log("No order found for this customer; place one first (review.order_id references order).");
    return;
  }
  const oid = order.order_id;

  if (product1) {
    const { error } = await supabase.from('review').insert({
      customer_id: cid,
      order_id: oid,
      product_id: product1.product_id,
      rating: 5,
      comment: "Absolutely delicious! The best fried rice."
    }).select().maybeSingle();
    if (error) { console.error("Insert failed for product 1:", error); return; }
    console.log("Seeded review for product 1");
  }

  if (product2) {
    const { error } = await supabase.from('review').insert({
      customer_id: cid,
      order_id: oid,
      product_id: product2.product_id,
      rating: 4,
      comment: "Very good dessert, but a bit too sweet."
    }).select().maybeSingle();
    if (error) { console.error("Insert failed for product 2:", error); return; }
    console.log("Seeded review for product 2");
  }
}

run().catch(console.error);
