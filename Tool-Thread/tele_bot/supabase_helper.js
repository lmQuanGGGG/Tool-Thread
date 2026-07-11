require('dotenv').config();
global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

// Ngoại lệ quota theo từng tài khoản, dùng khi cần điều chỉnh mà không làm đổi gói chung.
const USER_QUOTA_OVERRIDES = {
  'lmquang.devops@gmail.com': { reels_per_day: 8 },
};

const supabaseUrl = process.env.SUPABASE_URL;
// BẮT BUỘC dùng Service Role Key để bypass RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("!!! Chưa cấu hình SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY. Fallback về .env local.");
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Parse cookie string thô (c_user=xxx; xs=yyy) → Puppeteer cookie array.
 * Cũng xử lý luôn trường hợp đã là JSON array (legacy format).
 */
function parseCookieString(cookieStr, domain = '.facebook.com') {
  if (!cookieStr) return [];

  // Thử JSON array trước (legacy: export từ browser extension)
  try {
    const parsed = JSON.parse(cookieStr);
    if (Array.isArray(parsed)) {
      return parsed.map(c => {
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        delete c.storeId; delete c.id; delete c.hostOnly; delete c.session;
        return c;
      });
    }
  } catch (_) { /* không phải JSON, tiếp tục parse string */ }

  // Parse cookie string thô: "c_user=123; xs=abc; datr=xyz"
  return cookieStr.split(';').map(pair => {
    const [name, ...rest] = pair.trim().split('=');
    return {
      name: name.trim(),
      value: rest.join('=').trim(),
      domain,
      path: '/',
      secure: true,
      httpOnly: false,
      sameSite: 'None',
    };
  }).filter(c => c.name && c.value);
}

/**
 * Lấy tier limits từ DB với fallback hardcode.
 */
async function getTierLimits(tier = 'free') {
  const defaults = {
    free:   { auto_run: false, reels_per_day: 2,  threads_per_day: 10,  fb_post_per_day: 1,  crawl_per_day: 1,  max_links: 4  },
    lite:   { auto_run: false, reels_per_day: 3,  threads_per_day: 30,  fb_post_per_day: 3,  crawl_per_day: 2,  max_links: 8  },
    plus:   { auto_run: true,  reels_per_day: 6,  threads_per_day: 80,  fb_post_per_day: 5,  crawl_per_day: 3,  max_links: 20 },
    pro:    { auto_run: true,  reels_per_day: 12, threads_per_day: 160, fb_post_per_day: 10, crawl_per_day: 4,  max_links: 100 },
    promax: { auto_run: true,  reels_per_day: -1, threads_per_day: -1,  fb_post_per_day: -1, crawl_per_day: -1,  max_links: -1 },
  };

  if (!supabase) return defaults[tier] || defaults.free;

  try {
    const { data, error } = await supabase.from('tier_limits').select('*').eq('tier', tier).single();
    if (error || !data) return defaults[tier] || defaults.free;
    return data;
  } catch {
    return defaults[tier] || defaults.free;
  }
}

/**
 * Kéo toàn bộ config của user từ Supabase dựa theo email.
 * Trả về object: { fb_cookie, threads_cookie, affiliate_links, tele_chat_id, tier, ... }
 * Đồng thời parse cookie sang array Puppeteer-ready ngay tại đây.
 */
async function fetchBotConfig(email = process.env.USER_EMAIL || 'admin@autofarm.com') {
  // Fallback: không có Supabase → đọc từ .env (cho local dev)
  if (!supabase) {
    console.log("!!! Không có Supabase. Chạy bằng .env local...");
    return {
      fb_cookie:         process.env.FB_COOKIE || '',
      threads_cookie:    process.env.THREADS_COOKIE || '',
      affiliate_links:   process.env.SHOPEE_AFF_LINK || '',
      tele_chat_id:      process.env.TELE_CHAT_ID || '',
      tier:              process.env.USER_TIER || 'free',
      // Cookie đã được parse sẵn
      fb_cookies_arr:    parseCookieString(process.env.FB_COOKIE, '.facebook.com'),
      threads_cookies_arr: parseCookieString(process.env.THREADS_COOKIE, '.threads.net'),
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('fb_cookie, threads_cookie, affiliate_links, parsed_affiliate_links, tele_chat_id, tier, target_channels')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error("✗ Lỗi Supabase:", error.message);
      throw error;
    }
    if (!data) {
      if (email === 'admin@autofarm.com' || email === process.env.USER_EMAIL) {
        console.log(`!!! Không tìm thấy admin ${email} trên Supabase. Tự động Fallback về .env local...`);
        return {
          fb_cookie:         process.env.FB_COOKIE || '',
          threads_cookie:    process.env.THREADS_COOKIE || '',
          affiliate_links:   process.env.SHOPEE_AFF_LINK || '',
          tele_chat_id:      process.env.TELE_CHAT_ID || '',
          tier:              process.env.USER_TIER || 'free',
          fb_cookies_arr:    parseCookieString(process.env.FB_COOKIE, '.facebook.com'),
          fb_cookie_reels_arr: parseCookieString(process.env.FB_COOKIE_REELS || process.env.FB_COOKIE, '.facebook.com'),
          threads_cookies_arr: parseCookieString(process.env.THREADS_COOKIE, '.threads.net'),
        };
      } else {
        console.error(`✗ Lỗi: User ${email} không tồn tại trong DB, từ chối chạy!`);
        return null;
      }
    }

    console.log(`✓ Đã kéo config từ Supabase cho: ${email} | Tier: ${data.tier}`);

    // Parse affiliate links thành array (mỗi dòng 1 link)
    const affiliateArr = (data.affiliate_links || '')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    return {
      ...data,
      affiliate_links_arr: affiliateArr,
      // Puppeteer-ready cookie arrays
      fb_cookies_arr:      parseCookieString(data.fb_cookie, '.facebook.com'),
      fb_cookie_reels_arr: parseCookieString(process.env.FB_COOKIE_REELS || data.fb_cookie, '.facebook.com'), // Fallback reels cookie từ env nếu DB ko có
      threads_cookies_arr: parseCookieString(data.threads_cookie, '.threads.net'),
    };
  } catch (err) {
    console.error("✗ fetchBotConfig thất bại:", err.message);
    return null;
  }
}

/**
 * Kiểm tra xem user còn quota hôm nay không.
 * @returns {boolean} true = còn quota, false = hết limit
 */
async function checkQuota(email, type = 'reels_posted') {
  if (!supabase) return true; // local dev: bỏ qua check

  try {
    const { data: profile } = await supabase
      .from('profiles').select('id, tier, email').eq('email', email).maybeSingle();
    if (!profile) return false;

    const limits = await getTierLimits(profile.tier);
    const limitKey = type === 'reels_posted' ? 'reels_per_day'
                   : type === 'threads_commented' ? 'threads_per_day'
                   : type === 'threads_posts_count' ? 'threads_post_per_day'
                   : type === 'fb_posts_count' ? 'fb_post_per_day'
                   : type === 'fb_comments_count' ? 'fb_comments_per_day'
                   : 'fb_story_per_day';
                   
    let limit = USER_QUOTA_OVERRIDES[profile.email]?.[limitKey] ?? limits[limitKey];
    // Fallback nếu DB thiếu column
    if (limit === undefined && type === 'threads_posts_count') {
        limit = limits['reels_per_day'] || 2; 
    }
    if (limit === undefined && type === 'fb_posts_count') {
        limit = 3; 
    }
    if (limit === undefined && type === 'fb_comments_count') {
        limit = profile.tier === 'promax' ? -1 : profile.tier === 'pro' ? 6 : profile.tier === 'plus' ? 4 : profile.tier === 'lite' ? 2 : 1;
    }
    if (limit === -1) return true; // unlimited

    const vnTime = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const today = vnTime.toISOString().split('T')[0];
    const { data: stat } = await supabase
      .from('usage_stats')
      .select(type)
      .eq('user_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    const used = stat?.[type] || 0;
    const ok = used < limit;
    if (!ok) console.warn(`🚫 ${email} đã hết quota [${type}]: ${used}/${limit}`);
    return ok;
  } catch (err) {
    console.error("checkQuota error:", err.message);
    return true; // nếu lỗi check thì cho chạy tiếp
  }
}

/**
 * Cập nhật usage stats sau khi bot chạy xong.
 * @param {string} userIdOrEmail - ID hoặc Email của user
 * @param {string} type - 'reels_posted' | 'threads_commented' | 'fb_posts_count'
 * @param {number} count - số lượng tăng thêm (mặc định 1)
 */
async function updateUsageStats(userIdOrEmail, type = 'reels_posted', count = 1) {
  if (!supabase) return;

  const vnTime = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
  const today = vnTime.toISOString().split('T')[0];

  try {
    let userId = userIdOrEmail;
    // Nếu là email thì resolve sang UUID
    if (userIdOrEmail.includes('@')) {
      const { data: profile } = await supabase
        .from('profiles').select('id').eq('email', userIdOrEmail).maybeSingle();
      if (!profile) return;
      userId = profile.id;
    }

    // Upsert: tạo nếu chưa có, update nếu có
    const { data: existing } = await supabase
      .from('usage_stats')
      .select(type)
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase.from('usage_stats')
        .update({ [type]: (existing[type] || 0) + count })
        .eq('user_id', userId)
        .eq('date', today);
    } else {
      await supabase.from('usage_stats')
        .insert([{ user_id: userId, date: today, [type]: count }]);
    }

    console.log(`📊 Updated stats: ${type} +${count} cho user ${userId}`);
  } catch (err) {
    console.error("✗ updateUsageStats lỗi:", err.message);
  }
}

// ─── TELEGRAM MEDIA UPLOAD (tái sử dụng pattern của 1_mass_uploader.js) ───
const TelegramBot = (() => {
  try { const m = require('node-telegram-bot-api'); return m.default || m; } catch { return null; }
})();

const TELE_TOKEN   = process.env.TELE_BOT_TOKEN || process.env.TELE_TOKEN || '8990210506:AAENkVoEQGWpduKsPvaCIUs4qmRBeJItUuc';
const STORAGE_CHAT = parseInt(process.env.TELE_STORAGE_CHAT || '-5396355060', 10);

let _bot = null;
function getBot() {
  if (!TelegramBot) return null;
  if (!_bot) _bot = new TelegramBot(TELE_TOKEN, { polling: false });
  return _bot;
}

/**
 * Upload 1 media (ảnh hoặc video) từ URL lên Telegram group lưu trữ.
 * @param {string} url - URL công khai của ảnh/video
 * @param {string} mediaType - 'image' | 'video'
 * @param {string} caption - caption tùy chọn
 * @returns {string|null} file_id hoặc null nếu lỗi
 */
async function uploadMediaToTelegram(url, mediaType = 'image', caption = '') {
  const bot = getBot();
  if (!bot) { console.warn('!!! node-telegram-bot-api chưa cài'); return null; }

  const axios = require('axios');
  try {
    const response = await axios({ url, responseType: 'stream' });
    
    // Tách tên file gốc từ URL nếu có, hoặc tạo tên ngẫu nhiên
    let ext = mediaType === 'video' ? 'mp4' : 'jpg';
    let filename = `file_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
    
    try {
      const urlPath = new URL(url).pathname;
      const originalName = urlPath.split('/').pop();
      if (originalName && originalName.includes('.')) {
        filename = originalName;
      }
    } catch (e) {}

    const msg = await bot.sendDocument(STORAGE_CHAT, response.data, { caption }, { filename });

    // Lấy file_id từ bất kỳ loại media nào
    const fileId = msg.document?.file_id
      || msg.video?.file_id
      || msg.photo?.at(-1)?.file_id
      || null;

    if (fileId) console.log(`✓ Uploaded media → file_id: ${fileId}`);
    return fileId;
  } catch (err) {
    console.error('✗ uploadMediaToTelegram lỗi:', err.message);
    return null;
  }
}

/**
 * Upload nhiều media tuần tự, trả về mảng file_ids.
 * Delay 3s giữa các lần để tránh Telegram rate limit.
 */
async function uploadMediaBatch(mediaList, delayMs = 3000) {
  const results = [];
  for (const m of mediaList) {
    const fileId = await uploadMediaToTelegram(m.url, m.type || 'image', '');
    results.push({ type: m.type, file_id: fileId });
    if (delayMs) await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
}

// ─── LƯU LOG LÊN WEB REALTIME ───
async function logToWeb(email, botType, message, level = 'info') {
  if (!supabase) return;
  try {
    await supabase.from('bot_logs').insert([{
      email,
      bot_type: botType,
      message,
      level
    }]);
  } catch (err) {
    // Fail silently for logs
  }
}

/**
 * Gửi tin nhắn text qua Telegram (cho thông báo bot).
 */
async function sendTelegramMessage(chatId, text) {
  if (!chatId) return;
  const bot = getBot();
  if (bot) {
    try {
      await bot.sendMessage(chatId, text, { parse_mode: 'HTML' });
      console.log(`✓ Đã gửi tin nhắn Tele tới ${chatId}`);
    } catch (e) {
      console.error(`✗ Lỗi gửi tin nhắn Tele tới ${chatId}:`, e.message);
    }
  }
}

module.exports = {
  supabase,
  parseCookieString,
  fetchBotConfig,
  getTierLimits,
  checkQuota,
  updateUsageStats,
  uploadMediaToTelegram,
  uploadMediaBatch,
  sendTelegramMessage,
  logToWeb,
  STORAGE_CHAT,
  TELE_TOKEN,
};
