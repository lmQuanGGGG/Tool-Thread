const fs = require('fs');
let content = fs.readFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

// 1. Make images h-40
content = content.replace(/h-20 w-auto/g, 'h-40 w-auto');

// 2. Extract Threads Crawl Poster block
const startPoster = content.indexOf('{/* Posts Editor */}');
const endPoster = content.indexOf('{/* Shopee Editor (AI Parsing Results) */}');
const posterBlock = content.substring(startPoster, endPoster);

// Remove the block from the global tab
content = content.replace(posterBlock, '');

// 3. Remove items-start from Threads tab grid so it stretches
content = content.replace('<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">', '<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">');

// 4. Insert into Threads tab
// Let's find the closing of the left column in the Threads tab:
const threadsTabStart = content.indexOf('{/* ═══ THREADS ═══ */}');
const threadsTabEnd = content.indexOf('</main>', threadsTabStart);
const threadsContent = content.substring(threadsTabStart, threadsTabEnd);

const replacement = '              </div>\n\n              <div className="flex flex-col gap-6 h-full min-h-0">\n' + posterBlock + '              </div>\n            </div>\n          </div>\n        )}';

// The left column in threads tab ends with:
// '              </div>\n\n              \n            </div>\n          </div>\n        )}'

content = content.replace('              </div>\n\n              \n            </div>\n          </div>\n        )}', replacement);

fs.writeFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
