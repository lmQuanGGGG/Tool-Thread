const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const email = 'lmquang.devops@gmail.com';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  if (profileError) throw profileError;

  const { count: total, error: totalError } = await supabase
    .from('crawl_data')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id);
  if (totalError) throw totalError;

  const { count: kept, error: keptError } = await supabase
    .from('crawl_data')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', profile.id)
    .or('post_id.like.nick1-%,post_id.like.nick2-%');
  if (keptError) throw keptError;

  if (process.argv[2] !== '--delete') {
    console.log(JSON.stringify({ total, keep_nick_uyen: kept, would_delete: total - kept }));
    return;
  }

  const { error: deleteError } = await supabase
    .from('crawl_data')
    .delete()
    .eq('user_id', profile.id)
    .not('post_id', 'like', 'nick1-%')
    .not('post_id', 'like', 'nick2-%');
  if (deleteError) throw deleteError;

  console.log(JSON.stringify({ deleted: total - kept, remaining_nick_uyen: kept }));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
