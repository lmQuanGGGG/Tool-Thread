import re

with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find the start of the return block
match = re.search(r"  return \(\n    /\* Dark full-page wrapper", content)
if not match:
    print("Could not find start of return block")
    exit(1)

start_idx = match.start()

new_return = """  return (
    /* Dark full-page wrapper — fit viewport */
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* ── TITLE BAR ── */}
      <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60 z-10">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Bot className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-bold text-[13px] text-zinc-100 tracking-widest uppercase">
              AutoFarm Simulator v3.4
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
            Tier: <span className="text-emerald-400 font-bold">{userTier.toUpperCase()}</span>
          </span>
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-400 font-bold">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* ROW 1: SHARED */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ModuleCard label="Affiliate Link Pool" subtitle={"Giới hạn theo Tier"} dotActive={formData.affiliate_links.length > 0}>
                <textarea rows={3} value={formData.affiliate_links} onChange={(e) => setFormData({ ...formData, affiliate_links: e.target.value })} onBlur={handleSave} placeholder={"Nhập mỗi link 1 dòng.\\nGiới hạn: Lite(3), Plus(10), Pro(20), Promax(∞)"} className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-amber-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none transition-all mb-3" />
                <button onClick={() => handleTrigger("parse_links")} disabled={triggering || formData.affiliate_links.length === 0} className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40 w-fit">
                  {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Đồng bộ Tên & Sinh AI Comment
                </button>
                {parsedLinks.length > 0 && (
                  <div className="mt-5 border-t border-zinc-800/60 pt-4">
                    <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase mb-3">AI Parsing Results ({parsedLinks.length})</p>
                    <div className="max-h-[160px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {parsedLinks.map((p, i) => (
                        <div key={i} className="flex gap-3 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/80 hover:border-zinc-700 transition-colors">
                          <div className="w-12 h-12 shrink-0 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800"><img src={p.image_url} alt="img" className="w-full h-full object-cover opacity-90" /></div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className="text-[11px] text-zinc-200 font-bold truncate mb-0.5">{p.title}</p>
                            <p className="text-[9px] text-zinc-500 font-mono truncate mb-1">Link: <span className="text-zinc-400">{p.aff_link}</span></p>
                            <p className="text-[10px] text-emerald-400 italic truncate">" {p.suggested_comment} "</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ModuleCard>
            </div>
            
            <div className="lg:col-span-1">
              <ModuleCard label="Telegram Notify" subtitle="Real-time alerts" dotActive={!!formData.tele_chat_id}>
                <input type="text" value={formData.tele_chat_id} onChange={(e) => setFormData({ ...formData, tele_chat_id: e.target.value })} onBlur={handleSave} placeholder="Chat ID — nhắn @userinfobot để lấy" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-sky-300 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 transition-all" />
              </ModuleCard>
            </div>
          </div>

          {/* ROW 2: ENGINES & POSTER */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Col: Core Engines */}
            <div className="space-y-6">
              <ModuleCard label="FB Reels Engine" subtitle="Bypass Cookie Auth v2.0" dotActive={!!formData.fb_cookie}>
                <textarea rows={3} value={formData.fb_cookie} onChange={(e) => setFormData({ ...formData, fb_cookie: e.target.value })} onBlur={handleSave} placeholder="c_user=...; xs=...; datr=...;" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-emerald-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-all mb-3" />
                {formData.fb_cookie && (
                  <div className="flex items-center gap-2 mb-4"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]" /><span className="font-mono text-[10px] text-emerald-400">Cookie loaded — Ready to deploy</span></div>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <button onClick={() => handleTrigger("reels")} disabled={triggering || !formData.fb_cookie} className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40">
                    {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Run FB Reels
                  </button>
                  <button onClick={() => handleTrigger("fb_comment")} disabled={triggering || !formData.fb_cookie} className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-400 font-mono font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40">
                    {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageCircle className="w-3.5 h-3.5" />}
                    Run FB Auto Comment
                  </button>
                </div>
              </ModuleCard>

              <ModuleCard label="Threads AI Commenter" subtitle="Simulate Authentic Discourse" dotActive={!!formData.threads_cookie}>
                <textarea rows={3} value={formData.threads_cookie} onChange={(e) => setFormData({ ...formData, threads_cookie: e.target.value })} onBlur={handleSave} placeholder="sessionid=...; ds_user_id=...;" className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-[11px] font-mono text-blue-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none transition-all mb-3" />
                {formData.threads_cookie && (
                  <div className="flex items-center gap-2 mb-4"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)]" /><span className="font-mono text-[10px] text-blue-400">Threads auth — Connected</span></div>
                )}
                <div className="flex flex-wrap gap-2.5">
                  <button onClick={() => handleTrigger("threads")} disabled={triggering || !formData.threads_cookie} className="flex items-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 text-blue-400 font-mono font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40">
                    {triggering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    Run Threads Comment Bot
                  </button>
                </div>
              </ModuleCard>
            </div>

            {/* Right Col: Crawl Poster */}
            <div className="space-y-6">
              <ModuleCard label="Threads Crawl Poster" subtitle={threadsPosts.length + " bài khả dụng"} dotActive={threadsPosts.length > 0}>
                <div className="max-h-[600px] overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {threadsPosts.map((post, i) => (
                    <div key={post.id} className="bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-4 relative group/post transition-colors">
                      <button 
                          onClick={() => handleDeletePost(post.id)}
                          className="absolute top-3 right-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg w-7 h-7 flex items-center justify-center opacity-0 group-hover/post:opacity-100 transition-all z-10"
                          title="Xoá bài viết này"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>

                      <textarea 
                        className="w-full bg-zinc-900/30 border border-transparent focus:border-zinc-700 hover:border-zinc-800 rounded-lg p-3 pr-10 text-[12px] text-zinc-300 resize-none transition-all outline-none leading-relaxed"
                        rows={4}
                        value={post.text_content}
                        onChange={(e) => handleUpdatePostText(post.id, e.target.value)}
                      />
                      {post.image_urls && post.image_urls.length > 0 && (
                         <div className="mt-3 flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {post.image_urls.map((url: string, idx: number) => (
                               <div key={idx} className="relative group shrink-0">
                                 <img src={url} className="h-24 w-auto rounded-lg object-cover border border-zinc-800 transition-all group-hover:opacity-40" />
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
                      <div className="mt-4 flex justify-end gap-3 border-t border-zinc-800/60 pt-4">
                        <button onClick={() => handleSavePost(post)} className="bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold px-4 py-2 rounded-lg transition-all">
                          Lưu Thay Đổi
                        </button>
                        <button onClick={() => handlePostToThreads(post)} className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-[11px] font-bold px-5 py-2 rounded-lg transition-all">
                          Post To Threads
                        </button>
                      </div>
                    </div>
                  ))}
                  {threadsPosts.length === 0 && <p className="text-zinc-500 text-[12px] italic text-center py-4">Không có dữ liệu Crawl.</p>}
                </div>
              </ModuleCard>
            </div>
          </div>
        </div>
      </div>

      {/* ── IDE TERMINAL (FIXED BOTTOM) ── */}
      <div className="h-[280px] shrink-0 border-t border-zinc-800/80 bg-[#0c0c0c] flex shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20 relative">
        
        {/* Left: FB Terminal */}
        <div className="flex-1 flex flex-col border-r border-zinc-800/60">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">FB Console</span>
            </div>
            <button onClick={() => setFbLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar font-mono text-[11px]">
            {fbLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 hover:bg-white/[0.02] px-1 rounded transition-colors">
                <span className="text-zinc-600 shrink-0 mt-0.5">[{log.time}]</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5 ${LEVEL_BG[log.level]}`}>{log.level}</span>
                <p className={`leading-relaxed break-words ${LEVEL_COLOR[log.level]}`}>{log.msg}</p>
              </div>
            ))}
            <div ref={fbLogEndRef} />
          </div>
        </div>

        {/* Right: Threads Terminal */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-mono text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Threads Console</span>
            </div>
            <button onClick={() => setThreadsLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar font-mono text-[11px]">
            {threadsLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-2 hover:bg-white/[0.02] px-1 rounded transition-colors">
                <span className="text-zinc-600 shrink-0 mt-0.5">[{log.time}]</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 mt-0.5 ${LEVEL_BG[log.level]}`}>{log.level}</span>
                <p className={`leading-relaxed break-words ${LEVEL_COLOR[log.level]}`}>{log.msg}</p>
              </div>
            ))}
            <div ref={threadsLogEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
"""

new_content = content[:start_idx] + new_return
with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated layout")
