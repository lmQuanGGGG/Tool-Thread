import re

with open("Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make the text colors premium slate and darker!
# But skip zinc-300 and zinc-400 which are used in the terminal.
content = content.replace("text-zinc-500", "text-slate-600")
content = content.replace("text-zinc-600", "text-slate-700")
content = content.replace("text-zinc-700", "text-slate-800")
content = content.replace("text-zinc-800", "text-slate-900")
content = content.replace("text-zinc-900", "text-slate-950")

# Buttons using zinc
content = content.replace("bg-zinc-800", "bg-slate-900")
content = content.replace("bg-zinc-900", "bg-slate-950")

# Update selection color
content = content.replace("selection:bg-zinc-800 selection:text-zinc-900", "selection:bg-blue-200 selection:text-blue-900")

# Update placeholder colors
content = content.replace("placeholder:text-zinc-500", "placeholder:text-slate-400")
content = content.replace("placeholder:text-zinc-400", "placeholder:text-slate-400")

with open("Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated to premium slate palette")
