const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../tele_bot/data_products.json');
const products = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Bước 1: Follow redirect lấy shopId + itemId từ URL cuối
async function getShopeeIds(shortUrl) {
    try {
        const resp = await axios.get(shortUrl, {
            maxRedirects: 10,
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            }
        });
        const finalUrl = resp.request.res?.responseUrl || resp.config.url || '';
        
        // URL dạng: https://shopee.vn/product/shopId/itemId
        // Hoặc: https://shopee.vn/slug-i.shopId.itemId
        let shopId, itemId;

        const matchProduct = finalUrl.match(/shopee\.vn\/product\/(\d+)\/(\d+)/);
        if (matchProduct) {
            shopId = matchProduct[1];
            itemId = matchProduct[2];
        } else {
            // Thử parse từ slug dạng: slug-i.shopId.itemId
            const matchSlug = finalUrl.match(/-i\.(\d+)\.(\d+)/);
            if (matchSlug) {
                shopId = matchSlug[1];
                itemId = matchSlug[2];
            } else {
                // Lấy số cuối trong URL làm itemId nếu không parse được
                const nums = finalUrl.match(/\/(\d{8,})/g);
                if (nums && nums.length >= 2) {
                    shopId = nums[nums.length - 2].replace('/', '');
                    itemId = nums[nums.length - 1].replace('/', '');
                }
            }
        }
        return { shopId, itemId, finalUrl };
    } catch (e) {
        return { shopId: null, itemId: null, finalUrl: '' };
    }
}

// Bước 2: Gọi Shopee API lấy tên sản phẩm
async function getProductName(shopId, itemId) {
    try {
        const apiUrl = `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;
        const resp = await axios.get(apiUrl, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
                'Referer': 'https://shopee.vn/',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const name = resp.data?.data?.item?.name || resp.data?.data?.name;
        return name || null;
    } catch {
        return null;
    }
}

// Template comment
const COMMENT_TEMPLATE = {
    drama: [
        'Ai hỏi tôi hàng này thì đây nha: {link}',
        'Tui hay dùng {name} này, giá ok mà chất lượng ổn: {link}',
        'Mấy bà thích thì vào đây xem: {link}',
    ],
    uyen: [
        'Hàng này tui mặc suốt, mấy bà lấy info ở đây nha: {link}',
        'Set {name} này đi đâu cũng được: {link}',
        'Pass đồ xong nhưng cái này tôi vẫn giữ, {name} này xinh lắm: {link}',
    ],
    uyen_fashion: [
        'Mấy bà hỏi info {name} thì đây nha: {link}',
        'Set {name} này mặc xong được khen liền: {link}',
        'Hôm qua có bà hỏi tui mặc gì, đây là {name} nha: {link}',
    ],
    fallback: [
        'Tui hay dùng {name} này lắm: {link}',
        'Ai cần {name} thì lấy link ở đây nha: {link}',
    ]
};

function buildComment(category, name, link) {
    const tpls = COMMENT_TEMPLATE[category] || COMMENT_TEMPLATE.fallback;
    return tpls[Math.floor(Math.random() * tpls.length)]
        .replace('{name}', name).replace('{link}', link);
}

(async () => {
    const needsUpdate = products.filter(p =>
        !p.product_name
        || p.product_name.startsWith('Sản phẩm ')
        || p.product_name === 'Login now to start shopping!'
        || p.product_name === 'Shopee Việt Nam'
        || p.product_name === 'Shopee'
        || /^\d+$/.test(p.product_name) // ID thuần số = chưa có tên thật
    );
    console.log(`🚀 Cần lấy tên thật cho ${needsUpdate.length}/${products.length} sản phẩm...\n`);

    for (let i = 0; i < products.length; i++) {
        const p = products[i];
        const bad = !p.product_name
            || p.product_name.startsWith('Sản phẩm ')
            || p.product_name === 'Login now to start shopping!'
            || p.product_name === 'Shopee Việt Nam'
            || p.product_name === 'Shopee'
            || /^\d+$/.test(p.product_name);

        if (!bad) {
            console.log(`[${i+1}/30] ✅ Skip: ${p.product_name}`);
            continue;
        }

        process.stdout.write(`[${i+1}/30] ${p.link} → `);

        const { shopId, itemId } = await getShopeeIds(p.link);
        if (!shopId || !itemId) {
            console.log(`❌ Không parse được ID`);
            continue;
        }

        await sleep(500);
        const name = await getProductName(shopId, itemId);
        
        if (name) {
            p.product_name = name;
            p.suggested_comment = buildComment(p.category, name, p.link);
            console.log(`✅ "${name}"`);
        } else {
            console.log(`⚠️  API không trả tên (shopId=${shopId} itemId=${itemId})`);
        }

        fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2));
        await sleep(800);
    }

    const done = products.filter(p => p.product_name && !/^\d+$/.test(p.product_name) && !p.product_name.startsWith('Sản phẩm ')).length;
    console.log(`\n🎉 XONG! ${done}/30 sản phẩm đã có tên thật.`);
})();
