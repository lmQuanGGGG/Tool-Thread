const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const email = 'lmquang.devops@gmail.com';
const sourcePosts = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'data_ready_to_post.json'), 'utf8'));
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  if (profileError) throw profileError;

  const updates = sourcePosts.map(post => ({
    post_id: `nick1-${post.post_id}`,
    image_file_ids: (post.content?.media || []).map(media => media.file_id).filter(Boolean),
  }));

  let updated = 0;
  for (const post of updates) {
    const { data, error } = await supabase
      .from('crawl_data')
      .update({ image_file_ids: post.image_file_ids })
      .eq('user_id', profile.id)
      .eq('post_id', post.post_id)
      .select('id');
    if (error) throw error;
    updated += data?.length || 0;
  }

  console.log(JSON.stringify({ updated, total_media: updates.reduce((sum, post) => sum + post.image_file_ids.length, 0) }));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
