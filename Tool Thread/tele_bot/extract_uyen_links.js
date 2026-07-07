const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'data_ready_to_post.json');
const outputPath = path.join(__dirname, 'uyen_links_mapping.md');

try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const shopeeRegex = /https:\/\/(s\.shopee\.vn|shope\.ee|vn\.shp\.ee|shopee\.vn)[^\s]*/g;
    
    let markdown = `# Danh sách Link Shopee gốc của Uyên để Sếp tìm hàng Tương tự\n\n`;
    markdown += `| Post ID | Trích đoạn Content (Gợi ý sản phẩm) | Link Shopee Gốc của Uyên |\n`;
    markdown += `|---|---|---|\n`;

    let count = 0;
    data.forEach(post => {
        if (post.content && post.content.text) {
            const match = post.content.text.match(shopeeRegex);
            if (match) {
                count++;
                const originalLink = match[0];
                const snippet = post.content.text.replace(/\n/g, ' ').substring(0, 50) + '...';
                markdown += `| \`${post.post_id}\` | ${snippet} | ${originalLink} |\n`;
            }
        }
    });

    markdown += `\n**Tổng cộng có ${count} bài viết chứa link Shopee.**\n`;
    markdown += `\n👉 **Hướng dẫn cho Sếp:**\n`;
    markdown += `1. Sếp copy bảng này hoặc tải file về.\n`;
    markdown += `2. Bấm vào Link gốc xem nó bán cái áo/quần gì.\n`;
    markdown += `3. Lên Shopee tìm sản phẩm y hệt, lấy Link Affiliate của sếp.\n`;
    markdown += `4. Sau đó quăng cho em 1 cái danh sách (Ví dụ: ID 123 -> Link A, ID 456 -> Link B) để em thay chính xác 1:1 vào Data nhé!\n`;

    fs.writeFileSync(outputPath, markdown);
    console.log(`Đã xuất ${count} link ra file: ${outputPath}`);
} catch (e) {
    console.error(`Lỗi:`, e.message);
}
