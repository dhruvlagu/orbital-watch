import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
};

const STAR_COUNT = 200;
/** Target: 60 fps → ~16.67ms per frame */
const FRAME_BUDGET_MS = 1000 / 60;

function createStar(width: number, height: number, fromEdge?: "top" | "bottom" | "left" | "right"): Star {
  let x = Math.random() * width;
  let y = Math.random() * height;

  if (fromEdge === "top") y = 0;
  else if (fromEdge === "bottom") y = height;
  else if (fromEdge === "left") x = 0;
  else if (fromEdge === "right") x = width;

  return {
    x,
    y,
    r: 0.5 + Math.random(),
    speed: 0.05 + Math.random() * 0.15,
    opacity: 0.3 + Math.random() * 0.6,
  };
}

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect devicePixelRatio for sharp rendering on retina displays
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let lastTimestamp = 0;

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      ctx.scale(dpr, dpr);
      stars = Array.from({ length: STAR_COUNT }, () =>
        createStar(innerWidth, innerHeight),
      );
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (timestamp: number) => {
      animationFrameId = window.requestAnimationFrame(render);

      // Throttle to ≤60fps
      const elapsed = timestamp - lastTimestamp;
      if (elapsed < FRAME_BUDGET_MS) return;
      lastTimestamp = timestamp - (elapsed % FRAME_BUDGET_MS);

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        s.x += s.speed;
        s.y += s.speed * 0.6;

        if (s.x > w || s.y > h) {
          const fromEdge = Math.random() > 0.5 ? "top" : "left";
          stars[i] = createStar(w, h, fromEdge);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fill();
      }
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfieldCanvas" aria-hidden="true" />;
}
