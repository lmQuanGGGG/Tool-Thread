const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { fetchBotConfig, logToWeb, updateUsageStats, supabase } = require('../supabase_helper');

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const SEED_COMMENTS = [
    "Bài viết hay quá ạ ❤️",
    "Tuyệt vời quá!",
    "Đẹp xuất sắc luôn bạn ơi 😍",
    "Tương tác mạnh nha bạn",
    "Chúc bạn ngày mới vui vẻ nha 🌸",
    "Tuyệt quá ạ",
    "Xuất sắc bạn ơi 💯"
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
    
    // Đang test nên để false hiện màn hình nha sếp
    const browser = await puppeteer.launch({ 
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications'] 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.setCookie(...cookies);
    
    console.log("🌐 Đang truy cập Facebook Reels...");
    await logToWeb(email, 'fb-cmt-reels', '🌐 Đang truy cập Facebook Reels...', 'info');
    await page.goto('https://www.facebook.com/reels', { waitUntil: 'networkidle2' });
    
    console.log("🎭 Đang xem Reels...");
    await delay(3000);
    
    let commented = 0;
    const maxComments = 3; // Số lượng cmt dạo mỗi phiên
    
    for (let i = 0; i < maxComments + 2; i++) {
        if (commented >= maxComments) break;
        
        try {
            console.log(`🎬 Đang xem Reel thứ ${i + 1}...`);
            // Xem Reel một chút cho giống người thật
            await delay(getRandomInt(5000, 15000));
            
            // Tìm nút Like và Thả tim/Like
            const liked = await page.evaluate(() => {
                const likeBtns = Array.from(document.querySelectorAll('div[role="button"][aria-label="Thích"], div[role="button"][aria-label="Like"]'));
                // Lấy nút like của Reel hiện tại (thường hiển thị rõ trên màn hình)
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
                await delay(3000); // Chờ bảng comment trượt ra
                
                // Bốc text ngẫu nhiên
                const textToType = SEED_COMMENTS[getRandomInt(0, SEED_COMMENTS.length - 1)];
                console.log(`⌨️ Đang gõ nội dung: "${textToType}"`);
                
                // Tìm ô nhập comment
                const typeSuccess = await page.evaluate((text) => {
                    const boxes = Array.from(document.querySelectorAll('div[role="textbox"][aria-label="Viết bình luận"], div[role="textbox"][aria-label="Leave a comment"], div[role="textbox"][contenteditable="true"]'));
                    const visibleBox = boxes.find(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                    });
                    
                    if (visibleBox) {
                        visibleBox.focus();
                        return true;
                    }
                    return false;
                });
                
                if (typeSuccess) {
                    await page.keyboard.type(textToType, { delay: getRandomInt(30, 80) });
                    await delay(1000);
                    await page.keyboard.press('Enter');
                    
                    console.log("✓ Đã bắn Comment dạo thành công!");
                    commented++;
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
            
            // Chuyển sang Reel tiếp theo bằng phím mũi tên xuống
            console.log("⬇️ Chuyển sang Reel tiếp theo...");
            await page.keyboard.press('ArrowDown');
            await delay(2000);
            
        } catch (err) {
            console.log(`✗ Lỗi khi tương tác Reel ${i + 1}: ${err.message}`);
        }
    }
    
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

    await logToWeb(email, 'fb-cmt-reels', `🎉 Hoàn tất cmt dạo cho ${commented} Reels!`, 'success');
    console.log("🎉 Hoàn tất chu trình Seeding Reels!");
    
    await browser.close();
})();
