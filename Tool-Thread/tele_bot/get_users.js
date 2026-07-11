require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { getAutoBotSettings, isAutoBotEnabled } = require('./auto_settings');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    // Trả về mảng chứa admin để bot vẫn chạy được bằng biến môi trường local nếu không có Supabase
    console.log(JSON.stringify(["admin@autofarm.com"]));
    process.exit(0);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Bước 1: Lấy danh sách các tier được phép chạy tự động
    const { data: autoTiers, error: tierError } = await supabase
      .from('tier_limits')
      .select('tier')
      .eq('auto_run', true);

    if (tierError) throw tierError;

    const autoTierNames = autoTiers.map(t => t.tier); // ['plus', 'pro', 'promax']

    // Bước 2: Lấy email các user thuộc các tier đó và đã cấu hình Cookie
    const { data, error } = await supabase
      .from('profiles')
      .select('email')
      .in('tier', autoTierNames)
      .not('fb_cookie', 'is', null)
      .not('fb_cookie', 'eq', '');

    if (error) throw error;

    let emails = data.map(row => row.email);
    const autoBotKey = process.env.AUTO_BOT_KEY;
    if (autoBotKey) {
      const settings = await getAutoBotSettings(supabase, emails);
      emails = emails.filter(email => isAutoBotEnabled(settings, email, autoBotKey));
    }
    const excludedEmails = new Set(
      (process.env.EXCLUDED_AUTO_RUN_EMAILS || '')
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean)
    );
    emails = emails.filter(email => !excludedEmails.has(email.toLowerCase()));
    
    // Nếu không có ai, trả về mảng có admin để chạy fallback
    if (emails.length === 0) {
      emails = ["admin@autofarm.com"];
    }

    // Output JSON string để Github Actions phân tách thành Matrix
    console.log(JSON.stringify(emails));
  } catch (error) {
    console.error(error);
    console.log(JSON.stringify(["admin@autofarm.com"]));
  }
}

main();
