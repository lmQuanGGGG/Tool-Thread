require('dotenv').config();
const axios = require('axios');
async function run() {
    const email = 'trangnguyen910200@gmail.com';
    const url = process.env.SUPABASE_URL + '/rest/v1/profiles?email=eq.' + email;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
        const res = await axios.get(url, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
        console.log("Profiles Data:");
        console.log(JSON.stringify(res.data, null, 2));
        
        if (res.data.length > 0) {
            const userId = res.data[0].id;
            // Check usage_stats
            const urlStats = process.env.SUPABASE_URL + '/rest/v1/usage_stats?user_id=eq.' + userId;
            const resStats = await axios.get(urlStats, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
            console.log("\nUsage Stats Data:");
            console.log(JSON.stringify(resStats.data, null, 2));
        }
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
run();
