const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GITHUB_TOKEN || !GITHUB_REPO) {
    console.error("Missing env vars!");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Fetching eligible profiles for Auto Threads Comment...");
    
    // 1. Get tier limits
    const { data: limitsData } = await supabase.from('tier_limits').select('*');
    const limitsMap = {};
    if (limitsData) {
        limitsData.forEach(l => limitsMap[l.tier] = l);
    }

    // 2. Fetch profiles with threads_cookie
    const { data: profiles, error } = await supabase.from('profiles')
        .select('email, tier, threads_cookie')
        .not('threads_cookie', 'is', null);

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    const vnTime = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const today = vnTime.toISOString().split('T')[0];
    
    // 3. Fetch usage stats for today
    const { data: statsData } = await supabase.from('usage_stats').select('*').eq('date', today);
    const statsMap = {};
    if (statsData) {
        statsData.forEach(s => statsMap[s.email] = s);
    }

    for (const p of profiles) {
        if (!p.email || !p.tier) continue;
        const tierLimit = limitsMap[p.tier] || limitsMap['free'];
        
        const vnHour = (new Date().getUTCHours() + 7) % 24;

        const stat = statsMap[p.email];
        const used = stat ? (stat.threads_commented || 0) : 0;
        let limit = tierLimit.threads_per_day;

        if (p.tier === 'free') {
            // Free: 100% auto. Runs only on 2 slots (e.g., 8h, 20h).
            if (vnHour !== 8 && vnHour !== 20) {
                continue;
            }
        } else if (p.tier === 'lite') {
            // Lite: 20 auto. Runs on 3 slots (e.g., 8h, 13h, 20h).
            if (vnHour !== 8 && vnHour !== 13 && vnHour !== 20) {
                continue;
            }
            limit = 20; // 20/30 auto
        } else {
            // Plus, Pro, ProMax: 50% auto. Runs anytime until limit.
            if (limit !== -1) {
                limit = Math.floor(limit / 2);
            }
        }

        // Check quota
        if (limit !== -1 && used >= limit) {
            console.log(`[SKIP] ${p.email} - reached daily limit (${used}/${limit})`);
            continue;
        }

        console.log(`[DISPATCH] Triggering threads_comment_worker for ${p.email} (${used}/${limit === -1 ? '∞' : limit})`);
        try {
            await axios.post(
                `https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/threads_comment_worker.yml/dispatches`,
                {
                    ref: 'main',
                    inputs: { email: p.email }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(`✅ Success for ${p.email}`);
        } catch (e) {
            console.error(`❌ Failed for ${p.email}:`, e.response?.data?.message || e.message);
        }
        
        // Add a small delay between API calls
        await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log("Done dispatcher.");
}
run();
