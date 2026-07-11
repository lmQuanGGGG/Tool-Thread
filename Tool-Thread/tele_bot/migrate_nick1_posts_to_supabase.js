const fs = require('fs');
const path = require('path');
global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const TARGET_EMAIL = 'lmquang.devops@gmail.com';
const sourcePath = path.resolve(__dirname, 'data_ready_to_post.json');
const statePath = path.resolve(__dirname, 'account_state_1.json');
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function chunk(items, size) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );
}

async function main() {
  const posts = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const previouslyPosted = new Set(state.posts_done || []);

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, tier')
    .eq('email', TARGET_EMAIL)
    .single();
  if (profileError || !profile) throw new Error(`Không tìm thấy profile: ${profileError?.message || TARGET_EMAIL}`);

  const { error: tierError } = await supabase
    .from('profiles')
    .update({ tier: 'pro' })
    .eq('id', profile.id);
  if (tierError) throw new Error(`Không thể đổi gói Pro: ${tierError.message}`);

  const records = posts
    .filter(post => !previouslyPosted.has(post.post_id))
    .map(post => ({
      user_id: profile.id,
      post_id: `nick1-${post.post_id}`,
      source_url: post.post_url || null,
      text_content: post.content?.text || '',
      image_urls: (post.content?.media || [])
        .map(media => typeof media === 'string' ? media : media?.url)
        .filter(Boolean),
      image_file_ids: (post.content?.media || []).map(media => media.file_id).filter(Boolean),
      posted: false,
    }));

  const recordIds = records.map(record => record.post_id);
  const { data: existing, error: existingError } = await supabase
    .from('crawl_data')
    .select('post_id')
    .eq('user_id', profile.id)
    .in('post_id', recordIds);
  if (existingError) throw new Error(`Không thể kiểm tra bài trùng: ${existingError.message}`);

  const existingIds = new Set((existing || []).map(record => record.post_id));
  const newRecords = records.filter(record => !existingIds.has(record.post_id));
  for (const batch of chunk(newRecords, 100)) {
    const { error } = await supabase.from('crawl_data').insert(batch);
    if (error) throw new Error(`Không thể import bài: ${error.message}`);
  }

  console.log(JSON.stringify({
    email: TARGET_EMAIL,
    tier: 'pro',
    source_posts: posts.length,
    skipped_previously_posted: previouslyPosted.size,
    imported: newRecords.length,
    already_in_supabase: existingIds.size,
  }));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
