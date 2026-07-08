const fs = require('fs');
let content = fs.readFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

// 1. Extract ThreadsCrawler block
const startCrawler = content.indexOf('                <ThreadsCrawler');
const endCrawler = content.indexOf('/>\n', startCrawler) + 3;
const crawlerBlock = content.substring(startCrawler, endCrawler);

// Remove from Global tab
content = content.replace(crawlerBlock, '');

// 2. Insert into Threads tab
const threadsTabStart = content.indexOf('{/* ═══ THREADS ═══ */}');
const threadsTabLeftColumn = content.indexOf('<div className="space-y-5">', threadsTabStart);

// Let's replace the header of Threads tab too
const oldHeader = `                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">Threads Engine</h1>
                  <p className="text-sm text-gray-500">Cấu hình Bot Threads và chỉnh sửa bài đăng.</p>
                </div>`;
const newHeader = `                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1.5">Threads Workspace</h1>
                  <p className="text-sm text-gray-500">Tự động lấy bài viết và cấu hình Bot Threads.</p>
                </div>\n\n` + crawlerBlock;

content = content.replace(oldHeader, newHeader);

fs.writeFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
