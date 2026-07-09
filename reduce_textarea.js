const fs = require('fs');
let content = fs.readFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

content = content.replace(/min-h-\[120px\]/g, 'min-h-[70px]');

fs.writeFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
