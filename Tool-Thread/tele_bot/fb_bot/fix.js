const fs = require('fs');
let code = fs.readFileSync('1_fb_puppeteer.js', 'utf8');

// Fix focus
code = code.replace(
    'await targetBox.click();\n                        await delay(1000);',
    'await targetBox.click();\n                        await delay(1000);\n                        await page.evaluate(el => el.focus(), targetBox);'
);

// Fix file chooser click
code = code.replace(
    /let parent = box;\n[\s\S]*?parent = parent\.parentElement;\n                                    \}/,
    `let parent = box;
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
                                    }`
);

fs.writeFileSync('1_fb_puppeteer.js', code);
console.log("Fixed 1_fb_puppeteer.js");
