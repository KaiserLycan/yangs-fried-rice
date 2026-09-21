import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const { data: customer } = await supabase.from('customer').select('id').limit(1).single();
  const { data: product } = await supabase.from('product').select('product_id').limit(1).single();
  
  if (!customer || !product) {
      console.log("No data"); return;
  }
  
  console.log("Inserting for customer", customer.id, "product", product.product_id);
  
  const { data, error } = await supabase.from('review').insert({
      customer_id: customer.id,
      product_id: product.product_id,
      rating: 5,
      comment: "Test direct review"
  }).select();
  
  console.log("Result:", data, "Error:", error);
}

run().catch(console.error);
