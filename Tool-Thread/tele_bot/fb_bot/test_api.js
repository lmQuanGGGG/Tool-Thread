const axios = require('axios');
const fs = require('fs');

(async () => {
    let shopeeCookies = JSON.parse(fs.readFileSync('shopee_cookie.json', 'utf8'));
    let cookieStr = shopeeCookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    try {
        const res = await axios.get('https://shopee.vn/api/v4/item/get?itemid=18985520799&shopid=77374369', {
            headers: {
                'Cookie': cookieStr,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        console.log("Name:", res.data.data.name);
        console.log("Image:", res.data.data.image);
    } catch (e) {
        console.error(e.response ? e.response.status : e.message);
    }
})();
