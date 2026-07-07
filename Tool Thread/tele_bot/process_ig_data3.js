const fs = require('fs');
const axios = require('axios');
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '/Users/wang04/Documents/Crawl Thread/Tool Thread/tele_bot/.env' });

const TELEGRAM_BOT_TOKEN = process.env.TELE_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-5396355060';

async function uploadToTelegram(fileUrl) {
    const tempFile = path.join(__dirname, `temp_${Date.now()}.jpg`);
    let retries = 3;
    while (retries > 0) {
        try {
            console.log(`Đang tải ảnh từ: ${fileUrl.substring(0, 50)}...`);
            execSync(`curl -s -o "${tempFile}" "${fileUrl}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://www.instagram.com/"`);
            
            if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size < 100) {
                throw new Error('File tải về rỗng hoặc lỗi 404 (Curl bypass failed)');
            }

            const form = new require('form-data')();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            form.append('document', fs.createReadStream(tempFile));

            const uploadRes = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, form, {
                headers: form.getHeaders()
            });
            
            fs.unlinkSync(tempFile);
            return uploadRes.data.result.document.file_id;
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error_code === 429) {
                const retryAfter = e.response.data.parameters.retry_after || 10;
                console.log(`[WARN] Bị Telegram chặn Rate Limit, đợi ${retryAfter} giây rồi thử lại...`);
                await new Promise(r => setTimeout(r, retryAfter * 1000 + 1000));
                retries--;
                continue;
            }
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            console.error('Lỗi upload ảnh:', e.response ? JSON.stringify(e.response.data) : e.message);
            return null;
        }
    }
    return null;
}

async function processData() {
    const inputPath = '/Users/wang04/Downloads/instagram_farm_lnhuanhh_1783237701451.json';
    const outputPath = '/Users/wang04/Documents/Crawl Thread/Tool Thread/tele_bot/ig_ready_to_post.json';
    
    console.log('Đọc file Instagram:', inputPath);
    const igData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    let existingDramaData = [];
    
    let processedCount = 0;
    
    for (const post of igData) {
        let hasImage = false;
        
        if (post.content && post.content.media && post.content.media.length > 0) {
            for (let i = 0; i < post.content.media.length; i++) {
                if (post.content.media[i].type === 'image' && post.content.media[i].url) {
                    const file_id = await uploadToTelegram(post.content.media[i].url);
                    if (file_id) {
                        post.content.media[i].file_id = file_id;
                        hasImage = true;
                    }
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
        
        existingDramaData.push(post);
        processedCount++;
        console.log(`Đã xử lý post ${processedCount}/${igData.length}`);
    }
    existingDramaData.reverse();
    fs.writeFileSync(outputPath, JSON.stringify(existingDramaData, null, 2));
    console.log(`Thành công! Đã thêm và đảo ngược ${processedCount} bài viết vào kho ig_ready_to_post.`);
}

processData();
