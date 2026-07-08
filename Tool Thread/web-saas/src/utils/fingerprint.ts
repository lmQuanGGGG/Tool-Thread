/**
 * Thu thập thông số đặc trưng của trình duyệt để tạo Device Fingerprint.
 * Kết hợp nhiều tín hiệu để tăng entropy, khó giả mạo hơn là chỉ dùng IP.
 */

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Mỗi thiết bị render text/gradient khác nhau tùy GPU + font engine
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('fingerprint🍋', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('fingerprint🍋', 4, 17);

    return canvas.toDataURL();
  } catch {
    return '';
  }
}

function getAudioFingerprint(): number {
  try {
    const ctx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(1, 44100, 44100);
    const oscillator = ctx.createOscillator();
    const compressor = ctx.createDynamicsCompressor();
    oscillator.connect(compressor);
    compressor.connect(ctx.destination);
    oscillator.start(0);
    // Trả về giá trị đồng hồ audio node — khác nhau trên mỗi hardware
    return ctx.currentTime;
  } catch {
    return 0;
  }
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getDeviceFingerprint(): Promise<string> {
  const signals = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') || '',
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    `${screen.availWidth}x${screen.availHeight}`,
    new Date().getTimezoneOffset().toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.platform,
    navigator.hardwareConcurrency?.toString() || '',
    (navigator as any).deviceMemory?.toString() || '',
    navigator.cookieEnabled.toString(),
    typeof localStorage !== 'undefined' ? 'ls' : '',
    typeof sessionStorage !== 'undefined' ? 'ss' : '',
    typeof indexedDB !== 'undefined' ? 'idb' : '',
    getCanvasFingerprint(),
    getAudioFingerprint().toString(),
    navigator.doNotTrack || '',
    // Danh sách plugin (khác nhau giữa các máy cài extension khác nhau)
    Array.from(navigator.plugins || []).map(p => p.name).join(','),
  ];

  const raw = signals.join('|');
  return hashString(raw);
}
