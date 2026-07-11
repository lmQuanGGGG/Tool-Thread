const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const limits = { free: 4, lite: 8, plus: 20, pro: 100 };
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  for (const [tier, max_links] of Object.entries(limits)) {
    const { error } = await supabase.from('tier_limits').update({ max_links }).eq('tier', tier);
    if (error) throw error;
  }
  console.log(JSON.stringify(limits));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
