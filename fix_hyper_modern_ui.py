import re

with open("Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the main background with the hyper modern background
content = content.replace('bg-[#0a0a0a]', 'bg-hyper-modern bg-grainy')

# Use CSS grid instead of regular flex for some major sections
content = content.replace('grid grid-cols-1 md:grid-cols-2 gap-6', 'page-layout')
content = content.replace('grid grid-cols-1 lg:grid-cols-2 gap-8', 'page-layout')
content = content.replace('grid grid-cols-1 lg:grid-cols-2 gap-8 items-start', 'page-layout items-start')

# Convert the immediate children of those grids to use .area-half
content = re.sub(r'(<div className=")(bg-\[#111\] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors)', r'\1area-half shadow-layered \2', content)
content = re.sub(r'(<div className=")(space-y-6)', r'\1area-half \2', content)
content = re.sub(r'(<div className=")(h-\[500px\] bg-\[#0c0c0c\])', r'\1area-half shadow-layered \2', content)
content = re.sub(r'(<div className=")(bg-\[#111\] border border-white/5 rounded-2xl p-6 flex flex-col h-\[700px\])', r'\1area-half shadow-layered \2', content)

# Update h1 titles to use fluid typography and text-balance
content = content.replace('text-2xl font-semibold text-zinc-100 tracking-tight mb-2', 'text-fluid-h1 font-semibold text-zinc-100 tracking-tight mb-2 text-balance')

# Update p descriptions to use text-pretty
content = content.replace('text-sm text-zinc-500', 'text-sm text-zinc-500 text-pretty')

# Add the dim-siblings class to any container wrapping multiple glass-panels/posts
content = content.replace('flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar', 'flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar dim-siblings')
content = content.replace('grid grid-cols-1 lg:grid-cols-2 gap-4', 'grid grid-cols-1 lg:grid-cols-2 gap-4 dim-siblings')

# Replace bg-[#111] with glass-panel in main cards to use the new glassy layered squircle look
content = content.replace('bg-[#111] border border-white/5 rounded-2xl', 'glass-panel')
content = content.replace('bg-[#0a0a0a] border border-white/5 rounded-xl', 'glass-panel')

# Update Buttons to use btn-premium strictly
content = content.replace('bg-white text-black hover:bg-zinc-200', 'btn-premium bg-white text-black hover:bg-zinc-200')
content = content.replace('bg-zinc-100 text-zinc-900 hover:bg-white', 'btn-premium bg-zinc-100 text-zinc-900 hover:bg-white')
content = content.replace('bg-zinc-800 text-zinc-200 hover:bg-zinc-700', 'btn-premium bg-zinc-800 text-zinc-200 hover:bg-zinc-700')
content = content.replace('bg-blue-600 text-white hover:bg-blue-500', 'btn-premium bg-blue-600 text-white hover:bg-blue-500')
content = content.replace('bg-zinc-800 text-zinc-300 hover:bg-zinc-700', 'btn-premium bg-zinc-800 text-zinc-300 hover:bg-zinc-700')

with open("Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated page.tsx with hyper modern CSS classes")
