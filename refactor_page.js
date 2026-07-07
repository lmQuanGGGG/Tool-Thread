const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'Tool Thread', 'web-saas', 'src', 'app', 'dashboard', 'accounts', 'page.tsx');
let code = fs.readFileSync(p, 'utf8');

// 1. Tách Logs state
code = code.replace(
  /const \[logs, setLogs\] = useState<LogEntry\[\]>.*?\n  \]\);\n  const logEndRef = useRef<HTMLDivElement>\(null\);/s,
  `const [fbLogs, setFbLogs] = useState<LogEntry[]>([{ time: now(), level: "INFO", msg: "FB System khởi động..." }]);
  const [threadsLogs, setThreadsLogs] = useState<LogEntry[]>([{ time: now(), level: "INFO", msg: "Threads System khởi động..." }]);
  const [threadsPosts, setThreadsPosts] = useState<any[]>([]);
  const fbLogEndRef = useRef<HTMLDivElement>(null);
  const threadsLogEndRef = useRef<HTMLDivElement>(null);`
);

// 2. pushLog functions
code = code.replace(
  /const pushLog = \(level: LogEntry\["level"\], msg: string\) => \{\n    setLogs\(prev => \[\.\.\.prev, \{ time: now\(\), level, msg \}\]\);\n  \};\n\n  \/\/ Auto scroll log\n  useEffect\(\(\) => \{ logEndRef\.current\?\.scrollIntoView\(\{ behavior: "smooth" \}\); \}, \[logs\]\);/s,
  `const pushFbLog = (level: LogEntry["level"], msg: string) => setFbLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushThreadsLog = (level: LogEntry["level"], msg: string) => setThreadsLogs(prev => [...prev, { time: now(), level, msg }]);
  const pushLog = (level: LogEntry["level"], msg: string) => { pushFbLog(level, msg); pushThreadsLog(level, msg); }; // Broadcast

  useEffect(() => { fbLogEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [fbLogs]);
  useEffect(() => { threadsLogEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadsLogs]);`
);

// 3. fetch crawl_data
code = code.replace(
  /setLoading\(false\);\n    }\n    load\(\);/,
  `setLoading(false);
      // Fetch crawl data
      const { data: cData } = await supabase.from('crawl_data').select('*').eq('user_id', user.id).eq('posted', false).order('created_at', { ascending: false }).limit(20);
      if (cData) setThreadsPosts(cData);
    }
    load();`
);

// 4. realtime logs route
code = code.replace(
  /setLogs\(prev => \[\.\.\.prev, \{ time: timeStr, level, msg: \`\$\{prefix\}\$\{newLog\.message\}\` \}\]\);/s,
  `if (newLog.bot_type && newLog.bot_type.includes('threads')) {
            setThreadsLogs(prev => [...prev, { time: timeStr, level, msg: \`\${prefix}\${newLog.message}\` }]);
          } else {
            setFbLogs(prev => [...prev, { time: timeStr, level, msg: \`\${prefix}\${newLog.message}\` }]);
          }`
);

fs.writeFileSync(p, code);
console.log('Done refactoring states & logs');
