import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: product1 } = await supabase.from('product').select('product_id').ilike('product_name', '%Yang Special%').limit(1).single();
  const { data: product2 } = await supabase.from('product').select('product_id').ilike('product_name', '%Haloo%').limit(1).single();
  
  const { data: customer } = await supabase.from('customer').select('id').limit(1).single();
  const cid = customer ? customer.id : null;
  
  if (!cid) {
    console.log("No customers found");
    return;
  }
  
  const { data: order } = await supabase.from('order').select('order_id').eq('customer_id', cid).limit(1).single();
  const oid = order ? order.order_id : '00000000-0000-0000-0000-000000000000';

  if (product1) {
    await supabase.from('review').insert({
      customer_id: cid,
      order_id: oid,
      product_id: product1.product_id,
      rating: 5,
      comment: "Absolutely delicious! The best fried rice."
    });
    console.log("Seeded review for product 1");
  }

  if (product2) {
    await supabase.from('review').insert({
      customer_id: cid,
      order_id: oid,
      product_id: product2.product_id,
      rating: 4,
      comment: "Very good dessert, but a bit too sweet."
    });
    console.log("Seeded review for product 2");
  }
}

run().catch(console.error);
