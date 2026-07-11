const { execSync } = require('child_process');
execSync('npm i ws', { stdio: 'inherit' });
require('dotenv').config({ path: '../web-saas/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});
async function run() {
  const date = new Date().toLocaleDateString('en-CA');
  const { data: users, error: uErr } = await supabase.from('profiles').select('id').limit(1);
  if (users && users.length > 0) {
    const userId = users[0].id;
    const { error: updErr } = await supabase.from('usage_stats').update({ crawls_count: 1 }).eq('user_id', userId).eq('date', date);
    console.log('Result update:', updErr ? updErr.message : 'Success');
  } else {
    console.log('No users found');
  }
}
run();
