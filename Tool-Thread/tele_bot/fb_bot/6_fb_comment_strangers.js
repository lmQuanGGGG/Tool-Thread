const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { fetchBotConfig, logToWeb, updateUsageStats, supabase } = require('../supabase_helper');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Token Telegram từ .env để tải ảnh
const TELEGRAM_BOT_TOKEN = process.env.TELE_BOT_TOKEN || "8990210506:AAENkVoEQGWpduKsPvaCIUs4qmRBeJItUuc";

async function downloadImageFromTelegram(file_id) {
    console.log(`[INFO] Kéo ảnh từ Telegram... (file_id: ${file_id})`);
    try {
        const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${file_id}`;
        const fileRes = await axios.get(getFileUrl);
        const filePath = fileRes.data.result.file_path;

        const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
        const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });

        const localPath = path.resolve(__dirname, `temp_img_${Date.now()}.jpg`);
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

const SEED_COMMENTS = [
    "Tuyệt vời quá!",
    "Xuất sắc bạn ơi 💯",
    "Video hay quá nè",
    "Đỉnh quá bạn ơi",
    "Tương tác mạnh nha bạn",
    "Đẹp xuất sắc luôn",
    "Thả tim cho video này ❤️",
    "Quá xịn xò 👏"
];

(async () => {
    const email = process.env.USER_EMAIL || 'admin@autofarm.com';
    const dbConfig = await fetchBotConfig(email);

    let rawCookie = process.env.FB_COOKIE;
    if (dbConfig && dbConfig.fb_cookie) {
        rawCookie = dbConfig.fb_cookie;
    }

    if (!rawCookie) {
        console.log("❌ Không tìm thấy Cookie FB!");
        return;
    }

    const cookies = typeof rawCookie === 'string' ? JSON.parse(rawCookie) : rawCookie;

    // Lấy data Shopee Affiliate
    let scrapedData = dbConfig?.parsed_affiliate_links || [];
    if (scrapedData.length === 0) {
        const dataFile = path.resolve(__dirname, 'shopee_data.json');
        if (fs.existsSync(dataFile)) {
            scrapedData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
        }
    }

    const validProducts = scrapedData.filter(p => !p.fb_posted);
    if (validProducts.length < 2) {
        console.log("❌ Không đủ 2 sản phẩm Shopee chưa đăng! Vui lòng cào thêm.");
        return;
    }

    // Đang test nên để false hiện màn hình nha sếp
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications'] 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.setCookie(...cookies);
    
    console.log("🌐 Đang truy cập Facebook Reels...");
    await logToWeb(email, 'fb-cmt-reels', '🌐 Đang truy cập Facebook Reels để rải link...', 'info');
    await page.goto('https://www.facebook.com/reels', { waitUntil: 'networkidle2' });
    
    console.log("🎭 Đang xem Reels...");
    await delay(3000);
    
    let affCommented = 0;
    let normalCommented = 0;
    const maxAff = 2; // Cmt 2 cái link aff
    const maxNormal = 1; // Cmt 1 cái khen bình thường
    
    for (let i = 0; i < maxAff + maxNormal + 3; i++) {
        if (affCommented >= maxAff && normalCommented >= maxNormal) break;
        
        try {
            console.log(`🎬 Đang xem Reel thứ ${i + 1}...`);
            await delay(getRandomInt(5000, 15000));
            
            // Tìm nút Like và Thả tim/Like
            const liked = await page.evaluate(() => {
                const likeBtns = Array.from(document.querySelectorAll('div[role="button"][aria-label="Thích"], div[role="button"][aria-label="Like"]'));
                const visibleLikeBtn = likeBtns.find(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight;
                });
                
                if (visibleLikeBtn) {
                    visibleLikeBtn.click();
                    return true;
                }
                return false;
            });
            if (liked) console.log("👍 Đã thả Like cho Reel!");
            await delay(1500);

            // Bấm vào nút Bình luận
            const clickedCmt = await page.evaluate(() => {
                const cmtBtns = Array.from(document.querySelectorAll('div[role="button"][aria-label="Bình luận"], div[role="button"][aria-label="Leave a comment"]'));
                const visibleCmtBtn = cmtBtns.find(el => {
                    const rect = el.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight;
                });
                
                if (visibleCmtBtn) {
                    visibleCmtBtn.click();
                    return true;
                }
                return false;
            });
            
            if (clickedCmt) {
                console.log("💬 Đã mở bảng Bình luận, chờ xíu...");
                await delay(3000);
                
                // Quyết định xem cmt loại nào (Affiliate hay Normal)
                let isAffiliate = false;
                if (affCommented < maxAff && normalCommented < maxNormal) {
                    isAffiliate = Math.random() > 0.5; // Random 50/50 nếu cả 2 còn slot
                } else if (affCommented < maxAff) {
                    isAffiliate = true;
                }
                
                let pickedProduct = null;
                let localImg = null;
                let cmtText = "";
                
                if (isAffiliate) {
                    pickedProduct = validProducts.find(p => !p.fb_posted_temp); // fb_posted_temp để theo dõi trong cùng 1 phiên
                    if (pickedProduct) {
                        pickedProduct.fb_posted_temp = true;
                        cmtText = `${pickedProduct.suggested_comment || 'Sản phẩm siêu hot'}\n${pickedProduct.aff_link}`;
                        if (pickedProduct.tele_file_id) {
                            localImg = await downloadImageFromTelegram(pickedProduct.tele_file_id);
                        }
                    } else {
                        isAffiliate = false; // Hết sản phẩm thì chuyển sang cmt thường
                    }
                }
                
                if (!isAffiliate) {
                    cmtText = SEED_COMMENTS[getRandomInt(0, SEED_COMMENTS.length - 1)];
                }

                // Tìm ô nhập comment và ĐÍNH KÈM ẢNH
                const uploadBoxInfo = await page.evaluate(() => {
                    const boxes = Array.from(document.querySelectorAll('div[role="textbox"][aria-label="Viết bình luận"], div[role="textbox"][aria-label="Leave a comment"], div[role="textbox"][contenteditable="true"]'));
                    const visibleBox = boxes.find(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                    });
                    
                    if (visibleBox) {
                        // Tìm vị trí nút Đính kèm ảnh (icon camera) ở gần ô nhập
                        let attachBtnRect = null;
                        let parent = visibleBox.parentElement;
                        for(let k=0; k<6; k++) {
                            if(!parent) break;
                            const fileIcons = Array.from(parent.querySelectorAll('div[aria-label="Đính kèm một ảnh hoặc video"], div[aria-label="Đính kèm ảnh hoặc video"], div[aria-label="Attach a photo or video"]'));
                            if (fileIcons.length > 0) {
                                const rect = fileIcons[0].getBoundingClientRect();
                                attachBtnRect = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
                                break;
                            }
                            parent = parent.parentElement;
                        }
                        
                        // Lấy tọa độ ô nhập để click vào
                        const boxRect = visibleBox.getBoundingClientRect();
                        return { 
                            boxX: boxRect.x + boxRect.width / 2, 
                            boxY: boxRect.y + boxRect.height / 2,
                            attachBtn: attachBtnRect 
                        };
                    }
                    return null;
                });
                
                if (uploadBoxInfo) {
                    // Click vào ô nhập trước
                    await page.mouse.click(uploadBoxInfo.boxX, uploadBoxInfo.boxY);
                    await delay(1000);

                    // Đính kèm ảnh (chỉ chạy nếu là Affiliate và có ảnh)
                    if (isAffiliate && localImg && uploadBoxInfo.attachBtn) {
                        try {
                            const [chooser] = await Promise.all([
                                page.waitForFileChooser({ timeout: 10000 }),
                                page.mouse.click(uploadBoxInfo.attachBtn.x, uploadBoxInfo.attachBtn.y)
                            ]);
                            await chooser.accept([localImg]);
                            console.log(`⏳ Chờ load ảnh đính kèm...`);
                            await delay(6000); // Đợi FB tải ảnh xong hẳn
                        } catch (e) {
                            console.log(`!!! Lỗi khi đính kèm ảnh:`, e.message);
                        }
                    }

                    // Gõ từng dòng caption + link
                    if (isAffiliate) {
                        console.log(`⌨️ Đang gõ nội dung kèm link Shopee...`);
                        const lines = cmtText.split('\n');
                        for (let line of lines) {
                            await page.keyboard.type(line, { delay: getRandomInt(20, 50) });
                            await page.keyboard.down('Shift');
                            await page.keyboard.press('Enter');
                            await page.keyboard.up('Shift');
                            await delay(200);
                        }
                    } else {
                        console.log(`⌨️ Đang gõ khen dạo: "${cmtText}"`);
                        await page.keyboard.type(cmtText, { delay: getRandomInt(30, 80) });
                    }

                    await delay(2000);
                    await page.keyboard.press('Enter');
                    
                    if (isAffiliate) {
                        console.log("✓ Đã bắn Comment rải link thành công!");
                        affCommented++;
                        if (pickedProduct) pickedProduct.fb_posted = true;
                    } else {
                        console.log("✓ Đã bắn Comment khen dạo thành công!");
                        normalCommented++;
                    }
                    
                    if (localImg && fs.existsSync(localImg)) fs.unlinkSync(localImg);
                    
                    await delay(2000);
                    // Đóng bảng comment (bấm phím Esc)
                    await page.keyboard.press('Escape');
                    await delay(1000);
                } else {
                    console.log("⚠️ Không tìm thấy ô nhập Comment!");
                }
            } else {
                console.log("⚠️ Không tìm thấy nút Bình luận trên Reel này.");
            }
            
            console.log("⬇️ Chuyển sang Reel tiếp theo...");
            await page.keyboard.press('ArrowDown');
            await delay(2000);
            
        } catch (err) {
            console.log(`✗ Lỗi khi tương tác Reel ${i + 1}: ${err.message}`);
        }
    }
    
    // Lưu trạng thái đã post
    if (dbConfig && dbConfig.id && supabase) {
        await supabase.from('profiles').update({ parsed_affiliate_links: scrapedData }).eq('id', dbConfig.id);
    }
    const dataFile = path.resolve(__dirname, 'shopee_data.json');
    if (fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify(scrapedData, null, 2));

    // === CẬP NHẬT COOKIE MỚI VÀO SUPABASE ===
    console.log("🍪 Đang trích xuất Cookie FB mới để gia hạn...");
    const currentCookies = await page.cookies();
    
    try {
        if (currentCookies.length > 0) {
            const { error: updateErr } = await supabase
                .from('profiles')
                .update({ fb_cookie: JSON.stringify(currentCookies) })
                .eq('email', email);
                
            if (updateErr) {
                console.error("❌ Lỗi khi cập nhật Cookie lên Supabase:", updateErr);
            } else {
                console.log("✅ Đã lưu Cookie FB mới vào DB thành công (Gia hạn phiên).");
            }
        }
    } catch (e) {
         console.log("Lỗi cập nhật Cookie DB:", e.message);
    }
    // ==========================================

    await logToWeb(email, 'fb-cmt-reels', `🎉 Hoàn tất Seeding: ${affCommented} link Aff + ${normalCommented} lời khen!`, 'success');
    console.log(`🎉 Hoàn tất chu trình Seeding rải link Reels! (Aff: ${affCommented}, Khen: ${normalCommented})`);
    
    await browser.close();
})();
