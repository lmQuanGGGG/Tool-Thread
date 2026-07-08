const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

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
        console.log(`✅ Dispatched ${workflowId} for ${email}`);
    } catch (e) {
        console.error(`❌ Failed ${workflowId} for ${email}:`, e.response?.data?.message || e.message);
    }
}

async function run() {
    const vnHour = (new Date().getUTCHours() + 7) % 24;
    console.log(`Current VN Hour: ${vnHour}h`);

    // We only run on specific golden hours: 8, 11, 13, 16, 19
    if (![8, 11, 13, 16, 19].includes(vnHour)) {
        console.log("Not a scheduled hour. Exiting.");
        return;
    }

    const { data: profiles, error } = await supabase.from('profiles')
        .select('email, tier, fb_cookie')
        .not('fb_cookie', 'is', null)
        .neq('fb_cookie', '');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    for (const p of profiles) {
        if (!p.email || !p.tier) continue;
        const isPlus = p.tier === 'plus';
        const isProOrMax = p.tier === 'pro' || p.tier === 'promax';

        if (!isPlus && !isProOrMax) continue;

        if (vnHour === 8 || vnHour === 13) {
            // 8h, 13h: Plus -> Reels, Pro -> Reels + Post
            if (isPlus || isProOrMax) await dispatchWorkflow('reels_worker.yml', p.email);
            if (isProOrMax) await dispatchWorkflow('fb_worker.yml', p.email);
        }
        else if (vnHour === 11 || vnHour === 16) {
            // 11h, 16h: Plus -> None, Pro -> Reels
            if (isProOrMax) await dispatchWorkflow('reels_worker.yml', p.email);
        }
        else if (vnHour === 19) {
            // 19h: Plus -> Reels + Post, Pro -> Reels + Post
            if (isPlus || isProOrMax) {
                await dispatchWorkflow('reels_worker.yml', p.email);
                await dispatchWorkflow('fb_worker.yml', p.email);
            }
        }
        
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log("Done facebook dispatcher.");
}
run();
