const fs = require('fs');

const code = `const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Token Telegram từ .env
const TELEGRAM_BOT_TOKEN = process.env.TELE_BOT_TOKEN || "8990210506:AAENkVoEQGWpduKsPvaCIUs4qmRBeJItUuc";

async function downloadImageFromTelegram(file_id) {
    console.log(\`[INFO] Kéo ảnh từ Telegram... (file_id: \${file_id})\`);
    try {
        const getFileUrl = \`https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/getFile?file_id=\${file_id}\`;
        const fileRes = await axios.get(getFileUrl);
        const filePath = fileRes.data.result.file_path;

        const downloadUrl = \`https://api.telegram.org/file/bot\${TELEGRAM_BOT_TOKEN}/\${filePath}\`;
        const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });

        const localPath = path.resolve(__dirname, \`temp_img_\${Date.now()}.jpg\`);
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(localPath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('[ERROR] Lỗi tải ảnh:', error.message);
        return null;
    }
}

(async () => {
    console.log("🚀 Đang khởi động FB Auto Comment Bot...");
    
    let fbCookieStr = process.env.FB_COOKIE;
    if (!fbCookieStr) {
        console.error("✗ Lỗi: Chưa có FB_COOKIE trong file .env!");
        process.exit(1);
    }
    let cookies = JSON.parse(fbCookieStr);

    const cleanCookies = cookies.map(c => {
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        delete c.storeId;
        delete c.id;
        delete c.hostOnly;
        delete c.session;
        return c;
    });

    let targets = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'fb_targets.json'), 'utf8'));
    
    // Đọc data từ data_products.json (tệp đã chứa link ảnh và comment mẫu)
    const productsPath = path.resolve(__dirname, '../data_products.json');
    let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    
    // Lọc ra các sản phẩm CÓ ẢNH (để đảm bảo cmt cho real)
    let validProducts = products.filter(p => p.tele_file_id && p.suggested_comment);

    if (validProducts.length === 0) {
        console.error("✗ Không có sản phẩm nào có đủ ảnh và cmt mẫu trong data_products.json!");
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-notifications'
        ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' });
    
    console.log("🍪 Nạp Cookie Facebook...");
    await page.setCookie(...cleanCookies);

    console.log("🌐 Đang truy cập Facebook (sau khi nạp Cookie)...");
    await page.goto('https://www.facebook.com', { waitUntil: 'networkidle2' });
    
    let waitTime = getRandomInt(3000, 7000);
    console.log(\`⏳ Đợi \${waitTime/1000}s cho Facebook load hoàn tất...\`);
    await delay(waitTime);

    for (let target of targets) {
        console.log(\`\\n🎯 Di chuyển đến mục tiêu: \${target}\`);
        await page.goto(target, { waitUntil: 'networkidle2' });
        await delay(getRandomInt(5000, 8000));
        
        try {
            await page.evaluate(() => {
                const closeBtns = [...document.querySelectorAll('div[aria-label="Đóng"], div[aria-label="Close"], div[aria-label="Tôi đồng ý"], div[aria-label="I agree"], div[aria-label="Tham gia nhóm"], div[aria-label="Join Group"]' )];
                closeBtns.forEach(btn => { if (btn) btn.click(); });
            });
            await delay(2000);
        } catch(e) {}

        await page.evaluate(() => window.scrollBy(0, 800));
        await delay(3000);

        try {
            console.log("👀 Đang quét các bài viết gần nhất...");
            
            // Kích hoạt tất cả các nút "Bình luận" đang hiển thị để mở ô nhập liệu (nếu nó đang bị ẩn)
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('div[role="button"]'));
                btns.forEach(btn => {
                    const text = (btn.innerText || '').trim().toLowerCase();
                    if (text === 'bình luận' || text === 'comment') {
                        btn.click();
                    }
                });
            });
            await delay(3000);

            // Tìm thẳng các Ô Comment (Textbox)
            const commentBoxes = await page.$$('div[role="textbox"][contenteditable="true"]');
            let validBoxes = [];
            for (let box of commentBoxes) {
                const isValid = await page.evaluate(el => {
                    const rect = el.getBoundingClientRect();
                    const isVisible = rect.width > 0 && rect.height > 0;
                    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
                    const placeholder = (el.getAttribute('aria-placeholder') || '').toLowerCase();
                    // Đảm bảo đây là ô comment (không phải ô post bài)
                    return isVisible && (aria.includes('bình luận') || aria.includes('comment') || placeholder.includes('bình luận') || placeholder.includes('comment'));
                }, box);
                if (isValid) {
                    validBoxes.push(box);
                }
            }

            console.log(\`[INFO] Tìm thấy \${validBoxes.length} ô comment hợp lệ.\`);
            if (validBoxes.length === 0) {
                await page.screenshot({ path: \`debug_no_btn_\${Date.now()}.png\` });
            }
            
            // Theo yêu cầu sếp: Comment tối đa 2 bài trên mỗi Group
            let postsToComment = 2; 
            let commentedCount = 0;

            for (let i = 0; i < validBoxes.length; i++) {
                if (commentedCount >= postsToComment) break;
                
                let targetBox = validBoxes[i];
                try {
                    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), targetBox);
                    await delay(2000);

                    // Thả Like bài viết trước khi cmt
                    console.log(\`👍 Đang thả Like cho bài thứ \${i + 1}...\`);
                    await page.evaluate((box) => {
                        let parent = box;
                        for(let k=0; k<8; k++) {
                            if (!parent) break;
                            const likeBtn = Array.from(parent.querySelectorAll('div[role="button"]')).find(el => el.innerText === 'Thích' || el.innerText === 'Like');
                            if (likeBtn) {
                                likeBtn.click();
                                break;
                            }
                            parent = parent.parentElement;
                        }
                    }, targetBox);
                    await delay(1500);

                    console.log(\`💬 Click vào ô Comment thứ \${i + 1}...\`);
                    await targetBox.click();
                    await delay(1000);
                    await page.evaluate(el => el.focus(), targetBox);
                    
                    // Bốc sản phẩm ngẫu nhiên
                    let pickedProduct = validProducts[getRandomInt(0, validProducts.length - 1)];
                    let cmtText = (pickedProduct.suggested_comment && pickedProduct.suggested_comment.includes(pickedProduct.aff_link))
                        ? pickedProduct.suggested_comment
                        : (pickedProduct.suggested_comment ? `${pickedProduct.suggested_comment}\n${pickedProduct.aff_link}` : `${pickedProduct.title}\n${pickedProduct.aff_link}`);
                    
                    console.log(\`📸 Tải ảnh sản phẩm về...\`);
                    let localImg = await downloadImageFromTelegram(pickedProduct.tele_file_id);
                    
                    if (localImg) {
                        console.log(\`🖼️ Đính kèm ảnh vào comment...\`);
                        // Tải ảnh trực tiếp vào thẻ input[type="file"]
                        const fileInputHandle = await page.evaluateHandle((box) => {
                            let parent = box;
                            for(let k=0; k<12; k++) {
                                if(!parent) break;
                                const fileInputs = parent.querySelectorAll('input[type="file"][accept*="image"]');
                                if (fileInputs.length > 0) {
                                    return fileInputs[fileInputs.length - 1]; // Lấy cái cuối cùng trong form
                                }
                                parent = parent.parentElement;
                            }
                            return null;
                        }, targetBox);

                        const isElement = await page.evaluate(el => el instanceof HTMLElement, fileInputHandle);
                        if (isElement) {
                            await fileInputHandle.uploadFile(localImg);
                            console.log(\`⏳ Chờ FB xử lý ảnh đính kèm...\`);
                            await delay(6000);
                        } else {
                            console.log("!!! Không tìm thấy thẻ input type=file, bỏ qua up ảnh!");
                        }
                    }

                    // Gõ text mồi
                    const lines = cmtText.split('\\n');
                    for (let line of lines) {
                        await page.keyboard.type(line, { delay: getRandomInt(20, 50) });
                        await page.keyboard.down('Shift');
                        await page.keyboard.press('Enter');
                        await page.keyboard.up('Shift');
                        await delay(200);
                    }

                    await delay(2000);
                    await page.keyboard.press('Enter');
                    console.log("✓ Đã bắn Comment + Ảnh thành công!");
                    commentedCount++;
                    
                    if (localImg && fs.existsSync(localImg)) fs.unlinkSync(localImg);
                    
                    if (commentedCount < postsToComment) {
                        let restTime = getRandomInt(15, 25);
                        console.log(\`😴 Bot nghỉ mệt \${restTime}s trước khi cmt bài tiếp theo...\`);
                        await delay(restTime * 1000);
                    }
                } catch (err) {
                    console.log(\`✗ Lỗi khi comment bài \${i + 1}:\`, err.message);
                    await page.screenshot({ path: \`debug_cmt_err_\${i}.png\` });
                }
            }
            
            console.log(\`🚀 Đã hoàn thành \${commentedCount} bài ở Group/Page này. Chuyển mục tiêu...\`);
            await delay(getRandomInt(20000, 30000));
        } catch (err) {
            console.log(\`✗ Lỗi trong Group \${target}:\`, err.message);
        }
    }

    console.log("🎉 Hoàn tất chiến dịch rải link FB!");
    await browser.close();
})();
`;

fs.writeFileSync('1_fb_puppeteer.js', code);
console.log("Fully rewritten 1_fb_puppeteer.js");
