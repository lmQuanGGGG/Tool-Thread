const fs = require('fs');
let code = fs.readFileSync('1_fb_puppeteer.js', 'utf8');

code = code.replace(
    'console.log(`✗ Lỗi khi comment bài ${i + 1}:`, err.message);',
    'console.log(`✗ Lỗi khi comment bài ${i + 1}:`, err.message);\n                    await page.screenshot({ path: `debug_cmt_err_${i}.png` });'
);

fs.writeFileSync('1_fb_puppeteer.js', code);
console.log("Fixed 1_fb_puppeteer.js screenshot");
