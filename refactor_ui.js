const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'Tool-Thread', 'web-saas', 'src', 'app', 'dashboard', 'accounts', 'page.tsx');
let code = fs.readFileSync(p, 'utf8');

// The BODY layout currently is:
//       {/* ── BODY: 2-col ── */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* LEFT — Config Modules: 2x2 grid */}
//         <div className="flex-1 overflow-y-auto p-4">
//           <div className="grid grid-cols-2 gap-3 h-full">
//             ... cards ...
//           </div>
//         </div>
//         {/* RIGHT — Console Live Logs */}
//         <div className="w-[300px] shrink-0 border-l border-zinc-800/80 flex flex-col bg-zinc-900/40">
//           ... logs ...
//         </div>
//       </div>

// I will replace it using regex.
const bodyStart = code.indexOf('{/* ── BODY: 2-col ── */}');
const beforeBody = code.substring(0, bodyStart);

const newBody = `      {/* ── BODY: 2-col ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT COLUMN: FACEBOOK */}
        <div className="flex-1 flex flex-col border-r border-zinc-800/80 bg-zinc-950/50">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Module 1: FB Cookie */}
            <ModuleCard label="FB Reels Engine" subtitle="Bypass Cookie Auth v2.0" dotActive={!!formData.fb_cookie}>
              <textarea rows={3} value={formData.fb_cookie} onChange={(e) => setFormData({ ...formData, fb_cookie: e.target.value })} onBlur={handleSave} placeholder="c_user=...; xs=...; datr=...;" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-[11px] font-mono text-emerald-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 resize-none transition-all" />
              {formData.fb_cookie && (
                <div className="mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /><span className="font-mono text-[10px] text-emerald-400">Cookie loaded — Ready to deploy</span></div>
              )}
            </ModuleCard>

            {/* Module 3: Affiliate Links */}
            <ModuleCard label="Affiliate Link Pool" subtitle={"Giới hạn theo Tier"} dotActive={formData.affiliate_links.length > 0}>
              <textarea rows={3} value={formData.affiliate_links} onChange={(e) => setFormData({ ...formData, affiliate_links: e.target.value })} onBlur={handleSave} placeholder={"Nhập mỗi link 1 dòng.\\nGiới hạn: Lite(3), Plus(10), Pro(20), Promax(∞)"} className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-[11px] font-mono text-amber-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 resize-none transition-all mb-2" />
              <button onClick={() => handleTrigger("parse_links")} disabled={triggering || formData.affiliate_links.length === 0} className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all disabled:opacity-40">
                {triggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                Đồng bộ Tên & Sinh AI Comment
              </button>
              {parsedLinks.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] text-zinc-500 font-mono font-bold uppercase">AI Parsing Results ({parsedLinks.length})</p>
                  <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {parsedLinks.map((p, i) => (
                      <div key={i} className="flex gap-2 bg-zinc-950/80 p-2 rounded-lg border border-zinc-800">
                        <div className="w-10 h-10 shrink-0 bg-zinc-900 rounded overflow-hidden"><img src={p.image_url} alt="img" className="w-full h-full object-cover opacity-80" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-zinc-300 font-bold truncate">{p.title}</p>
                          <p className="text-[9px] text-zinc-400 font-mono truncate mt-0.5">Link: {p.aff_link}</p>
                          <p className="text-[10px] text-emerald-400 italic truncate mt-1">" {p.suggested_comment} "</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ModuleCard>

            {/* Module 4: Telegram */}
            <ModuleCard label="Telegram Notify" subtitle="Real-time alerts" dotActive={!!formData.tele_chat_id}>
              <input type="text" value={formData.tele_chat_id} onChange={(e) => setFormData({ ...formData, tele_chat_id: e.target.value })} onBlur={handleSave} placeholder="Chat ID — nhắn @userinfobot để lấy" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-[11px] font-mono text-sky-300 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/50 transition-all mb-3" />
            </ModuleCard>

            <div className="flex flex-wrap gap-2 mt-2">
              <button onClick={() => handleTrigger("reels")} disabled={triggering || !formData.fb_cookie} className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all disabled:opacity-40">
                {triggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Run FB Reels
              </button>
              <button onClick={() => handleTrigger("fb_comment")} disabled={triggering || !formData.fb_cookie} className="flex items-center gap-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-400 font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all disabled:opacity-40">
                {triggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />}
                Run FB Auto Comment
              </button>
            </div>
          </div>

          {/* FB LOGS */}
          <div className="h-[250px] shrink-0 border-t border-zinc-800/80 flex flex-col bg-zinc-900/40">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5 text-emerald-400" /><span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">FB Live Logs</span></div>
              <button onClick={() => setFbLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-600 hover:text-zinc-400 transition-colors" title="Clear logs"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[10px]">
              {fbLogs.map((log, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2"><span className="text-zinc-600">[{log.time}]</span><span className={\`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase \${LEVEL_BG[log.level]}\`}>{log.level}</span></div>
                  <p className={\`leading-relaxed pl-1 \${LEVEL_COLOR[log.level]}\`}>{log.msg}</p>
                </div>
              ))}
              <div ref={fbLogEndRef} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: THREADS */}
        <div className="flex-1 flex flex-col bg-zinc-950/50">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Module 2: Threads Cookie */}
            <ModuleCard label="Threads AI Commenter" subtitle="Simulate Authentic Discourse" dotActive={!!formData.threads_cookie}>
              <textarea rows={3} value={formData.threads_cookie} onChange={(e) => setFormData({ ...formData, threads_cookie: e.target.value })} onBlur={handleSave} placeholder="sessionid=...; ds_user_id=...;" className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-[11px] font-mono text-blue-300 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none transition-all" />
              {formData.threads_cookie && (
                <div className="mt-2 flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" /><span className="font-mono text-[10px] text-blue-400">Threads auth — Connected</span></div>
              )}
            </ModuleCard>

            <div className="flex flex-wrap gap-2 mt-2 mb-4">
              <button onClick={() => handleTrigger("threads")} disabled={triggering || !formData.threads_cookie} className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/40 text-blue-400 font-mono font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-full transition-all disabled:opacity-40">
                {triggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Run Threads Comment Bot
              </button>
            </div>

            {/* Module: Crawl Data */}
            <ModuleCard label="Threads Crawl Poster" subtitle={threadsPosts.length + " bài khả dụng"} dotActive={threadsPosts.length > 0}>
              <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {threadsPosts.map((post, i) => (
                  <div key={post.id} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
                    <p className="text-[11px] text-zinc-300 whitespace-pre-wrap">{post.text_content}</p>
                    {post.image_urls && post.image_urls.length > 0 && (
                       <div className="mt-2 flex gap-2 overflow-x-auto">
                          {post.image_urls.map((url, idx) => (
                             <img key={idx} src={url} className="h-16 rounded object-cover border border-zinc-800" />
                          ))}
                       </div>
                    )}
                    <div className="mt-3 flex justify-end">
                      <button onClick={() => handleTrigger("threads_post_" + post.id)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold px-3 py-1.5 rounded transition-all">
                        Post To Threads
                      </button>
                    </div>
                  </div>
                ))}
                {threadsPosts.length === 0 && <p className="text-zinc-500 text-[11px] italic">Không có dữ liệu Crawl.</p>}
              </div>
            </ModuleCard>

          </div>

          {/* THREADS LOGS */}
          <div className="h-[250px] shrink-0 border-t border-zinc-800/80 flex flex-col bg-zinc-900/40">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2"><Terminal className="w-3.5 h-3.5 text-blue-400" /><span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest">Threads Live Logs</span></div>
              <button onClick={() => setThreadsLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-600 hover:text-zinc-400 transition-colors" title="Clear logs"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[10px]">
              {threadsLogs.map((log, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2"><span className="text-zinc-600">[{log.time}]</span><span className={\`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase \${LEVEL_BG[log.level]}\`}>{log.level}</span></div>
                  <p className={\`leading-relaxed pl-1 \${LEVEL_COLOR[log.level]}\`}>{log.msg}</p>
                </div>
              ))}
              <div ref={threadsLogEndRef} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync(p, beforeBody + newBody);
console.log('UI Refactored');
