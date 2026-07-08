const fs = require('fs');
let content = fs.readFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

// Remove global TerminalPanel
content = content.replace(
  /<div className="h-\[450px\] anim-fade-up anim-d3">\s*<TerminalPanel logs=\{globalLogs\}[\s\S]*?<\/div>/,
  ''
);

// Remove fb TerminalPanel
content = content.replace(
  /<div className="h-\[350px\] anim-fade-up anim-d2">\s*<TerminalPanel logs=\{fbLogs\}[\s\S]*?<\/div>/,
  ''
);

// Remove threads TerminalPanel
content = content.replace(
  /<div className="h-\[350px\] anim-fade-up anim-d2">\s*<TerminalPanel logs=\{threadsLogs\}[\s\S]*?<\/div>/,
  ''
);

fs.writeFileSync('Tool Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
console.log("Done fixing regex");
