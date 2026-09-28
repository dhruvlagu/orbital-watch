import { useState, useRef, useEffect, useCallback } from "react";
import { useMagneticButton } from "../hooks/useMagneticButton";
import katex from "katex";

// Helper to render LaTeX with KaTeX
const renderMath = (latex: string) => {
  try {
    return katex.renderToString(latex, { displayMode: false });
  } catch (e) {
    return latex; // Fallback to plain text if rendering fails
  }
};

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

// MAGNETIC BUTTON AUDIT: "Initiate Collision Cascade" button uses magnetic effect
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
  const [altitudeMin, setAltitudeMin] = useState(400);
  const [altitudeMax, setAltitudeMax] = useState(800);
  const [inclinationMinDeg, setInclinationMinDeg] = useState(-23);
  const [inclinationMaxDeg, setInclinationMaxDeg] = useState(23);
  const [explanationExpanded, setExplanationExpanded] = useState(false);
  const [cascadeStatus, setCascadeStatus] = useState("");
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Convert km to internal radius units (km / 2000)
  const kmToRadius = (km: number) => km / 2000;
  const radiusMin = kmToRadius(altitudeMin);
  const radiusMax = kmToRadius(altitudeMax);

  // Convert degrees to radians for internal calculations
  const degToRad = (deg: number) => deg * (Math.PI / 180);
  const inclinationMin = degToRad(inclinationMinDeg);
  const inclinationMax = degToRad(inclinationMaxDeg);

  // Derived altitude center for the slider
  const altitudeCenter = (altitudeMin + altitudeMax) / 2;



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
  }, [objectCount, altitudeMin, altitudeMax, inclinationMinDeg, inclinationMaxDeg, generateDebris]);

  // Handle tab visibility change to pause/resume animation gracefully
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isAnimatingRef.current && animationRef.current) {
        // Tab lost focus during animation - cancel to prevent buildup
        cancelAnimationFrame(animationRef.current);
        // Redraw final state to ensure clean visual state
        drawCanvas(currentDebrisRef.current, rippleRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const triggerCascade = () => {
    // Guard against multiple simultaneous cascade animations
    if (isAnimatingRef.current) {
      return;
    }
    
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
        setCascadeStatus(`Cascade complete — ${collisionCount} collisions, ${currentDebrisRef.current.length} objects now in field`);
        setDebris(currentDebrisRef.current); // Sync state only when animation ends
        drawCanvas(currentDebrisRef.current, rippleRef.current);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const reset = () => {
    // Cancel any pending animation frame
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    // Reset all animation and state flags
    setIsRunning(false);
    isAnimatingRef.current = false;
    setCascadeStatus("");
    
    // Reset slider values to defaults
    setObjectCount(15);
    setAltitudeMin(400);
    setAltitudeMax(800);
    setInclinationMinDeg(-23);
    setInclinationMaxDeg(23);

    // Generate debris with default values
    const newDebris = generateDebris(15, kmToRadius(400), kmToRadius(800), degToRad(-23), degToRad(23));
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


  };

  return (
    <div className="card kesslerSimInstrument">
      {/* Instrument Header */}
      <div className="kesslerSimHeader">
        <div className="kesslerSimHeader__left">
          <h3 className="kesslerSimHeader__title">Kessler Cascade Simulator</h3>
          <p className="kesslerSimHeader__desc">
            Interactive simulation of how debris collisions create cascading chain reactions in Low Earth Orbit.
          </p>
        </div>
        <div className="kesslerSimHeader__status">
          <span className={`kesslerSimBadge ${isRunning ? "kesslerSimBadge--active" : cascadeStatus.includes("complete") ? "kesslerSimBadge--complete" : "kesslerSimBadge--ready"}`}>
            <span className="kesslerSimBadge__dot" />
            {isRunning ? "CASCADE RUNNING" : cascadeStatus.includes("complete") ? "CASCADE CONCLUDED" : "READY"}
          </span>
        </div>
      </div>

      {/* Physics / Educational Notes Drawer */}
      <div className="kesslerSimNotes">
        <button
          type="button"
          className="kesslerSimNotes__toggle"
          onClick={() => setExplanationExpanded(!explanationExpanded)}
          aria-expanded={explanationExpanded}
        >
          <span>{explanationExpanded ? "▾ Hide Mechanics & Orbital Physics Notes" : "▸ View Mechanics & Orbital Physics Notes"}</span>
        </button>
        {explanationExpanded && (
          <div className="kesslerSimNotes__body">
            <div className="kesslerSimNotes__grid">
              <div className="kesslerSimNotes__col">
                <strong>Orbital Speed &amp; Altitude:</strong>
                <p>
                  Higher orbits move slower (<span dangerouslySetInnerHTML={{ __html: renderMath('v = \\sqrt{\\frac{GM}{r}}') }} />), so objects up there take longer to complete a lap and encounter each other less often. Down in low LEO, objects are moving faster and finishing orbits quickly, so they pass each other more often, which means more chances to collide.
                </p>
              </div>
              <div className="kesslerSimNotes__col">
                <strong>Inclination Dispersion:</strong>
                <p>
                  Debris doesn't all orbit on the same plane. When two objects cross at different inclinations, especially near-opposite directions, their closing speed can hit close to 15 km/s. That's fast enough that even a small fragment does real damage.
                </p>
              </div>
              <div className="kesslerSimNotes__col">
                <strong>Exponential Fragmentation:</strong>
                <p>
                  Every collision creates more debris than it destroys. Each hit multiplies into fragments, and those fragments raise the odds of the next collision. Once that keeps happening faster than drag can pull old debris down, the cascade feeds itself.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parameter Control Deck */}
      <div className={`kesslerControlDeck ${isRunning ? "kesslerControlDeck--disabled" : ""}`}>
        <div className="kesslerControlGrid">
          {/* Slider 1: Object Density */}
          <div className="kesslerParam">
            <div className="kesslerParam__header">
              <span className="kesslerParam__label">
                Initial Objects
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
                    onClick={() => setActiveTooltip((cur) => (cur === "objects" ? null : "objects"))}
                  >
                    ?
                  </button>
                  {activeTooltip === "objects" && (
                    <div className="tooltipContent">
                      Starting number of debris objects in stable orbit. Higher initial density drastically raises collision odds before a cascade even begins.
                    </div>
                  )}
                </span>
              </span>
              <div className="kesslerParam__readout">
                <span className="kesslerParam__value">{objectCount}</span>
                <span className="kesslerParam__sub">{objectCount <= 15 ? "LOW" : objectCount <= 25 ? "MODERATE" : "HIGH"}</span>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={objectCount}
              onChange={(e) => {
                if (isRunning) return;
                setObjectCount(parseInt(e.target.value));
              }}
              disabled={isRunning}
              className="kesslerSlider"
              aria-label="Initial debris object count"
            />
          </div>

          {/* Slider 2: Orbital Altitude */}
          <div className="kesslerParam">
            <div className="kesslerParam__header">
              <span className="kesslerParam__label">
                Orbital Altitude
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
                    onClick={() => setActiveTooltip((cur) => (cur === "altitude" ? null : "altitude"))}
                  >
                    ?
                  </button>
                  {activeTooltip === "altitude" && (
                    <div className="tooltipContent">
                      Sets the altitude band for debris in kilometers. Higher altitudes mean slower orbital speeds (<span dangerouslySetInnerHTML={{ __html: renderMath('v = \\sqrt{\\frac{GM}{r}}') }} />) and fewer collision opportunities.
                    </div>
                  )}
                </span>
              </span>
              <div className="kesslerParam__readout">
                <span className="kesslerParam__value">{altitudeCenter.toFixed(0)} km</span>
                <span className="kesslerParam__sub">{altitudeCenter < 500 ? "LOW-LEO" : altitudeCenter < 750 ? "MID-LEO" : "HIGH-LEO"}</span>
              </div>
            </div>
            <input
              type="range"
              min="300"
              max="1000"
              step="50"
              value={altitudeCenter}
              onChange={(e) => {
                if (isRunning) return;
                const center = parseInt(e.target.value);
                const spread = 100;
                setAltitudeMin(Math.max(300, center - spread));
                setAltitudeMax(Math.min(1000, center + spread));
              }}
              disabled={isRunning}
              className="kesslerSlider"
              aria-label="Orbital altitude center"
            />
          </div>

          {/* Slider 3: Inclination Spread */}
          <div className="kesslerParam">
            <div className="kesslerParam__header">
              <span className="kesslerParam__label">
                Inclination Spread
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
                    onClick={() => setActiveTooltip((cur) => (cur === "inclination" ? null : "inclination"))}
                  >
                    ?
                  </button>
                  {activeTooltip === "inclination" && (
                    <div className="tooltipContent tooltipContent--wide">
                      Sets orbital plane tilt variation. Wider spread creates cross-track orbital intersections at closing speeds up to 15 km/s.
                    </div>
                  )}
                </span>
              </span>
              <div className="kesslerParam__readout">
                <span className="kesslerParam__value">±{((inclinationMaxDeg - inclinationMinDeg) / 2).toFixed(0)}°</span>
                <span className="kesslerParam__sub">{((inclinationMaxDeg - inclinationMinDeg) / 2) < 20 ? "CO-PLANAR" : ((inclinationMaxDeg - inclinationMinDeg) / 2) < 40 ? "MODERATE" : "CROSS-TRACK"}</span>
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="5"
              value={(inclinationMaxDeg - inclinationMinDeg) / 2}
              onChange={(e) => {
                if (isRunning) return;
                const spread = parseInt(e.target.value);
                setInclinationMinDeg(-spread);
                setInclinationMaxDeg(spread);
              }}
              disabled={isRunning}
              className="kesslerSlider"
              aria-label="Inclination spread"
            />
          </div>
        </div>

        {isRunning && (
          <div className="kesslerLockNotice">
            <span>Parameters locked while cascade runs. Use Reset Orbit to change settings.</span>
          </div>
        )}
      </div>

      {/* Primary Simulation Canvas & Telemetry Overlay */}
      <div className="kesslerViewport">
        <canvas ref={canvasRef} className="kesslerCanvas" />
        
        {/* HUD Instrument Metrics */}
        <div className="kesslerHUD">
          <div className="kesslerHUD__item">
            <span className="kesslerHUD__key">LEO OBJECTS</span>
            <span className="kesslerHUD__val">{currentDebrisRef.current.length}</span>
          </div>
        </div>

        <div className="kesslerFooterDisclaimer">
          <span>Educational visualization of collision cascades in orbit.</span>
        </div>
      </div>

      {/* Control & Live Telemetry Action Bar */}
      <div className="kesslerControlBar">
        <div className="kesslerControlBar__status">
          <span className="kesslerStatusPrefix">TELEMETRY FEED:</span>
          <span className="kesslerStatusMessage">
            {cascadeStatus || "Stable orbit. Click \"Initiate Collision Cascade\" to start the simulation."}
          </span>
        </div>

        <div className="kesslerControlBar__actions">
          <button
            ref={triggerButtonRef}
            type="button"
            className="btn btn--primary kesslerActionBtn"
            onClick={triggerCascade}
            disabled={isRunning}
          >
            {isRunning ? "Simulating Cascade..." : "Initiate Collision Cascade →"}
          </button>
          <button
            type="button"
            className="btn btn--secondary kesslerActionBtn"
            onClick={reset}
          >
            Reset Orbit
          </button>
        </div>
      </div>
    </div>
  );
}
