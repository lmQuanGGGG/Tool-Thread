const fs = require('fs');
let content = fs.readFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', 'utf8');

// 1. Fix Threads Crawl Poster (Vertical list)
// Text area:
content = content.replace(
  'className="w-full bg-transparent text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[90px] placeholder:text-gray-400"',
  'className="w-full bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[120px] placeholder:text-gray-400 mb-2 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"'
);
// Images size:
content = content.replace(
  'className="h-40 w-auto rounded-lg object-cover border border-gray-200 transition-all group-hover:opacity-80"',
  'className="h-72 w-auto rounded-xl object-cover border border-gray-200 transition-all group-hover:opacity-80 shadow-sm"'
);


// 2. Fix Shopee Data (Global tab carousel)
// Remove flex-1 from textarea
content = content.replace(
  'className="w-full flex-1 bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[100px] placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"',
  'className="w-full bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[120px] placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 mb-2"'
);
// Push buttons to bottom using mt-auto
content = content.replace(
  '<div className="mt-4 flex justify-end gap-2 shrink-0 border-t border-gray-200/60 pt-4">',
  '<div className="mt-auto flex justify-end gap-2 shrink-0 border-t border-gray-200/60 pt-4">'
);
// Image size in Global tab (it was h-40)
content = content.replace(
  'className="h-40 w-auto rounded-lg object-cover border border-gray-200"',
  'className="h-72 w-auto rounded-xl object-cover border border-gray-200 shadow-sm"'
);

// 3. Fix FB Story Poster (FB tab vertical list)
// Remove flex-1 from textarea (if any) -> Actually it was not flex-1, let's check:
// "className="w-full bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[72px] placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500""
content = content.replace(
  'className="w-full bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[72px] placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"',
  'className="w-full bg-white border border-gray-200/80 rounded-lg p-3 text-[13px] text-gray-800 resize-none outline-none leading-relaxed min-h-[120px] mb-2 placeholder:text-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"'
);
// Push buttons to bottom (not needed for vertical list, but just to be safe, leave mt-4)
// Image size in FB tab
// Wait, the previous replacement might have matched this, let's check if the string was identical.
// In Global tab it was 'className="h-40 w-auto rounded-lg object-cover border border-gray-200"'
// In FB tab it was also 'className="h-40 w-auto rounded-lg object-cover border border-gray-200"'
// So the string replacement replaced BOTH! (No, string replace only replaces FIRST unless regex with /g).
// Let's run a regex for the image class to replace all occurrences.
content = content.replace(
  /className="h-40 w-auto rounded-lg object-cover border border-gray-200"/g,
  'className="h-72 w-auto rounded-xl object-cover border border-gray-200 shadow-sm"'
);


fs.writeFileSync('Tool-Thread/web-saas/src/app/dashboard/accounts/page.tsx', content);
