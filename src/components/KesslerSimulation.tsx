import { useState, useRef, useEffect, useCallback } from "react";
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
  const [, setDebris] = useState<Debris[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const animationRef = useRef<number>();
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const currentDebrisRef = useRef<Debris[]>([]);
  const rippleRef = useRef<{ radius: number; opacity: number; active: boolean }>({ radius: 0, opacity: 0, active: false });
  const isAnimatingRef = useRef(false);

  useMagneticButton(triggerButtonRef);

  // Simulation parameters
  const [objectCount, setObjectCount] = useState(15);
  const [radiusMin, setRadiusMin] = useState(0.25);
  const [radiusMax, setRadiusMax] = useState(0.4);
  const [inclinationMin, setInclinationMin] = useState(-0.4);
  const [inclinationMax, setInclinationMax] = useState(0.4);
  const [explanationExpanded, setExplanationExpanded] = useState(false);
  const [cascadeStatus, setCascadeStatus] = useState("");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Derived altitude center for the slider
  const altitudeCenter = (radiusMin + radiusMax) / 2;



  const initialDebrisRef = useRef<Debris[] | null>(null);
  
  // Function to generate debris based on current parameters
  const generateDebris = useCallback((count: number, rMin: number, rMax: number, iMin: number, iMax: number) => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = rMin + Math.random() * (rMax - rMin);
      const inclination = iMin + Math.random() * (iMax - iMin);

      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const cosInc = Math.cos(inclination);
      const sinInc = Math.sin(inclination);

      const x3d = radius * cosAngle;
      const y3d = radius * sinAngle * cosInc;
      const z3d = radius * sinAngle * sinInc;

      // Keplerian motion: angular speed ∝ 1/radius^1.5 (slower for better visualization)
      const keplerConstant = 0.0025;
      const angularSpeed = keplerConstant / Math.pow(radius, 1.5);
      const orbitalSpeed = angularSpeed * radius; // v = ωr
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
  }, []);

  if (!initialDebrisRef.current) {
    initialDebrisRef.current = generateDebris(objectCount, radiusMin, radiusMax, inclinationMin, inclinationMax);
  }

  useEffect(() => {
    const newDebris = generateDebris(objectCount, radiusMin, radiusMax, inclinationMin, inclinationMax);
    setDebris(newDebris);
    currentDebrisRef.current = newDebris;
    if (!isAnimatingRef.current) {
      initialDebrisRef.current = newDebris;
      drawCanvas(newDebris, rippleRef.current);
    }
  }, [objectCount, radiusMin, radiusMax, inclinationMin, inclinationMax, generateDebris]);

  const triggerCascade = () => {
    setIsRunning(true);
    setCascadeStatus("Cascade initiated — collision chain reaction starting");
    rippleRef.current = { radius: 0, opacity: 0.6, active: true };
    currentDebrisRef.current = [...currentDebrisRef.current];
    isAnimatingRef.current = true;
    let time = 0;
    const duration = 2500; // 2.5 seconds
    const maxDebrisCount = 150; // Cap per cascade
    let debrisAddedInCascade = 0; // Track debris added during this cascade
    let collisionCount = 0;

    const animate = () => {
      time += 16;
      const progress = Math.min(time / duration, 1);

      // Update ripple
      if (rippleRef.current.active) {
        const rippleProgress = Math.min((time) / 600, 1);
        rippleRef.current = {
          radius: rippleProgress * 0.5,
          opacity: 0.6 * (1 - rippleProgress),
          active: rippleProgress < 1
        };
      }

      if (progress < 1) {
        // Add new debris randomly every few frames (respect per-cascade cap)
        let spawnedThisFrame = 0;
        if (Math.random() < 0.4 && debrisAddedInCascade < maxDebrisCount) {
          setCascadeStatus(`Debris field expanding — ${currentDebrisRef.current.length} objects in orbit (cap: ${maxDebrisCount})`);
          const newRadius = radiusMin + Math.random() * (radiusMax - radiusMin);
          const newAngle = Math.random() * Math.PI * 2;
          const newInclination = inclinationMin + Math.random() * (inclinationMax - inclinationMin);
          
          // Calculate 3D position using spherical coordinates with inclination
          const cosAngle = Math.cos(newAngle);
          const sinAngle = Math.sin(newAngle);
          const cosInc = Math.cos(newInclination);
          const sinInc = Math.sin(newInclination);
          
          // 3D coordinates centered at origin
          const x3d = newRadius * cosAngle;
          const y3d = newRadius * sinAngle * cosInc;
          const z3d = newRadius * sinAngle * sinInc;
          
          // Calculate orbital velocity (tangential to orbit) using Keplerian motion
          const keplerConstant = 0.0025;
          const angularSpeed = keplerConstant / Math.pow(newRadius, 1.5);
          const orbitalSpeed = angularSpeed * newRadius; // v = ωr
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
          currentDebrisRef.current = [...currentDebrisRef.current, newDebris];
          debrisAddedInCascade++;
          spawnedThisFrame++;
        }

        // Update positions with stable orbital mechanics and detect collisions
        const collisionThreshold = 0.04; // Distance threshold for collision
        const newFragments: Debris[] = [];
        
        // Update positions using stable orbital mechanics (angle-based)
        // Keplerian motion: angular speed ∝ 1/radius^1.5 (Kepler's third law)
        const keplerConstant = 0.0025; // Slower rotation for better visualization
        currentDebrisRef.current = currentDebrisRef.current.map((d: Debris) => {
          const angularSpeed = keplerConstant / Math.pow(d.radius, 1.5);
          const nextAngle = (d.angle + angularSpeed) % (Math.PI * 2);
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
        const maxDebrisToCheck = Math.min(currentDebrisRef.current.length, 50); // Limit to prevent lag
        for (let i = 0; i < maxDebrisToCheck; i++) {
          for (let j = i + 1; j < maxDebrisToCheck; j++) {
            const d1 = currentDebrisRef.current[i];
            const d2 = currentDebrisRef.current[j];

            // Calculate 3D distance
            const dx = d1.x - d2.x;
            const dy = d1.y - d2.y;
            const dz = d1.z - d2.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (distance < collisionThreshold) {
              collisionCount++;
              const fragmentCount = 2;
              const remainingCap = maxDebrisCount - debrisAddedInCascade - newFragments.length;
              if (
                remainingCap < fragmentCount ||
                currentDebrisRef.current[i].size === 0 ||
                currentDebrisRef.current[j].size === 0
              ) {
                continue;
              }

              setCascadeStatus(`Collision! Creating fragments — ${collisionCount} collisions, ${currentDebrisRef.current.length + newFragments.length} objects`);

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

              currentDebrisRef.current[i] = { ...currentDebrisRef.current[i], size: 0 };
              currentDebrisRef.current[j] = { ...currentDebrisRef.current[j], size: 0 };
            }
          }
        }

        // Remove collided debris and add fragments (respect per-cascade cap)
        const fragmentsToAdd = newFragments;
        currentDebrisRef.current = [...currentDebrisRef.current.filter((d: Debris) => d.size > 0), ...fragmentsToAdd];
        debrisAddedInCascade += fragmentsToAdd.length;

        drawCanvas(currentDebrisRef.current, rippleRef.current);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsRunning(false);
        isAnimatingRef.current = false;
        setCascadeStatus(`Cascade complete — ${collisionCount} collisions created ${currentDebrisRef.current.length} debris objects`);
        setDebris(currentDebrisRef.current); // Sync state only when animation ends
        drawCanvas(currentDebrisRef.current, rippleRef.current);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const reset = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    isAnimatingRef.current = false;
    setCascadeStatus("");
    
    // Reset slider values to defaults
    setObjectCount(15);
    setRadiusMin(0.25);
    setRadiusMax(0.4);
    setInclinationMin(-0.4);
    setInclinationMax(0.4);
    
    // Generate debris with default values
    const newDebris = generateDebris(15, 0.25, 0.4, -0.4, 0.4);
    setDebris(newDebris);
    currentDebrisRef.current = newDebris;
    initialDebrisRef.current = newDebris;
    rippleRef.current = { radius: 0, opacity: 0, active: false };
    drawCanvas(newDebris, rippleRef.current);
  };

  const drawCanvas = (debrisToDraw: Debris[], rippleToDraw: { radius: number; opacity: number; active: boolean }) => {
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

    // Draw technical grid (graph-paper style)
    ctx.strokeStyle = "rgba(0, 212, 255, 0.08)";
    ctx.lineWidth = 1;
    
    // Fine grid
    const fineGridSize = 20;
    for (let x = 0; x < width; x += fineGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += fineGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Coarse grid (every 4 fine lines)
    ctx.strokeStyle = "rgba(0, 212, 255, 0.12)";
    const coarseGridSize = 80;
    for (let x = 0; x < width; x += coarseGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += coarseGridSize) {
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
    const sortedDebris = [...debrisToDraw].sort((a, b) => a.z - b.z); // Sort by Z for proper depth ordering

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
    if (rippleToDraw.active) {
      const rippleRadius = rippleToDraw.radius * Math.min(width, height);
      const rippleOpacity = rippleToDraw.opacity;
      const strokeWidth = 4 * (1 - rippleToDraw.radius * 2);

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
    ctx.fillText(`Debris objects: ${debrisToDraw.length}`, width * 0.5, 30);
  };

  return (
    <div className="kesslerSimulation">
      <h3 className="simulationLabel simulationLabel--title">Kessler Cascade Simulation</h3>
      
      {/* Explanatory Panel */}
      <div className="explanationPanel">
        <button 
          className="explanationToggle" 
          onClick={() => setExplanationExpanded(!explanationExpanded)}
        >
          {explanationExpanded ? "▼ What's happening" : "▶ What's happening"}
        </button>
        {explanationExpanded && (
          <div className="explanationContent">
            <p><strong>Orbital Speed & Altitude:</strong> Gravity is what keeps debris in orbit, and it gets weaker with distance — so at higher altitude, less centripetal force is needed to stay in orbit, meaning objects move slower (v = √(GM/r)). This is Kepler's third law in action: orbital period grows with altitude, so farther-out objects take longer to complete one trip around Earth.</p>
            <p><strong>Inclination & Collisions:</strong> Wider orbital tilt spread means more path crossings, often at higher relative speeds — both raise collision risk.</p>
            <p><strong>Kessler Syndrome:</strong> One collision creates debris that raises the odds of further collisions — potentially triggering exponential growth.</p>
          </div>
        )}
      </div>

      {/* Parameter Controls */}
      <div className={`parameterControls ${isRunning ? 'parameterControls--disabled' : ''}`}>
        {isRunning && (
          <div className="disabledNotice">
            Parameters locked during cascade — press Reset to adjust
          </div>
        )}
        <div className="controlGroup">
          <label className="controlLabel">
            <span className="controlValue">Initial Objects: {objectCount} — {objectCount <= 15 ? "low density" : objectCount <= 25 ? "moderate density" : "high density"}</span>
            <span className="controlHelp">
              <button
                type="button"
                className="controlTooltip"
                aria-label="Explain initial object count"
                aria-expanded={activeTooltip === "objects"}
                onMouseEnter={() => setActiveTooltip("objects")}
                onMouseLeave={() => setActiveTooltip(null)}
                onFocus={() => setActiveTooltip("objects")}
                onBlur={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip((current) => (current === "objects" ? null : "objects"))}
              >
                ?
              </button>
              {activeTooltip === "objects" && (
                <div className="tooltipContent">
                  Starting number of debris objects in stable orbit. More objects raise collision probability even before a cascade begins.
                </div>
              )}
            </span>
          </label>
          <input
            type="range"
            min="5"
            max="40"
            value={objectCount}
            onChange={(e) => setObjectCount(parseInt(e.target.value))}
            disabled={isRunning}
            className="controlSlider"
          />
        </div>

        <div className="controlGroup">
          <label className="controlLabel">
            <span className="controlValue">Orbital Altitude: {altitudeCenter.toFixed(2)} — {altitudeCenter < 0.3 ? "low-LEO band" : altitudeCenter < 0.4 ? "mid-LEO band" : "high-LEO band"}</span>
            <span className="controlHelp">
              <button
                type="button"
                className="controlTooltip"
                aria-label="Explain orbital altitude"
                aria-expanded={activeTooltip === "altitude"}
                onMouseEnter={() => setActiveTooltip("altitude")}
                onMouseLeave={() => setActiveTooltip(null)}
                onFocus={() => setActiveTooltip("altitude")}
                onBlur={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip((current) => (current === "altitude" ? null : "altitude"))}
              >
                ?
              </button>
              {activeTooltip === "altitude" && (
                <div className="tooltipContent">
                  Sets the starting altitude band for debris. Higher altitude means slower orbital speed and a longer period — see "What's happening" above for why.
                </div>
              )}
            </span>
          </label>
          <input
            type="range"
            min="0.2"
            max="0.55"
            step="0.05"
            value={altitudeCenter}
            onChange={(e) => {
              const center = parseFloat(e.target.value);
              const spread = 0.075; // Fixed spread for simplicity
              setRadiusMin(center - spread);
              setRadiusMax(center + spread);
            }}
            disabled={isRunning}
            className="controlSlider"
          />
        </div>

        <div className="controlGroup">
          <label className="controlLabel">
            <span className="controlValue">Inclination Spread: {((inclinationMax - inclinationMin) / 2).toFixed(2)} — {((inclinationMax - inclinationMin) / 2) < 0.3 ? "tight" : ((inclinationMax - inclinationMin) / 2) < 0.6 ? "moderate" : "wide"}</span>
            <span className="controlHelp">
              <button
                type="button"
                className="controlTooltip"
                aria-label="Explain inclination spread"
                aria-expanded={activeTooltip === "inclination"}
                onMouseEnter={() => setActiveTooltip("inclination")}
                onMouseLeave={() => setActiveTooltip(null)}
                onFocus={() => setActiveTooltip("inclination")}
                onBlur={() => setActiveTooltip(null)}
                onClick={() => setActiveTooltip((current) => (current === "inclination" ? null : "inclination"))}
              >
                ?
              </button>
              {activeTooltip === "inclination" && (
                <div className="tooltipContent tooltipContent--wide">
                  Sets how much orbital tilt varies across debris. Wider spread means more crossing points between orbits — see "What's happening" above for why that raises collision risk.
                </div>
              )}
            </span>
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={(inclinationMax - inclinationMin) / 2}
            onChange={(e) => {
              const spread = parseFloat(e.target.value);
              setInclinationMin(-spread);
              setInclinationMax(spread);
            }}
            disabled={isRunning}
            className="controlSlider"
          />
        </div>
      </div>

      {cascadeStatus && (
        <div className="cascadeStatus">
          {cascadeStatus}
        </div>
      )}

      <div className="simulationCanvasWrapper">
        <canvas ref={canvasRef} className="simulationCanvas" />
        <p className="simulationDisclaimer">Illustrative educational visualization; not an orbital-mechanics model.</p>
      </div>
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
