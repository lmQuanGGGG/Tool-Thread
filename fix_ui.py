import re

with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update ModuleCard
content = re.sub(
    r'className="bg-zinc-900/80 border border-zinc-700/60 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-600/80 transition-all"',
    r'className="glass-panel rounded-2xl p-6 transition-all hover:border-zinc-600/80 group"',
    content
)

# 2. Update Main Wrapper to include blobs
content = re.sub(
    r'<div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">',
    r'<div className="h-screen bg-[#050505] flex flex-col overflow-hidden relative">\n      <div className="bg-ambient-blob w-[500px] h-[500px] bg-emerald-500/10 rounded-full top-[-200px] left-[-200px]" />\n      <div className="bg-ambient-blob w-[600px] h-[600px] bg-blue-500/10 rounded-full bottom-[-100px] right-[-200px]" style={{animationDelay: "5s"}} />',
    content
)

# 3. Update Textareas and Inputs
content = re.sub(
    r'className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-\[11px\] font-mono text-(.*?)-300 placeholder:text-zinc-600 focus:outline-none focus:border-(.*?)-500/50 resize-none transition-all mb-3"',
    r'className="w-full glass-input rounded-xl p-3 text-[11px] font-mono text-\1-300 placeholder:text-zinc-600 focus:outline-none focus:border-\2-500/50 resize-none transition-all mb-3"',
    content
)
content = re.sub(
    r'className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-3 text-\[11px\] font-mono text-(.*?)-300 placeholder:text-zinc-600 focus:outline-none focus:border-(.*?)-500/50 transition-all"',
    r'className="w-full glass-input rounded-xl p-3 text-[11px] font-mono text-\1-300 placeholder:text-zinc-600 focus:outline-none focus:border-\2-500/50 transition-all"',
    content
)
content = re.sub(
    r'className="w-full bg-zinc-900/30 border border-transparent focus:border-zinc-700 hover:border-zinc-800 rounded-lg p-3 pr-10 text-\[12px\] text-zinc-300 resize-none transition-all outline-none leading-relaxed"',
    r'className="w-full glass-input rounded-lg p-3 pr-10 text-[12px] text-zinc-300 resize-none transition-all outline-none leading-relaxed"',
    content
)

# 4. Update Buttons
content = re.sub(
    r'className="flex items-center gap-2 bg-(.*?)-500/10 hover:bg-\1-500/20 border border-\1-500/40 text-\1-400 font-mono font-bold text-\[10px\] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40(.*?)"',
    r'className="flex items-center gap-2 btn-premium bg-\1-500/10 hover:bg-\1-500/20 border border-\1-500/30 hover:border-\1-400/50 text-\1-400 font-mono font-bold text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-full transition-all disabled:opacity-40 hover:shadow-[0_0_15px_rgba(var(--color-\1-500),0.2)]\2"',
    content
)

content = re.sub(
    r'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-\[11px\] font-bold px-4 py-2 rounded-lg transition-all',
    r'btn-premium bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-[11px] font-bold px-4 py-2 rounded-lg transition-all',
    content
)

content = re.sub(
    r'bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-\[11px\] font-bold px-5 py-2 rounded-lg transition-all',
    r'btn-premium bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-400/50 text-blue-400 text-[11px] font-bold px-5 py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]',
    content
)

# 5. Fix Post items background
content = re.sub(
    r'bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-4 relative group/post transition-colors',
    r'glass-panel !bg-black/20 hover:!bg-black/40 rounded-xl p-4 relative group/post transition-colors',
    content
)

with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("UI updated")
