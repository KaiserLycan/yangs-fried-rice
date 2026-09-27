const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k) acc[k.trim()] = v.join('=').trim().replace(/(^"|"$)/g, '');
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Create a dummy staff user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: 'temp_staff2@test.local',
    password: 'Password123!',
    email_confirm: true
  });
  
  if (authErr) {
    console.error("Create user failed:", authErr);
  }
  
  const userId = authData?.user?.id;
  
  if (userId) {
    // Insert into employee table as STAFF
    await supabase.from('employee').insert({
      employee_id: userId,
      email: 'temp_staff2@test.local',
      role: 'STAFF',
      first_name: 'Test',
      last_name: 'Staff'
    });
  }
  
  // Now sign in
  const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data, error } = await anonClient.auth.signInWithPassword({
    email: 'temp_staff2@test.local',
    password: 'Password123!'
  });
  
  if (error) {
    console.error("Login failed:", error);
    return;
  }
  
  const token = data.session.access_token;
  
  const { execSync } = require('child_process');
  try {
    const res = execSync(`curl -s -X POST ${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/get_customer_stats -H "apikey: ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}" -H "Authorization: Bearer ${token}"`);
    console.log("CURL output:");
    console.log(res.toString());
  } catch(e) {
    console.error(e.stderr?.toString() || e);
  }
}
run();
