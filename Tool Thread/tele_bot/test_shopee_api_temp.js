const axios = require('axios');

async function test() {
    const shopId = '822557683';
    const itemId = '19875463134';
    const apiUrl = `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;
    try {
    const resp = await axios.get(apiUrl, {
        timeout: 10000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
            'Referer': 'https://shopee.vn/',
            'X-Requested-With': 'XMLHttpRequest'
        }
    });
    console.log(resp.data.data.item.name);
    console.log(resp.data.data.item.image);
    } catch (e) {
        console.error(e.message);
    }
}

test();
