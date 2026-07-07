require('dotenv').config({ path: '/Users/wang04/Documents/Crawl Thread/Tool Thread/web-saas/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function upgradeToPromax() {
  console.log("Đang nâng cấp tất cả tài khoản lên Promax và cộng 10,000 credits...");
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
        tier: 'promax',
        credits: 10000
    })
    .neq('tier', 'promax_dummy_condition') // Update all rows
    .select();

  if (error) {
    console.error("Lỗi:", error.message);
  } else {
    console.log(`✅ Nâng cấp thành công ${data.length} tài khoản!`);
  }
}

upgradeToPromax();
