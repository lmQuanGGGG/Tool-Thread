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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GITHUB_TOKEN || !GITHUB_REPO) {
    console.error("Missing env vars!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function dispatchWorkflow(workflowId, email) {
    try {
        await axios.post(
            `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${workflowId}/dispatches`,
            { ref: 'main', inputs: { email: email } },
            {
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        console.log(`✓ Dispatched ${workflowId} for ${email}`);
    } catch (e) {
        console.error(`✗ Failed ${workflowId} for ${email}:`, e.response?.data?.message || e.message);
    }
}

async function run() {
    const vnHour = (new Date().getUTCHours() + 7) % 24;
    console.log(`Current VN Hour: ${vnHour}h`);

    // Chỉ chạy tại các khung bot đã định. Cron chạy lệch phút 17 để tránh
    // hàng đợi GitHub Actions vào đầu giờ, nhưng vẫn giữ đúng giờ Việt Nam.
    if (![...STANDARD_SLOTS, ...SPECIAL_REELS_EXTRA_SLOTS, ...FB_POST_SLOTS].includes(vnHour)) {
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

        const isFree = p.tier === 'free';
        const isLite = p.tier === 'lite';
        const isPlus = p.tier === 'plus';
        const isPro = p.tier === 'pro';
        const isProMax = p.tier === 'promax';
        const auto = (key) => isAutoBotEnabled(autoSettings, p.email, key);

        if (!isFree && !isLite && !isPlus && !isPro && !isProMax) continue;

        // Bỏ logic SPECIAL_REELS_EMAIL vì giờ đã có ProMax
        
        // Free: theo bảng gói — 2 Reels, 1 Shopee Post/Story, 1 phiên rải link Reels.
        if (isFree) {
            if (hasFb && auto('reels') && [11, 19].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
            }
            if (hasFb && [19].includes(vnHour)) {
                if (auto('fb_comment')) {
                    await dispatchWorkflow('fb_worker.yml', p.email);
                    await dispatchWorkflow('fb_comment_worker.yml', p.email);
                }
            }
            if (hasThreads && auto('threads_post') && [8, 19].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }

        // Lite: theo bảng gói — 3 Reels, 3 Shopee Post/Story, 2 phiên rải link Reels.
        if (isLite) {
            if (hasFb && auto('reels') && [8, 11, 19].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
            }
            if (hasFb && [11, 19].includes(vnHour)) {
                if (auto('fb_comment')) {
                    await dispatchWorkflow('fb_worker.yml', p.email);
                    await dispatchWorkflow('fb_comment_worker.yml', p.email);
                }
            }
            if (hasThreads && auto('threads_post') && [8, 13, 19].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }

        // Plus Logic: 4 phiên/ngày (8h, 13h, 16h, 19h)
        if (isPlus) {
            if (hasFb && auto('reels') && [8, 13, 16, 19].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
            }
            if (hasFb && auto('fb_comment') && [13, 19].includes(vnHour)) {
                await dispatchWorkflow('fb_worker.yml', p.email);
            }
            if (hasFb && auto('fb_comment') && [8, 11, 13, 16].includes(vnHour)) {
                await dispatchWorkflow('fb_comment_worker.yml', p.email);
            }
            if (hasThreads && auto('threads_post') && [13, 19].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }

        // Pro Logic: 6 phiên/ngày (8h, 11h, 13h, 16h, 19h, 21h)
        if (isPro) {
            if (hasFb && auto('reels') && [8, 11, 13, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
            }
            if (hasFb && auto('fb_comment') && [8, 11, 13, 19].includes(vnHour)) {
                await dispatchWorkflow('fb_worker.yml', p.email);
            }
            if (hasFb && auto('fb_comment') && [8, 11, 13, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('fb_comment_worker.yml', p.email);
            }
            if (hasThreads && auto('threads_post') && [8, 11, 13, 19].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }
        
        // ProMax Logic: 8 phiên/ngày (8h, 10h, 11h, 13h, 15h, 16h, 19h, 21h)
        if (isProMax) {
            if (hasFb && auto('reels') && [8, 10, 11, 13, 15, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
            }
            if (hasFb && auto('fb_comment') && [8, 11, 13, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('fb_worker.yml', p.email);
            }
            if (hasFb && auto('fb_comment') && [8, 10, 11, 13, 15, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('fb_comment_worker.yml', p.email);
            }
            if (hasThreads && auto('threads_post') && [8, 10, 11, 13, 15, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }

        // Shopee Post/Story dùng một lịch riêng để tránh trùng với các phiên
        // Reel/comment. Trước đây phần này chạy bằng cron riêng, dễ bị GitHub
        // bỏ lỡ và không truyền email cho worker.
        const fbPostSlots = isFree ? [19]
            : isLite ? [8, 11, 19]
            : FB_POST_SLOTS;
        if (hasFb && auto('fb_post') && fbPostSlots.includes(vnHour)) {
            await dispatchWorkflow('shopee_worker.yml', p.email);
        }
        
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Done facebook dispatcher.");
}
run();
