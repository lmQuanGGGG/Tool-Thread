const fs = require('fs');
let content = fs.readFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

const startBlock = content.indexOf('<div className="relative flex-1 min-h-0">');
// Find the end of the Threads Crawl Poster block, which ends with "</div>" right before "</div>\n\n              <div className=\"flex flex-col gap-6 h-full min-h-0\">"
// Actually, let's just use string replace for the whole inner block of Threads Crawl Poster.

const oldBlock = `<div className="relative flex-1 min-h-0">
                    {threadsPosts.length > 0 && (
                      <>
                        <button onClick={() => scrollThreads('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                          <ChevronLeft className="w-5 h-5 pr-0.5" />
                        </button>
                        <button onClick={() => scrollThreads('right')} className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 w-9 h-9 bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 border border-gray-200 transition-all hover:scale-110">
                          <ChevronRight className="w-5 h-5 pl-0.5" />
                        </button>
                      </>
                    )}
                    <div ref={threadsCarouselRef} className="flex overflow-x-auto gap-5 h-full snap-x snap-mandatory pb-4 [&::-webkit-scrollbar]:hidden">
                      {threadsPosts.map((post) => (
                        <div key={post.id} className="w-[320px] shrink-0 h-full flex flex-col bg-gray-50 border border-gray-200/80 rounded-xl p-5 relative group/post hover:border-gray-300 hover:shadow-sm transition-all snap-center">
                          <button onClick={() => handleDeletePost(post.id)} className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10" title="Xoá">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <textarea className="w-full flex-1 bg-transparent text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[120px] placeholder:text-gray-400" value={post.text_content} onChange={(e) => handleUpdatePostText(post.id, e.target.value)} placeholder="Nội dung bài viết..." />
                          {post.image_urls && post.image_urls.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 shrink-0">
                              {post.image_urls.map((url: string, idx: number) => (
                                <div key={idx} className="relative group shrink-0">
                                  <img src={url} className="h-40 w-auto rounded-lg object-cover border border-gray-200 transition-all group-hover:opacity-30" />
                                  <button onClick={() => handleRemovePostImage(post.id, idx)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="mt-4 flex justify-end gap-2 shrink-0 border-t border-gray-200/60 pt-4">
                            <button onClick={() => handleSavePost(post)} className={\`\${btnSecondary} text-[12px] px-4 py-1.5\`}>Lưu</button>
                            <button onClick={() => handlePostToThreads(post)} className={\`\${btnViolet} text-[12px] px-4 py-1.5\`}>Đăng Threads</button>
                          </div>
                        </div>
                      ))}
                      {threadsPosts.length === 0 && (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm">Không có dữ liệu Crawl nào.</p>
                        </div>
                      )}
                    </div>
                  </div>`;

const newBlock = `<div className="flex-1 overflow-y-auto pr-1 space-y-4 dim-siblings [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {threadsPosts.map((post) => (
                    <div key={post.id} className="bg-gray-50 border border-gray-200/80 rounded-xl p-5 relative group/post hover:border-gray-300 hover:shadow-sm transition-all">
                      <button onClick={() => handleDeletePost(post.id)} className="absolute top-3 right-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10" title="Xoá">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <textarea className="w-full bg-transparent text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[90px] placeholder:text-gray-400" value={post.text_content} onChange={(e) => handleUpdatePostText(post.id, e.target.value)} placeholder="Nội dung bài viết..." />
                      {post.image_urls && post.image_urls.length > 0 && (
                        <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                          {post.image_urls.map((url: string, idx: number) => (
                            <div key={idx} className="relative group shrink-0">
                              <img src={url} className="h-40 w-auto rounded-lg object-cover border border-gray-200 transition-all group-hover:opacity-80" />
                              <button onClick={() => handleRemovePostImage(post.id, idx)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex justify-end gap-2 border-t border-gray-200/60 pt-4">
                        <button onClick={() => handleSavePost(post)} className={\`\${btnSecondary} text-[12px] px-4 py-1.5\`}>Lưu Thay Đổi</button>
                        <button onClick={() => handlePostToThreads(post)} className={\`\${btnViolet} text-[12px] px-4 py-1.5\`}>Đăng Threads</button>
                      </div>
                    </div>
                  ))}
                  {threadsPosts.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">Không có dữ liệu Crawl nào.</p>
                    </div>
                  )}
                </div>`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
