import re

with open("Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Inject activeTab state
state_injection = """  const [activeTab, setActiveTab] = useState<"global" | "fb" | "threads">("global");
"""
if "const [activeTab" not in content:
    content = content.replace("const [threadsPosts, setThreadsPosts] = useState<any[]>([]);", 
                              "const [threadsPosts, setThreadsPosts] = useState<any[]>([]);\n" + state_injection)

# 2. Add some minimal icons if they don't exist
if "import { Settings," not in content and "Settings" not in content:
    content = content.replace('import { Bot, Terminal, Trash2, Zap, Play, MessageCircle, Loader2 }', 
                              'import { Bot, Terminal, Trash2, Zap, Play, MessageCircle, Loader2, Settings, Facebook, AtSign }')

# 3. Replace the entire return block
start_idx = content.find("  return (\n    /* Dark full-page wrapper")
if start_idx == -1:
    print("Could not find start of return block")
    exit(1)

new_return = """  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-300 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* ── HEADER NAVIGATION ── */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 text-zinc-100" />
            <span className="font-semibold text-sm tracking-tight text-zinc-100">AutoFarm Simulator</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-800/50 text-[10px] font-mono text-zinc-400 border border-white/5 uppercase">v3.5</span>
          </div>

          <nav className="flex items-center gap-1">
            <button 
              onClick={() => setActiveTab("global")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === "global" ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
            >
              Cấu Hình Chung
            </button>
            <button 
              onClick={() => setActiveTab("fb")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === "fb" ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
            >
              Facebook Engine
            </button>
            <button 
              onClick={() => setActiveTab("threads")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${activeTab === "threads" ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"}`}
            >
              Threads Engine
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[11px] font-medium text-zinc-400">{userEmail}</span>
            <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest">{userTier} TIER</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center border border-white/10">
            <span className="text-xs font-bold text-zinc-300">{userEmail?.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ── */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-8">
        
        {/* TAB 1: GLOBAL CONFIGS */}
        {activeTab === "global" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Cấu Hình Chung</h1>
              <p className="text-sm text-zinc-500">Quản lý kho link Affiliate và nhận thông báo qua Telegram.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-zinc-200">Affiliate Link Pool</h3>
                  <div className={`w-2 h-2 rounded-full ${formData.affiliate_links ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                </div>
                <textarea 
                  rows={4} 
                  value={formData.affiliate_links} 
                  onChange={(e) => setFormData({ ...formData, affiliate_links: e.target.value })} 
                  onBlur={handleSave} 
                  placeholder={"Nhập mỗi link 1 dòng.\\nGiới hạn: Lite(3), Plus(10), Pro(20), Promax(∞)"} 
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-[13px] font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/50 resize-none transition-all mb-4" 
                />
                <button 
                  onClick={() => handleTrigger("parse_links")} 
                  disabled={triggering || !formData.affiliate_links} 
                  className="w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 font-medium text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  Đồng Bộ Tên & Sinh Comment AI
                </button>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors h-fit">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-zinc-200">Telegram Notify</h3>
                  <div className={`w-2 h-2 rounded-full ${formData.tele_chat_id ? 'bg-sky-500' : 'bg-zinc-700'}`} />
                </div>
                <input 
                  type="text" 
                  value={formData.tele_chat_id} 
                  onChange={(e) => setFormData({ ...formData, tele_chat_id: e.target.value })} 
                  onBlur={handleSave} 
                  placeholder="Chat ID — nhắn @userinfobot để lấy" 
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-[13px] font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500/50 transition-all" 
                />
                <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
                  Nhận cảnh báo real-time khi bot post bài thành công, lỗi cookie, hoặc các thống kê crawl định kỳ.
                </p>
              </div>
            </div>

            {/* Parsing Results */}
            {parsedLinks.length > 0 && (
              <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                <h3 className="font-medium text-zinc-200 mb-6">AI Parsing Results ({parsedLinks.length})</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {parsedLinks.map((p, i) => (
                    <div key={i} className="flex gap-4 bg-[#0a0a0a] border border-white/5 p-4 rounded-xl">
                      <img src={p.image_url} alt="" className="w-16 h-16 rounded-lg object-cover bg-zinc-900 border border-white/5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate mb-1">{p.title}</p>
                        <p className="text-[11px] text-zinc-500 font-mono truncate mb-2">{p.aff_link}</p>
                        <p className="text-xs text-zinc-400 italic">"{p.suggested_comment}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FACEBOOK ENGINE */}
        {activeTab === "fb" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Facebook Engine</h1>
                <p className="text-sm text-zinc-500">Thiết lập Cookie và chạy tiến trình Facebook.</p>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-zinc-200">FB Access Cookie</h3>
                  <div className={`w-2 h-2 rounded-full ${formData.fb_cookie ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                </div>
                <textarea 
                  rows={4} 
                  value={formData.fb_cookie} 
                  onChange={(e) => setFormData({ ...formData, fb_cookie: e.target.value })} 
                  onBlur={handleSave} 
                  placeholder="c_user=...; xs=...; datr=...;" 
                  className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-[13px] font-mono text-emerald-400/80 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none transition-all mb-6" 
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleTrigger("reels")} 
                    disabled={triggering || !formData.fb_cookie} 
                    className="flex items-center justify-center gap-2 bg-zinc-100 text-zinc-900 hover:bg-white font-medium text-sm px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    FB Reels
                  </button>
                  <button 
                    onClick={() => handleTrigger("fb_comment")} 
                    disabled={triggering || !formData.fb_cookie} 
                    className="flex items-center justify-center gap-2 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 font-medium text-sm px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    Auto Comment
                  </button>
                </div>
              </div>
            </div>

            <div className="h-[500px] bg-[#0c0c0c] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#111]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span className="text-xs font-mono font-medium text-zinc-300">fb-live-logs.log</span>
                </div>
                <button onClick={() => setFbLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[12px] custom-scrollbar">
                {fbLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                    <span className={`px-1.5 rounded text-[10px] font-bold uppercase shrink-0 ${LEVEL_BG[log.level]}`}>{log.level}</span>
                    <span className={`${LEVEL_COLOR[log.level]} break-words leading-relaxed`}>{log.msg}</span>
                  </div>
                ))}
                <div ref={fbLogEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: THREADS ENGINE */}
        {activeTab === "threads" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight mb-2">Threads Engine</h1>
                  <p className="text-sm text-zinc-500">Cấu hình Bot Threads và chỉnh sửa bài đăng.</p>
                </div>

                <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-medium text-zinc-200">Threads Access Cookie</h3>
                    <div className={`w-2 h-2 rounded-full ${formData.threads_cookie ? 'bg-blue-500' : 'bg-zinc-700'}`} />
                  </div>
                  <textarea 
                    rows={4} 
                    value={formData.threads_cookie} 
                    onChange={(e) => setFormData({ ...formData, threads_cookie: e.target.value })} 
                    onBlur={handleSave} 
                    placeholder="sessionid=...; ds_user_id=...;" 
                    className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-[13px] font-mono text-blue-400/80 placeholder:text-zinc-700 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all mb-6" 
                  />
                  <button 
                    onClick={() => handleTrigger("threads")} 
                    disabled={triggering || !formData.threads_cookie} 
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-500 font-medium text-sm px-4 py-3 rounded-xl transition-all disabled:opacity-50"
                  >
                    {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Khởi động AI Commenter
                  </button>
                </div>

                {/* Threads Terminal */}
                <div className="h-[350px] bg-[#0c0c0c] border border-white/5 rounded-2xl flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-[#111]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-zinc-400" />
                      <span className="text-xs font-mono font-medium text-zinc-300">threads-live-logs.log</span>
                    </div>
                    <button onClick={() => setThreadsLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[12px] custom-scrollbar">
                    {threadsLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-zinc-600 shrink-0">[{log.time}]</span>
                        <span className={`px-1.5 rounded text-[10px] font-bold uppercase shrink-0 ${LEVEL_BG[log.level]}`}>{log.level}</span>
                        <span className={`${LEVEL_COLOR[log.level]} break-words leading-relaxed`}>{log.msg}</span>
                      </div>
                    ))}
                    <div ref={threadsLogEndRef} />
                  </div>
                </div>

              </div>

              {/* Right Col: Threads Poster */}
              <div className="bg-[#111] border border-white/5 rounded-2xl p-6 flex flex-col h-[700px]">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-medium text-zinc-200">Threads Crawl Poster</h3>
                  <span className="px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-400">{threadsPosts.length} Bài Đăng</span>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                  {threadsPosts.map((post, i) => (
                    <div key={post.id} className="bg-[#0a0a0a] border border-white/5 rounded-xl p-5 relative group/post transition-colors hover:border-zinc-700">
                      <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="absolute top-4 right-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg w-8 h-8 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10"
                          title="Xoá bài viết này"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>

                      <textarea 
                        className="w-full bg-transparent text-[13px] text-zinc-300 resize-none outline-none leading-relaxed min-h-[100px]"
                        value={post.text_content}
                        onChange={(e) => handleUpdatePostText(post.id, e.target.value)}
                        placeholder="Nội dung bài viết..."
                      />
                      
                      {post.image_urls && post.image_urls.length > 0 && (
                         <div className="mt-4 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {post.image_urls.map((url: string, idx: number) => (
                               <div key={idx} className="relative group shrink-0">
                                 <img src={url} className="h-24 w-auto rounded-lg object-cover border border-white/5 transition-all group-hover:opacity-30" />
                                 <button 
                                    onClick={() => handleRemovePostImage(post.id, idx)}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                            ))}
                         </div>
                      )}
                      
                      <div className="mt-6 flex justify-end gap-3">
                        <button onClick={() => handleSavePost(post)} className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium px-4 py-2 rounded-lg transition-all">
                          Lưu
                        </button>
                        <button onClick={() => handlePostToThreads(post)} className="bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-medium px-5 py-2 rounded-lg transition-all">
                          Đăng Lên Threads
                        </button>
                      </div>
                    </div>
                  ))}
                  {threadsPosts.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                       <MessageCircle className="w-10 h-10 mb-4 opacity-50" />
                       <p className="text-sm">Không có dữ liệu Crawl nào.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
      </main>
    </div>
  );
}
"""

content = content[:start_idx] + new_return

with open("Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Rewrite complete")
