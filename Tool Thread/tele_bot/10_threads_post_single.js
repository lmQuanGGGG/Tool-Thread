require('dotenv').config();
const { supabase, logToWeb } = require('./supabase_helper');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadImageFromUrl(url) {
    try {
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        const localPath = path.resolve(__dirname, `temp_th_single_${Date.now()}_${Math.floor(Math.random()*1000)}.jpg`);
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

async function runSinglePost() {
  const email = process.env.USER_EMAIL || 'admin@autofarm.com';
  const postId = process.env.POST_ID;

  console.log(`🚀 Bắt đầu chạy bot đăng bài Threads đơn lẻ cho post_id: ${postId}`);
  await logToWeb(email, 'threads_post', `🚀 Bắt đầu quá trình đăng bài (ID: ${postId}) lên Threads...`, 'info');

  if (!postId) {
    console.error("❌ Thiếu POST_ID");
    await logToWeb(email, 'threads_post', `❌ Lỗi: Không nhận được ID bài viết.`, 'error');
    process.exit(1);
  }

  try {
    // 1. Lấy dữ liệu bài viết
    const { data: postData, error } = await supabase
      .from('crawl_data')
      .select('*')
      .eq('id', postId)
      .single();

    if (error || !postData) {
      console.error("❌ Lỗi lấy dữ liệu:", error?.message);
      await logToWeb(email, 'threads_post', `❌ Không tìm thấy dữ liệu bài viết trong DB.`, 'error');
      process.exit(1);
    }

    console.log(`✅ Đã lấy thành công nội dung bài viết: ${postData.post_id}`);
    await logToWeb(email, 'threads_post', `✅ Đã lấy nội dung chuẩn bị đăng...`, 'info');

    // 1.5 Lấy cookie và link affiliate của user
    const { data: profileData, error: profileErr } = await supabase
      .from('profiles')
      .select('threads_cookie, affiliate_links')
      .eq('email', email)
      .single();

    if (profileErr || !profileData?.threads_cookie) {
      console.error("❌ Lỗi lấy Cookie:", profileErr?.message);
      await logToWeb(email, 'threads_post', `❌ Không tìm thấy Threads Cookie. Vui lòng cập nhật trên Web.`, 'error');
      process.exit(1);
    }

    console.log("⏳ Đang gọi Puppeteer mở Chrome ẩn danh và đăng bài...");
    await logToWeb(email, 'threads_post', `⏳ Khởi động Chrome ẩn danh...`, 'info');

    let ninjaComment = '';
    const affiliateLinks = (profileData.affiliate_links || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (affiliateLinks.length > 0) {
        const catchphrases = [
            "Cái này xài thích lắm á mn, tui ưng xỉu:",
            "Mấy bà ơi gom lẹ deal này nha, xài bao êm:",
            "Ai chưa thử cái này thì thử liền đi, khum hối hận đâu:",
            "Eo ôi ưng cái bụng ghê, để lại link cho bà nào cần nè:",
            "Góc rắc thính: Món này dạo này tui mê cực kì:",
            "Hôm bữa ai hỏi tui xài gì thì link đây nha:",
            "Đừng hỏi sao tui chăm mua sắm, tại mấy món này xịn quá nè:"
        ];
        let randomThinh = catchphrases[Math.floor(Math.random() * catchphrases.length)];
        let randomLink = affiliateLinks[Math.floor(Math.random() * affiliateLinks.length)];
        ninjaComment = `👉 ${randomThinh} ${randomLink}`;
    }

    // Parse Cookies
    let cookies = [];
    try {
      const rawArr = JSON.parse(profileData.threads_cookie);
      if (Array.isArray(rawArr)) {
        cookies = rawArr.map(c => {
          let cNew = { ...c };
          if (cNew.sameSite === 'no_restriction' || cNew.sameSite === 'unspecified') cNew.sameSite = 'None';
          // Puppeteer không hỗ trợ các field này trong setCookie
          delete cNew.storeId; 
          delete cNew.id; 
          delete cNew.hostOnly; 
          delete cNew.session;
          return cNew;
        });
      } else {
        throw new Error("Cookie không phải là một mảng JSON");
      }
    } catch (err) {
      console.error("❌ Lỗi Parse Cookie:", err.message);
      await logToWeb(email, 'threads_post', `❌ Lỗi định dạng Cookie (Yêu cầu JSON Array).`, 'error');
      process.exit(1);
    }

    // 2. Thực thi đăng bài bằng Puppeteer
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setCookie(...cookies);

    console.log('[INFO] Đang mở Threads...');
    await page.goto('https://www.threads.net/', { waitUntil: 'networkidle2', timeout: 30000 });
    await delay(3000);

    // Kiểm tra đăng nhập
    if (page.url().includes('login')) {
      await logToWeb(email, 'threads_post', `❌ Cookie hết hạn hoặc không hợp lệ (Bị đẩy ra Login)`, 'error');
      await browser.close();
      process.exit(1);
    }

    // Click nút Viết bài
    await logToWeb(email, 'threads_post', `✏️ Đang click nút Viết bài...`, 'info');
    const writeClicked = await page.evaluate(() => {
        const nav = document.querySelector('nav') || document.body;
        const btns = [...nav.querySelectorAll('div[role="button"], a, svg')];
        const writeBtn = btns.find(b => {
            const label = (b.getAttribute('aria-label') || '').toLowerCase();
            return label === 'write' || label === 'tạo' || label === 'create' || label === 'new thread';
        });
        if (writeBtn) {
            (writeBtn.closest('[role="button"]') || writeBtn).click();
            return true;
        }
        return false;
    });

    if (!writeClicked) {
      await logToWeb(email, 'threads_post', `❌ Không tìm thấy nút Tạo bài!`, 'error');
      await page.screenshot({ path: `debug_single_err_${Date.now()}.png`});
      await browser.close();
      process.exit(1);
    }
    await delay(3000);

    // Điền text
    const textSelectors = [
        'div[contenteditable="true"][role="textbox"]',
        'p[data-lexical-editor="true"]',
        'div[data-lexical-editor="true"]',
    ];
    let textInput = null;
    for (const sel of textSelectors) {
        try { await page.waitForSelector(sel, { timeout: 3000 }); textInput = sel; break; } catch (e) {}
    }
    
    if (!textInput) {
      await logToWeb(email, 'threads_post', `❌ Không tìm thấy ô nhập nội dung!`, 'error');
      await browser.close();
      process.exit(1);
    }

    const postText = postData.text_content || '';
    await page.click(textInput);
    await delay(500);
    await page.keyboard.type(postText, { delay: 10 });
    await logToWeb(email, 'threads_post', `✍️ Đã gõ xong nội dung chữ.`, 'info');

    // Tải & đính kèm ảnh
    let downloadedImages = [];
    if (postData.image_urls && postData.image_urls.length > 0) {
      await logToWeb(email, 'threads_post', `🖼️ Đang tải ${postData.image_urls.length} ảnh xuống máy chủ...`, 'info');
      for (const url of postData.image_urls) {
        const p = await downloadImageFromUrl(url);
        if (p) downloadedImages.push(p);
      }

      if (downloadedImages.length > 0) {
        await logToWeb(email, 'threads_post', `📎 Đang đính kèm ${downloadedImages.length} ảnh vào bài...`, 'info');
        const [chooser] = await Promise.all([
            page.waitForFileChooser({ timeout: 10000 }),
            page.evaluate(() => {
                const attachBtn = document.querySelector('svg[aria-label="Attach media"], svg[aria-label="Đính kèm phương tiện"]');
                if (attachBtn) attachBtn.closest('[role="button"]').click();
                else document.querySelector('input[type="file"]')?.click();
            })
        ]);
        if (chooser) {
            await chooser.accept(downloadedImages.slice(0,9));
            await delay(4000); // Chờ load ảnh
        }
      }
    }

    // Bấm nút Post
    await logToWeb(email, 'threads_post', `🚀 Chuẩn bị ấn nút Đăng...`, 'info');
    await delay(1000);
    const postClicked = await page.evaluate(() => {
        const dialog = document.querySelector('div[role="dialog"]') || document;
        const btns = [...dialog.querySelectorAll('div[role="button"], button')];
        const postBtns = btns.filter(b => {
            const t = b.innerText?.trim();
            return t === 'Post' || t === 'Đăng';
        });
        if (postBtns.length > 0) {
            const postBtn = postBtns[postBtns.length - 1];
            if (postBtn.hasAttribute('disabled') || postBtn.getAttribute('aria-disabled') === 'true') return false;
            postBtn.click();
            return true;
        }
        return false;
    });

    if (!postClicked) {
      await logToWeb(email, 'threads_post', `❌ Nút Post bị vô hiệu hóa hoặc không tìm thấy!`, 'error');
      await page.screenshot({ path: `debug_single_err_post_${Date.now()}.png`});
      await browser.close();
      process.exit(1);
    }

    await delay(5000); // Chờ Threads xử lý đăng bài và hiện thông báo Toast

    // Cố gắng tìm nút "Xem" hoặc "View" trên thông báo Toast để vào bài viết vừa đăng
    const viewClicked = await page.evaluate(() => {
        // Tìm tất cả các link hoặc nút có chữ "Xem" hoặc "View"
        const elements = Array.from(document.querySelectorAll('a, div[role="button"], button'));
        for (const el of elements) {
            const text = (el.innerText || '').trim().toLowerCase();
            if (text === 'xem' || text === 'view') {
                el.click();
                return true;
            }
        }
        // Fallback: Tìm link nào mới xuất hiện chứa '/post/'
        const postLinks = Array.from(document.querySelectorAll('a[href*="/post/"]'));
        if (postLinks.length > 0) {
            postLinks[0].click();
            return true;
        }
        return false;
    });

    if (viewClicked) {
        console.log("✅ Đã bấm vào nút Xem bài viết mới đăng!");
        await delay(3000); // Chờ load trang bài viết chi tiết
    } else {
        console.log("⚠️ Không tìm thấy nút Xem trên thông báo, cmt có thể bị thả nhầm chỗ!");
    }

    if (ninjaComment) {
        console.log("💬 Đang tiến hành thả Ninja Comment (Affiliate Link)...");
        await logToWeb(email, 'threads_post', `💬 Đang thả comment chứa link Affiliate...`, 'info');
        try {
            await delay(5000); // Chờ bài đăng hiện lên
            const replyBox = await page.evaluate(() => {
                const svgs = Array.from(document.querySelectorAll('svg[aria-label="Reply"], svg[aria-label="Trả lời"], svg[aria-label="Comment"], svg[aria-label="Bình luận"]'));
                if (svgs.length > 0) {
                    const targetBtn = svgs[0];
                    const clickable = targetBtn.closest('div[role="button"], button') || targetBtn;
                    const rect = clickable.getBoundingClientRect();
                    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
                }
                return null;
            });

            if (replyBox) {
                await page.mouse.click(replyBox.x + replyBox.width / 2, replyBox.y + replyBox.height / 2);
                console.log("[INFO] Đã click mở hộp thoại Reply...");
                await delay(3000);
                await page.waitForSelector('div[contenteditable="true"]', { timeout: 5000 });
                await page.click('div[contenteditable="true"]');
                await page.keyboard.type(ninjaComment, { delay: 30 });
                await delay(2000);

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
                }
                
                await delay(15000); // Chờ post cmt
                console.log("✅ Đã thả comment Affiliate thành công!");
                await logToWeb(email, 'threads_post', `✅ Đã thả comment Affiliate thành công!`, 'success');
            } else {
                console.log("⚠️ Không tìm thấy nút Reply để thả comment.");
                await logToWeb(email, 'threads_post', `⚠️ Không tìm thấy nút Reply để thả comment.`, 'warn');
            }
        } catch (e) {
            console.error('[ERROR] Ninja Comment thất bại:', e.message);
            await logToWeb(email, 'threads_post', `❌ Lỗi thả comment: ${e.message}`, 'error');
        }
    }

    await browser.close();
    
    // Dọn dẹp ảnh tạm
    downloadedImages.forEach(p => { if(fs.existsSync(p)) fs.unlinkSync(p); });

    // 3. Cập nhật trạng thái
    const { error: updateErr } = await supabase
      .from('crawl_data')
      .update({ posted: true, posted_at: new Date().toISOString() })
      .eq('id', postId);

    if (updateErr) {
      console.error("❌ Lỗi cập nhật DB:", updateErr.message);
      await logToWeb(email, 'threads_post', `⚠️ Đăng thành công nhưng lỗi cập nhật trạng thái DB!`, 'warn');
    } else {
      console.log("✅ Đã cập nhật trạng thái posted = true");
      await logToWeb(email, 'threads_post', `🎉 Đăng bài thành công lên Threads! [ID: ${postId}]`, 'success');
    }

    process.exit(0);
  } catch (err) {
    console.error("💥 Lỗi ngoài ý muốn:", err);
    await logToWeb(email, 'threads_post', `💥 Lỗi cục bộ: ${err.message}`, 'error');
    process.exit(1);
  }
}

runSinglePost();
