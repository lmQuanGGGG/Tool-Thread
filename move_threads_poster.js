const fs = require('fs');
let content = fs.readFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

// 1. Extract the Posts Editor block
const startMarker = '{/* Posts Editor */}';
const startIndex = content.indexOf(startMarker);
if (startIndex === -1) throw new Error('Posts Editor not found');

// Find the end of Posts Editor. It ends before `</div>\n          </div>\n        )}\n\n      </main>`
// The block is enclosed in `<div className={\`\${cardClass} p-6 flex flex-col h-[700px] anim-fade-up anim-d3\`}>` ... `</div>`
const blockRegex = /\{\/\* Posts Editor \*\/\}\s*<div className="[^"]+ flex flex-col h-\[700px\][^"]+">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

// Wait, the structure in `activeTab === "threads"`:
// <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
//   <div className="space-y-5"> ... </div>
//   {/* Posts Editor */}
//   <div className="..."> ... </div>
// </div>

const extractRegex = /(\{\/\* Posts Editor \*\/\}\s*<div className="[^"]+ flex flex-col h-\[700px\][^>]*>[\s\S]*?<!-- end of posts editor -->)/; // I need a safer way.

// Let's just use string parsing to extract exactly the Posts Editor div
const contentAfterStart = content.substring(startIndex);
let openDivs = 0;
let endIndex = -1;
let started = false;

for (let i = 0; i < contentAfterStart.length; i++) {
  if (contentAfterStart.startsWith('<div', i)) {
    started = true;
    openDivs++;
  } else if (contentAfterStart.startsWith('</div', i)) {
    openDivs--;
    if (started && openDivs === 0) {
      endIndex = startIndex + i + 6; // include '</div>'
      break;
    }
  }
}

if (endIndex === -1) throw new Error('Could not find end of Posts Editor');

const postsEditorBlock = content.substring(startIndex, endIndex);

// Remove the block from its current position
content = content.substring(0, startIndex) + content.substring(endIndex);

// 2. Insert it into the right column of the global tab
// In global tab:
// <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
//   <div className="space-y-6">
//     <ThreadsCrawler />
//     ...
//     <Telegram Notify />
//   </div>
//   {/* INSERT HERE */}
// </div>

const globalInsertTarget = `                <div className={\`\${cardClass} p-6 h-fit anim-fade-up anim-d2\`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[13px] font-semibold text-gray-900">Telegram Notify</h3>
                    <StatusDot active={!!formData.tele_chat_id} />
                  </div>
                  <input type="text" value={formData.tele_chat_id} onChange={(e) => setFormData({ ...formData, tele_chat_id: e.target.value })} onBlur={handleSave} placeholder="Chat ID — nhắn @userinfobot để lấy" className={inputClass} />
                  <p className="mt-3.5 text-[12px] text-gray-400 leading-relaxed">Nhận cảnh báo real-time khi bot post bài thành công, lỗi cookie, hoặc các thống kê crawl định kỳ.</p>
                </div>
              </div>`;

if (!content.includes(globalInsertTarget)) throw new Error('Global insert target not found');

content = content.replace(globalInsertTarget, globalInsertTarget + '\n\n              ' + postsEditorBlock);

fs.writeFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
console.log("Successfully moved Posts Editor to global tab!");
