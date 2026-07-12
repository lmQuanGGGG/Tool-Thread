const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { getAutoBotSettings, isAutoBotEnabled } = require('./auto_settings');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const SPECIAL_REELS_EMAIL = 'lmquang.devops@gmail.com';
const STANDARD_SLOTS = [8, 11, 13, 16, 19];
const SPECIAL_REELS_EXTRA_SLOTS = [10, 15, 21];
const FB_POST_SLOTS = [11, 14, 16, 20, 22];
const DISPATCHER_HOURS = [...new Set([...STANDARD_SLOTS, ...SPECIAL_REELS_EXTRA_SLOTS, ...FB_POST_SLOTS, 23])];
const AUTO_SCHEDULES = {
    free: { reels: [11, 19], fbGroups: [19], fbReels: [19], threadsPost: [8, 19], fbPost: [19] },
    lite: { reels: [8, 11, 19], fbGroups: [11, 19], fbReels: [11, 19], threadsPost: [8, 13, 19], fbPost: [8, 11, 19] },
    plus: { reels: [8, 13, 16, 19], fbGroups: [13, 19], fbReels: [8, 11, 13, 16], threadsPost: [13, 19], fbPost: FB_POST_SLOTS },
    pro: { reels: [8, 11, 13, 16, 19, 21], fbGroups: [8, 11, 13, 19], fbReels: [8, 11, 13, 16, 19, 21], threadsPost: [8, 11, 13, 19], fbPost: FB_POST_SLOTS },
    promax: { reels: [8, 10, 11, 13, 15, 16, 19, 21], fbGroups: [8, 11, 13, 16, 19, 21], fbReels: [8, 10, 11, 13, 15, 16, 19, 21], threadsPost: [8, 10, 11, 13, 15, 16, 19, 21], fbPost: FB_POST_SLOTS },
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GITHUB_TOKEN || !GITHUB_REPO) {
    console.error("Missing env vars!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function getVnDate() {
    return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function dispatchWorkflow(workflowId, email, slot) {
    try {
        await axios.post(
            `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflowId}/dispatches`,
            { ref: 'main', inputs: { email: email, run_mode: 'auto' } },
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        await supabase.from('bot_logs').insert({
            email,
            bot_type: `auto-dispatch:${workflowId}`,
            message: `slot:${getVnDate()}:${slot}`,
            level: 'info',
        });
        console.log(`✓ Dispatched ${workflowId} for ${email}`);
        return true;
    } catch (e) {
        console.error(`✗ Failed ${workflowId} for ${email}:`, e.response?.data?.message || e.message);
        return false;
    }
}

// Mỗi workflow/khách chỉ chạy một phiên ở mỗi lần dispatcher. Nếu một khung
// bị lỡ, slot chưa có marker sẽ được lấy trước ở lần kế tiếp thay vì bắn dồn.
async function dispatchNextPendingSlot(workflowId, email, slots, vnHour) {
    const today = getVnDate();
    const { data, error } = await supabase.from('bot_logs')
        .select('message')
        .eq('email', email)
        .eq('bot_type', `auto-dispatch:${workflowId}`)
        .like('message', `slot:${today}:%`);

    if (error) {
        console.error(`✗ Cannot read catch-up queue for ${workflowId}:`, error.message);
        return false;
    }

    const completed = new Set((data || []).map(row => Number(String(row.message).split(':').pop())));
    const pending = slots.filter(slot => slot <= vnHour && !completed.has(slot));
    if (!pending.length) return false;

    const slot = pending[0];
    console.log(`${slot < vnHour ? '↩️ Catch-up' : '⏰ Scheduled'} ${workflowId} for ${email}: slot ${slot}h`);
    return dispatchWorkflow(workflowId, email, slot);
}

async function run() {
    const vnHour = (new Date().getUTCHours() + 7) % 24;
    console.log(`Current VN Hour: ${vnHour}h`);

    // Chỉ chạy tại các khung bot đã định. Cron chạy lệch phút 17 để tránh
    // hàng đợi GitHub Actions vào đầu giờ, nhưng vẫn giữ đúng giờ Việt Nam.
    if (!DISPATCHER_HOURS.includes(vnHour)) {
        console.log("Not a scheduled hour. Exiting.");
        return;
    }

    const { data: profiles, error } = await supabase.from('profiles')
        .select('email, tier, fb_cookie, threads_cookie');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }
    const autoSettings = await getAutoBotSettings(supabase, profiles.map(p => p.email).filter(Boolean));

    for (const p of profiles) {
        if (!p.email || !p.tier) continue;
        const hasFb = p.fb_cookie && p.fb_cookie.trim() !== '';
        const hasThreads = p.threads_cookie && p.threads_cookie.trim() !== '';

        if (!hasFb && !hasThreads) continue;

        const schedules = AUTO_SCHEDULES[p.tier];
        const auto = (key) => isAutoBotEnabled(autoSettings, p.email, key);

        if (!schedules) continue;

        if (hasFb && auto('reels')) await dispatchNextPendingSlot('reels_worker.yml', p.email, schedules.reels, vnHour);
        if (hasFb && auto('fb_comment')) {
            await dispatchNextPendingSlot('fb_worker.yml', p.email, schedules.fbGroups, vnHour);
            await dispatchNextPendingSlot('fb_comment_worker.yml', p.email, schedules.fbReels, vnHour);
        }
        if (hasThreads && auto('threads_post')) await dispatchNextPendingSlot('threads_post_worker.yml', p.email, schedules.threadsPost, vnHour);
        if (hasFb && auto('fb_post')) await dispatchNextPendingSlot('shopee_worker.yml', p.email, schedules.fbPost, vnHour);
        
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Done facebook dispatcher.");
}
run();
