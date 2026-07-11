const AUTO_BOT_KEYS = ['reels', 'fb_comment', 'threads_comment', 'fb_post', 'threads_post'];

async function getAutoBotSettings(supabase, emails) {
  const settings = new Map();
  if (!emails.length) return settings;

  const botTypes = AUTO_BOT_KEYS.map((key) => `auto-setting:${key}`);
  const { data, error } = await supabase
    .from('bot_logs')
    .select('email, bot_type, message, created_at')
    .in('email', emails)
    .in('bot_type', botTypes)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[AUTO SETTINGS] Không đọc được cấu hình:', error.message);
    return settings;
  }

  for (const row of data || []) {
    const key = row.bot_type.replace('auto-setting:', '');
    const id = `${row.email}:${key}`;
    if (!settings.has(id)) settings.set(id, row.message === 'enabled');
  }
  return settings;
}

function isAutoBotEnabled(settings, email, key) {
  return settings.get(`${email}:${key}`) !== false;
}

module.exports = { AUTO_BOT_KEYS, getAutoBotSettings, isAutoBotEnabled };
