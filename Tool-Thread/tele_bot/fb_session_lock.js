const { createClient } = require('@supabase/supabase-js');

const [action, email, holder] = process.argv.slice(2);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

if (!action || !email || !holder || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Usage: node fb_session_lock.js <acquire|release> <email> <holder>');
  process.exit(1);
}

async function run() {
  if (action === 'release') {
    const { error } = await supabase.rpc('release_fb_session_lock', { p_email: email, p_holder: holder });
    if (error) throw error;
    console.log(`Released Facebook session lock for ${email}`);
    return;
  }

  if (action !== 'acquire') throw new Error(`Unknown action: ${action}`);
  const deadline = Date.now() + 90 * 60 * 1000;
  while (Date.now() < deadline) {
    const { data, error } = await supabase.rpc('acquire_fb_session_lock', {
      p_email: email,
      p_holder: holder,
      p_ttl_seconds: 7200,
    });
    if (error) throw error;
    if (data) {
      console.log(`Acquired Facebook session lock for ${email}`);
      return;
    }
    console.log(`Facebook session busy for ${email}; retrying in 30 seconds...`);
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  throw new Error(`Timed out waiting for Facebook session lock: ${email}`);
}

run().catch(error => {
  console.error(error.message || error);
  process.exit(1);
});
