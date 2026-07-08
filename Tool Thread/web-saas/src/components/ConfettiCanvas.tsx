"use client";

import { useEffect, useRef } from "react";

/* ═══════════════════════════════════════════════
   Canvas Confetti — magnetic attraction to cursor
   ═══════════════════════════════════════════════ */
type Particle = {
  x: number; y: number; baseX: number; baseY: number;
  vx: number; vy: number;
  size: number; color: string; shape: number;
  angle: number; speed: number; depth: number;
  rotation: number; rotSpeed: number;
  heartX: number; heartY: number;
};

const ATTRACT_RADIUS = 800; // px — bán kính ảnh hưởng siêu lớn để tạo hiệu ứng vũ trụ
const ATTRACT_FORCE = 0.04; // lực hút
const RETURN_FORCE = 0.05; // lực kéo về vị trí gốc (tăng mạnh để tụ hình trái tim nhanh hơn)
const FRICTION = 0.92;

export default function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = ["#4285F4", "#EA4335", "#FBBC04", "#34A853", "#7B61FF", "#FF6D93", "#00BCD4", "#FF9800", "#A855F7", "#06B6D4"];
    let w = 0, h = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = Math.min(250, Math.floor(w * h / 4500)); // Tăng số lượng hạt để giống dải ngân hà
    const pts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const depth = 0.3 + Math.random() * 0.7;
      
      // Sinh toạ độ hình trái tim rải rác
      const t_heart = Math.random() * Math.PI * 2;
      // Scale trái tim to ra và rải rác nhờ random
      const rScale = (0.3 + Math.random() * 0.7) * 20; 
      const hx = rScale * 16 * Math.pow(Math.sin(t_heart), 3);
      const hy = -rScale * (13 * Math.cos(t_heart) - 5 * Math.cos(2 * t_heart) - 2 * Math.cos(3 * t_heart) - Math.cos(4 * t_heart));

      pts.push({
        x: Math.random() * w, y: Math.random() * h,
        baseX: Math.random() * w, baseY: Math.random() * h,
        vx: 0, vy: 0,
        size: (2 + Math.random() * 4) * depth,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: Math.floor(Math.random() * 3),
        angle: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.3,
        depth,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        heartX: hx,
        heartY: hy,
      });
    }

    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    const onLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    let raf: number;
    let t = 0;

    const draw = () => {
      t += 0.005;
      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mouseActive = mouseRef.current.active;

      for (const p of pts) {
        // Drift nhẹ cho base position
        p.baseX += Math.cos(p.angle) * p.speed * 0.2;
        p.baseY += Math.sin(p.angle) * p.speed * 0.2;
        if (p.baseX < -20) p.baseX = w + 20;
        if (p.baseX > w + 20) p.baseX = -20;
        if (p.baseY < -20) p.baseY = h + 20;
        if (p.baseY > h + 20) p.baseY = -20;

        // Tính khoảng cách đến chuột
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Kéo về vị trí base + oscillation bồng bềnh (luôn luôn chạy để giữ sự nhẹ nhàng)
        const targetX = p.baseX + Math.sin(t * 2 + p.angle) * 15;
        const targetY = p.baseY + Math.cos(t * 1.5 + p.angle) * 15;
        p.vx += (targetX - p.x) * RETURN_FORCE;
        p.vy += (targetY - p.y) * RETURN_FORCE;

        if (mouseActive && dist < ATTRACT_RADIUS) {
          // Lực "di cư" và tạo hình trái tim
          // Giảm tốc độ nhịp đập xuống một chút (t * 12 thay vì 15)
          const beatPhase = Math.sin(t * 12);
          // Thêm hiệu ứng nhịp đập (Heartbeat) phập phồng mạnh mẽ bằng hàm sin lũy thừa
          const beatScale = 1 + Math.pow(beatPhase, 6) * 0.4;

          const targetMouseX = mx + p.heartX * beatScale;
          const targetMouseY = my + p.heartY * beatScale;
          const pullDx = targetMouseX - p.baseX;
          const pullDy = targetMouseY - p.baseY;

          // Tăng tốc độ đuổi theo chuột cực mạnh
          const pullSpeed = 0.15 * p.speed;
          p.baseX += pullDx * pullSpeed;
          p.baseY += pullDy * pullSpeed;

          // Hiệu ứng "thổn thức": Khi nhịp đập đạt đỉnh, bắn một vài hạt văng ra ngoài như tia lửa
          if (beatPhase > 0.95 && Math.random() < 0.05) {
            p.vx += p.heartX * 0.05;
            p.vy += p.heartY * 0.05;
          }
        }

        // Apply velocity
        p.vx *= FRICTION;
        p.vy *= FRICTION;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed + (Math.abs(p.vx) + Math.abs(p.vy)) * 0.01;

        // Alpha tăng khi gần chuột
        let alpha = 0.25 + p.depth * 0.3;
        if (mouseActive && dist < ATTRACT_RADIUS) {
          alpha += (1 - dist / ATTRACT_RADIUS) * 0.35;
        }

        // Nhịp đập của sứa (Pulse) - bơi từng nhịp
        const pulse = Math.pow(Math.sin(t * 8 + p.angle * 2), 4);
        
        // Sứa đẩy nước bơi lên/tiến tới
        const bobbingY = Math.sin(t * 5 + p.angle) * 8 * p.depth;
        
        // Thay vì bóp méo hình, cho hạt "nở" nhẹ theo nhịp
        const scale = 1 + pulse * 0.15;

        ctx.save();
        ctx.translate(p.x, p.y + bobbingY - pulse * 5); // Đẩy nhẹ lên khi vỗ
        ctx.rotate(p.rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = Math.min(alpha, 0.85);
        ctx.fillStyle = p.color;

        if (p.shape === 0) {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.shape === 1) {
          const s = p.size * 1.8;
          ctx.beginPath();
          ctx.roundRect(-s / 2, -p.size / 2, s, p.size, p.size * 0.3);
          ctx.fill();
        } else {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = Math.max(1.5, p.size * 0.5);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(-p.size * 1.5, 0);
          ctx.lineTo(p.size * 1.5, 0);
          ctx.stroke();
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
