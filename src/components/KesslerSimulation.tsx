import { useState, useRef, useEffect } from "react";

interface Debris {
  id: string;
  x: number;
  y: number;
  angle: number;
  size: number;
}

export default function KesslerSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [debris, setDebris] = useState<Debris[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef<number>();

  const initialDebris: Debris[] = Array.from({ length: 15 }, (_, i) => ({
    id: `d-${i}`,
    x: 0.5,
    y: 0.5,
    angle: (i / 15) * Math.PI * 2,
    size: 3,
  }));

  useEffect(() => {
    setDebris(initialDebris);
  }, []);

  const triggerCascade = () => {
    setIsRunning(true);
    let currentDebris = [...debris];
    let time = 0;
    const duration = 3000; // 3 seconds

    const animate = () => {
      time += 16;
      const progress = Math.min(time / duration, 1);

      if (progress < 1) {
        // Add new debris randomly every few frames
        if (Math.random() < 0.3) {
          const randomDebris = currentDebris[Math.floor(Math.random() * currentDebris.length)];
          const newDebris: Debris = {
            id: `d-${Date.now()}-${Math.random()}`,
            x: randomDebris.x + (Math.random() - 0.5) * 0.1,
            y: randomDebris.y + (Math.random() - 0.5) * 0.1,
            angle: Math.random() * Math.PI * 2,
            size: 2 + Math.random() * 2,
          };
          currentDebris = [...currentDebris, newDebris];
        }

        // Update positions
        currentDebris = currentDebris.map((d) => ({
          ...d,
          angle: (d.angle + 0.02) % (Math.PI * 2),
          x: 0.5 + Math.cos(d.angle) * (0.25 + Math.random() * 0.15),
          y: 0.5 + Math.sin(d.angle) * (0.25 + Math.random() * 0.15),
        }));

        setDebris(currentDebris);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsRunning(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const reset = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    setDebris(initialDebris);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Clear and draw background
    ctx.fillStyle = "rgba(10, 14, 26, 0.95)";
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = "rgba(0, 212, 255, 0.05)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Earth
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const earthRadius = 60;

    // Earth gradient
    const earthGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, earthRadius);
    earthGradient.addColorStop(0, "rgba(100, 150, 255, 0.4)");
    earthGradient.addColorStop(1, "rgba(50, 100, 200, 0.2)");
    ctx.fillStyle = earthGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.fill();

    // Earth border
    ctx.strokeStyle = "rgba(0, 212, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw orbital paths
    [0.25, 0.35, 0.45].forEach((radius) => {
      ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * radius})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * radius * 0.45, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw debris
    debris.forEach((d) => {
      const x = centerX + (width * 0.35) * Math.cos(d.angle) * (1 + Math.random() * 0.1);
      const y = centerY + (height * 0.35) * Math.sin(d.angle) * (1 + Math.random() * 0.1);

      // Debris glow
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, d.size * 2);
      glowGradient.addColorStop(0, "rgba(0, 212, 255, 0.3)");
      glowGradient.addColorStop(1, "rgba(0, 212, 255, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(x - d.size * 2, y - d.size * 2, d.size * 4, d.size * 4);

      // Debris dot
      ctx.fillStyle = "#00d4ff";
      ctx.beginPath();
      ctx.arc(x, y, d.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw text
    ctx.fillStyle = "#8b9ab0";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Debris objects: ${debris.length}`, width * 0.5, 30);
  }, [debris]);

  return (
    <div className="kesslerSimulation">
      <div className="simulationLabel">Simplified Kessler Cascade Simulation</div>
      <canvas ref={canvasRef} className="simulationCanvas" />
      <div className="simulationLabel simulationLabel--bottom">Each click represents one uncontrolled collision event</div>
      <div className="simulationControls">
        <button className="btn btn--primary" onClick={triggerCascade} disabled={isRunning}>
          {isRunning ? "Cascade Running..." : "Trigger Cascade"}
        </button>
        <button className="btn btn--secondary" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
