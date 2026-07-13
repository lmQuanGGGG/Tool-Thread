const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const EMAIL = 'lmquang.devops@gmail.com';
const SOURCES = [
  { prefix: 'nick1', file: 'data_ready_to_post.json' },
  { prefix: 'nick2', file: 'drama_ready_to_post.json' },
];
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function metrics(post) {
  const likes = post.stats?.likes || 0;
  const replies = post.stats?.replies || 0;
  const reposts = post.stats?.reposts || 0;
  const quotes = post.stats?.quotes || 0;
  return {
    source_published_at: post.timestamp ? new Date(post.timestamp * 1000).toISOString() : null,
    source_likes: likes,
    source_replies: replies,
    source_reposts: reposts,
    source_quotes: quotes,
    source_engagement: likes + replies + reposts + quotes,
  };
}

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('id').eq('email', EMAIL).single();
  if (profileError) throw profileError;

  let updated = 0;
  let matched = 0;
  for (const source of SOURCES) {
    const posts = JSON.parse(fs.readFileSync(path.resolve(__dirname, source.file), 'utf8'));
    for (const post of posts) {
      const { data, error } = await supabase.from('crawl_data')
        .update(metrics(post))
        .eq('user_id', profile.id)
        .eq('post_id', `${source.prefix}-${post.post_id}`)
        .select('id');
      if (error) throw error;
      matched += data?.length || 0;
      updated += data?.length || 0;
    }
  }
  console.log(JSON.stringify({ email: EMAIL, matched, updated }));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
