import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
};

const STAR_COUNT = 200;

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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];

    const resize = () => {
      const { innerWidth, innerHeight } = window;
      canvas.width = innerWidth;
      canvas.height = innerHeight;
      stars = Array.from({ length: STAR_COUNT }, () =>
        createStar(canvas.width, canvas.height),
      );
    };

    resize();
    window.addEventListener("resize", resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        s.x += s.speed;
        s.y += s.speed * 0.6;

        if (s.x > canvas.width || s.y > canvas.height) {
          const fromEdge = Math.random() > 0.5 ? "top" : "left";
          stars[i] = createStar(canvas.width, canvas.height, fromEdge);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.opacity})`;
        ctx.fill();
      }

      animationFrameId = window.requestAnimationFrame(render);
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfieldCanvas" aria-hidden="true" />;
}

