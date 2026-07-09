const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data_ready_to_post.json');

// Mảng 13 link Affiliate của sếp
const shopeeLinks = [
    'https://s.shopee.vn/8fQUwP4vxj',
    'https://s.shopee.vn/20tb0AoKKB',
    'https://s.shopee.vn/4LHVmTSfLV',
    'https://s.shopee.vn/3g1ozHGzTT',
    'https://s.shopee.vn/8V74kAgWED',
    'https://s.shopee.vn/2LWROrPB2P',
    'https://s.shopee.vn/80Ao9HqPii',
    'https://s.shopee.vn/5LA2yTbjNI',
    'https://s.shopee.vn/1BKU0pkFIh',
    'https://s.shopee.vn/903LLFIQXc',
    'https://s.shopee.vn/3g1ozVOjz1',
    'https://s.shopee.vn/30m8CIdrqy',
    'https://s.shopee.vn/6Aj9y8mvSW'
];

try {
    let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // Đảm bảo data đã được sắp xếp tăng dần theo thời gian (cũ nhất ở trên)
    data.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

    // Xử lý link rác
    data.forEach((post, index) => {
        if (post.content && post.content.text) {
            const shopeeRegex = /https:\/\/(shope\.ee|vn\.shp\.ee|shopee\.vn)[^\s]*/g;
            
            if (index < 10) {
                // 10 bài đầu tiên: XÓA SẠCH LINK ĐỂ NGÂM NICK
                post.content.text = post.content.text.replace(shopeeRegex, '').trim();
            } else {
                // Từ bài thứ 11: Chèn link Affiliate Random của SẾP
                const randomLink = shopeeLinks[Math.floor(Math.random() * shopeeLinks.length)];
                post.content.text = post.content.text.replace(shopeeRegex, randomLink);
            }
        }
    });

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log(`\n🎉 BÙM! Đã lọc sạch sẽ link Shopee của Uyên và thay bằng link của Sếp cho ${data.length} bài đăng!`);

} catch (e) {
    console.error(`Lỗi xử lý file data của Uyên:`, e.message);
}
