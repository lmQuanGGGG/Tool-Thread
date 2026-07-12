require('dotenv').config();
const axios = require('axios');

async function run() {
    const url = process.env.SUPABASE_URL + '/rest/v1/profiles?email=ilike.*ngohong*';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
        const res = await axios.get(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        console.log(res.data.map(u => ({ id: u.id, email: u.email, tier: u.tier })));
    } catch(e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
run();
