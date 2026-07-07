const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

async function uploadToTele(filePath) {
    const token = process.env.TELE_BOT_TOKEN || "8990210506:AAENkVoEQGWpduKsPvaCIUs4qmRBeJItUuc";
    const chatId = process.env.TELE_CHAT_ID || "1622329388"; // Need to check if there is a group chat ID
    
    let stats = fs.statSync(filePath);
    if (stats.size > 50 * 1024 * 1024) {
        console.log("File too big for Tele Bot API (>50MB).");
        return null;
    }

    const form = new FormData();
    form.append('chat_id', chatId);
    form.append('video', fs.createReadStream(filePath));

    try {
        const res = await axios.post(`https://api.telegram.org/bot${token}/sendVideo`, form, {
            headers: form.getHeaders()
        });
        return res.data.result.video.file_id;
    } catch (e) {
        console.log("Error:", e.message);
    }
}
console.log("Tele test script ready.");
