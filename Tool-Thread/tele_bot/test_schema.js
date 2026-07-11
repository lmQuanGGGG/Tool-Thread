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
  const { data, error } = await supabase.from('usage_stats').select('*').limit(1);
  console.log(data);
}
run();
