const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const SPECIAL_REELS_EMAIL = 'lmquang.devops@gmail.com';
const STANDARD_SLOTS = [8, 11, 13, 16, 19];
const SPECIAL_REELS_EXTRA_SLOTS = [10, 15, 21];

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

    // Các gói thường chạy ở 5 khung giờ. Tài khoản đặc biệt có thêm 3 khung Reel.
    if (![...STANDARD_SLOTS, ...SPECIAL_REELS_EXTRA_SLOTS].includes(vnHour)) {
        console.log("Not a scheduled hour. Exiting.");
        return;
    }

    const { data: profiles, error } = await supabase.from('profiles')
        .select('email, tier, fb_cookie, threads_cookie');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

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

        if (!isFree && !isLite && !isPlus && !isPro && !isProMax) continue;

        // Bỏ logic SPECIAL_REELS_EMAIL vì giờ đã có ProMax
        
        // Free Logic: 1 phiên/ngày (19h)
        if (isFree) {
            if (hasFb && [19].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
                await dispatchWorkflow('fb_worker.yml', p.email);
            }
            if (hasThreads && [8, 19].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }

        // Lite Logic: 2 phiên/ngày (11h, 19h)
        if (isLite) {
            if (hasFb && [11, 19].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
                await dispatchWorkflow('fb_worker.yml', p.email);
            }
            if (hasThreads && [8, 13, 19].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }

        // Plus Logic: 4 phiên/ngày (8h, 13h, 16h, 19h)
        if (isPlus) {
            if (hasFb && [8, 13, 16, 19].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
            }
            if (hasFb && [13, 19].includes(vnHour)) {
                await dispatchWorkflow('fb_worker.yml', p.email);
            }
            if (hasFb && [8, 11, 13, 16].includes(vnHour)) {
                await dispatchWorkflow('fb_comment_worker.yml', p.email);
            }
            if (hasThreads && [13, 19].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }

        // Pro Logic: 6 phiên/ngày (8h, 11h, 13h, 16h, 19h, 21h)
        if (isPro) {
            if (hasFb && [8, 11, 13, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
            }
            if (hasFb && [8, 11, 13, 19].includes(vnHour)) {
                await dispatchWorkflow('fb_worker.yml', p.email);
            }
            if (hasFb && [8, 11, 13, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('fb_comment_worker.yml', p.email);
            }
            if (hasThreads && [8, 11, 13, 19].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }
        
        // ProMax Logic: 8 phiên/ngày (8h, 10h, 11h, 13h, 15h, 16h, 19h, 21h)
        if (isProMax) {
            if (hasFb && [8, 10, 11, 13, 15, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('reels_worker.yml', p.email);
            }
            if (hasFb && [8, 11, 13, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('fb_worker.yml', p.email);
            }
            if (hasFb && [8, 10, 11, 13, 15, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('fb_comment_worker.yml', p.email);
            }
            if (hasThreads && [8, 10, 11, 13, 15, 16, 19, 21].includes(vnHour)) {
                await dispatchWorkflow('threads_post_worker.yml', p.email);
            }
        }
        
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Done facebook dispatcher.");
}
run();
