const fs = require('fs');
let code = fs.readFileSync('1_fb_puppeteer.js', 'utf8');

const oldUpload = `                            const [chooser] = await Promise.all([
                                page.waitForFileChooser({ timeout: 10000 }),
                                page.evaluate((box) => {
                                    let parent = box;
                                    for(let k=0; k<10; k++) {
                                        if(!parent) break;
                                        // Tìm nút đính kèm ảnh bằng aria-label
                                        const fileIcons = Array.from(parent.querySelectorAll('[aria-label*="ảnh"], [aria-label*="Ảnh"], [aria-label*="photo"], [aria-label*="Photo"]'));
                                        if (fileIcons.length > 0) {
                                            // Click vào cái đầu tiên là icon camera
                                            fileIcons[0].click();
                                            return;
                                        }
                                        parent = parent.parentElement;
                                    }
                                }, targetBox)
                            ]);
                            await chooser.accept([localImg]);
                            console.log(\`⏳ Chờ load ảnh...\`);
                            await delay(6000); // Đợi FB tải ảnh xong hẳn`;

const newUpload = `                            // Tải ảnh trực tiếp vào thẻ input[type="file"]
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
                                console.log("⚠️ Không tìm thấy thẻ input type=file, bỏ qua up ảnh!");
                            }`;

code = code.replace(oldUpload, newUpload);
fs.writeFileSync('1_fb_puppeteer.js', code);
console.log("Fixed 1_fb_puppeteer.js direct file upload");
