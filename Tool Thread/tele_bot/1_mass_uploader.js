const tgApi = require('node-telegram-bot-api');
const TelegramBot = tgApi.default || tgApi;
const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Cấu hình Bot & Group
const token = '8990210506:AAENkVoEQGWpduKsPvaCIUs4qmRBeJItUuc';
const chatId = -5396355060;
const bot = new TelegramBot(token, { polling: false });

// Xác định mode: `node 1_mass_uploader.js drama` → chạy cho nick Drama
// Không truyền tham số → chạy cho nick Uyên (đường dẫn cũ)
const MODE = process.argv[2] === 'drama' ? 'drama' : 'uyen';

const inputJsonPath = MODE === 'drama'
    ? path.join(__dirname, '..', 'drama_raw_data.json')  // drama_raw_data.json trong Tool Thread/
    : '/Users/wang04/Downloads/threads_full_option_1783158545788.json';

const outputJsonPath = MODE === 'drama'
    ? path.join(__dirname, 'drama_ready_to_post.json')
    : path.join(__dirname, 'data_ready_to_post.json');

console.log(`\n🎯 MODE: ${MODE.toUpperCase()} | Input: ${inputJsonPath}`);
console.log(`📦 Output: ${outputJsonPath}\n`);

// Hàm tạo khoảng nghỉ (Delay) để tránh Telegram chặn spam
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTestUpload() {
    console.log("🚀 Bắt đầu đọc file JSON...");
    const rawData = fs.readFileSync(inputJsonPath, 'utf8');
    let threadsData = JSON.parse(rawData);
    
    // Sắp xếp chronologically (Cũ nhất đăng trước, mới nhất đăng sau)
    threadsData.sort((a, b) => {
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        return timeA - timeB; // Tăng dần
    });

    // Đọc data cũ nếu có để không bị ghi đè mất
    let updatedData = [];
    const existingPostIds = new Set();
    if (fs.existsSync(outputJsonPath)) {
        try {
            updatedData = JSON.parse(fs.readFileSync(outputJsonPath, 'utf8'));
            updatedData.forEach(p => existingPostIds.add(p.post_id));
            console.log(`[!] Tìm thấy ${updatedData.length} bài cũ trong data_ready_to_post.json`);
        } catch (e) {}
    }

    // XỬ LÝ TOÀN BỘ BÀI VIẾT (Lọc trùng)
    const postsToProcess = threadsData.filter(p => !existingPostIds.has(p.post_id));
    console.log(`Bắt đầu xử lý ${postsToProcess.length} bài MỚI... (Bỏ qua ${threadsData.length - postsToProcess.length} bài trùng)`);

    // --- Cập nhật Timestamp cho data cũ (Từ file cào mới nhất) ---
    updatedData.forEach(oldPost => {
        const matchingNewPost = threadsData.find(newPost => newPost.post_id === oldPost.post_id);
        if (matchingNewPost && matchingNewPost.timestamp) {
            oldPost.timestamp = matchingNewPost.timestamp;
        }
    });
    // Sau khi cập nhật, lưu lại luôn!
    fs.writeFileSync(outputJsonPath, JSON.stringify(updatedData, null, 2));
    console.log(`[+] Đã đồng bộ Timestamp thành công cho các bài đăng cũ!`);


    for (let i = 0; i < postsToProcess.length; i++) {
        const post = postsToProcess[i];
        console.log(`\n⏳ Đang xử lý bài ${i + 1}/${postsToProcess.length} (ID: ${post.post_id})`);
        
        let newMediaList = [];
        const content = post.content || {};
        
        if (content.media && content.media.length > 0) {
            for (let j = 0; j < content.media.length; j++) {
                const m = content.media[j];
                console.log(`   👉 Đang tải Media ${j + 1}...`);
                try {
                    const response = await axios({
                        url: m.url,
                        responseType: 'stream'
                    });
                    
                    // Gắn nội dung bài (Text) vào Ảnh đầu tiên
                    let captionText = '';
                    if (j === 0) {
                        captionText = content.text ? content.text.substring(0, 1000) : '';
                        if (captionText) captionText += '\n\n';
                        captionText += `(Bài ID: ${post.post_id} | ❤️ ${post.stats ? post.stats.likes : 0})`;
                    }

                    const fileName = m.type === 'video' ? `video_${post.post_id}_${j}.mp4` : `image_${post.post_id}_${j}.jpg`;
                    const msg = await bot.sendDocument(chatId, response.data, {
                        caption: captionText
                    }, {
                        filename: fileName
                    });

                    let fileId = '';
                    if (msg.document) fileId = msg.document.file_id;
                    else if (msg.video) fileId = msg.video.file_id;
                    else if (msg.photo) fileId = msg.photo[msg.photo.length - 1].file_id;

                    console.log(`   ✓ Up thành công! file_id: ${fileId}`);
                    newMediaList.push({ type: m.type, file_id: fileId });
                    await sleep(3000);
                } catch (err) {
                    console.error(`   ✗ Lỗi khi up media ${j + 1}:`, err.message);
                }
            }
        } else {
            // Nếu bài chỉ có chữ (Không có ảnh)
            if (content.text) {
                await bot.sendMessage(chatId, `📝 TEXT ONLY (ID: ${post.post_id}):\n\n${content.text}`);
                await sleep(1500);
            }
        }
        
        // Cập nhật lại post với media mới
        updatedData.push({
            ...post,
            content: {
                text: content.text,
                media: newMediaList // Thay URL rác bằng file_id Tele
            }
        });
    }

    // Lưu file test
    fs.writeFileSync(outputJsonPath, JSON.stringify(updatedData, null, 2));
    console.log(`\n🎉 HOÀN TẤT TEST! Đã lưu file mới tại: ${outputJsonPath}`);
    console.log("👉 Chồng mở Group Telegram lên xem ảnh đã bắn qua chưa nhé!");
}

runTestUpload();
