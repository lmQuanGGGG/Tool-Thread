require('dotenv').config();
const axios = require('axios');
async function run() {
    const emails = ['lemanh21122000@gmail.com', 'acclolv1camkeunhieu@gmail.com'];
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    for (const email of emails) {
        console.log(`\n=========================================`);
        console.log(`Checking email: ${email}`);
        const url = process.env.SUPABASE_URL + '/rest/v1/profiles?email=eq.' + email;
        try {
            const res = await axios.get(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
            
            if (res.data.length > 0) {
                const user = res.data[0];
                console.log("Profiles Data:");
                console.log(`- fb_cookie: ${user.fb_cookie ? 'YES' : 'NULL'}`);
                console.log(`- threads_cookie: ${user.threads_cookie ? 'YES' : 'NULL'}`);
                console.log(`- affiliate_links: ${user.affiliate_links ? 'YES' : 'NULL'}`);
                console.log(`- tele_chat_id: ${user.tele_chat_id || 'NULL'}`);
                
                // Check usage_stats
                const userId = user.id;
                const urlStats = process.env.SUPABASE_URL + '/rest/v1/usage_stats?user_id=eq.' + userId;
                const resStats = await axios.get(urlStats, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
                console.log("Usage Stats Data:");
                if (resStats.data.length > 0) {
                     console.log(JSON.stringify(resStats.data, null, 2));
                } else {
                     console.log("[] (No usage stats)");
                }
            } else {
                console.log("-> User NOT FOUND in profiles.");
            }
        } catch(e) {
            console.error(e.response ? e.response.data : e.message);
        }
    }
}
run();
