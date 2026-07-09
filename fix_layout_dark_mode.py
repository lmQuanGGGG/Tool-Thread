with open("Tool-Thread/web-saas/src/app/dashboard/layout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Convert Sidebar and Layout to Dark Mode
content = content.replace('bg-white', 'bg-[#0a0a0a]')
content = content.replace('bg-[#F8F9FA]', 'bg-[#000]')
content = content.replace('border-black/5', 'border-white/5')
content = content.replace('border-zinc-100', 'border-white/5')
content = content.replace('border-zinc-200', 'border-white/10')
content = content.replace('text-zinc-900', 'text-white')
content = content.replace('text-zinc-800', 'text-zinc-200')
content = content.replace('text-zinc-500', 'text-zinc-400')
content = content.replace('bg-zinc-100', 'bg-white/5')
content = content.replace('bg-zinc-200', 'bg-white/10')
content = content.replace('radial-gradient(#d4d4d8 1px, transparent 1px)', 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)')

with open("Tool-Thread/web-saas/src/app/dashboard/layout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    page = f.read()

# Ensure page.tsx background is strictly dark by using inline style/tailwind
page = page.replace('bg-hyper-modern', 'bg-black')

with open("Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(page)

print("Layout and Page converted to Dark Mode")
