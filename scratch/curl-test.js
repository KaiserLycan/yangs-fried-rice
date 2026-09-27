const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k) acc[k.trim()] = v.join('=').trim().replace(/(^"|"$)/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'staff@test.local',
    password: 'Password123!'
  });
  if (error) {
    console.error("Login failed:", error);
    return;
  }
  
  const token = data.session.access_token;
  console.log("Got token. Running curl...");
  
  const { execSync } = require('child_process');
  try {
    const res = execSync(`curl -s -X POST ${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_customer_stats -H "apikey: ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}" -H "Authorization: Bearer ${token}"`);
    console.log(res.toString());
  } catch(e) {
    console.error(e.stderr?.toString() || e);
  }
}
run();
