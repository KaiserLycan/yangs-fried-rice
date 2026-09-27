const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('order').select('fulfillment_method');
  if (error) console.error(error);
  
  const counts = data.reduce((acc, row) => {
    acc[row.fulfillment_method] = (acc[row.fulfillment_method] || 0) + 1;
    return acc;
  }, {});
  console.log('Counts:', counts);
}
run();
