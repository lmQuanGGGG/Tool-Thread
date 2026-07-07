with open("Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make the terminals light mode
content = content.replace('bg-[#0c0c0c]', 'bg-zinc-950')
content = content.replace('bg-[#111]', 'bg-zinc-900')

# Actually, wait. The user saw a BLACK terminal in the screenshot! Look at the screenshot! 
# "fb-live-logs.log" has a BLACK background, white text! And the user LOVED it!
# Wait, if the terminal was black, and my script changed text to dark, the terminal text is now dark!
# I need to revert terminal text to light!
content = content.replace('<Terminal className="w-4 h-4 text-zinc-700" />', '<Terminal className="w-4 h-4 text-zinc-400" />')
content = content.replace('<span className="text-xs font-mono font-medium text-zinc-800">fb-live-logs.log</span>', '<span className="text-xs font-mono font-medium text-zinc-300">fb-live-logs.log</span>')
content = content.replace('<span className="text-xs font-mono font-medium text-zinc-800">threads-live-logs.log</span>', '<span className="text-xs font-mono font-medium text-zinc-300">threads-live-logs.log</span>')
content = content.replace('<button onClick={() => setFbLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-500 hover:text-zinc-800 transition-colors">', '<button onClick={() => setFbLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-500 hover:text-zinc-300 transition-colors">')
content = content.replace('<button onClick={() => setThreadsLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-500 hover:text-zinc-800 transition-colors">', '<button onClick={() => setThreadsLogs([{ time: now(), level: "INFO", msg: "Console cleared." }])} className="text-zinc-500 hover:text-zinc-300 transition-colors">')

with open("Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed terminal text")
