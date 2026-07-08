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

    const today = new Date().toISOString().split('T')[0];
    
    // 3. Fetch usage stats for today
    const { data: statsData } = await supabase.from('usage_stats').select('*').eq('date', today);
    const statsMap = {};
    if (statsData) {
        statsData.forEach(s => statsMap[s.email] = s);
    }

    for (const p of profiles) {
        if (!p.email || !p.tier) continue;
        const tierLimit = limitsMap[p.tier] || limitsMap['free'];
        
        // Skip if not an auto_run tier (e.g. free, lite)
        if (!tierLimit.auto_run) continue;

        const stat = statsMap[p.email];
        const used = stat ? (stat.threads_commented || 0) : 0;
        const limit = tierLimit.threads_per_day;

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
