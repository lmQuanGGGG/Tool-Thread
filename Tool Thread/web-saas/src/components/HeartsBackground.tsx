"use client";

import { useEffect, useRef } from "react";

export default function HeartsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: any[] = [];
    
    const handleMouseMove = (e: MouseEvent) => {
      if (Math.random() > 0.4) {
        createHeart(e.clientX, e.clientY);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    const colors = ["#ff4b4b", "#ff7676", "#ffb3b3", "#3b82f6", "#8b5cf6"];

    const createHeart = (x: number, y: number) => {
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * -1.5 - 0.5,
        speedX: (Math.random() - 0.5) * 1,
        life: 1,
        decay: Math.random() * 0.02 + 0.015,
      });
    };

    const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      const topCurveHeight = h * 0.3;
      ctx.moveTo(0, topCurveHeight);
      ctx.bezierCurveTo(0, 0, -w / 2, 0, -w / 2, topCurveHeight);
      ctx.bezierCurveTo(-w / 2, h / 2, 0, h * 0.8, 0, h);
      ctx.bezierCurveTo(0, h * 0.8, w / 2, h / 2, w / 2, topCurveHeight);
      ctx.bezierCurveTo(w / 2, 0, 0, 0, 0, topCurveHeight);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };

    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          i--;
          continue;
        }

        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        drawHeart(ctx, p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-0" 
      style={{ opacity: 0.8 }}
    />
  );
}
