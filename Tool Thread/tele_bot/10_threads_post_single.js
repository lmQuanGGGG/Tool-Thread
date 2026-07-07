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
      .select('threads_cookie, parsed_affiliate_links')
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
    
    // Ưu tiên lấy data cào từ DB của user, nếu chưa có thì lấy tạm data gốc mẫu
    let products = profileData?.parsed_affiliate_links || [];
    if (products.length === 0) {
        const productsPath = path.resolve(__dirname, 'fb_bot', 'shopee_data.json');
        if (fs.existsSync(productsPath)) {
            products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
        }
    }

    let validProducts = products.filter(p => p.tele_file_id && (p.suggested_comment || p.title));
    
    if (validProducts.length > 0) {
        let pickedProduct = validProducts[Math.floor(Math.random() * validProducts.length)];
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
        // Gộp nội dung y chang như pm2 bot
        ninjaComment = `✨ ${pickedProduct.title}\n\n👉 ${randomThinh} ${pickedProduct.aff_link}`;
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

    // Tải ảnh trước khi gõ text (để tiết kiệm thời gian chờ trên giao diện)
    let downloadedImages = [];
    if (postData.image_urls && postData.image_urls.length > 0) {
      await logToWeb(email, 'threads_post', `🖼️ Đang tải ${postData.image_urls.length} ảnh xuống máy chủ...`, 'info');
      // Tải song song tất cả các ảnh cùng lúc
      const downloadPromises = postData.image_urls.map(url => downloadImageFromUrl(url));
      const results = await Promise.all(downloadPromises);
      downloadedImages = results.filter(p => p !== null);
    }

    const postText = postData.text_content || '';
    await page.click(textInput);
    await delay(500);
    await page.keyboard.type(postText, { delay: 10 });
    await logToWeb(email, 'threads_post', `✍️ Đã gõ xong nội dung chữ.`, 'info');

    // Đính kèm ảnh
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

    if (ninjaComment) {
        await logToWeb(email, 'threads_post', `💬 Đang thêm bình luận chứa Link Affiliate chung vào Thread...`, 'info');
        const addThreadClicked = await page.evaluate(() => {
            const divs = Array.from(document.querySelectorAll('div'));
            const add = divs.find(d => {
                const t = (d.innerText || '').toLowerCase();
                return t === 'add to thread' || t === 'thêm vào chuỗi';
            });
            if (add) {
                add.click();
                return true;
            }
            return false;
        });

        if (addThreadClicked) {
            await delay(1500);
            const textInputs = await page.$$(textInput); // Lấy danh sách các ô nhập chữ
            if (textInputs.length > 1) {
                await textInputs[textInputs.length - 1].click();
                await delay(500);
                const lines = ninjaComment.split('\n');
                for (let line of lines) {
                    await page.keyboard.type(line, { delay: 10 });
                    await page.keyboard.down('Shift');
                    await page.keyboard.press('Enter');
                    await page.keyboard.up('Shift');
                    await delay(100);
                }
                await logToWeb(email, 'threads_post', `✍️ Đã gõ xong bình luận Affiliate.`, 'info');
                await delay(1000);
            } else {
                await logToWeb(email, 'threads_post', `⚠️ Không mở được hộp thoại bình luận, sẽ đăng bài không kèm link.`, 'error');
            }
        } else {
            // Backup: Nếu không thấy nút Add to thread (VD do ngôn ngữ khác), ta thử tìm bằng cách lấy tất cả textboxes
            // Có thể dùng phím Tab 3 lần
            await logToWeb(email, 'threads_post', `⚠️ Không tìm thấy nút Add to thread. Thử dùng Tab...`, 'info');
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await page.keyboard.press('Tab');
            await page.keyboard.press('Enter');
            await delay(1500);
            const textInputs = await page.$$(textInput);
            if (textInputs.length > 1) {
                await textInputs[textInputs.length - 1].click();
                const lines = ninjaComment.split('\n');
                for (let line of lines) {
                    await page.keyboard.type(line, { delay: 10 });
                    await page.keyboard.down('Shift');
                    await page.keyboard.press('Enter');
                    await page.keyboard.up('Shift');
                    await delay(100);
                }
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

    await delay(10000); // Chờ 10s cho bài đăng lên server hoàn tất



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
