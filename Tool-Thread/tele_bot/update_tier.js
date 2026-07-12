require('dotenv').config();
const axios = require('axios');

async function run() {
    const url = process.env.SUPABASE_URL + '/rest/v1/profiles?email=eq.ngohong@gmail.com';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
        const res = await axios.patch(url, { tier: 'pro' }, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });
        console.log("Update success!");
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
run();
