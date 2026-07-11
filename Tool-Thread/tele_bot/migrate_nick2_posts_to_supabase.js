const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const email = 'lmquang.devops@gmail.com';
const posts = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'drama_ready_to_post.json'), 'utf8'));
const state = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'account_state_2.json'), 'utf8'));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  if (profileError) throw profileError;

  const postedIds = new Set(state.posts_done || []);
  const records = posts
    .filter(post => !postedIds.has(post.post_id))
    .map(post => ({
      user_id: profile.id,
      post_id: `nick2-${post.post_id}`,
      source_url: post.post_url || null,
      text_content: post.content?.text || '',
      image_urls: (post.content?.media || []).map(media => media.url).filter(Boolean),
      image_file_ids: (post.content?.media || []).map(media => media.file_id).filter(Boolean),
      posted: false,
    }));

  const ids = records.map(record => record.post_id);
  const { data: existing, error: existingError } = await supabase
    .from('crawl_data')
    .select('post_id')
    .eq('user_id', profile.id)
    .in('post_id', ids);
  if (existingError) throw existingError;

  const existingIds = new Set((existing || []).map(record => record.post_id));
  const newRecords = records.filter(record => !existingIds.has(record.post_id));
  for (let index = 0; index < newRecords.length; index += 100) {
    const { error } = await supabase.from('crawl_data').insert(newRecords.slice(index, index + 100));
    if (error) throw error;
  }

  console.log(JSON.stringify({
    source_posts: posts.length,
    skipped_previously_posted: postedIds.size,
    imported: newRecords.length,
    already_in_supabase: existingIds.size,
  }));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
