require('dotenv').config(); // Load .env local khi test, bỏ qua khi chạy trên GitHub Actions
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { fetchBotConfig } = require('./supabase_helper');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const axios = require('axios');
const path = require('path');

// ==========================================
// CẤU HÌNH & BIẾN MÔI TRƯỜNG
// ==========================================
const TELEGRAM_BOT_TOKEN = process.env.TELE_BOT_TOKEN;
const NICK_INDEX = process.env.NICK_INDEX || '1';
const NICHE = process.env[`ACC${NICK_INDEX}_NICHE`] || 'quanao'; // 'quanao' hoặc 'drama'

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Load kho sản phẩm tổng hợp (cả Thời Trang lẫn Son/Makeup)
// Nick Drama sẽ dùng cả 2 ngach để Ninja Comment
const PRODUCTS_DATA_PATH = path.resolve(__dirname, 'data_products.json');
const allProducts = fs.existsSync(PRODUCTS_DATA_PATH)
    ? JSON.parse(fs.readFileSync(PRODUCTS_DATA_PATH, 'utf8')).filter(p => p.product_name && p.product_name !== '')
    : [];

// Tách theo đúng category để phân phối comment chuẩn xác
const dramaProducts = allProducts.filter(p => p.category === 'drama');        // 12 sp Son/Makeup của nick Drama
const uyenProducts = allProducts.filter(p => p.category === 'uyen');         // 13 link affiliate gốc của Uyên
const uyenFashionItems = allProducts.filter(p => p.category === 'uyen_fashion'); // 5 link thời trang gán thẳng vào bài

// 5 link thời trang của Uyên — gán cố định thẳng vào body bài viết đúng ngày
const FASHION_DAY_LINKS = {
    15: 'https://s.shopee.vn/2Vprblnbew',
    20: 'https://s.shopee.vn/5LA2z0Xc2O',
    25: 'https://s.shopee.vn/4qDmO7Yz1b',
    28: 'https://s.shopee.vn/20tb0wVUHA',
    34: 'https://s.shopee.vn/1113p8TfrF'
};

// Ninja Comment pool:
// — Nick Uyên: 13 link affiliate gốc (uyen)
// — Nick Drama: 12 drama + 13 uyen + 5 uyen_fashion = 30 link (mà phủ hết mọi ngách)
function getRandomProductComment(niche) {
    const pool = niche === 'uyen'
        ? uyenProducts
        : [...dramaProducts, ...uyenProducts, ...uyenFashionItems]; // Drama dùng cả 30
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ==========================================
// QUẢN LÝ VÒNG ĐỜI NICK (ACCOUNT LIFECYCLE)
// ==========================================
const STATE_FILE = path.resolve(__dirname, `account_state_${NICK_INDEX}.json`);

function getAccountState() {
    if (fs.existsSync(STATE_FILE)) {
        return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
    // Khởi tạo ngày 1
    const initialState = { start_date: new Date().toISOString(), posts_done: [] };
    fs.writeFileSync(STATE_FILE, JSON.stringify(initialState, null, 2));
    return initialState;
}

function getDaysSinceStart(startDate) {
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ==========================================
// HÀM TẢI ẢNH TỪ TELEGRAM
// ==========================================
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

async function downloadImageFromUrl(url) {
    console.log(`[INFO] Kéo ảnh từ direct URL...`);
    try {
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        const localPath = path.resolve(__dirname, `temp_img_${Date.now()}.jpg`);
        const writer = fs.createWriteStream(localPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(localPath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('[ERROR] Lỗi tải ảnh từ URL:', error.message);
        return null;
    }
}

// ==========================================
// HÀM CHỌN BÀI ĐĂNG DỰA VÀO VÒNG ĐỜI
// ==========================================
function selectPostForToday(day, state, rawData) {
    // Ngày 1-13: Ngâm nick — chỉ bốc bài sạch không có link
    if (day <= 13) {
        return rawData.find(p => !state.posts_done.includes(p.post_id) && !p.content.text.includes('shopee.vn'));
    }

    // Ngày đặc biệt của nick Uyên: ghím 5 link thời trang thẳng vào body bài viết
    // (các bài này được xử lý trong runFarm, đây chỉ điều hướng bốc bài sạch)
    const fashionDays = Object.keys(FASHION_DAY_LINKS).map(Number);
    if (NICHE === 'quanao' && fashionDays.includes(day)) {
        // Bốc bài sạch bất kỳ chưa đăng (link thời trang sẽ được nhúng thẳng vào text ở runFarm)
        return rawData.find(p => !state.posts_done.includes(p.post_id));
    }

    // Mặc định: bốc bài chưa đăng
    return rawData.find(p => !state.posts_done.includes(p.post_id));
}

// ==========================================
// HÀM ĐĂNG BÀI LÊN THREADS BẰNG PUPPETEER
// ==========================================
async function postToThreads(page, postText, imagePaths, day, NICHE, FASHION_DAY_LINKS, isNinjaLink, ninjaComment) {
    console.log('[INFO] Đang mở Threads...');
    await page.goto('https://www.threads.net/', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(3000);

    // 1. Click nút Create Thread (Write)
    try {
        const clicked = await page.evaluate(() => {
            // 1. Ưu tiên click nút Create ở sidebar/menu chính (thường nằm trong thẻ nav)
            const nav = document.querySelector('nav') || document.body;
            const btns = [...nav.querySelectorAll('div[role="button"], a, svg')];
            const writeBtn = btns.find(b => {
                const label = (b.getAttribute('aria-label') || '').toLowerCase();
                const title = (b.getAttribute('title') || '').toLowerCase();
                // Bắt chính xác để tránh dính 'Tạo thread' trong phần gợi ý profile
                return label === 'write' || label === 'tạo' || label === 'create' || label === 'new thread' ||
                       title === 'write' || title === 'tạo' || title === 'create';
            });

            if (writeBtn) {
                const clickable = writeBtn.closest('[role="button"]') || writeBtn;
                clickable.click();
                return 'Icon Menu';
            }

            // 2. Fallback tìm qua text placeholder trên Feed
            const allEls = [...document.querySelectorAll('span, div')];
            const startText = allEls.find(el => {
                const txt = el.innerText?.trim();
                return txt === 'Start a thread...' || txt === 'Bắt đầu thread...' || txt === 'Có gì mới?';
            });
            if (startText) {
                startText.click();
                return 'Text Placeholder';
            }

            return false;
        });

        if (clicked) {
            console.log(`[INFO] Đã click mở bảng viết bài qua: ${clicked}`);
        } else {
            console.error('[ERROR] Không tìm thấy nút Write/Create!');
            await page.screenshot({ path: 'debug_write_error.png' });
            return false;
        }
    } catch (e) {
        console.error('[ERROR] Lỗi click nút Write:', e.message);
        return false;
    }
    await delay(4000); // Chờ modal mở hoàn toàn

    // Kiểm tra đăng nhập thành công chưa
    const currentUrl = page.url();
    console.log(`[INFO] URL hiện tại: ${currentUrl}`);
    if (currentUrl.includes('login')) {
        console.error('[ERROR] Cookie hết hạn hoặc không hợp lệ — đang ở trang login!');
        return false;
    }

    // 2. Điền Text — Threads dùng Lexical Editor, thử nhiều selector
    const textSelectors = [
        'div[contenteditable="true"][role="textbox"]',
        'div[contenteditable="true"]',
        'div[role="textbox"]',
        'p[data-lexical-editor="true"]',
        'div[data-lexical-editor="true"]',
    ];
    let textInput = null;
    for (const sel of textSelectors) {
        try {
            await page.waitForSelector(sel, { timeout: 5000 });
            textInput = sel;
            console.log(`[INFO] Tìm thấy text editor: ${sel}`);
            break;
        } catch { }
    }
    if (!textInput) {
        // Debug: log các element có contenteditable trên trang
        const debugInfo = await page.evaluate(() => {
            const els = document.querySelectorAll('[contenteditable], [role="textbox"], [data-lexical-editor]');
            return [...els].map(e => ({ tag: e.tagName, role: e.getAttribute('role'), ce: e.getAttribute('contenteditable'), class: e.className.substring(0, 50) }));
        });
        console.log('[DEBUG] Các editor tìm thấy:', JSON.stringify(debugInfo));
        console.error('[ERROR] Không tìm thấy ô nhập text');
        await page.screenshot({ path: 'debug_editor_error.png' });
        return false;
    }
    try {
        await page.click(textInput);
        await delay(500);
        await page.keyboard.type(postText, { delay: 30 });
    } catch (e) {
        console.error('[ERROR] Không type được text:', e.message);
        return false;
    }

    // 3. Upload Ảnh qua FileChooser (mô phỏng click thật để React nhận)
    if (imagePaths && imagePaths.length > 0) {
        // Giới hạn tối đa 9 ảnh
        const finalImagePaths = imagePaths.slice(0, 9);
        try {
            console.log(`[INFO] Chuẩn bị tải ${finalImagePaths.length} ảnh lên...`);
            const [chooser] = await Promise.all([
                page.waitForFileChooser({ timeout: 10000 }),
                page.evaluate(() => {
                    // Ưu tiên click nút Đính kèm phương tiện
                    const attachBtn = document.querySelector('svg[aria-label="Attach media"], svg[aria-label="Đính kèm phương tiện"]');
                    if (attachBtn) {
                        attachBtn.closest('[role="button"]').click();
                    } else {
                        // Nếu không có nút, click thẳng vào thẻ input ẩn
                        document.querySelector('input[type="file"]')?.click();
                    }
                })
            ]);

            if (chooser) {
                await chooser.accept(finalImagePaths);
                console.log(`[INFO] Đã attach ${finalImagePaths.length} ảnh thành công!`);
                await delay(3000); // Đợi ảnh render lên khung preview
            }
        } catch (e) {
            console.log('[WARN] Lỗi tải ảnh qua FileChooser (bỏ qua):', e.message);
        }
    }


    // DEBUG: Chụp ảnh hiện trường trước khi Post để xem ảnh có lên form chưa và toggle đúng chưa
    console.log('[INFO] Đang chụp ảnh màn hình form trước khi Post...');
    await page.screenshot({ path: 'debug_before_post.png' });

    // 4. Click nút Post — tìm qua text content
    console.log('[INFO] Đang tìm nút Post...');
    await delay(1000);
    try {
        const postBtnInfo = await page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]') || document;
            const btns = [...dialog.querySelectorAll('div[role="button"], button')];
            const postBtns = btns.filter(b => {
                const t = b.innerText?.trim();
                return t === 'Post' || t === 'Đăng';
            });
            if (postBtns.length > 0) {
                const postBtn = postBtns[postBtns.length - 1]; // Lấy nút cuối cùng (thường là trong modal active)
                const style = window.getComputedStyle(postBtn);
                if (postBtn.hasAttribute('disabled') || postBtn.getAttribute('aria-disabled') === 'true' || style.opacity !== '1') {
                    return 'DISABLED';
                }
                const rect = postBtn.getBoundingClientRect();
                return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            }
            return 'NOT_FOUND';
        });
        if (postBtnInfo === 'NOT_FOUND') throw new Error('Không tìm thấy nút Post trong DOM');
        if (postBtnInfo === 'DISABLED') {
            console.error('[ERROR] Nút Post bị mờ (disabled), có thể do bài viết trống rỗng hoặc upload ảnh lỗi!');
            await page.screenshot({ path: 'debug_post_disabled.png' });
            return false;
        }
        console.log('[INFO] Đã tìm thấy toạ độ nút Post, chuẩn bị click...');
        await page.mouse.click(postBtnInfo.x, postBtnInfo.y);
        console.log('[INFO] Đã click nút Post bằng chuột thật!');
        
        // Chờ Toast xuất hiện để BIẾT CHẮC CHẮN bài đã được upload xong (nhưng KHÔNG click vào nó)
        console.log('[INFO] Đang chờ hệ thống upload ảnh và lưu bài (rình Toast báo thành công)...');
        let uploadSuccess = false;
        for (let i = 0; i < 40; i++) {
            const toastAppeared = await page.evaluate(() => {
                const btns = [...document.querySelectorAll('div[role="button"], a')];
                const viewBtn = btns.find(b => {
                    const t = (b.innerText || '').trim().toLowerCase();
                    if (t === 'view' || t === 'xem' || t === 'xem bài viết' || t === 'view post') {
                        const parentText = (b.parentElement?.innerText || '').toLowerCase();
                        const grandparentText = (b.parentElement?.parentElement?.innerText || '').toLowerCase();
                        const textToCheck = parentText.length > 5 ? parentText : grandparentText;
                        if (textToCheck.length > 0 && textToCheck.length < 80) {
                            if (textToCheck.includes('đăng') || textToCheck.includes('post')) return true;
                        }
                    }
                    return false;
                });
                return !!viewBtn;
            });
            
            if (toastAppeared) {
                uploadSuccess = true;
                console.log('[INFO] Bài đã được tải lên server thành công (đã thấy Toast)!');
                break;
            }
            await delay(1000);
        }

        if (!uploadSuccess) {
            console.log('[WARN] Quá 40s không thấy Toast báo đăng thành công, nhưng cứ thử đi tiếp...');
        }
        await delay(2000); // Đợi thêm 2s cho mượt
        
        console.log('[INFO] Đang lấy link Trang cá nhân từ thanh điều hướng để đi về...');
        const profileUrl = await page.evaluate(() => {
            const main = document.querySelector('main');
            const allLinks = Array.from(document.querySelectorAll('a[href^="/@"]'));
            
            // Tìm thẻ <a> trỏ tới profile (không chứa /post/ và không nằm trong khu vực main feed)
            const navProfileLink = allLinks.find(a => {
                if (a.href.includes('/post/')) return false;
                if (main && main.contains(a)) return false;
                return true; // Đây chắc chắn là link tới trang cá nhân trên sidebar!
            });
            return navProfileLink ? navProfileLink.href : null;
        });

        try {
            if (profileUrl) {
                console.log('[INFO] Đã tìm thấy link nhà:', profileUrl);
                await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
            } else {
                const fallbackUser = NICHE === 'quanao' ? 'uyennhi.daily_wear' : 'qmeoooo___';
                console.log(`[WARN] Không tìm thấy link profile trên DOM! Ép load thẳng nhà của: ${fallbackUser}`);
                await page.goto(`https://www.threads.net/@${fallbackUser}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
            }
        } catch (navErr) {
            console.log(`[WARN] Lỗi tải trang Profile: ${navErr.message}. Nhưng bài đăng đã lên, vẫn tính là thành công!`);
        }
        await delay(6000); // Chờ trang Profile tải xong hoàn toàn

        await page.screenshot({ path: 'debug_after_post.png' });
    } catch (e) {
        console.error('[ERROR]', e.message);
        return false;
    }

    // 5. Ninja Comment (thả link xuống comment của bài số 2)
    if (isNinjaLink && ninjaComment) {
        console.log('[INFO] Bắt đầu Ninja Comment vào bài thứ 2 từ trên xuống...');
        try {
            // Lăn chuột xuống để bài số 2 lộ ra và né cái banner "Hoàn tất Profile" nếu có
            await page.mouse.wheel({ deltaY: 800 });
            await delay(2000);

            // Tìm nút Reply thứ 2 trên tường
            const replyBox = await page.evaluate(() => {
                const svgs = [...document.querySelectorAll('svg')];
                const replyIcons = svgs.filter(s => {
                    const label = (s.getAttribute('aria-label') || '').toLowerCase();
                    return label === 'reply' || label === 'trả lời' || label === 'comment' || label === 'bình luận';
                });
                
                if (replyIcons.length > 1) {
                    const targetBtn = replyIcons[1]; // Bài thứ 2
                    const clickable = targetBtn.closest('div[role="button"], button') || targetBtn;
                    clickable.scrollIntoView({ behavior: 'instant', block: 'center' });
                    const rect = clickable.getBoundingClientRect();
                    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                } else if (replyIcons.length === 1) {
                    const targetBtn = replyIcons[0];
                    const clickable = targetBtn.closest('div[role="button"], button') || targetBtn;
                    clickable.scrollIntoView({ behavior: 'instant', block: 'center' });
                    const rect = clickable.getBoundingClientRect();
                    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                }
                return null;
            });

            if (replyBox) {
                await delay(1000); // Wait for scroll to settle
                await page.mouse.click(replyBox.x + replyBox.width / 2, replyBox.y + replyBox.height / 2);
                console.log('[INFO] Đã click mở hộp thoại Reply...');
                await delay(3000);
                
                try {
                    await page.waitForSelector('div[contenteditable="true"]', { timeout: 5000 });
                } catch (e) {
                    console.log('[WARN] Click Reply rồi nhưng không thấy ô nhập chữ. Đang thử click bằng DOM...');
                    await page.evaluate(() => {
                        const svgs = [...document.querySelectorAll('svg')];
                        const replyIcons = svgs.filter(s => {
                            const label = (s.getAttribute('aria-label') || '').toLowerCase();
                            return label === 'reply' || label === 'trả lời' || label === 'comment' || label === 'bình luận';
                        });
                        if (replyIcons.length > 1) {
                            const btn = replyIcons[1].closest('div[role="button"], button') || replyIcons[1];
                            btn.click();
                        } else if (replyIcons.length === 1) {
                            const btn = replyIcons[0].closest('div[role="button"], button') || replyIcons[0];
                            btn.click();
                        }
                    });
                    await delay(3000);
                    await page.waitForSelector('div[contenteditable="true"]', { timeout: 5000 });
                }
                await page.click('div[contenteditable="true"]');
                const lines = ninjaComment.split('\n');
                for (let line of lines) {
                    await page.keyboard.type(line, { delay: 30 });
                    await page.keyboard.down('Shift');
                    await page.keyboard.press('Enter');
                    await page.keyboard.up('Shift');
                    await delay(100);
                }
                await delay(2000); // Đợi type xong hẳn

                const postBox = await page.evaluate(() => {
                    const dialog = document.querySelector('div[role="dialog"]') || document;
                    const svgs = Array.from(dialog.querySelectorAll('svg'));
                    
                    const submitSvgs = svgs.filter(s => {
                        const label = (s.getAttribute('aria-label') || '').toLowerCase();
                        return label === 'câu trả lời' || label === 'reply' || label === 'post' || label === 'đăng';
                    });
                    
                    if (submitSvgs.length > 0) {
                        for (let i = submitSvgs.length - 1; i >= 0; i--) {
                            const btn = submitSvgs[i].closest('div[role="button"], button') || submitSvgs[i];
                            if (btn && !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true') {
                                const rect = btn.getBoundingClientRect();
                                return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                            }
                        }
                    }
                    return null;
                });
                
                if (postBox) {
                    await page.mouse.click(postBox.x + postBox.width / 2, postBox.y + postBox.height / 2);
                    console.log('[SUCCESS] Đã bắt được và click nút mũi tên (Send) bằng chuột thật!');
                } else {
                    console.log("[WARN] Không tìm thấy tọa độ nút Đăng, thử dùng phím tắt...");
                    await delay(1000);
                    await page.keyboard.down('Meta');
                    await page.keyboard.press('Enter');
                    await page.keyboard.up('Meta');
                    
                    await page.keyboard.down('Control');
                    await page.keyboard.press('Enter');
                    await page.keyboard.up('Control');
                    console.log('[INFO] Đã nhồi thêm phím tắt Cmd+Enter/Ctrl+Enter!');
                }

                await delay(15000); // Chờ comment gửi đi lên server (Tăng lên 15s để chắc chắn không ngắt ngang)
            } else {
                console.log('[WARN] Không tìm thấy nút Reply (icon bong bóng) dưới bài viết!');
            }
        } catch (e) {
            console.error('[ERROR] Ninja Comment thất bại:', e.message);
        }
    }

    return true;
}

// ==========================================
// LUỒNG CHẠY CHÍNH (MAIN LOOP)
// ==========================================
async function runFarm() {
    let pm2ProcessName = 'thread-quanao-farmer';
    if (NICHE === 'drama') pm2ProcessName = 'thread-drama-farmer';
    else if (NICHE === 'drama_ig') pm2ProcessName = 'thread-drama-ig-farmer';
    
    const manualFlagPath = path.resolve(__dirname, `${pm2ProcessName}.manual`);
    
    if (fs.existsSync(manualFlagPath)) {
        console.log(`⚡ Phát hiện lệnh chạy từ Sếp (Telegram)! Bỏ qua bước ngâm nick, phi thẳng vào post bài!`);
        fs.unlinkSync(manualFlagPath); // Xoá cờ đi để lần sau chạy tự động còn biết mà ngâm nick
    } else {
        const randomMinutes = Math.floor(Math.random() * 25) + 1;
        console.log(`⏱ HỆ THỐNG BOT TỰ ĐỘNG: Đang ngâm nick (delay ngẫu nhiên) ${randomMinutes} phút trước khi bắt đầu...`);
        await delay(randomMinutes * 60 * 1000);
    }
    console.log(`🚀 BẮT ĐẦU MÁY CÀY (NICK SỐ ${NICK_INDEX} - NGÁCH ${NICHE.toUpperCase()})`);

    const state = getAccountState();
    const day = getDaysSinceStart(state.start_date);
    console.log(`📅 Hôm nay là Ngày thứ ${day} của Vòng đời Nick.`);

    // Đọc Data
    let dataFileName = 'drama_ready_to_post.json';
    if (NICHE === 'quanao') dataFileName = 'data_ready_to_post.json';
    else if (NICHE === 'drama_ig') dataFileName = 'ig_ready_to_post.json';
    const dataPath = path.resolve(__dirname, dataFileName);
    if (!fs.existsSync(dataPath)) {
        console.error(`[ERROR] Không tìm thấy kho Data: ${dataPath}`);
        return;
    }
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Chọn bài
    const selectedPost = selectPostForToday(day, state, rawData);
    if (!selectedPost) {
        console.log('[WARN] Không còn bài nào phù hợp cho hôm nay!');
        return;
    }

    console.log(`📌 Đã bốc bài ID: ${selectedPost.post_id}`);

    // Kéo cấu hình từ Supabase
    let dbConfig = null;
    try {
        dbConfig = await fetchBotConfig();
    } catch (e) {}

    // Chuẩn bị Text và Ninja Comment
    let postText = selectedPost.content.text || '';
    let isNinjaLink = false;
    let ninjaComment = '';

    // === Xử lý ĐẶC BIỆT: Nick Uyên vào ngày Fashion ===
    // Nhúng 5 link thời trang thẳng vào cuối bài viết theo đúng ngày
    const fashionDays = Object.keys(FASHION_DAY_LINKS).map(Number);
    if (NICHE === 'quanao' && fashionDays.includes(day)) {
        postText += `\n\n${FASHION_DAY_LINKS[day]}`;
    }

    // === Ninja Comment Logic — tự động thả link xuống comment bài vừa đăng ===
    if (dbConfig?.parsed_affiliate_links && dbConfig.parsed_affiliate_links.length > 0) {
        const catchphrases = [
            "Cái này xài thích lắm á mn, tui ưng xỉu:",
            "Mấy bà ơi gom lẹ deal này nha, xài bao êm:",
            "Ai chưa thử cái này thì thử liền đi, khum hối hận đâu:",
            "Eo ôi ưng the bụng ghê, để lại link cho bà nào cần nè:",
            "Góc rắc thính: Món này dạo này tui mê cực kì:",
            "Hôm bữa ai hỏi tui xài gì thì link đây nha:",
            "Đừng hỏi sao tui chăm mua sắm, tại mấy món này xịn quá nè:"
        ];
        let pickedProduct = dbConfig.parsed_affiliate_links[Math.floor(Math.random() * dbConfig.parsed_affiliate_links.length)];
        isNinjaLink = true;
        if (pickedProduct.suggested_comment) {
            ninjaComment = `${pickedProduct.suggested_comment}\n${pickedProduct.aff_link}`;
        } else {
            let randomThinh = catchphrases[Math.floor(Math.random() * catchphrases.length)];
            ninjaComment = `👉 ${randomThinh} ${pickedProduct.aff_link}`;
        }
    } else if (allProducts.length > 0) {
        const pickedProduct = getRandomProductComment(NICHE);
        if (pickedProduct) {
            isNinjaLink = true;
            ninjaComment = pickedProduct.suggested_comment;
        }
    }

    // Tải Ảnh
    let localImagePaths = [];
    const mediaArray = selectedPost.content?.media || selectedPost.media || [];

    if (selectedPost.file_id && mediaArray.length === 0) {
        const path = await downloadImageFromTelegram(selectedPost.file_id);
        if (path) localImagePaths.push(path);
    } else {
        for (const item of mediaArray) {
            let path = null;
            if (item.file_id) {
                path = await downloadImageFromTelegram(item.file_id);
            } else if (item.url) {
                path = await downloadImageFromUrl(item.url);
            }
            if (path) localImagePaths.push(path);
        }
    }

    if (!postText.trim() && localImagePaths.length === 0) {
        console.error('[ERROR] Bài viết rỗng (không chữ, không ảnh). Bỏ qua!');
        return false;
    }

    // PUPPETEER

    const cookieString = dbConfig?.threads_cookie || process.env[`COOKIE_ACC${NICK_INDEX}`];

    if (!cookieString) {
        console.error('[ERROR] Thiếu Cookie!');
        return;
    }
    const rawCookies = JSON.parse(cookieString);

    // Threads mới chuyển sang domain threads.com, cần clone cookie sang các domain này
    const cookies = [];
    for (const raw of rawCookies) {
        let c = { ...raw };
        if (c.sameSite === 'no_restriction') c.sameSite = 'None';
        delete c.storeId;
        delete c.id;
        delete c.hostOnly;
        delete c.session;
        
        cookies.push({ ...c, domain: '.instagram.com' });
        cookies.push({ ...c, domain: '.threads.net' });
        cookies.push({ ...c, domain: '.threads.com' });
    }

    const browser = await puppeteer.launch({
        headless: 'new', // Chạy ngầm hoàn toàn
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications', '--lang=en-US']
    });

    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36');

        // Navigate đến trang login instagram trước để mồi cookie (an toàn hơn)
        await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.setCookie(...cookies.filter(c => c.domain === '.instagram.com'));

        // Inject cookie cho threads
        await page.setCookie(...cookies.filter(c => c.domain.includes('threads')));
        console.log(`[INFO] Đã inject ${cookies.length} cookies cho đa domain!`);

        // Sang threads
        await page.goto('https://www.threads.com/', { waitUntil: 'networkidle2', timeout: 30000 });
        await delay(3000);

        // Kiểm tra đăng nhập thành công
        const loggedIn = await page.evaluate(() => {
            const hasLoginBtn = !!document.querySelector('a[href*="/login"], a[href*="login"]');
            const hasSignupText = document.body.innerText.includes('Log in or sign up') || document.body.innerText.includes('Sign up to post');
            if (hasLoginBtn || hasSignupText) return false;
            return !!document.querySelector('[aria-label="Create"], [aria-label="Tạo"], svg[aria-label="Write"], svg[aria-label="Settings"]');
        });
        console.log(`[INFO] Đăng nhập: ${loggedIn ? '✓ OK' : '✗ Thất bại — cookie có thể hết hạn hoặc sai domain!'}`);
        if (!loggedIn) {
            await page.screenshot({ path: 'debug_login_failed.png' });
            try {
                const chatId = process.env.TELE_CHAT_ID || -5396355060;
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { chat_id: chatId, text: `✗ **Bot Threads (Nick ${NICK_INDEX} - ${NICHE})**\nLỗi: Đăng nhập thất bại (Cookie hết hạn hoặc sai domain)!`, parse_mode: 'Markdown' });
            } catch(err) {}
            return;
        }

        const success = await postToThreads(page, postText, localImagePaths, day, NICHE, FASHION_DAY_LINKS, isNinjaLink, ninjaComment);

        if (success) {
            state.posts_done.push(selectedPost.post_id);
            fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
            console.log(`[SUCCESS] Đã lưu State!`);
            try {
                const chatId = process.env.TELE_CHAT_ID || -5396355060;
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { chat_id: chatId, text: `✓ **Bot Threads (Nick ${NICK_INDEX} - ${NICHE})**\nĐã đăng bài thành công lên Threads!`, parse_mode: 'Markdown' });
            } catch(err) {}
        } else {
            try {
                const chatId = process.env.TELE_CHAT_ID || -5396355060;
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { chat_id: chatId, text: `✗ **Bot Threads (Nick ${NICK_INDEX} - ${NICHE})**\nLỗi: Đăng bài thất bại!`, parse_mode: 'Markdown' });
            } catch(err) {}
        }
    } catch (e) {
        console.error('[ERROR] Lỗi Puppeteer:', e.message);
        try {
            const chatId = process.env.TELE_CHAT_ID || -5396355060;
            await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, { chat_id: chatId, text: `✗ **Bot Threads (Nick ${NICK_INDEX} - ${NICHE})**\nLỗi Puppeteer sập: ${e.message}`, parse_mode: 'Markdown' });
        } catch(err) {}
    } finally {
        for (const p of localImagePaths) {
            if (p && fs.existsSync(p)) fs.unlinkSync(p);
        }
        await browser.close();
    }
}

runFarm();
