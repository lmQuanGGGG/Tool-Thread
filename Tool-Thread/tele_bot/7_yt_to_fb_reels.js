const { execSync, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
require('dotenv').config();

// TÍCH HỢP ĐƯỜNG ỐNG SUPABASE
const { fetchBotConfig, updateUsageStats, logToWeb, checkQuota, sendTelegramMessage, parseCookieString, supabase } = require('./supabase_helper');

puppeteer.use(StealthPlugin());

const OUTPUT_DIR = path.resolve(__dirname, 'reels_videos');
const HISTORY_FILE = path.resolve(__dirname, 'reels_history.json');

// yt-dlp chỉ dùng để quét danh sách video của từng kênh.
const YTDLP_CMD = "yt-dlp";

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}

function cleanSingleGeminiText(rawText) {
    let text = String(rawText || '').replace(/\*/g, '').trim();
    text = text.replace(/^\s*(?:dưới đây|sau đây)[^\n:]*:\s*/i, '');
    const firstOption = text.match(/(?:^|\n|:)\s*(?:lựa chọn|option)\s*1\s*(?:\([^)]*\))?\s*:\s*/i);
    if (firstOption && firstOption.index !== undefined) {
        text = text.slice(firstOption.index + firstOption[0].length);
    }
    const nextOption = text.search(/(?:\n|:|\s)\s*(?:✨\s*)?(?:lựa chọn|option)\s*[2-9]\s*(?:\([^)]*\))?\s*:\s*/i);
    if (nextOption >= 0) text = text.slice(0, nextOption);
    if (text.startsWith('"') && text.endsWith('"')) text = text.slice(1, -1);
    return text.trim();
}

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

let postedIds = [];
if (fs.existsSync(HISTORY_FILE)) {
    try {
        postedIds = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) { }
}

function isDirectVideoUrl(url) {
    try {
        const host = new URL(url).hostname.toLowerCase();
        const pathName = new URL(url).pathname.toLowerCase();
        return host === 'v.douyin.com'
            || (host.endsWith('douyin.com') && (pathName.includes('/video/') || pathName.includes('/share/video/')))
            || (host.endsWith('tiktok.com') && pathName.includes('/video/'))
            || (host.includes('youtube.com') && (pathName === '/watch' || pathName.includes('/shorts/')))
            || host === 'youtu.be';
    } catch (_) {
        return false;
    }
}

async function fetchLatestVideos(channels) {
    let allVideos = [];
    for (let channel of channels) {
        console.log("🔍 Đang quét danh sách Videos từ:", channel);
        try {
            const directVideo = isDirectVideoUrl(channel);
            const args = directVideo
                ? ['--no-playlist', '--dump-single-json', channel]
                : [
                    '--flat-playlist', '--dump-json', '--playlist-end', '50',
                    '--extractor-args', 'youtube:player_client=android', channel
                ];
            const output = execFileSync(YTDLP_CMD, args, {
                encoding: 'utf8', maxBuffer: 20 * 1024 * 1024
            });

            for (const line of output.trim().split('\n')) {
                if (!line) continue;
                try {
                    const info = JSON.parse(line);
                    if (info.id) {
                        // extractor + id tránh trùng lịch sử giữa các nền tảng.
                        allVideos.push({
                            id: `${info.extractor_key || info.extractor || 'video'}:${info.id}`,
                            sourceId: info.id,
                            title: info.title || info.id,
                            // Với v.douyin.com, yt-dlp trả về URL đã resolve để GenDownload tải đúng video.
                            url: info.webpage_url || info.original_url || info.url || channel
                        });
                    }
                } catch (_) { }
            }
        } catch (err) {
            if (/douyin\.com/i.test(channel) && /Unsupported URL/i.test(err.message)) {
                console.error('✗ Link Douyin này đã redirect sang profile/trang chủ, không phải video công khai; bỏ qua nguồn này.');
            } else {
                console.error("✗ Lỗi quét kênh:", err.message);
            }
        }
    }
    return allVideos;
}

async function downloadFile(url, filePath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        timeout: 300000,
        headers: {
            // GenDownload's stream endpoint is intended for browser clients;
            // use a normal browser-like request when it proxies the source.
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
            'Accept': 'video/*,application/octet-stream;q=0.9,*/*;q=0.8',
        },
    });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
        response.data.on('error', reject);
    });
}

function removeFileQuietly(filePath) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function assertPlayableMedia(filePath, label) {
    const size = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    if (size < 1024) {
        throw new Error(`${label} rỗng hoặc quá nhỏ (${size} bytes).`);
    }

    try {
        const probe = JSON.parse(execFileSync('ffprobe', [
            '-v', 'error', '-show_entries', 'format=format_name,duration', '-of', 'json', filePath,
        ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
        const duration = Number(probe?.format?.duration || 0);
        if (!Number.isFinite(duration) || duration < 1) {
            throw new Error(`duration không hợp lệ (${duration || 0}s)`);
        }
    } catch (_) {
        throw new Error(`${label} không phải file media hợp lệ hoặc không có nội dung.`);
    }
}

function hasAudio(format) {
    return format.has_audio === true || format.hasAudio === true || format.audio === true
        || Boolean(format.audio_url || format.audioUrl)
        || (typeof format.acodec === 'string' && format.acodec !== 'none')
        || /audio\//i.test(format.mime_type || format.mimeType || '');
}

function isAudioOnly(format) {
    return format.type === 'audio' || format.vcodec === 'none' || /audio/i.test(format.label || '');
}

async function downloadVideoFromGenDownload(video, outputPath) {
    const outputDir = path.dirname(outputPath);
    const safeId = path.basename(outputPath, '.mp4');
    const { data } = await axios.post('https://gendownload.com/api/extract', { url: video.url }, {
        timeout: 60000,
        headers: { 'Content-Type': 'application/json' }
    });
    const formats = data?.formats || [];
    if (!formats.length) throw new Error('API GenDownload không trả về format nào.');

    const videoFormats = formats.filter((format) => format.url && !isAudioOnly(format));
    const bestVideo = videoFormats.find(hasAudio)
        || videoFormats.find((format) => format.label === '1080p')
        || videoFormats.find((format) => format.label === '720p')
        || videoFormats[0];
    if (!bestVideo) throw new Error('API GenDownload không trả về video hợp lệ.');

    await downloadFile(bestVideo.url, outputPath);
    assertPlayableMedia(outputPath, 'Video GenDownload');

    // Nếu video stream không chứa tiếng, dùng audio stream API trả về để ghép lại.
    const audioStream = () => execFileSync('ffprobe', [
        '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_type',
        '-of', 'default=noprint_wrappers=1:nokey=1', outputPath
    ], { encoding: 'utf8' }).trim();
    if (audioStream() !== 'audio') {
        const audioFormat = formats.find((format) => format.url && isAudioOnly(format));
        if (!audioFormat) {
            throw new Error('GenDownload chỉ trả về video không tiếng cho URL này.');
        }
        const audioPath = path.join(outputDir, `${safeId}.audio`);
        const mergedPath = path.join(outputDir, `${safeId}.merged.mp4`);
        await downloadFile(audioFormat.url, audioPath);
        assertPlayableMedia(audioPath, 'Audio GenDownload');
        execFileSync('ffmpeg', [
            '-y', '-i', outputPath, '-i', audioPath, '-c:v', 'copy', '-c:a', 'aac',
            '-map', '0:v:0', '-map', '1:a:0', '-shortest', mergedPath
        ], { stdio: 'pipe' });
        fs.renameSync(mergedPath, outputPath);
        fs.unlinkSync(audioPath);
    }
    if (audioStream() !== 'audio') {
        throw new Error('File sau khi xử lý vẫn không có audio stream.');
    }
    return outputPath;
}

function isYouTubeUrl(url) {
    try {
        const host = new URL(url).hostname.toLowerCase();
        return host.includes('youtube.com') || host === 'youtu.be';
    } catch (_) {
        return false;
    }
}

async function downloadVideoWithYtDlpFallback(video, outputPath) {
    const dir = path.dirname(outputPath);
    const base = path.basename(outputPath, '.mp4');
    const template = path.join(dir, `${base}.fallback.%(ext)s`);
    for (const name of fs.readdirSync(dir)) {
        if (name.startsWith(`${base}.fallback.`)) removeFileQuietly(path.join(dir, name));
    }

    execFileSync(YTDLP_CMD, [
        '--no-playlist', '--no-warnings', '--extractor-args', 'youtube:player_client=android',
        '--merge-output-format', 'mp4', '--remux-video', 'mp4',
        '-f', 'bv*+ba/b', '-o', template, video.url,
    ], { stdio: 'pipe', timeout: 300000 });

    const fallbackFiles = fs.readdirSync(dir)
        .filter((name) => name.startsWith(`${base}.fallback.`) && !name.endsWith('.part'))
        .map((name) => path.join(dir, name))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
    if (!fallbackFiles.length) throw new Error('yt-dlp không tạo file fallback.');

    assertPlayableMedia(fallbackFiles[0], 'Video fallback yt-dlp');
    removeFileQuietly(outputPath);
    fs.renameSync(fallbackFiles[0], outputPath);
    const audio = execFileSync('ffprobe', [
        '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=codec_type',
        '-of', 'default=noprint_wrappers=1:nokey=1', outputPath,
    ], { encoding: 'utf8' }).trim();
    if (audio !== 'audio') throw new Error('yt-dlp fallback tải video không có audio.');
    return outputPath;
}

async function downloadVideoWithAudio(video, outputDir) {
    // GenDownload là nguồn chính. Mỗi lần thử phải bóc token stream mới vì URL
    // tạm có thể hết hạn hoặc upstream trả body rỗng cho runner GitHub.
    const safeId = video.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const outputPath = path.join(outputDir, `${safeId}.mp4`);
    const errors = [];
    for (let attempt = 1; attempt <= 3; attempt++) {
        removeFileQuietly(outputPath);
        try {
            await downloadVideoFromGenDownload(video, outputPath);
            return outputPath;
        } catch (err) {
            errors.push(`lần ${attempt}: ${err.message}`);
            removeFileQuietly(outputPath);
            console.warn(`⚠ GenDownload tải lỗi (${attempt}/3): ${err.message}`);
            if (attempt < 3) await delay(attempt * 3000);
        }
    }

    // YouTube có extractor riêng trên runner; chỉ dùng làm phương án dự phòng
    // khi stream API GenDownload thất bại hoàn toàn.
    if (isYouTubeUrl(video.url)) {
        console.warn('↪ GenDownload không trả file hợp lệ, chuyển sang yt-dlp fallback cho YouTube...');
        try {
            return await downloadVideoWithYtDlpFallback(video, outputPath);
        } catch (err) {
            errors.push(`yt-dlp fallback: ${err.message}`);
            removeFileQuietly(outputPath);
        }
    }
    throw new Error(`Không tải được video sau các lần thử: ${errors.join(' | ')}`);
}

(async () => {
    const clickButtonWithText = async (page, texts, retries = 30) => {
        let clicked = false;
        for (let i = 0; i < retries; i++) {
            clicked = await page.evaluate((texts) => {
                const btns = Array.from(document.querySelectorAll('div[role="button"], span[role="button"], button'));
                const targetBtn = btns.find(b => {
                    const text = (b.innerText || '').trim().toLowerCase();
                    const disabled = b.getAttribute('aria-disabled') === 'true' || b.disabled;
                    if (disabled) return false;

                    // So khớp chính xác hoặc chỉ flexible với chữ 'tiếp tục' / 'continue'
                    return texts.some(t => {
                        if (text === t) return true;
                        if ((t === 'tiếp tục' || t === 'continue') && text.startsWith(t)) return true;
                        return false;
                    });
                });
                if (targetBtn) {
                    targetBtn.click();
                    return true;
                }
                return false;
            }, texts);
            if (clicked) break;
            await delay(3000);
        }
        return clicked;
    };

    // Facebook có thể nuốt Enter trong editor. Click nút gửi rồi tải lại Reel để
    // chỉ công nhận comment khi dữ liệu đã được Facebook lưu lại thật sự.
    const submitCommentAndVerify = async (page, commentText) => {
        const clickedSubmit = await page.evaluate(() => {
            const boxes = Array.from(document.querySelectorAll('div[role="textbox"][contenteditable="true"]'));
            const box = boxes.find((item) => {
                const rect = item.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            });
            if (!box) return false;

            let parent = box.parentElement;
            for (let level = 0; parent && level < 7; level += 1, parent = parent.parentElement) {
                const button = Array.from(parent.querySelectorAll('div[role="button"], button, span[role="button"]')).find((item) => {
                    const label = (item.getAttribute('aria-label') || item.innerText || '').trim().toLowerCase();
                    const disabled = item.getAttribute('aria-disabled') === 'true' || item.disabled;
                    return !disabled && [
                        'gửi', 'send', 'đăng bình luận', 'post comment',
                        'bình luận', 'comment', 'đăng', 'post'
                    ].includes(label);
                });
                if (button) {
                    button.click();
                    return true;
                }
            }
            return false;
        });

        // Chỉ dùng Enter làm dự phòng nếu UI không có nút gửi rõ ràng.
        if (!clickedSubmit) await page.keyboard.press('Enter');
        await delay(4000);

        try {
            await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
            await delay(3000);
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('div[role="button"][aria-label="Bình luận"], div[role="button"][aria-label="Leave a comment"]'));
                const button = buttons.find((item) => {
                    const rect = item.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                });
                if (button) button.click();
            });
            await delay(2000);

            await page.waitForFunction((text) => {
                const normalize = (value) => (value || '').replace(/\s+/g, ' ').trim();
                const signature = normalize(text.replace(/https?:\/\/\S+/gi, '')).slice(0, 24);
                if (signature.length < 8) return false;
                return Array.from(document.querySelectorAll('[role="article"], div, span')).some((element) => {
                    const value = normalize(element.innerText || element.textContent);
                    return value.includes(signature);
                });
            }, { timeout: 20000 }, commentText);
            return true;
        } catch (_) {
            return false;
        }
    };

    const getFacebookCookies = (config) => {
        const savedCookies = config?.fb_cookie_reels_arr || config?.fb_cookies_arr || [];
        if (savedCookies.length > 0) return savedCookies;
        return parseCookieString(process.env.FB_COOKIE, '.facebook.com');
    };

    const saveFacebookCookies = async (page, config) => {
        if (!config?.id || !supabase) return;
        const currentCookies = await page.cookies('https://www.facebook.com');
        const hasSession = currentCookies.some((cookie) => cookie.name === 'c_user')
            && currentCookies.some((cookie) => cookie.name === 'xs');
        if (!hasSession) throw new Error('Facebook không trả về c_user/xs sau khi nạp session.');

        // Lưu nguyên format Puppeteer/CDP trả về. Không đổi sameSite sang format
        // extension vì lần chạy sau Puppeteer không inject được `unspecified`.
        const { error } = await supabase
            .from('profiles')
            .update({ fb_cookie: JSON.stringify(currentCookies) })
            .eq('id', config.id);
        if (error) throw error;
    };

    const isFacebookLoginOrCheckpoint = async (page) => {
        const url = page.url();
        if (/\/(login|checkpoint)\b/i.test(url)) return true;
        return Boolean(await page.$('input[name="email"], input[name="pass"]'));
    };

    let dbConfig = null;
    let browser = null;
    let page = null;
    const email = process.env.USER_EMAIL || 'admin@autofarm.com';

    try {
        dbConfig = await fetchBotConfig(email);
    } catch (e) { }

    // Kiểm tra Quota trước khi chạy
    const hasQuota = await checkQuota(email, 'reels_posted');
    if (!hasQuota) {
        console.log(`✗ Tài khoản ${email} đã hết giới hạn đăng Reels hôm nay. Dừng script.`);
        await logToWeb(email, 'yt-reels', `Đã hết giới hạn đăng Reels hôm nay. Dừng script.`, 'warn');
        if (dbConfig && dbConfig.tele_chat_id) {
            await sendTelegramMessage(dbConfig.tele_chat_id, `✘<b>[Bot Up Reels]</b>\nTừ chối chạy do đã hết giới hạn đăng Reels hôm nay.\nTài khoản: ${email}`);
        }
        process.exit(0);
    }

    // Đọc danh sách kênh từ DB, nếu không có thì fallback mặc định
    let channels = [];
    if (dbConfig?.target_channels) {
        channels = dbConfig.target_channels.split('\n').map(c => c.trim()).filter(Boolean);
    }
    if (channels.length === 0) {
        channels = [
            "https://www.youtube.com/@RvPhim1Phut/shorts",
            "https://www.youtube.com/@CutReviewPhim/shorts"
        ];
    }

    // Không quét/tải video nếu account chưa có cookie Facebook hợp lệ.
    const cookies = getFacebookCookies(dbConfig);
    if (cookies.length === 0) {
        console.error('✗ Lỗi: Chưa có FB Cookie! Hãy nhập cookie trên trang Bots & Config.');
        await logToWeb(email, 'yt-reels', 'Dừng trước khi tải video: chưa có FB Cookie.', 'error');
        process.exitCode = 1;
        return;
    }

    const isPromax = dbConfig?.tier === 'promax';
    await logToWeb(email, 'yt-reels', `Khởi động tool FB Reels... Channels: ${channels.length}`, 'info');

    const pm2ProcessName = 'fb-reels-farmer';
    const manualFlagPath = path.resolve(__dirname, `${pm2ProcessName}.manual`);
    const runMode = process.env.RUN_MODE;
    const isGithubAction = process.env.GITHUB_ACTIONS === 'true';
    const skipWarmup = isGithubAction || fs.existsSync(manualFlagPath) || isPromax;

    if (skipWarmup) {
        let msg = isGithubAction
            ? (runMode === 'auto' ? '🤖 Lệnh tự động từ Dispatcher' : '⚡ Lệnh chạy tay từ Web')
            : (fs.existsSync(manualFlagPath) ? '⚡ Lệnh chạy tay' : '💎 Đặc quyền Promax');
        console.log(`${msg}! Bỏ qua bước ngâm nick...`);
        await logToWeb(email, 'yt-reels', `${msg}! Bỏ qua bước ngâm nick...`, 'info');
        if (fs.existsSync(manualFlagPath)) fs.unlinkSync(manualFlagPath);
    } else {
        const randomMinutes = Math.floor(Math.random() * 25) + 1;
        console.log(`⏱ HỆ THỐNG BOT TỰ ĐỘNG: Đang ngâm nick (delay ngẫu nhiên) ${randomMinutes} phút trước khi bắt đầu...`);
        await delay(randomMinutes * 60 * 1000); // Đổi ra mili-giây
    }

    // Nạp và xác nhận session trước khi tải để không phí lượt download khi cookie chết.
    try {
        browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications', '--window-size=1280,800']
        });
        page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto('https://www.facebook.com/login', { waitUntil: 'domcontentloaded' });
        await page.setCookie(...cookies);
        await page.goto('https://www.facebook.com', { waitUntil: 'networkidle2' });

        if (await isFacebookLoginOrCheckpoint(page)) {
            throw new Error('Cookie không hợp lệ hoặc Facebook yêu cầu xác minh; đã bị chuyển về màn hình login/checkpoint.');
        }
        await saveFacebookCookies(page, dbConfig);
        console.log(`🍪 Đã xác nhận ${cookies.length} cookies Facebook trước khi tải video.`);
    } catch (error) {
        console.error(`✗ Không thể xác nhận Facebook session: ${error.message}`);
        await logToWeb(email, 'yt-reels', `Dừng trước khi tải video: ${error.message}`, 'error');
        if (browser) await browser.close();
        process.exitCode = 1;
        return;
    }

    console.log("🚀 KHỞI ĐỘNG TOOL: QUÉT VIDEO SANG FB REELS...");

    // 1. Lấy danh sách video
    const videos = await fetchLatestVideos(channels);

    // Lọc ra tất cả các video chưa từng tải
    const unpostedVideos = videos.filter(vid => !postedIds.includes(vid.id));

    if (unpostedVideos.length === 0) {
        console.log("🤷‍♂️ Toàn bộ video trong tệp quét đã được đăng. Dừng hệ thống.");
        process.exit(0);
    }

    // Chọn NGẪU NHIÊN 1 video trong danh sách CHƯA TỪNG ĐĂNG
    const videoToProcess = unpostedVideos[Math.floor(Math.random() * unpostedVideos.length)];

    // 2. Tải video chất lượng cao nhất (Best Quality)
    console.log(`\n⬇️ Đang tải video: ${videoToProcess.title}`);
    await logToWeb(email, 'yt-reels', `Đã tìm thấy video mới: ${videoToProcess.title}. Đang tải...`, 'info');
    let outputPath;

    try {
        console.log(`\n➡️ Gọi GenDownload để tải video: ${videoToProcess.url}`);
        await logToWeb(email, 'yt-reels', 'Đang tải bằng GenDownload và kiểm tra/ghép audio nếu cần...', 'info');
        outputPath = await downloadVideoWithAudio(videoToProcess, OUTPUT_DIR);
        console.log('✓ Tải và kiểm tra audio hoàn tất!');
    } catch (err) {
        console.error("✗ Lỗi tải video:", err.message);
        process.exit(1);
    }

    if (!fs.existsSync(outputPath)) {
        console.error("✗ File không tồn tại sau khi tải.");
        process.exit(1);
    }
    console.log("✓ Tải video thành công!");
    await logToWeb(email, 'yt-reels', `Tải video 1080p hoàn tất! Đang kết nối Facebook để đăng...`, 'info');

    // Bỏ qua FFMPEG theo yêu cầu của sếp, giữ nguyên video gốc để chất lượng cao nhất và up nhanh hơn.

    // 3. Đăng lên Facebook Reels (session đã được xác nhận trước khi tải).

    // === THÊM HÀNH VI NGƯỜI THẬT ===
    console.log("🎭 Đang giả lập hành vi người dùng (scroll, lướt feed)...");
    for (let i = 0; i < 3; i++) {
        await page.mouse.wheel({ deltaY: 300 + Math.random() * 500 });
        await delay(2000 + Math.random() * 3000);

        // Rê chuột ngẫu nhiên
        const rx = 100 + Math.random() * 600;
        const ry = 100 + Math.random() * 600;
        await page.mouse.move(rx, ry, { steps: 10 });
    }
    // Cuộn lên lại đầu trang
    await page.mouse.wheel({ deltaY: -2000 });
    await delay(2000);
    // === END HÀNH VI ===

    console.log("🔄 Kiểm tra màn hình xác nhận đăng nhập (Continue as)...");
    for (let i = 0; i < 5; i++) {
        try {
            const clicked = await page.evaluate(() => {
                const btnTexts = ['tiếp tục', 'continue', 'ok', 'chấp nhận', 'accept', 'bỏ qua', 'skip', 'không, cảm ơn', 'no thanks', 'đăng nhập', 'log in', 'allow', 'cho phép'];
                const elements = [...document.querySelectorAll('div[role="button"], button, a, span[dir="auto"]')];
                for (let el of elements) {
                    const text = (el.innerText || '').toLowerCase().trim();
                    if (text && btnTexts.some(t => text.includes(t) || text.startsWith(t))) {
                        el.click();
                        if (el.closest('div[role="button"]')) el.closest('div[role="button"]').click();
                        return true;
                    }
                }
                return false;
            });
            if (clicked) {
                console.log("🔄 Phát hiện màn hình xác nhận, đã bấm Tiếp tục...");
                await delay(3000);
                break;
            }
        } catch (e) { }
        await delay(2000);
    }

    console.log("🌐 Đi đến trang tạo Reels...");
    await page.goto('https://www.facebook.com/reels/create', { waitUntil: 'networkidle2' });
    await delay(5000);

    try {
        console.log("⬆️ Đang tải video lên...");
        await logToWeb(email, 'yt-reels', `Đang upload video lên Facebook Reels...`, 'info');

        let fileInput = await page.$('input[type="file"]');
        if (!fileInput) {
            const currentUrl = page.url();
            console.error("✗ Không tìm thấy input up video. URL hiện tại:", currentUrl);

            await page.screenshot({ path: 'error_fb_reels.png' });
            console.log("📸 Đang upload ảnh chụp màn hình lỗi lên mạng...");
            try {
                const uploadRes = execSync('curl -s -F "file=@error_fb_reels.png" https://bashupload.com', { encoding: 'utf8' });
                console.log("👉 Xem ảnh lỗi tại đây:");
                console.log(uploadRes);
            } catch (e) {
                console.log("Upload ảnh lỗi thất bại:", e.message);
            }

            throw new Error("Không tìm thấy input up video. Có thể bị FB văng ra login hoặc đổi giao diện.");
        }

        await fileInput.uploadFile(outputPath);
        console.log("⏳ Chờ FB upload và xử lý video (15s)...");
        await delay(15000);



        // BƯỚC 1: Bấm Tiếp Lần 1 (Tạo thước phim -> Chỉnh sửa thước phim)
        console.log("➡️ Bấm nút Tiếp (Lần 1)...");
        const next1 = await clickButtonWithText(page, ['tiếp', 'next']);
        if (!next1) {
            console.log("!!! Không bấm được nút Tiếp 1. Dừng tiến trình!");
            throw new Error("Không thể click nút Tiếp Lần 1");
        }
        await delay(5000);

        // BƯỚC 2: Bấm Tiếp Lần 2 (Chỉnh sửa thước phim -> Tuỳ chọn đăng)
        console.log("➡️ Bấm nút Tiếp (Lần 2)...");
        const next2 = await clickButtonWithText(page, ['tiếp', 'next']);
        if (!next2) console.log("!!! Không bấm được nút Tiếp 2.");
        await delay(5000);

        // Gắn Link Affiliate (nếu có)
        const fs = require('fs');
        // Lấy affiliate link từ Supabase trước, fallback data_products.json, rồi env
        let affLink = null;
        try {
            // Ưu tiên link từ Supabase (user đã nhập trên web)
            const supabaseLinks = dbConfig?.affiliate_links_arr || [];
            if (supabaseLinks.length > 0) {
                affLink = supabaseLinks[Math.floor(Math.random() * supabaseLinks.length)];
                console.log("🔗 Lấy affiliate link từ Supabase:", affLink);
            } else {
                // Fallback: đọc từ file JSON local
                const products = JSON.parse(fs.readFileSync('./data_products.json', 'utf8'));
                if (products && products.length > 0) {
                    affLink = products[Math.floor(Math.random() * products.length)].link;
                    console.log("🎲 Lấy link từ data_products.json:", affLink);
                }
            }
        } catch (e) {
            affLink = process.env.SHOPEE_AFF_LINK || null;
            if (affLink) console.log("!!! Fallback về env SHOPEE_AFF_LINK");
        }

        // BƯỚC 3: Điền mô tả trên màn hình Tuỳ chọn đăng
        console.log("✍️ Đang điền Caption...");
        const textBox = await page.$('div[role="textbox"][contenteditable="true"]');
        if (textBox) {
            await textBox.click();
            await delay(1000);

            const userTier = dbConfig?.tier || 'free';
            const GEMINI_KEY_POOL = [
                process.env.GEMINI_API_KEY,
                process.env.GEMINI_API_KEY_2,
                process.env.GEMINI_API_KEY_3,
            ].filter(Boolean);

            let caption = "";

            if (userTier !== 'free' && GEMINI_KEY_POOL.length > 0) {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                let prompt = `Bạn là một chuyên gia sáng tạo nội dung viral trên Facebook Reels.\n`;
                prompt += `Hãy viết 1 caption thật ngắn gọn (tối đa 2-3 câu) theo ĐÚNG CẤU TRÚC SAU:\n`;
                if (affLink) {
                    prompt += `👉 [1 câu mồi giới thiệu món đồ hot trend gây tò mò] [LINK]\n\n`;
                }
                prompt += `[1 câu giật gân tóm tắt phim dựa trên tiêu đề: "${videoToProcess.title}"]\n\n`;
                prompt += `Không dùng markdown in đậm/nghiêng. CHỈ trả về nguyên văn một caption để đăng; không lời dẫn, không giải thích, không đánh số, không nhiều lựa chọn. ${affLink ? 'Tuyệt đối giữ nguyên chữ [LINK] để tool tự thay thế.' : ''}\n`;

                let success = false;
                for (let i = 0; i < GEMINI_KEY_POOL.length; i++) {
                    try {
                        console.log(`🔑 Thử Gemini key #${i + 1}/${GEMINI_KEY_POOL.length} để viết Cap Reels...`);
                        const genAI = new GoogleGenerativeAI(GEMINI_KEY_POOL[i]);
                        const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });
                        
                        const result = await model.generateContent(prompt);
                        let finalCaption = cleanSingleGeminiText(result.response.text());
                        
                        if (affLink) {
                            if (finalCaption.includes('[LINK]')) {
                                caption = finalCaption.replace('[LINK]', affLink);
                            } else {
                                caption = `👉 Link mua hàng ở đây nha: ${affLink}\n\n${finalCaption}`;
                            }
                        } else {
                            caption = finalCaption;
                        }
                        success = true;
                        break;
                    } catch (e) {
                        console.log(`⚠️ Key #${i + 1} lỗi: ${e.message}`);
                    }
                }
                if (!success) {
                    // Fallback nếu API lỗi hết
                    await logToWeb(email, 'yt-reels', 'Gemini không tạo được caption; dùng tiêu đề video làm caption dự phòng.', 'warn');
                    caption = affLink ? `👉 Link mua hàng ở đây nha: ${affLink}\n\n${videoToProcess.title}` : videoToProcess.title;
                }
            } else {
                // Gói free hoặc không có key
                if (userTier !== 'free') {
                    await logToWeb(email, 'yt-reels', 'Không có Gemini API key trong môi trường chạy; dùng tiêu đề video làm caption dự phòng.', 'warn');
                }
                caption = affLink ? `👉 Link mua hàng ở đây nha: ${affLink}\n\n${videoToProcess.title}` : videoToProcess.title;
            }

            caption += `\n\n#phimhay #reviewphim #giaitri #reels`;

            const lines = caption.split('\n');
            for (let line of lines) {
                await page.keyboard.type(line, { delay: 50 });
                await page.keyboard.down('Shift');
                await page.keyboard.press('Enter');
                await page.keyboard.up('Shift');
            }
        } else {
            console.log("!!! Không tìm thấy ô nhập Caption!");
        }
        await delay(3000);

        // BƯỚC 4: Gắn thẻ Affiliate (Màn hình cuối)
        if (affLink && affLink !== 'https://shope.ee/YOUR_LINK_HERE') {
            console.log("🛒 Bắt đầu gắn thẻ Affiliate Shopee...");
            await logToWeb(email, 'yt-reels', 'Đang thực hiện gắn thẻ link Affiliate Shopee vào Reels...', 'info');

            const clickAddProduct = await page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('*')).filter(el => {
                    if (el.children.length > 0) return false;
                    const text = (el.innerText || '').trim();
                    return text === 'Thêm sản phẩm' || text === 'Add product';
                });

                for (let el of elements) {
                    let clickable = el.closest('div[role="button"]') || el.closest('div[tabindex="0"]');
                    if (clickable) {
                        clickable.click();
                        return true;
                    }
                }
                return false;
            });

            if (clickAddProduct) {
                console.log("⏳ Chờ Pop-up hiện lên...");
                await delay(3000);

                console.log("⌨️ Nhập URL Shopee...");
                const inputFocused = await page.evaluate(() => {
                    const inputs = Array.from(document.querySelectorAll('input'));
                    let urlInput = inputs.find(i => i.placeholder === 'URL' || i.getAttribute('aria-label') === 'URL' || i.type === 'text' || i.type === 'url');
                    if (urlInput) {
                        urlInput.focus();
                        return true;
                    }
                    return false;
                });

                if (inputFocused) {
                    await delay(500);
                    await page.keyboard.type(affLink, { delay: 10 });
                    await delay(2000);

                    console.log("💾 Bấm nút Lưu...");
                    await page.evaluate(() => {
                        const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                        const saveBtn = buttons.find(b => (b.innerText || '').trim() === 'Lưu' || (b.innerText || '').trim() === 'Save');
                        if (saveBtn) saveBtn.click();
                    });
                    console.log("✓ Đã gắn thẻ sản phẩm!");
                }
                await delay(3000);
            } else {
                console.log("!!! Không tìm thấy nút 'Thêm sản phẩm' trên màn hình Đăng.");
            }
        }

        // BƯỚC 5: Bấm Đăng / Publish
        console.log("🚀 Bấm Đăng Reels (Đợi FB duyệt bản quyền)...");
        await logToWeb(email, 'yt-reels', 'Bấm Đăng Reels! Đang chờ thuật toán FB duyệt bản quyền (90s)...', 'info');
        const published = await clickButtonWithText(page, ['đăng', 'publish'], 30); // Chờ lên đến 90s (30x3s)
        if (!published) {
            console.log("!!! Không bấm được nút Đăng (có thể do video quá nặng hoặc lỗi). Dừng tiến trình!");
            throw new Error("Không thể click nút Đăng");
        }

        console.log("⏳ Chờ hoàn tất đăng bài (90s) để video 1080p không bị ngắt quãng...");
        await delay(90000);

        console.log("✓ Đăng FB Reels thành công!");
        await logToWeb(email, 'yt-reels', `Đăng FB Reels thành công: ${videoToProcess.title}`, 'success');
        await updateUsageStats(email, 'reels_posted', 1);
        if (dbConfig && dbConfig.tele_chat_id) {
            await sendTelegramMessage(dbConfig.tele_chat_id, `✓ <b>[Bot Up Reels]</b>\nĐăng FB Reels thành công:\n- Video: <b>${videoToProcess.title}</b>\nTài khoản: ${email}`);
        }

        // Lưu lịch sử
        postedIds.push(videoToProcess.id);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(postedIds, null, 2));

        // BƯỚC 6: AUTO-COMMENT RẢI LINK CHO GÓI PLUS / PRO
        const userTier = dbConfig?.tier || 'free';
        let numComments = 0;
        if (userTier === 'plus') numComments = 2;
        else if (userTier === 'pro' || userTier === 'promax') numComments = 3;

        if (numComments > 0) {
            console.log(`💬 Kích hoạt Auto-comment cho gói ${userTier.toUpperCase()} (${numComments} links)...`);
            await logToWeb(email, 'yt-reels', `Chuyển sang tường nhà để Auto-comment ${numComments} links Affiliate...`, 'info');

            await page.goto('https://www.facebook.com/me/reels_tab', { waitUntil: 'networkidle2', timeout: 60000 });
            await delay(5000);

            // Mở trực tiếp Reel đầu tiên (mới nhất) thay vì click mù trong modal.
            const reelUrl = await page.evaluate(() => {
                const reels = Array.from(document.querySelectorAll('a[href*="/reel/"]'));
                if (reels.length > 0) {
                    return reels[0].href;
                }
                return null;
            });

            if (!reelUrl) {
                console.log("⚠️ Không tìm thấy Reel nào trong tab Reels để comment.");
                await logToWeb(email, 'yt-reels', `Không tìm thấy video Reel nào trong trang cá nhân để auto-comment.`, 'warn');
            } else {
                await page.goto(reelUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                await delay(5000); // Đợi Reel mở lên (dạng modal popup hoặc trang mới)

                const clickedFirstCommentBtn = await page.evaluate(() => {
                    const cmtBtns = Array.from(document.querySelectorAll('div[role="button"][aria-label="Bình luận"], div[role="button"][aria-label="Leave a comment"]'));
                    const visibleCmtBtn = cmtBtns.find(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0 && rect.top >= 0;
                    });
                    if (visibleCmtBtn) {
                        visibleCmtBtn.click();
                        return true;
                    }
                    return false;
                });

                if (clickedFirstCommentBtn) {
                    console.log("💬 Đã mở bảng Bình luận của Reel vừa đăng.");
                    await delay(3000);

                    const supabaseLinks = dbConfig?.affiliate_links_arr || [];
                    let localProducts = [];
                    try {
                        localProducts = JSON.parse(fs.readFileSync('./data_products.json', 'utf8')).map(p => p.link);
                    } catch (e) {}
                    
                    let linkPool = supabaseLinks.length > 0 ? supabaseLinks : localProducts;
                    linkPool = linkPool.sort(() => 0.5 - Math.random());
                    const linksToPost = linkPool.slice(0, numComments);

                    const { GoogleGenerativeAI } = require('@google/generative-ai');
                    const GEMINI_KEY_POOL = [
                        process.env.GEMINI_API_KEY,
                        process.env.GEMINI_API_KEY_2,
                        process.env.GEMINI_API_KEY_3,
                    ].filter(Boolean);

                    for (let cmtIdx = 0; cmtIdx < linksToPost.length; cmtIdx++) {
                        const currentLink = linksToPost[cmtIdx];
                        let cmtText = `👉 Món đồ này siêu hot luôn nha: ${currentLink}`;

                        if (GEMINI_KEY_POOL.length > 0) {
                            let prompt = `Bạn là người săn sale Shopee.\n`;
                            prompt += `Hãy viết 1 câu bình luận siêu ngắn gọn, khen một món đồ cực hot, cuối câu để nguyên chữ [LINK]\n`;
                            prompt += `Ví dụ: "Món này xinh xỉu luôn mấy bà: [LINK]"\n`;
                            prompt += `Tuyệt đối không dùng markdown. BẮT BUỘC có chữ [LINK]. CHỈ trả về đúng một câu bình luận, không lời dẫn, không đánh số và không nhiều lựa chọn.\n`;

                            for (let i = 0; i < GEMINI_KEY_POOL.length; i++) {
                                try {
                                    const genAI = new GoogleGenerativeAI(GEMINI_KEY_POOL[i]);
                                    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" }); // fallback model name if 3.1 isn't real, but user claimed it works
                                    const result = await model.generateContent(prompt);
                                    let gCap = cleanSingleGeminiText(result.response.text());
                                    if (gCap.includes('[LINK]')) {
                                        cmtText = gCap.replace('[LINK]', currentLink);
                                    } else {
                                        cmtText = `${gCap} 👉 ${currentLink}`;
                                    }
                                    break;
                                } catch (e) {}
                            }
                        }

                        const uploadBoxInfo = await page.evaluate(() => {
                            const boxes = Array.from(document.querySelectorAll('div[role="textbox"][aria-label="Viết bình luận"], div[role="textbox"][aria-label="Leave a comment"], div[role="textbox"][contenteditable="true"]'));
                            const visibleBox = boxes.find(el => {
                                const rect = el.getBoundingClientRect();
                                return rect.width > 0 && rect.height > 0;
                            });
                            if (visibleBox) {
                                const boxRect = visibleBox.getBoundingClientRect();
                                return { boxX: boxRect.x + boxRect.width / 2, boxY: boxRect.y + boxRect.height / 2 };
                            }
                            return null;
                        });

                        if (uploadBoxInfo) {
                            await page.mouse.click(uploadBoxInfo.boxX, uploadBoxInfo.boxY);
                            await delay(1000);
                            
                            const lines = cmtText.split('\n');
                            for (const [index, line] of lines.entries()) {
                                await page.keyboard.type(line, { delay: 50 });
                                if (index < lines.length - 1) {
                                    await page.keyboard.down('Shift');
                                    await page.keyboard.press('Enter');
                                    await page.keyboard.up('Shift');
                                    await delay(200);
                                }
                            }

                            await delay(1000);
                            const submitted = await submitCommentAndVerify(page, cmtText);
                            if (!submitted) {
                                console.log(`⚠️ Không xác minh được cmt thứ ${cmtIdx + 1}; không ghi nhận thành công.`);
                                await logToWeb(email, 'yt-reels', `Không xác minh được Comment ${cmtIdx + 1}/${numComments} trên Facebook; không ghi nhận thành công.`, 'warn');
                                break;
                            }

                            console.log(`✓ Đã xác minh cmt thứ ${cmtIdx + 1}`);
                            await logToWeb(email, 'yt-reels', `Đã xác minh Comment rải link ${cmtIdx + 1}/${numComments} trên Reel.`, 'success');
                            await delay(Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000);
                        } else {
                            break;
                        }
                    }
                } else {
                    console.log("!!! Không tìm thấy nút Bình luận trên Reel.");
                    await logToWeb(email, 'yt-reels', `Lỗi: Không tìm thấy nút Bình luận trên Reel để auto-comment!`, 'warn');
                }
            }
        }

    } catch (err) {
        console.error("✗ Lỗi khi đăng Reels:", err.message);
        await logToWeb(email, 'yt-reels', `Lỗi khi đăng Reels: ${err.message}`, 'error');
        if (dbConfig && dbConfig.tele_chat_id) {
            await sendTelegramMessage(dbConfig.tele_chat_id, `✘<b>[Bot Up Reels Lỗi]</b>\nLỗi: ${err.message}\nTài khoản: ${email}`);
        }
        await page.screenshot({ path: `debug_reels_err_${Date.now()}.png` });
        // Để finally lưu session/cookie vừa được Facebook refresh rồi mới báo job lỗi.
        process.exitCode = 1;
    } finally {
        // === AUTO REFRESH COOKIE ===
        try {
            console.log("🍪 Đang trích xuất Cookie FB mới để gia hạn...");
            await saveFacebookCookies(page, dbConfig);
            console.log("✓ Đã lấy Cookie FB mới thành công và cập nhật lên DB!");
            await logToWeb(email, 'yt-reels', `✓ Đã lưu Cookie FB mới vào DB (Gia hạn thành công)!`, 'success');
        } catch (cookieErr) {
            console.error("Lỗi trích xuất Cookie FB:", cookieErr);
        }
        // === END AUTO REFRESH ===

        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        if (browser) await browser.close();
    }
})();
