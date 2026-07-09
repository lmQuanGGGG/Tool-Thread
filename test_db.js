require('dotenv').config({ path: 'Tool Thread/tele_bot/.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data, error } = await supabase.from('usage_stats').select('threads_posts_count').limit(1);
  if (error) {
    console.log("ERROR:", error.message);
  } else {
    console.log("EXISTS!", data);
  }
}
test();
