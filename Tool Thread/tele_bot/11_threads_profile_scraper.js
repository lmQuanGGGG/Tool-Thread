require('dotenv').config({ path: __dirname + '/.env' });
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const { supabase } = require('./supabase_helper');

const TELEGRAM_BOT_TOKEN = process.env.TELE_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-5396355060';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function uploadToTelegram(fileUrl) {
    if (!TELEGRAM_BOT_TOKEN) return null;
    const tempFile = path.join(__dirname, `temp_scrape_${Date.now()}.jpg`);
    let retries = 3;
    while (retries > 0) {
        try {
            console.log(`Đang tải media từ: ${fileUrl.substring(0, 50)}...`);
            // Bypass Instagram/Threads image protection
            execSync(`curl -s -o "${tempFile}" "${fileUrl}" -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://www.threads.net/"`);
            
            if (!fs.existsSync(tempFile) || fs.statSync(tempFile).size < 100) {
                throw new Error('File tải về rỗng hoặc lỗi 404');
            }

            const FormData = require('form-data');
            const form = new FormData();
            form.append('chat_id', TELEGRAM_CHAT_ID);
            
            const isVideo = fileUrl.includes('.mp4');
            const endpoint = isVideo ? 'sendVideo' : 'sendDocument';
            
            form.append(isVideo ? 'video' : 'document', fs.createReadStream(tempFile));

            const uploadRes = await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${endpoint}`, form, {
                headers: form.getHeaders()
            });
            
            fs.unlinkSync(tempFile);
            
            if (isVideo && uploadRes.data.result.video) {
                return uploadRes.data.result.video.file_id;
            } else if (uploadRes.data.result.document) {
                return uploadRes.data.result.document.file_id;
            } else {
                return null;
            }
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error_code === 429) {
                const retryAfter = e.response.data.parameters.retry_after || 10;
                console.log(`[WARN] Bị Telegram chặn Rate Limit, đợi ${retryAfter} giây rồi thử lại...`);
                await delay(retryAfter * 1000 + 1000);
                retries--;
                continue;
            }
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            console.error('Lỗi upload media:', e.response ? JSON.stringify(e.response.data) : e.message);
            return null;
        }
    }
    return null;
}

// Hàm lấy cookie
function getCookies(dbConfig) {
    const { parseCookieString } = require('./supabase_helper');
    let cookies = [];
    if (dbConfig?.threads_cookie) {
        cookies = parseCookieString(dbConfig.threads_cookie, '.threads.net');
    }
    if ((!cookies || cookies.length === 0) && process.env.THREADS_COOKIE) {
        try {
            cookies = JSON.parse(process.env.THREADS_COOKIE);
        } catch (e) {
            cookies = parseCookieString(process.env.THREADS_COOKIE, '.threads.net');
        }
    }
    return cookies;
}

async function run() {
    const email = process.env.USER_EMAIL || 'admin@autofarm.com';
    console.log(`🤖 Bắt đầu cào profile Threads cho user: ${email}`);

    if (!supabase) {
        console.error("❌ Không thể kết nối Supabase (supabase client is null)! Vui lòng kiểm tra biến môi trường SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.");
        process.exit(1);
    }

    // Lấy config từ DB
    let { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .limit(1);

    if (error || !profiles || profiles.length === 0) {
        console.warn(`⚠️ Không tìm thấy user ${email} trong DB! Thử lấy một user bất kỳ làm fallback...`);
        const { data: fallbackProfiles } = await supabase.from('profiles').select('*').limit(1);
        if (!fallbackProfiles || fallbackProfiles.length === 0) {
            console.error("❌ Không có bất kỳ user nào trong bảng profiles! Vui lòng đăng ký tài khoản trên Web SaaS trước.");
            process.exit(1);
        }
        profiles = fallbackProfiles;
        console.log(`✅ Đã fallback sang user: ${profiles[0].email}`);
    }

    const dbConfig = profiles[0];
    const targetUrl = process.env.PROFILE_URL;

    if (!targetUrl || !targetUrl.includes('threads')) {
        console.error("❌ Không có link profile Threads hợp lệ để cào! (Vui lòng điền vào Github Action input 'target_url')");
        process.exit(1);
    }

    console.log(`🎯 Target Profile: ${targetUrl}`);

    const cookies = getCookies(dbConfig);
    if (!cookies || cookies.length === 0) {
        console.warn("⚠️ Không có cookie Threads, cào ở chế độ ẩn danh (có thể bị giới hạn)...");
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1280,960'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 960 });

    if (cookies.length > 0) {
        await page.setCookie(...cookies);
        console.log("✅ Đã nạp Cookie Threads!");
    }

    await page.evaluateOnNewDocument(() => {
        window.rawThreadsData = [];
        const originalFetch = window.fetch;
        window.fetch = async function (...args) {
            const response = await originalFetch.apply(this, args);
            const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
            if (url.includes('graphql')) {
                const clone = response.clone();
                clone.text().then(text => {
                    text.split('\n').forEach(chunk => {
                        try {
                            const json = JSON.parse(chunk);
                            const str = JSON.stringify(json);
                            if (str.includes('thread_items') || str.includes('text_post_app_info')) {
                                window.rawThreadsData.push(json);
                            }
                        } catch (e) {}
                    });
                }).catch(() => {});
            }
            return response;
        };

        const XHR = XMLHttpRequest.prototype;
        const open = XHR.open;
        const send = XHR.send;
        XHR.open = function (method, url) {
            this._reqUrl = url;
            return open.apply(this, arguments);
        };
        XHR.send = function () {
            this.addEventListener('load', function () {
                if (this._reqUrl && this._reqUrl.includes('graphql')) {
                    try {
                        this.responseText.split('\n').forEach(chunk => {
                            try {
                                const json = JSON.parse(chunk);
                                const str = JSON.stringify(json);
                                if (str.includes('thread_items') || str.includes('text_post_app_info')) {
                                    window.rawThreadsData.push(json);
                                }
                            } catch (e) {}
                        });
                    } catch (e) {}
                }
            });
            return send.apply(this, arguments);
        };
    });

    console.log("🌐 Đi đến trang profile...");
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    await delay(5000);

    const maxScrolls = parseInt(process.env.MAX_SCROLLS) || 15;
    console.log(`🤖 Bắt đầu auto-scroll ${maxScrolls} nhịp...`);
    for (let i = 0; i < maxScrolls; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(2500); // Chờ GraphQL load
        console.log(`Đã cuộn ${i + 1}/${maxScrolls} nhịp...`);
    }

    console.log("✅ Đã cuộn xong, đóng browser...");
    await browser.close();

    const rawThreadsData = await page.evaluate(() => window.rawThreadsData || []);

    if (!rawThreadsData || rawThreadsData.length === 0) {
        console.error("❌ Không bắt được dữ liệu nào. Có thể do chưa đăng nhập hoặc profile trống.");
        process.exit(1);
    }

    console.log("🔄 Bắt đầu bóc tách JSON và lọc bài trùng...");
    const cleanData = [];
    function extractFullData(node) {
        if (Array.isArray(node)) {
            node.forEach(extractFullData);
        } else if (node && typeof node === 'object') {
            if (node.post && node.post.user) {
                const post = node.post;
                const mediaList = [];

                const extractMedia = (mediaItem) => {
                    if (mediaItem.image_versions2?.candidates?.length > 0) {
                        mediaList.push({ type: 'image', url: mediaItem.image_versions2.candidates[0].url });
                    }
                    if (mediaItem.video_versions?.length > 0) {
                        mediaList.push({ type: 'video', url: mediaItem.video_versions[0].url });
                    }
                };

                if (post.carousel_media) {
                    post.carousel_media.forEach(extractMedia);
                } else {
                    extractMedia(post);
                }

                cleanData.push({
                    post_id: post.id || post.pk,
                    timestamp: post.taken_at,
                    post_url: post.code ? `https://www.threads.net/@${post.user.username}/post/${post.code}` : null,
                    author: {
                        username: post.user.username,
                        full_name: post.user.full_name,
                        is_verified: post.user.is_verified,
                        avatar_url: post.user.profile_pic_url
                    },
                    content: post.caption?.text || "",
                    media: mediaList,
                    stats: {
                        likes: post.like_count || 0,
                        replies: post.text_post_app_info?.direct_reply_count || 0,
                        reposts: post.text_post_app_info?.repost_count || 0,
                        quotes: post.text_post_app_info?.quote_count || 0
                    }
                });
            }
            Object.values(node).forEach(extractFullData);
        }
    }

    extractFullData(rawThreadsData);
    let uniqueData = Array.from(new Map(cleanData.map(item => [item.post_id, item])).values());
    
    // Sắp xếp cũ nhất lên trước hoặc mới nhất lên trước tuỳ nhu cầu.
    // Ở đây ta cứ xếp mới nhất trước
    uniqueData.sort((a, b) => b.timestamp - a.timestamp);
    console.log(`🎉 Bóc được ${uniqueData.length} bài đăng duy nhất từ trang!`);

    // CHỐNG TRÙNG VÀ GIỚI HẠN SỐ LƯỢNG (Chỉ xử lý bài chưa từng cào)
    const TIER_LIMITS = { free: 5, lite: 12, plus: 25, pro: 59, promax: 129 };
    const userTier = dbConfig.tier || 'free';
    const MAX_POSTS_TO_SAVE = TIER_LIMITS[userTier] || 5;
    
    console.log(`📌 Gói ${userTier.toUpperCase()} - Giới hạn tối đa ${MAX_POSTS_TO_SAVE} bài`);
    
    // Áp dụng giới hạn TRƯỚC KHI lọc trùng, để đảm bảo luôn chỉ check số lượng bài mới nhất giới hạn trong khoảng này
    uniqueData = uniqueData.slice(0, MAX_POSTS_TO_SAVE);
    
    const postIds = uniqueData.map(p => p.post_id.toString());
    
    const { data: existingPosts, error: existErr } = await supabase
        .from('crawl_data')
        .select('post_id')
        .eq('user_id', dbConfig.id)
        .in('post_id', postIds);

    const existingIds = new Set((existingPosts || []).map(p => p.post_id));
    
    // Lọc bỏ bài đã có trong DB, và cắt đúng 25 bài
    const newPosts = uniqueData.filter(p => !existingIds.has(p.post_id.toString())).slice(0, MAX_POSTS_TO_SAVE);

    if (newPosts.length === 0) {
        console.log("🛑 Tất cả các bài cào được đều đã tồn tại trong Database hoặc không có bài mới! Dừng tool.");
        process.exit(0);
    }

    console.log(`🔥 Bắt đầu xử lý ${newPosts.length} bài viết MỚI (Bỏ qua ${existingIds.size} bài đã trùng)...`);
    let successCount = 0;

    for (let i = 0; i < newPosts.length; i++) {
        const post = newPosts[i];
        console.log(`\n⏳ Đang xử lý post [${i+1}/${newPosts.length}] - ID: ${post.post_id}`);
        
        let image_file_ids = [];
        let image_urls = [];

        // 1. Upload Media to Telegram
        if (post.media && post.media.length > 0) {
            console.log(`   📸 Phát hiện ${post.media.length} media. Đang tiến hành Upload lên Telegram...`);
            for (let j = 0; j < post.media.length; j++) {
                if (post.media[j].url) {
                    console.log(`   ⏳ Đang tải media [${j+1}/${post.media.length}]...`);
                    image_urls.push(post.media[j].url);
                    const file_id = await uploadToTelegram(post.media[j].url);
                    if (file_id) {
                        image_file_ids.push(file_id);
                        console.log(`   ✅ Tải thành công media [${j+1}] -> File_ID: ${file_id}`);
                    } else {
                        console.log(`   ❌ Lỗi tải media [${j+1}]!`);
                    }
                    await delay(1000); // Rate limit protection
                }
            }
        } else {
            console.log(`   📝 Bài viết chỉ có Text, không có media.`);
        }
        
        // 2. Insert to Supabase DB (crawl_data)
        try {
            const { error: insertErr } = await supabase
                .from('crawl_data')
                .upsert({
                    user_id: dbConfig.id,
                    post_id: post.post_id.toString(),
                    source_url: post.post_url,
                    text_content: post.content,
                    image_urls: image_urls,
                    image_file_ids: image_file_ids,
                    posted: false
                }, { onConflict: 'user_id,post_id' });

            if (insertErr) {
                console.error(`❌ Lỗi insert Supabase post ${post.post_id}:`, insertErr.message);
            } else {
                successCount++;
                console.log(`✅ Lưu thành công post ${post.post_id} vào Database (crawl_data).`);
            }
        } catch (dbErr) {
            console.error(`❌ Lỗi kết nối Supabase post ${post.post_id}:`, dbErr.message);
        }
    }

    console.log(`\n🎯 HOÀN TẤT! Cào thành công ${successCount}/${newPosts.length} bài viết vào Database!`);
}

run().catch(console.error);
