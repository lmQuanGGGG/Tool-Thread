const fs = require('fs');

const products = JSON.parse(fs.readFileSync('data_products.json', 'utf8'));
const shopeeData = JSON.parse(fs.readFileSync('fb_bot/shopee_data.json', 'utf8'));

const updatedProducts = products.map(p => {
    // Tìm item tương ứng trong shopeeData
    const s = shopeeData.find(item => item.aff_link === p.link);
    if (s) {
        return {
            link: p.link,
            category: p.category,
            product_name: "", // Luôn để rỗng vì đây là data cmt
            suggested_comment: p.suggested_comment, // Giữ nguyên comment mồi của Sếp
            image_url: s.image_url,
            tele_file_id: s.tele_file_id
        };
    }
    return p;
});

fs.writeFileSync('data_products.json', JSON.stringify(updatedProducts, null, 2));
console.log('Done updating data_products.json');
