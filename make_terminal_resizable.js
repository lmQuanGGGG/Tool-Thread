const fs = require('fs');
let content = fs.readFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

// 1. Add states for terminal height and dragging
if (!content.includes('const [terminalHeight')) {
  content = content.replace(
    /const \[isTerminalOpen, setIsTerminalOpen\] = useState\(false\);/,
    `const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHeight, setTerminalHeight] = useState(320);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 150 && newHeight < window.innerHeight - 150) {
        setTerminalHeight(newHeight);
      }
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);`
  );
}

// 2. Adjust the main container paddingBottom
content = content.replace(
  /<div className="min-h-screen bg-\[\#F7F7F8\] font-sans text-gray-900 pb-20">/,
  `<div className="min-h-screen bg-[#F7F7F8] font-sans text-gray-900 transition-all duration-300" style={{ paddingBottom: isTerminalOpen ? terminalHeight : 80 }}>`
);

// 3. Update the terminal panel style and add the drag handle
content = content.replace(
  /className=\{`fixed bottom-0 right-0 left-0 lg:left-\[256px\] bg-\[\#0F0F14\] border-t border-white\/\[0\.1\] shadow-2xl z-50 transition-all duration-300 flex flex-col \$\{isTerminalOpen \? "h-\[320px\] translate-y-0" : "h-0 translate-y-full border-transparent"}`\}/g,
  `className={\`fixed bottom-0 right-0 left-0 lg:left-[256px] bg-[#0F0F14] shadow-2xl z-50 flex flex-col transition-transform \${isDragging ? "duration-0" : "duration-300"} \${isTerminalOpen ? "translate-y-0" : "translate-y-full border-transparent"}\`}
        style={{ height: isTerminalOpen ? terminalHeight : 0 }}`
);

// Add the drag handle above the header
const headerRegex = /\{\/\* Header \/ Tabs \*\/\}\s*<div className="flex items-center justify-between px-4 bg-\[\#161620\] shrink-0 border-b border-white\/\[0\.05\]">/;
const replacement = `{/* Drag Handle */}
        <div 
          onMouseDown={() => setIsTerminalOpen(true) && setIsDragging(true)} // if they drag it should be open
          onMouseDownCapture={() => setIsDragging(true)}
          className="h-1.5 w-full bg-[#161620] cursor-row-resize hover:bg-blue-500/50 transition-colors shrink-0"
        />
        {/* Header / Tabs */}
        <div className="flex items-center justify-between px-4 bg-[#161620] shrink-0 border-b border-white/[0.05]">`;
content = content.replace(headerRegex, replacement);

fs.writeFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
console.log("Done updating terminal to be resizable");
