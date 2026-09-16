import { useEffect, useRef } from "react";

type Star = {
  x: number;
  y: number;
  r: number;
  speed: number;
  opacity: number;
  depth: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: { r: number; g: number; b: number };
  isShooting?: boolean;
  trail?: { x: number; y: number }[];
  orbitCenterX: number;
  orbitCenterY: number;
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
};

const getStarCount = () => (typeof window !== "undefined" && window.innerWidth < 768 ? 50 : 120); // Fewer stars for text focus
/** Target: 60 fps → ~16.67ms per frame */
const FRAME_BUDGET_MS = 1000 / 60;

function createStar(width: number, height: number, fromEdge?: "top" | "bottom" | "left" | "right"): Star {
  let x = Math.random() * width;
  let y = Math.random() * height;

  if (fromEdge === "top") y = 0;
  else if (fromEdge === "bottom") y = height;
  else if (fromEdge === "left") x = 0;
  else if (fromEdge === "right") x = width;

  // Depth/parallax effect: depth 0-1, where 1 is closer
  const depth = Math.random();
  
  // Color variation for realism - mostly white with subtle tints
  const starColors = [
    { r: 255, g: 255, b: 255 }, // white (most common)
    { r: 255, g: 255, b: 255 }, // white
    { r: 255, g: 255, b: 255 }, // white
    { r: 230, g: 235, b: 255 }, // very subtle blue-white
    { r: 255, g: 250, b: 235 }, // very subtle yellow-white
  ];
  const color = starColors[Math.floor(Math.random() * starColors.length)];
  
  // Twinkling parameters - more subtle
  const twinkleSpeed = 0.005 + Math.random() * 0.015;
  const twinklePhase = Math.random() * Math.PI * 2;
  
  const baseOpacity = 0.1 + depth * 0.3; // Much dimmer for text focus

  // Orbital parameters
  const orbitCenterX = width / 2;
  const orbitCenterY = height / 2;
  const orbitRadius = 100 + Math.random() * Math.min(width, height) * 0.4;
  const orbitAngle = Math.random() * Math.PI * 2;
  const orbitSpeed = (0.0005 + Math.random() * 0.001) * (depth > 0.5 ? 1 : -1); // Random direction

  return {
    x,
    y,
    r: 0.3 + depth * 0.7, // Closer stars are larger
    speed: 0.02 + depth * 0.2, // Closer stars move faster
    opacity: baseOpacity,
    depth,
    baseOpacity,
    twinkleSpeed,
    twinklePhase,
    color,
    orbitCenterX,
    orbitCenterY,
    orbitRadius,
    orbitAngle,
    orbitSpeed,
  };
}

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePos = useRef<{ x: number; y: number } | null>(null);
  const scrollY = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      mousePos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mousePos.current = null;
    };

    const handleScroll = () => {
      scrollY.current = window.scrollY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("scroll", handleScroll, { passive: true });

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
      stars = Array.from({ length: getStarCount() }, () =>
        createStar(innerWidth, innerHeight),
      );
    };

    resize();
    window.addEventListener("resize", resize);

    // Intersection Observer to pause animation when not visible
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (!isVisible) {
          window.cancelAnimationFrame(animationFrameId);
        } else {
          lastTimestamp = performance.now();
          animationFrameId = window.requestAnimationFrame(render);
        }
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    const render = (timestamp: number) => {
      if (!isVisible) return;
      
      animationFrameId = window.requestAnimationFrame(render);

      // Throttle to ≤60fps
      const elapsed = timestamp - lastTimestamp;
      if (elapsed < FRAME_BUDGET_MS) return;
      lastTimestamp = timestamp - (elapsed % FRAME_BUDGET_MS);

      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.clearRect(0, 0, w, h);

      // Very rarely spawn shooting stars
      if (Math.random() < 0.0002) { // 0.02% chance per frame (much rarer)
        const shootingStar: Star = {
          x: Math.random() * w,
          y: 0,
          r: 1.2,
          speed: 1.5 + Math.random() * 1.5,
          opacity: 0.8,
          depth: 1,
          baseOpacity: 0.8,
          twinkleSpeed: 0,
          twinklePhase: 0,
          color: { r: 255, g: 255, b: 255 },
          isShooting: true,
          trail: [],
        };
        stars.push(shootingStar);
      }

      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        
        // Handle shooting stars differently
        if (s.isShooting) {
          // Add to trail
          s.trail!.push({ x: s.x, y: s.y });
          if (s.trail!.length > 10) s.trail!.shift();
          
          // Move faster
          s.x += s.speed;
          s.y += s.speed * 0.8;
          
          // Draw trail
          if (s.trail!.length > 1) {
            ctx.beginPath();
            ctx.moveTo(s.trail![0].x, s.trail![0].y);
            for (let j = 1; j < s.trail!.length; j++) {
              ctx.lineTo(s.trail![j].x, s.trail![j].y);
            }
            ctx.strokeStyle = `rgba(${s.color.r},${s.color.g},${s.color.b},0.3)`;
            ctx.lineWidth = s.r;
            ctx.stroke();
          }
          
          // Remove if off screen
          if (s.x > w || s.y > h) {
            stars.splice(i, 1);
            i--;
            continue;
          }
        } else {
          // Orbital movement
          s.orbitAngle += s.orbitSpeed;
          s.x = s.orbitCenterX + Math.cos(s.orbitAngle) * s.orbitRadius;
          s.y = s.orbitCenterY + Math.sin(s.orbitAngle) * s.orbitRadius * 0.6; // Slightly elliptical

          // Twinkling effect - more subtle
          s.opacity = s.baseOpacity + Math.sin(timestamp * s.twinkleSpeed + s.twinklePhase) * 0.1;

          if (mousePos.current) {
            const dx = mousePos.current.x - s.x;
            const dy = mousePos.current.y - s.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && dist > 0) {
              const pull = 0.02; // More subtle interaction
              s.x += (dx / dist) * pull;
              s.y += (dy / dist) * pull;
            }
          }

          // Keep stars within bounds - respawn if they drift too far
          if (s.x < -50 || s.x > w + 50 || s.y < -50 || s.y > h + 50) {
            const fromEdge = Math.random() > 0.5 ? "top" : "left";
            stars[i] = createStar(w, h, fromEdge);
            continue;
          }
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color.r},${s.color.g},${s.color.b},${s.opacity})`;
        ctx.fill();
      }
    };

    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="starfieldCanvas" aria-hidden="true" />;
}
