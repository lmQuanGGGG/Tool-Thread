const fs = require('fs');
let content = fs.readFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

if (!content.includes('shopeeCarouselRef')) {
  content = content.replace(
    /const scrollThreads = /,
    `const shopeeCarouselRef = useRef<HTMLDivElement>(null);
  const scrollShopee = (direction: "left" | "right") => {
    if (shopeeCarouselRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      shopeeCarouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
  const scrollThreads = `
  );
}

const oldShopeeBlockRegex = /\{parsedLinks\.length > 0 && \([\s\S]*?<h3 className="text-\[13px\] font-semibold text-gray-900">AI Parsing Results<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;
content = content.replace(oldShopeeBlockRegex, '');

const newShopeeBlock = `
              {/* Shopee Editor (AI Parsing Results) */}
              {parsedLinks.length > 0 && (
                <div className={\`\${cardClass} p-6 flex flex-col flex-1 min-h-0 anim-fade-up anim-d3\`}>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-[13px] font-semibold text-gray-900">Shopee Data (AI Parsing)</h3>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-[11px] font-mono text-emerald-600 font-semibold">{parsedLinks.length} items</span>
                  </div>
                  
                  <div className="relative flex-1 min-h-0">
                    <button onClick={() => scrollShopee('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                      <ChevronLeft className="w-5 h-5 pr-0.5" />
                    </button>
                    <button onClick={() => scrollShopee('right')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                      <ChevronRight className="w-5 h-5 pl-0.5" />
                    </button>
                    
                    <div ref={shopeeCarouselRef} className="flex overflow-x-auto gap-5 h-full snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden">
                      {parsedLinks.map((p, i) => (
                        <div key={i} className="w-[320px] shrink-0 h-full flex flex-col bg-gray-50 border border-gray-200/80 rounded-xl p-5 relative group/post hover:border-gray-300 hover:shadow-sm transition-all snap-center">
                          <button onClick={() => handleDeleteParsedLink(i)} className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10" title="Xoá">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <p className="text-[13px] font-semibold text-gray-900 truncate mb-1 pr-8">{p.title}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate mb-3">{p.aff_link}</p>
                          
                          <textarea className="w-full flex-1 bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[100px] placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" value={p.suggested_comment} onChange={(e) => handleUpdateParsedLinkText(i, e.target.value)} placeholder="Nội dung thả thính..." />
                          
                          <div className="mt-3 flex items-center gap-3 shrink-0">
                            <img src={p.image_url} alt="" className="h-20 w-auto rounded-lg object-cover border border-gray-200" />
                          </div>
                          
                          <div className="mt-4 flex justify-end gap-2 shrink-0 border-t border-gray-200/60 pt-4">
                            <button onClick={handleSaveParsedLink} className={\`\${btnSecondary} text-[12px] px-4 py-1.5\`}>Lưu Thay Đổi</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}`;

const oldRightColumnRegex = /(\{\/\* Posts Editor \*\/\}\s*<div className="\$\{[^}]+\} p-6 flex flex-col h-full min-h-0 anim-fade-up anim-d3">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/;
const match = content.match(oldRightColumnRegex);

if (match) {
  let updatedThreadsBlock = match[0].replace('h-full min-h-0 anim-fade-up anim-d3', 'flex-1 min-h-0 anim-fade-up anim-d3');
  
  const rightColumnWrapper = `
              {/* Right Column Wrapper */}
              <div className="flex flex-col gap-6 h-full min-h-0">
                ${updatedThreadsBlock}
                ${newShopeeBlock}
              </div>
  `;
  
  content = content.replace(match[0], rightColumnWrapper);
  fs.writeFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
  console.log("Successfully transformed Shopee data into a carousel and stacked it in the right column!");
} else {
  console.log("Could not find Posts Editor");
}
