const fs = require('fs');
let content = fs.readFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

// The string occurs twice, we replace both with overflow-hidden
content = content.replace(/<div className="flex flex-col gap-6 h-full min-h-0">/g, '<div className="flex flex-col gap-6 h-full min-h-0 overflow-hidden">');

fs.writeFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
