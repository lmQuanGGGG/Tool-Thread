const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, 'tele_bot/data_products.json');
const products = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

// Template comment theo category — chỉ cần link, không cần tên SP
const COMMENT_TEMPLATE = {
    drama: [
        'Ai hỏi tui hàng này thì đây nha: {link}',
        'Mấy bà thích thì vào đây xem, tui đang dùng: {link}',
        'Hàng này ok lắm nha mấy chị: {link}',
        'Tui hay mua mấy thứ này lắm, link đây: {link}',
    ],
    uyen: [
        'Hàng này tui mặc suốt, mấy bà lấy info ở đây nha: {link}',
        'Set này đi đâu cũng được, mua ở đây: {link}',
        'Mấy bà hỏi cái này ở đâu, thì đây link nha: {link}',
        'Pass đồ xong nhưng cái này tôi vẫn giữ vì xinh lắm: {link}',
    ],
    uyen_fashion: [
        'Mấy bà hỏi info thì đây nha: {link}',
        'Set này mặc xong được khen liền, link đây: {link}',
        'Hôm qua có bà hỏi tui mặc gì, đây nha: {link}',
        'Outfit này tui thích lắm, mấy bà lấy link ở đây: {link}',
    ],
};

let count = 0;
products.forEach(p => {
    // Chỉ fill những cái chưa có comment xịn
    const needsFill = !p.suggested_comment
        || p.suggested_comment.includes('Shopee Việt Nam')
        || p.suggested_comment.includes('Sản phẩm ')
        || p.suggested_comment.includes('undefined')
        || p.suggested_comment === '';

    if (needsFill) {
        const tpls = COMMENT_TEMPLATE[p.category] || COMMENT_TEMPLATE.drama;
        p.product_name = p.product_name || `sp${count + 1}`;
        p.suggested_comment = tpls[Math.floor(Math.random() * tpls.length)].replace('{link}', p.link);
        count++;
    }
});

fs.writeFileSync(DATA_PATH, JSON.stringify(products, null, 2));
console.log(`✓ Đã fill comment cho ${count} sản phẩm!`);
console.log(`📂 ${DATA_PATH}`);

// Preview kết quả
products.forEach((p, i) => {
    console.log(`\n[${i + 1}] [${p.category}] ${p.link}`);
    console.log(`   💬 ${p.suggested_comment}`);
});
