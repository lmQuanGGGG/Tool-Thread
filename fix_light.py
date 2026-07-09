import re

# Fix page.tsx to use dark text
with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove forced background
content = content.replace('bg-hyper-modern bg-grainy', '')

# Make text dark
content = content.replace('text-white', 'text-zinc-900')
content = content.replace('text-zinc-100', 'text-zinc-900')
content = content.replace('text-zinc-200', 'text-zinc-800')
content = content.replace('text-zinc-300', 'text-zinc-700')
content = content.replace('text-zinc-400', 'text-zinc-600')
# Restore terminal text (don't make it too dark on black terminal bg)
# Terminals have bg-[#0c0c0c] or bg-[#0a0a0a], so we must keep text bright there!
content = content.replace('bg-[#0c0c0c] text-zinc-700', 'bg-[#0c0c0c] text-zinc-300')
content = content.replace('bg-[#0a0a0a] border border-white/5 rounded-xl p-4 h-[400px] overflow-y-auto font-mono text-[10px] text-zinc-600', 'bg-[#0a0a0a] border border-white/5 rounded-xl p-4 h-[400px] overflow-y-auto font-mono text-[10px] text-zinc-300')

# Restore button texts
content = content.replace('bg-blue-600 text-zinc-900', 'bg-blue-600 text-white')
content = content.replace('bg-zinc-800 text-zinc-900', 'bg-zinc-800 text-white')

with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

# Fix globals.css to look good in light mode
with open("Tool-Thread/web-saas/src/app/globals.css", "r", encoding="utf-8") as f:
    css = f.read()

css = css.replace('rgba(20, 20, 20, 0.7)', 'rgba(255, 255, 255, 0.7)')
css = css.replace('rgba(255, 255, 255, 0.06)', 'rgba(0, 0, 0, 0.05)')
css = css.replace('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.8)')
css = css.replace('rgba(0, 0, 0, 0.6)', '#ffffff')

with open("Tool-Thread/web-saas/src/app/globals.css", "w", encoding="utf-8") as f:
    f.write(css)

print("Fixed for Light Mode")
