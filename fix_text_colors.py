with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Stepwise replacement from darkest to lightest to avoid double-bumping
content = content.replace("text-zinc-100", "text-white")
content = content.replace("text-zinc-200", "text-white")
content = content.replace("text-zinc-300", "text-zinc-200")
content = content.replace("text-zinc-400", "text-zinc-300")
content = content.replace("text-zinc-500", "text-zinc-400")
content = content.replace("text-zinc-600", "text-zinc-500")

# Input text needs to be very bright
content = content.replace("text-emerald-400/80", "text-emerald-400 font-bold")
content = content.replace("text-blue-400/80", "text-blue-400 font-bold")

with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Colors bumped")
