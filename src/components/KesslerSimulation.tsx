import { useState, useRef, useEffect } from "react";
import { useMagneticButton } from "../hooks/useMagneticButton";

interface Debris {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  angle: number;
  radius: number;
  inclination: number;
  size: number;
}

// MAGNETIC BUTTON AUDIT: "Trigger Cascade" button uses magnetic effect
export default function KesslerSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [debris, setDebris] = useState<Debris[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef<number>();
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const [ripple, setRipple] = useState<{ radius: number; opacity: number; active: boolean }>({ radius: 0, opacity: 0, active: false });

  useMagneticButton(triggerButtonRef);

  const initialDebris: Debris[] = Array.from({ length: 15 }, (_, i) => {
    const angle = (i / 15) * Math.PI * 2;
    const radius = 0.25 + Math.random() * 0.15;
    const inclination = (Math.random() - 0.5) * 0.8; // Random inclination between -0.4 and 0.4 radians
    
    // Calculate 3D position using spherical coordinates with inclination
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const cosInc = Math.cos(inclination);
    const sinInc = Math.sin(inclination);
    
    // 3D coordinates centered at origin
    const x3d = radius * cosAngle;
    const y3d = radius * sinAngle * cosInc;
    const z3d = radius * sinAngle * sinInc;
    
    // Calculate orbital velocity (tangential to orbit)
    const orbitalSpeed = 0.02;
    const vx = -orbitalSpeed * sinAngle;
    const vy = orbitalSpeed * cosAngle * cosInc;
    const vz = orbitalSpeed * cosAngle * sinInc;
    
    return {
      id: `d-${i}`,
      angle,
      radius,
      inclination,
      x: 0.5 + x3d,
      y: 0.5 + y3d,
      z: z3d,
      vx,
      vy,
      vz,
      size: 3,
    };
  });

  useEffect(() => {
    setDebris(initialDebris);
  }, []);

  const triggerCascade = () => {
    setIsRunning(true);
    setRipple({ radius: 0, opacity: 0.6, active: true });
    let currentDebris = [...debris];
    let time = 0;
    const duration = 2000; // 2 seconds
    const maxDebrisCount = 150; // Cap per cascade
    let debrisAddedInCascade = 0; // Track debris added during this cascade

    const animate = () => {
      time += 16;
      const progress = Math.min(time / duration, 1);

      // Update ripple
      if (ripple.active) {
        const rippleProgress = Math.min((time) / 600, 1);
        setRipple({
          radius: rippleProgress * 0.5,
          opacity: 0.6 * (1 - rippleProgress),
          active: rippleProgress < 1
        });
      }

      if (progress < 1) {
        // Add new debris randomly every few frames (respect per-cascade cap)
        if (Math.random() < 0.5 && debrisAddedInCascade < maxDebrisCount) {
          const newRadius = 0.25 + Math.random() * 0.15;
          const newAngle = Math.random() * Math.PI * 2;
          const newInclination = (Math.random() - 0.5) * 0.8;
          
          // Calculate 3D position using spherical coordinates with inclination
          const cosAngle = Math.cos(newAngle);
          const sinAngle = Math.sin(newAngle);
          const cosInc = Math.cos(newInclination);
          const sinInc = Math.sin(newInclination);
          
          // 3D coordinates centered at origin
          const x3d = newRadius * cosAngle;
          const y3d = newRadius * sinAngle * cosInc;
          const z3d = newRadius * sinAngle * sinInc;
          
          // Calculate orbital velocity (tangential to orbit)
          const orbitalSpeed = 0.02;
          const vx = -orbitalSpeed * sinAngle;
          const vy = orbitalSpeed * cosAngle * cosInc;
          const vz = orbitalSpeed * cosAngle * sinInc;
          
          const newDebris: Debris = {
            id: `d-${Date.now()}-${Math.random()}`,
            angle: newAngle,
            radius: newRadius,
            inclination: newInclination,
            x: 0.5 + x3d,
            y: 0.5 + y3d,
            z: z3d,
            vx,
            vy,
            vz,
            size: 2 + Math.random() * 2,
          };
          currentDebris = [...currentDebris, newDebris];
          debrisAddedInCascade++;
        }

        // Update positions with stable orbital mechanics and detect collisions
        const collisionThreshold = 0.04; // Distance threshold for collision
        const newFragments: Debris[] = [];
        
        // Update positions using stable orbital mechanics (angle-based)
        currentDebris = currentDebris.map((d) => {
          const nextAngle = (d.angle + 0.02) % (Math.PI * 2);
          // Calculate 3D position using spherical coordinates with inclination
          const cosAngle = Math.cos(nextAngle);
          const sinAngle = Math.sin(nextAngle);
          const cosInc = Math.cos(d.inclination);
          const sinInc = Math.sin(d.inclination);
          
          // 3D coordinates centered at origin
          const x3d = d.radius * cosAngle;
          const y3d = d.radius * sinAngle * cosInc;
          const z3d = d.radius * sinAngle * sinInc;
          
          return {
            ...d,
            angle: nextAngle,
            x: 0.5 + x3d,
            y: 0.5 + y3d,
            z: z3d,
          };
        });
        
        // Collision detection (optimized with early exit)
        const maxDebrisToCheck = Math.min(currentDebris.length, 50); // Limit to prevent lag
        for (let i = 0; i < maxDebrisToCheck; i++) {
          for (let j = i + 1; j < maxDebrisToCheck; j++) {
            const d1 = currentDebris[i];
            const d2 = currentDebris[j];
            
            // Calculate 3D distance
            const dx = d1.x - d2.x;
            const dy = d1.y - d2.y;
            const dz = d1.z - d2.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < collisionThreshold) {
              // Collision detected - create fragments
              const fragmentCount = 2;
              for (let f = 0; f < fragmentCount; f++) {
                newFragments.push({
                  id: `frag-${Date.now()}-${Math.random()}`,
                  x: d1.x,
                  y: d1.y,
                  z: d1.z,
                  vx: 0, vy: 0, vz: 0, // Not used in orbital mechanics
                  angle: d1.angle + (Math.random() - 0.5) * 0.5,
                  radius: d1.radius * (0.9 + Math.random() * 0.2),
                  inclination: d1.inclination + (Math.random() - 0.5) * 0.1,
                  size: Math.max(1, d1.size * 0.7),
                });
              }
              
              // Mark collided debris for removal (by setting size to 0)
              currentDebris[i] = { ...currentDebris[i], size: 0 };
              currentDebris[j] = { ...currentDebris[j], size: 0 };
            }
          }
        }
        
        // Remove collided debris and add fragments (respect per-cascade cap)
        const fragmentsToAdd = newFragments.slice(0, maxDebrisCount - debrisAddedInCascade);
        currentDebris = [...currentDebris.filter(d => d.size > 0), ...fragmentsToAdd];
        debrisAddedInCascade += fragmentsToAdd.length;

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

    // Draw Earth glow halo
    const earthGlow = ctx.createRadialGradient(centerX, centerY, earthRadius * 0.5, centerX, centerY, earthRadius);
    earthGlow.addColorStop(0, "rgba(0, 100, 180, 0.12)");
    earthGlow.addColorStop(1, "rgba(0, 100, 180, 0)");
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
    ctx.fillStyle = earthGlow;
    ctx.fill();

    // Draw Earth body
    ctx.beginPath();
    ctx.arc(centerX, centerY, earthRadius * 0.67, 0, Math.PI * 2);
    ctx.fillStyle = "#0c152b";
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(0, 212, 255, 0.5)";
    ctx.shadowColor = "rgba(0, 212, 255, 0.3)";
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Earth latitude & longitude lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0, 212, 255, 0.2)";
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, earthRadius * 0.67, earthRadius * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, earthRadius * 0.25, earthRadius * 0.67, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Draw orbital paths
    [0.25, 0.35, 0.45].forEach((radius) => {
      ctx.strokeStyle = `rgba(0, 212, 255, ${0.1 * radius})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, width * radius * 0.45, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw debris with 3D perspective
    const focalLength = 2; // Controls the strength of perspective effect
    const sortedDebris = [...debris].sort((a, b) => a.z - b.z); // Sort by Z for proper depth ordering
    
    sortedDebris.forEach((d) => {
      // Perspective projection
      const scale = focalLength / (focalLength + d.z);
      const projectedX = centerX + (d.x - 0.5) * width * scale;
      const projectedY = centerY + (d.y - 0.5) * height * scale;
      const scaledSize = d.size * scale;
      
      // Depth-based opacity
      const depthOpacity = Math.max(0.3, Math.min(1, scale));

      // Debris glow
      const glowGradient = ctx.createRadialGradient(projectedX, projectedY, 0, projectedX, projectedY, scaledSize * 2);
      glowGradient.addColorStop(0, `rgba(0, 212, 255, ${0.3 * depthOpacity})`);
      glowGradient.addColorStop(1, "rgba(0, 212, 255, 0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(projectedX - scaledSize * 2, projectedY - scaledSize * 2, scaledSize * 4, scaledSize * 4);

      // Debris dot
      ctx.fillStyle = `rgba(0, 212, 255, ${depthOpacity})`;
      ctx.beginPath();
      ctx.arc(projectedX, projectedY, scaledSize, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw ripple effect
    if (ripple.active) {
      const rippleRadius = ripple.radius * Math.min(width, height);
      const rippleOpacity = ripple.opacity;
      const strokeWidth = 4 * (1 - ripple.radius * 2);

      ctx.strokeStyle = `rgba(0, 212, 255, ${rippleOpacity})`;
      ctx.lineWidth = Math.max(strokeWidth, 1);
      ctx.beginPath();
      ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw text
    ctx.fillStyle = "#8b9ab0";
    ctx.font = "12px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`Debris objects: ${debris.length}`, width * 0.5, 30);
  }, [debris, ripple]);

  return (
    <div className="kesslerSimulation">
      <div className="simulationLabel">Kessler Cascade Simulation</div>
      <canvas ref={canvasRef} className="simulationCanvas" />
      <div className="simulationLabel simulationLabel--bottom">Debris collisions create fragments, triggering exponential chain reactions</div>
      <div className="simulationControls">
        <button ref={triggerButtonRef} className="btn btn--primary" onClick={triggerCascade} disabled={isRunning}>
          {isRunning ? "Cascade Running..." : "Trigger Cascade"}
        </button>
        <button className="btn btn--secondary" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
