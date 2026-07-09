const fs = require('fs');
let content = fs.readFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

// Replace the current Global Terminal Toggle and Panel with the VSCode-style one
const regex = /\{\/\* Global Terminal Toggle \*\/\}(.|\n)*?(?=<\/div>\s*<\/div>\s*\);\s*\})/g;

const newTerminalHtml = `
      {/* VS Code Style Terminal Panel */}
      <div 
        className={\`fixed bottom-0 right-0 left-0 lg:left-[256px] bg-[#0F0F14] border-t border-white/[0.1] shadow-2xl z-50 transition-all duration-300 flex flex-col \${isTerminalOpen ? "h-[320px] translate-y-0" : "h-0 translate-y-full border-transparent"}\`}
      >
        {/* Header / Tabs */}
        <div className="flex items-center justify-between px-4 bg-[#161620] shrink-0 border-b border-white/[0.05]">
          <div className="flex gap-4">
            {(["global", "fb", "threads"] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setTerminalTab(tab)}
                className={\`py-2 text-[11px] font-mono uppercase tracking-wider relative transition-colors \${terminalTab === tab ? "text-white" : "text-gray-500 hover:text-gray-300"}\`}
              >
                {tab === "global" ? "Global Logs" : tab === "fb" ? "FB Logs" : "Threads Logs"}
                {terminalTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (terminalTab === "global") setGlobalLogs([{ time: now(), level: "INFO", msg: "Cleared." }]);
                if (terminalTab === "fb") setFbLogs([{ time: now(), level: "INFO", msg: "Cleared." }]);
                if (terminalTab === "threads") setThreadsLogs([{ time: now(), level: "INFO", msg: "Cleared." }]);
              }} 
              className="text-zinc-500 hover:text-white transition-colors"
              title="Clear Terminal"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setIsTerminalOpen(false)} className="text-zinc-500 hover:text-white transition-colors" title="Close Panel">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Log Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-[12px] bg-[#0F0F14]">
          {(terminalTab === "global" ? globalLogs : terminalTab === "fb" ? fbLogs : threadsLogs).map((log, i) => (
            <div key={i} className="flex items-start gap-2 hover:bg-white/[0.02] px-2 py-0.5 rounded transition-colors -mx-2">
              <span className="text-zinc-600 shrink-0 tabular-nums">[{log.time}]</span>
              <span className={\`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 \${LEVEL_BG[log.level]}\`}>{log.level}</span>
              <span className={\`\${LEVEL_COLOR[log.level]} break-words leading-relaxed\`}>{log.msg}</span>
            </div>
          ))}
          <div ref={terminalTab === "global" ? globalLogEndRef : terminalTab === "fb" ? fbLogEndRef : threadsLogEndRef} />
        </div>
      </div>

      {/* Global Terminal Toggle Button (when closed) */}
      {!isTerminalOpen && (
        <button 
          onClick={() => setIsTerminalOpen(true)}
          className="fixed bottom-6 right-6 w-12 h-12 bg-[#0F0F14] hover:bg-[#161620] text-white rounded-full flex items-center justify-center shadow-2xl border border-white/[0.1] z-40 transition-all hover:scale-105"
          title="Open Terminal"
        >
          <Terminal className="w-5 h-5" />
        </button>
      )}
`;

content = content.replace(regex, newTerminalHtml.trim());
fs.writeFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
console.log("Done updating terminal style");
