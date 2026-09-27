const { createClient } = require('@supabase/supabase-js');
const url = "https://mnrrfhhqcmutiuljmalu.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ucnJmaGhxY211dGl1bGptYWx1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk1ODY3MSwiZXhwIjoyMTAyNTM0NjcxfQ.dCsodtKuMB4xjCZqeficLIbLiVTkWuJJEmzhqtNgJ9I";

const supabase = createClient(url, key);

async function check() {
  const { data: readyOrders } = await supabase
    .from('order')
    .select('order_id, created_at')
    .eq('order_status', 'ready');

  console.log(readyOrders);
}

check();
