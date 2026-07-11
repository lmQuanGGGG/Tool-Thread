const { execSync } = require('child_process');
execSync('npm i ws', { stdio: 'inherit' });
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});
async function run() {
  const { error } = await supabase.rpc('run_sql', { query: 'ALTER TABLE usage_stats ADD COLUMN IF NOT EXISTS crawls_count int4 DEFAULT 0;' });
  console.log('Result rpc run_sql:', error ? error.message : 'Success');
  
  // Update crawls_count to 1 for today for the user if they clicked it earlier!
  const date = new Date().toLocaleDateString('en-CA');
  const { error: updErr } = await supabase.from('usage_stats').update({ crawls_count: 1 }).eq('date', date);
  console.log('Result update:', updErr ? updErr.message : 'Success');
}
run();
