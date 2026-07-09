const fs = require('fs');
let content = fs.readFileSync('Tool-Thread/web-saas/src/app/dashboard/crawl/page.tsx', 'utf8');

// The dashboard background
content = content.replace(/className="h-full overflow-y-auto bg-zinc-950 p-5"/g, 'className="pb-10 p-5"');

// Common background and borders
content = content.replace(/bg-zinc-900\/60|bg-zinc-900\/80|bg-zinc-900/g, 'bg-white');
content = content.replace(/border-zinc-800\/80|border-zinc-800/g, 'border-gray-200/80');

content = content.replace(/bg-zinc-800\/50|bg-zinc-800/g, 'bg-gray-50');
content = content.replace(/border-zinc-700\/50|border-zinc-700/g, 'border-gray-200');
content = content.replace(/bg-zinc-950/g, 'bg-white');

// Text colors
content = content.replace(/text-white/g, 'text-gray-900');
content = content.replace(/text-zinc-200/g, 'text-gray-800');
content = content.replace(/text-zinc-300/g, 'text-gray-700');
content = content.replace(/text-zinc-400/g, 'text-gray-500');
content = content.replace(/text-zinc-500/g, 'text-gray-400');
content = content.replace(/hover:text-zinc-300/g, 'hover:text-gray-700');
content = content.replace(/hover:bg-zinc-800/g, 'hover:bg-gray-100');

// Input and textarea
content = content.replace(/bg-\[\#1C1C1F\]/g, 'bg-white');
content = content.replace(/border-\[\#2A2A2E\]/g, 'border-gray-200/80');
content = content.replace(/bg-\[\#131315\]/g, 'bg-white');
content = content.replace(/placeholder:text-gray-600/g, 'placeholder:text-gray-400');

// Primary / Secondary Buttons
content = content.replace(/bg-blue-600/g, 'bg-gray-900');
content = content.replace(/hover:bg-blue-700/g, 'hover:bg-black');
content = content.replace(/text-gray-900 rounded-xl/g, 'text-white rounded-xl'); // text-white was replaced by text-gray-900 above, let's fix it specifically for buttons:
// Wait, the button has bg-gray-900 text-gray-900. I'll just regex fix it manually later if needed.

// Colored backgrounds
content = content.replace(/bg-blue-500\/10/g, 'bg-sky-50');
content = content.replace(/text-blue-400/g, 'text-sky-600');
content = content.replace(/border-blue-500\/30/g, 'border-sky-100');
content = content.replace(/shadow-blue-900\/20/g, 'shadow-sm');

// Fix specific text-white replacements that should remain white
content = content.replace(/text-gray-900 font-mono/g, 'text-gray-900 font-mono'); // this is fine
content = content.replace(/text-gray-900 rounded-xl/g, 'text-white rounded-xl');
content = content.replace(/bg-emerald-500 hover:bg-emerald-600 text-gray-900/g, 'bg-emerald-500 hover:bg-emerald-600 text-white');

fs.writeFileSync('Tool-Thread/web-saas/src/app/dashboard/crawl/page.tsx', content);
console.log("Done replacing dark classes");
