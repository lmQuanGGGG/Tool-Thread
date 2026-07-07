const fs = require('fs');

const files = [
    '/Users/wang04/Downloads/threads_full_option_1783159375462.json',
    '/Users/wang04/Downloads/threads_full_option_1783160027568.json',
    '/Users/wang04/Downloads/threads_full_option_1783160034830.json'
];

let mergedData = [];
const existingIds = new Set();

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

files.forEach(file => {
    try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        data.forEach(post => {
            if (!existingIds.has(post.post_id)) {
                existingIds.add(post.post_id);
                mergedData.push(post);
            }
        });
        console.log(`Đọc ${file}: OK`);
    } catch (e) {
        console.error(`Lỗi đọc ${file}:`, e.message);
    }
});

// Sắp xếp tăng dần theo thời gian (cũ nhất ở trên)
mergedData.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

// Áp dụng Nguyên tắc "Ngâm Nick" MMO: 10 bài đầu không chèn link
mergedData.forEach((post, index) => {
    if (post.content && post.content.text) {
        const shopeeRegex = /https:\/\/(shope\.ee|vn\.shp\.ee|shopee\.vn)[^\s]*/g;
        
        if (index < 10) {
            // 10 bài đầu tiên: XÓA SẠCH LINK ĐỂ NGÂM NICK
            post.content.text = post.content.text.replace(shopeeRegex, '').trim();
        } else {
            // Từ bài thứ 11: Chèn link Affiliate Random
            const randomLink = shopeeLinks[Math.floor(Math.random() * shopeeLinks.length)];
            post.content.text = post.content.text.replace(shopeeRegex, randomLink);
        }
    }
});

const outputPath = '/Users/wang04/Documents/Crawl Thread/Tool Thread/drama_raw_data.json';
fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2));

console.log(`\n🎉 THÀNH CÔNG! Đã gộp ${mergedData.length} bài viết duy nhất (đã xóa trùng và lọc sạch Link Shopee rác).`);
console.log(`File đã lưu tại: ${outputPath}`);
