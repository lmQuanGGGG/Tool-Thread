import re

with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove the forced dark background from the main container
content = content.replace('bg-black bg-grainy text-zinc-200', 'bg-transparent text-zinc-900')
content = content.replace('bg-hyper-modern bg-grainy/80', 'bg-white/80')

# Convert text colors to dark text for light mode
content = content.replace('text-white', 'text-zinc-900')
# Fix buttons that should still have white text
content = content.replace('bg-blue-600 text-zinc-900', 'bg-blue-600 text-white')
content = content.replace('bg-zinc-800 text-zinc-200', 'bg-zinc-800 text-white')
content = content.replace('bg-zinc-900 text-zinc-200', 'bg-zinc-900 text-white')

# Remaining text mapping
content = content.replace('text-zinc-200', 'text-zinc-800')
content = content.replace('text-zinc-300', 'text-zinc-700')
content = content.replace('text-zinc-400', 'text-zinc-600')

# Fix the terminal background text so it stays legible (terminal is usually black)
# Terminal container is: bg-[#0a0a0a] border border-white/10
# So terminal text should be bright!
# Wait, my fix might have ruined the terminal colors.
# Let's target the terminal output specifically.
content = content.replace('text-zinc-700 font-mono', 'text-zinc-300 font-mono')
content = content.replace('text-zinc-800 text-xs', 'text-zinc-400 text-xs')
content = content.replace('text-zinc-600 font-mono text-[10px]', 'text-zinc-400 font-mono text-[10px]')

with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Switched to Light Mode text")
