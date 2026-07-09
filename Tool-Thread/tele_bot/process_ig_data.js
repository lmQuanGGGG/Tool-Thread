const fs = require('fs');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: '/Users/wang04/Documents/Crawl Thread/Tool-Thread/tele_bot/.env' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '1480036662'; // QuangLM chat id

async function uploadToTelegram(fileUrl) {
    try {
        console.log(`Đang tải ảnh lên Telegram từ: ${fileUrl.substring(0, 50)}...`);
        const response = await axios({ url: fileUrl, method: 'GET', responseType: 'stream' });
        
        const form = new require('form-data')();
        form.append('chat_id', TELEGRAM_CHAT_ID);
        form.append('photo', response.data, { filename: 'image.jpg' });

        const uploadRes = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, form, {
            headers: form.getHeaders()
        });
        
        return uploadRes.data.result.photo[uploadRes.data.result.photo.length - 1].file_id;
    } catch (e) {
        console.error('Lỗi upload ảnh:', e.message);
        return null;
    }
}

async function processData() {
    const inputPath = '/Users/wang04/Downloads/instagram_farm_lnhuanhh_1783237701451.json';
    const outputPath = '/Users/wang04/Documents/Crawl Thread/Tool-Thread/tele_bot/drama_ready_to_post.json';
    
    console.log('Đọc file Instagram:', inputPath);
    const igData = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const existingDramaData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    
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
                    // Rate limit protection
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }
        
        existingDramaData.push(post);
        processedCount++;
        console.log(`Đã xử lý post ${processedCount}/${igData.length}`);
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(existingDramaData, null, 2));
    console.log(`Thành công! Đã thêm ${processedCount} bài viết vào kho drama.`);
}

processData();
