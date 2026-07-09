with open("Tool-Thread/web-saas/src/app/dashboard/layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("text-zinc-500", "text-slate-600")
content = content.replace("text-zinc-400", "text-slate-500")
content = content.replace("text-zinc-800", "text-slate-900")
content = content.replace("text-zinc-900", "text-slate-950")
content = content.replace("bg-zinc-900", "bg-slate-950")
content = content.replace("bg-zinc-700", "bg-slate-800")
content = content.replace("hover:bg-zinc-100", "hover:bg-slate-100")
content = content.replace("border-zinc-100", "border-slate-200")
content = content.replace("border-zinc-200", "border-slate-300")

with open("Tool-Thread/web-saas/src/app/dashboard/layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated layout to slate")
