const fs = require('fs');
let code = fs.readFileSync('1_fb_puppeteer.js', 'utf8');

const oldLogic = `            // Tìm tất cả các nút Bình luận
            const cmtBtns = await page.$$('div[role="button"], div[aria-label*="Bình luận"], div[aria-label*="Comment"]');
            let validCmtBtns = [];
            for (let btn of cmtBtns) {
                const isValid = await page.evaluate(el => {
                    const text = (el.innerText || '').toLowerCase();
                    const aria = (el.getAttribute('aria-label') || '').toLowerCase();
                    return text.includes('bình luận') || text.includes('comment') || aria.includes('bình luận') || aria.includes('comment');
                }, btn);
                if (isValid) {
                    validCmtBtns.push(btn);
                }
            }

            console.log(\`[INFO] Tìm thấy \${validCmtBtns.length} bài viết có thể comment.\`);
            if (validCmtBtns.length === 0) {
                await page.screenshot({ path: \`debug_no_btn_\${Date.now()}.png\` });
            }
            
            // Theo yêu cầu sếp: Comment tối đa 2 bài trên mỗi Group
            let postsToComment = 2; 
            let commentedCount = 0;

            for (let i = 0; i < validCmtBtns.length; i++) {
                if (commentedCount >= postsToComment) break;
                
                let btn = validCmtBtns[i];
                try {
                    await page.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), btn);
                    await delay(2000);

                    // Thả Like bài viết trước khi cmt
                    console.log(\`👍 Đang thả Like cho bài thứ \${i + 1}...\`);
                    await page.evaluate((cmtEl) => {
                        let parent = cmtEl.parentElement;
                        for(let k=0; k<3; k++) {
                            if (!parent) break;
                            const likeBtn = Array.from(parent.querySelectorAll('div[role="button"]')).find(el => el.innerText === 'Thích' || el.innerText === 'Like');
                            if (likeBtn) {
                                likeBtn.click();
                                break;
                            }
                            parent = parent.parentElement;
                        }
                    }, btn);
                    await delay(1500);

                    console.log(\`💬 Click mở ô Comment cho bài thứ \${i + 1}...\`);
                    await btn.click();
                    await delay(3000);

                    const commentBoxSelector = 'div[aria-label="Viết bình luận"], div[aria-label="Leave a comment"], div[aria-label="Viết bình luận công khai..."], div[aria-label="Viết bình luận..."], div[role="textbox"][contenteditable="true"]';
                    
                    const commentBoxes = await page.$$(commentBoxSelector);
                    if (commentBoxes.length > 0) {
                        let targetBox = null;
                        for (let box of commentBoxes) {
                            const isVisible = await page.evaluate(el => {
                                const rect = el.getBoundingClientRect();
                                return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.bottom <= window.innerHeight;
                            }, box);
                            if (isVisible) {
                                targetBox = box;
                                break;
                            }
                        }

                        if (!targetBox) targetBox = commentBoxes[0];

                        await targetBox.click();
                        await delay(1000);
                        await page.evaluate(el => el.focus(), targetBox);`;

const newLogic = `            // Kích hoạt tất cả các nút "Bình luận" đang hiển thị để mở ô nhập liệu (nếu nó đang bị ẩn)
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
                    await page.evaluate(el => el.focus(), targetBox);`;

code = code.replace(oldLogic, newLogic);
// Delete extra bracket and else branch from old logic
code = code.replace(`                    } else {
                        console.log("!!! Không tìm thấy ô comment thật sự.");
                    }`, '');

fs.writeFileSync('1_fb_puppeteer.js', code);
console.log("Fixed 1_fb_puppeteer.js comment finding logic");
