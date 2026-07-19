import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentMetadata } from "../hooks/useDocumentMetadata";
import { useCardSpotlight } from "../hooks/useCardSpotlight";
import { useMagneticButton } from "../hooks/useMagneticButton";
import { fetchLiveOrbitalEnvironment } from "../services/liveOrbitalData";
import {
  CategoryScale,
  Chart as ChartJS,
  type Plugin,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import StarfieldCanvas from "../components/StarfieldCanvas";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
);

const debrisGrowthData = [
  { year: 1957, count: 1 },
  { year: 1960, count: 30 },
  { year: 1970, count: 1100 },
  { year: 1980, count: 4500 },
  { year: 1990, count: 7000 },
  { year: 2000, count: 9000 },
  { year: 2007, count: 10000 },
  { year: 2008, count: 13000 },
  { year: 2009, count: 13500 },
  { year: 2010, count: 16000 },
  { year: 2015, count: 17000 },
  { year: 2020, count: 20000 },
  { year: 2023, count: 31773 },
  { year: 2024, count: 39246 },
];

const markedEvents = [
  { year: 1957, label: "Sputnik" },
  { year: 2007, label: "ASAT test" },
  { year: 2009, label: "Iridium collision" },
];

const eventMarkerPlugin: Plugin<"line"> = {
  id: "eventMarkers",
  afterDraw(chart: ChartJS<"line">) {
    const { ctx, chartArea, scales } = chart;
    const xScale = scales.x;
    if (!xScale || !chartArea) return;

    ctx.save();
    markedEvents.forEach((event) => {
      const x = xScale.getPixelForValue(event.year);
      if (x < chartArea.left || x > chartArea.right) return;

      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "#8b9ab0";
      if (event.year === 2025) {
        ctx.textAlign = "right";
        ctx.fillText(event.label, x - 6, chartArea.top + 16);
      } else {
        ctx.textAlign = "left";
        ctx.fillText(event.label, x + 6, chartArea.top + 16);
      }
    });
    ctx.restore();
  },
};

const glowLinePlugin: Plugin<"line"> = {
  id: "glowLine",
  beforeDatasetDraw(chart: ChartJS<"line">, args: { index: number }) {
    if (args.index !== 0) return;
    const { ctx } = chart;
    ctx.save();
    ctx.shadowColor = "rgba(0, 212, 255, 0.6)";
    ctx.shadowBlur = 16;
  },
  afterDatasetDraw(chart: ChartJS<"line">, args: { index: number }) {
    if (args.index !== 0) return;
    chart.ctx.restore();
  },
};

const crisisEvents = [
  {
    year: "1957",
    title: "The Starting Gun",
    context:
      "Sputnik's launch ignited the Space Race between the US and USSR. Speed was the only metric that mattered — no nation paused to consider what would happen to hardware once its mission ended. Rocket boosters, dead satellites, lens caps — all abandoned in orbit without a second thought.",
    significance:
      "Established the 'Frontier Mentality' — space as an infinite, empty void.",
    visualType: "orbit",
  },
  {
    year: "1967",
    title: "The Paper Shield",
    context:
      "The Outer Space Treaty was signed by the US, USSR, and UK, becoming the foundational document of space law. While it declared space the 'province of all mankind,' it also established that nations retain permanent jurisdiction over every object they launch — forever. This seemingly reasonable clause would become the legal barrier preventing international debris cleanup decades later.",
    significance: "Space got a constitution. It didn't mention trash.",
    visualType: "document",
  },
  {
    year: "1978",
    title: "The Warning No One Heard",
    context:
      "NASA scientist Donald J. Kessler and colleague Burton Cour-Palais published a peer-reviewed paper in the Journal of Geophysical Research mathematically modeling a self-sustaining collision cascade in LEO. They calculated the orbital density threshold at which debris collisions would become inevitable and exponential. The paper was largely ignored by policymakers.",
    significance: "The math existed. The will to act didn't.",
    visualType: "warning",
  },
  {
    year: "2007",
    title: "The ASAT Crisis",
    context:
      "China's People's Liberation Army destroyed the defunct Fengyun-1C weather satellite with a direct-ascent anti-satellite missile at 865 km altitude. The single impact created 3,000+ trackable fragments and tens of thousands of smaller untrackable pieces — the largest debris-generating event in history. Much of this cloud remains in orbit today, spread across altitudes from 200 km to 3,800 km.",
    significance: "The most destructive deliberate act in orbital history.",
    visualType: "scatter",
  },
  {
    year: "2009",
    title: "The Zombie Strike",
    context:
      "On February 10, 2009, the active Iridium-33 communications satellite collided with the decommissioned Russian Cosmos-2251 at a closing speed of 11.7 km/s — roughly 26,000 mph. The first accidental hypervelocity impact between two intact satellites in history, it generated over 2,300 trackable fragments and an estimated 100,000+ smaller pieces. Both objects were tracked by the Space Surveillance Network — but the conjunction warning system failed to flag the collision risk in time for Iridium operators to maneuver.",
    significance: "The Kessler Syndrome stopped being theoretical.",
    visualType: "impact",
  },
  {
    year: "2022",
    title: "Too Little, Too Late?",
    context:
      "The FCC passed the 5-Year Rule, requiring US-licensed satellites to de-orbit within five years of mission end — replacing the previous 25-year standard. Progress, but only binding on US operators. Meanwhile, SpaceX's Starlink constellation was adding hundreds of satellites per year, and China was building its own megaconstellation.",
    significance: "The first enforceable rule. Still only covers one nation.",
    visualType: "constellation",
    tone: "amber",
  },
];

function SputnikVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let angle = 0;
    let beeps: Array<{ r: number; opacity: number }> = [];
    // Trail history for motion blur effect
    const trail: Array<{ x: number; y: number }> = [];

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);

      // Fade instead of clear — creates motion trail effect
      ctx.fillStyle = "rgba(9, 16, 36, 0.35)";
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Draw Earth glow halo
      const earthGlow = ctx.createRadialGradient(cx, cy, 30, cx, cy, 60);
      earthGlow.addColorStop(0, "rgba(0, 100, 180, 0.12)");
      earthGlow.addColorStop(1, "rgba(0, 100, 180, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fillStyle = earthGlow;
      ctx.fill();

      // Draw Earth body
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
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
      ctx.ellipse(cx, cy, 40, 15, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, 15, 40, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Orbit path
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(0, 212, 255, 0.15)";
      ctx.stroke();
      ctx.setLineDash([]);

      // Sputnik position
      const sx = cx + Math.cos(angle) * 80;
      const sy = cy + Math.sin(angle) * 80;

      // Update trail
      trail.push({ x: sx, y: sy });
      if (trail.length > 22) trail.shift();

      // Draw motion trail
      for (let i = 0; i < trail.length - 1; i++) {
        const alpha = (i / trail.length) * 0.5;
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, 2.5 * (i / trail.length), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
        ctx.fill();
      }

      // Update beep waves (emit only on every ~3rd second at 60fps ≈ 180 frames)
      if (Math.random() < 0.025) {
        beeps.push({ r: 4, opacity: 0.9 });
      }
      beeps = beeps
        .map((b) => ({ r: b.r + 1.2, opacity: b.opacity - 0.018 }))
        .filter((b) => b.opacity > 0);

      // Draw beep rings
      beeps.forEach((b) => {
        ctx.beginPath();
        ctx.arc(sx, sy, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 212, 255, ${b.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw Sputnik body with glow
      ctx.shadowColor = "rgba(0, 212, 255, 1)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.shadowBlur = 0;

      // Antennas trailing behind
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1;
      const antAngle = angle + Math.PI;
      const antLengths = [20, 24, 24, 20];
      const antSpreads = [-0.25, -0.1, 0.1, 0.25];
      for (let i = 0; i < 4; i++) {
        const theta = antAngle + antSpreads[i];
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(theta) * antLengths[i], sy + Math.sin(theta) * antLengths[i]);
        ctx.stroke();
      }

      angle += 0.012;
      animationId = requestAnimationFrame(draw);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      // Clear trail on resize to avoid stale positions
      trail.length = 0;
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

function DocumentVisual() {
  return (
    <div className="holographicDoc">
      <div className="holographicDoc__scanline" />
      <div className="holographicDoc__header">
        <span>TREATY_DOC // 1967_OST</span>
        <span className="holographicDoc__statusBlink">● ACTIVE</span>
      </div>
      <div className="holographicDoc__lines">
        <div className="holographicDoc__line" />
        <div className="holographicDoc__line holographicDoc__line--fade1" />
        <div className="holographicDoc__line holographicDoc__line--short" />
        <div className="holographicDoc__line holographicDoc__line--fade2" />
        <div className="holographicDoc__line holographicDoc__line--short holographicDoc__line--fade1" />
        <div className="holographicDoc__line" />
      </div>
      <div className="holographicDoc__highlight">
        <div className="holographicDoc__highlightTitle">ARTICLE VIII · SOVEREIGNTY</div>
        <div className="holographicDoc__highlightText">
          PERMANENT JURISDICTION<span className="holographicDoc__cursor">_</span>
        </div>
      </div>
    </div>
  );
}

function WarningVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    interface Satellite { orbit: number; angle: number; speed: number; color: string; id: number; }
    let satellites: Satellite[] = [];
    interface Debris { x: number; y: number; vx: number; vy: number; opacity: number; }
    let debris: Debris[] = [];

    const init = () => {
      satellites = [];
      debris = [];
      let idCounter = 0;
      const lanes = [54, 74, 94];
      lanes.forEach((lane) => {
        const count = Math.floor(lane / 12);
        for (let i = 0; i < count; i++) {
          satellites.push({ orbit: lane, angle: (i * (Math.PI * 2)) / count, speed: 0.015 - (lane - 54) * 0.00005, color: "#00d4ff", id: idCounter++ });
        }
      });
    };

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      const eg = ctx.createRadialGradient(cx, cy, 22, cx, cy, 50);
      eg.addColorStop(0, "rgba(0, 100, 180, 0.1)");
      eg.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, 50, 0, Math.PI * 2);
      ctx.fillStyle = eg;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fillStyle = "#0a1021";
      ctx.fill();
      ctx.shadowColor = "rgba(0, 180, 255, 0.25)";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "rgba(0, 212, 255, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const lanes = [54, 74, 94];
      lanes.forEach((lane) => {
        ctx.beginPath();
        ctx.arc(cx, cy, lane, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      satellites.forEach((s) => {
        s.angle += s.speed;
        const sx = cx + Math.cos(s.angle) * s.orbit;
        const sy = cy + Math.sin(s.angle) * s.orbit;

        if (s.color === "#00d4ff") {
          ctx.shadowColor = "rgba(0, 212, 255, 0.7)";
          ctx.shadowBlur = 9;
        } else if (s.color === "#ff3b3b") {
          ctx.shadowColor = "rgba(255, 59, 59, 0.8)";
          ctx.shadowBlur = 12;
        } else {
          ctx.shadowColor = "rgba(245, 166, 35, 0.6)";
          ctx.shadowBlur = 8;
        }

        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      if (time >= 100 && time < 102) {
        const target = satellites.find((s) => s.orbit === 74 && s.color === "#00d4ff");
        if (target) {
          target.color = "#f5a623";
          const tx = cx + Math.cos(target.angle) * target.orbit;
          const ty = cy + Math.sin(target.angle) * target.orbit;
          for (let i = 0; i < 18; i++) {
            const theta = Math.random() * Math.PI * 2;
            const speed = 0.7 + Math.random() * 2.2;
            debris.push({ x: tx, y: ty, vx: Math.cos(theta) * speed, vy: Math.sin(theta) * speed, opacity: 1 });
          }
        }
      }

      debris.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        d.opacity -= 0.005;

        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 166, 35, ${d.opacity})`;
        ctx.fill();

        satellites.forEach((s) => {
          if (s.color === "#00d4ff") {
            const sx = cx + Math.cos(s.angle) * s.orbit;
            const sy = cy + Math.sin(s.angle) * s.orbit;
            if (Math.hypot(d.x - sx, d.y - sy) < 6) {
              s.color = "#ff3b3b";
              for (let i = 0; i < 7; i++) {
                const theta = Math.random() * Math.PI * 2;
                const speed = 0.4 + Math.random() * 1.5;
                debris.push({ x: sx, y: sy, vx: Math.cos(theta) * speed, vy: Math.sin(theta) * speed, opacity: 1 });
              }
            }
          }
        });
      });
      debris = debris.filter((d) => d.opacity > 0);

      time += 1;
      if (time > 500) { time = 0; init(); }
      animationId = requestAnimationFrame(draw);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      time = 0;
      init();
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

function ScatterVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      decay: number;
      alpha: number;
    }

    let satAngle = Math.PI * 1.1; // start top-right for natural approach
    let missileStartY = 0;
    let missileY = 0;
    let state: "orbiting" | "launching" | "impacted" = "orbiting";
    let particles: Particle[] = [];
    let explosionRadius = 0;
    // Motion trail for satellite
    const satTrail: Array<{ x: number; y: number }> = [];

    const getCenter = () => ({
      cx: (canvas.width / (window.devicePixelRatio || 1)) / 2,
      cy: (canvas.height / (window.devicePixelRatio || 1)) / 2,
    });

    const reset = () => {
      time = 0;
      state = "orbiting";
      satAngle = Math.PI * 1.1;
      particles = [];
      explosionRadius = 0;
      satTrail.length = 0;
      const { cy } = getCenter();
      missileStartY = cy + 32;
      missileY = missileStartY;
    };

    reset();

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      missileStartY = cy + 32;

      // Earth glow halo
      const eg = ctx.createRadialGradient(cx, cy, 22, cx, cy, 55);
      eg.addColorStop(0, "rgba(0, 80, 180, 0.12)");
      eg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, 55, 0, Math.PI * 2);
      ctx.fillStyle = eg;
      ctx.fill();

      // Earth
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fillStyle = "#091024";
      ctx.fill();
      ctx.shadowColor = "rgba(0, 212, 255, 0.3)";
      ctx.shadowBlur = 8;
      ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Orbit ring
      ctx.beginPath();
      ctx.arc(cx, cy, 75, 0, Math.PI * 2);
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      const satX = cx + Math.cos(satAngle) * 75;
      const satY = cy + Math.sin(satAngle) * 75;

      if (state === "orbiting") {
        satAngle += 0.016;
        satTrail.push({ x: satX, y: satY });
        if (satTrail.length > 18) satTrail.shift();

        // Draw trail
        for (let i = 0; i < satTrail.length - 1; i++) {
          const alpha = (i / satTrail.length) * 0.4;
          ctx.beginPath();
          ctx.arc(satTrail[i].x, satTrail[i].y, 2 * (i / satTrail.length), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
          ctx.fill();
        }

        // Satellite
        ctx.shadowColor = "rgba(0, 212, 255, 0.9)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(satX, satY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00d4ff";
        ctx.fill();
        ctx.shadowBlur = 0;

        if (time > 90) {
          state = "launching";
          missileY = missileStartY;
        }
      } else if (state === "launching") {
        satAngle += 0.016;
        satTrail.push({ x: satX, y: satY });
        if (satTrail.length > 18) satTrail.shift();

        for (let i = 0; i < satTrail.length - 1; i++) {
          const alpha = (i / satTrail.length) * 0.3;
          ctx.beginPath();
          ctx.arc(satTrail[i].x, satTrail[i].y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
          ctx.fill();
        }

        ctx.shadowColor = "rgba(0, 212, 255, 0.9)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(satX, satY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00d4ff";
        ctx.fill();
        ctx.shadowBlur = 0;

        missileY -= 2.2;

        // Exhaust trail
        ctx.beginPath();
        ctx.moveTo(cx, missileStartY);
        ctx.lineTo(cx, missileY + 6);
        ctx.strokeStyle = "rgba(255, 200, 80, 0.2)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Missile tip with glow
        ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, missileY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
        ctx.shadowBlur = 0;

        const satDist = Math.hypot(cx - satX, missileY - satY);
        if (satDist < 8 || missileY <= cy - 80) {
          state = "impacted";
          explosionRadius = 5;
          for (let i = 0; i < 150; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.6 + Math.random() * 3.0;
            particles.push({
              x: satX,
              y: satY,
              vx: Math.cos(angle) * speed + -Math.sin(satAngle) * 1.2,
              vy: Math.sin(angle) * speed + Math.cos(satAngle) * 1.2,
              size: 0.8 + Math.random() * 2,
              color: i % 3 === 0 ? "#f5a623" : i % 3 === 1 ? "#ff3b3b" : "#8b9ab0",
              decay: 0.0012 + Math.random() * 0.003,
              alpha: 1,
            });
          }
        }
      } else if (state === "impacted") {
        // Expanding blast ring
        if (explosionRadius < 40) {
          const ringAlpha = (40 - explosionRadius) / 40;
          ctx.beginPath();
          ctx.arc(satX, satY, explosionRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 140, 0, ${ringAlpha})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(satX, satY, explosionRadius * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${ringAlpha * 0.5})`;
          ctx.fill();
          explosionRadius += 2.8;
        }

        // Scatter particles with gentle gravity toward Earth
        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0) {
            p.vx += (dx / dist) * 0.004;
            p.vy += (dy / dist) * 0.004;
          }
          p.alpha -= p.decay;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        particles = particles.filter((p) => p.alpha > 0);
      }

      time += 1;
      if (time > 500) reset();

      animationId = requestAnimationFrame(draw);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      reset();
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

function ImpactVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    interface Fragment {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      decay: number;
    }

    // Canvas-relative approach start/end computed from canvas size
    let sat1 = { x: 0, y: 0 };
    let sat2 = { x: 0, y: 0 };
    let state: "approach" | "impact" | "shattered" = "approach";
    let fragments: Fragment[] = [];
    let flashOpacity = 0;
    let ringRadius = 0;
    // Trails for each satellite
    const trail1: Array<{ x: number; y: number }> = [];
    const trail2: Array<{ x: number; y: number }> = [];

    const reset = (w: number, h: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const arm = Math.min(w, h) * 0.42;
      const vy = arm * 0.67;
      sat1 = { x: cx - arm, y: cy - vy };
      sat2 = { x: cx + arm, y: cy - vy };
      time = 0;
      state = "approach";
      fragments = [];
      flashOpacity = 0;
      ringRadius = 0;
      trail1.length = 0;
      trail2.length = 0;
    };

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const arm = Math.min(w, h) * 0.42;
      const vy = arm * 0.67;

      // Faint collision trajectory lines
      ctx.setLineDash([3, 8]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - arm, cy - vy);
      ctx.lineTo(cx + arm, cy + vy);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + arm, cy - vy);
      ctx.lineTo(cx - arm, cy + vy);
      ctx.stroke();
      ctx.setLineDash([]);

      if (state === "approach") {
        const progress = time / 100;

        // Interpolate positions toward collision point (center)
        sat1.x = (cx - arm) + progress * arm;
        sat1.y = (cy - vy) + progress * vy;
        sat2.x = (cx + arm) - progress * arm;
        sat2.y = (cy - vy) + progress * vy;

        trail1.push({ x: sat1.x, y: sat1.y });
        trail2.push({ x: sat2.x, y: sat2.y });
        if (trail1.length > 16) trail1.shift();
        if (trail2.length > 16) trail2.shift();

        // Draw trails
        for (let i = 0; i < trail1.length; i++) {
          const a = (i / trail1.length) * 0.4;
          ctx.beginPath();
          ctx.arc(trail1[i].x, trail1[i].y, 2 * (i / trail1.length), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 212, 255, ${a})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(trail2[i].x, trail2[i].y, 2 * (i / trail2.length), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 154, 176, ${a})`;
          ctx.fill();
        }

        // Sat 1 — Iridium-33 (active, blue glow)
        ctx.shadowColor = "rgba(0, 212, 255, 0.9)";
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(sat1.x, sat1.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#00d4ff";
        ctx.fill();
        ctx.shadowBlur = 0;

        // Sat 2 — Cosmos-2251 (derelict, dim grey)
        ctx.shadowColor = "rgba(139, 154, 176, 0.5)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sat2.x, sat2.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#8b9ab0";
        ctx.fill();
        ctx.shadowBlur = 0;

        if (time >= 100) {
          state = "impact";
          flashOpacity = 1.2;
          ringRadius = 2;
          for (let i = 0; i < 160; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 3.5;
            fragments.push({
              x: cx, y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 0.8 + Math.random() * 2,
              color: i % 3 === 0 ? "#00d4ff" : i % 3 === 1 ? "#ff3b3b" : "#8b9ab0",
              alpha: 1.0,
              decay: 0.0015 + Math.random() * 0.003,
            });
          }
        }
      } else if (state === "impact" || state === "shattered") {
        // Fragments — slow gravitational drift toward center
        fragments.forEach((f) => {
          f.x += f.vx;
          f.y += f.vy;
          const dx = cx - f.x;
          const dy = cy - f.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 0) {
            f.vx += (dx / dist) * 0.003;
            f.vy += (dy / dist) * 0.003;
          }
          f.alpha -= f.decay;
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
          ctx.fillStyle = f.color;
          ctx.globalAlpha = Math.max(0, f.alpha);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
        fragments = fragments.filter((f) => f.alpha > 0);

        // Expanding shockwave rings
        if (ringRadius < 55) {
          const rAlpha = (55 - ringRadius) / 55;
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${rAlpha * 0.8})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          if (ringRadius > 15) {
            ctx.beginPath();
            ctx.arc(cx, cy, ringRadius * 0.6, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 120, 60, ${rAlpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          ringRadius += 2.0;
        }

        // White flash that fades out
        if (flashOpacity > 0) {
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
          grad.addColorStop(0, `rgba(255,255,255,${Math.min(flashOpacity, 1)})`);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.beginPath();
          ctx.arc(cx, cy, 60, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          flashOpacity -= 0.05;
        } else {
          state = "shattered";
        }
      }

      time += 1;
      if (time > 400) reset(w, h);

      animationId = requestAnimationFrame(draw);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;
      reset(w, h);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

function ConstellationVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let angleOffset = 0;
    let labelPulse = 0;

    // 6 orbital planes × 10 sats = 60 satellites total visible
    const PLANES = 6;
    const SATS_PER_PLANE = 10;

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) / 260;
      const earthR = 38 * scale;
      const orbitRx = 80 * scale;
      const orbitRy = 25 * scale;

      // Earth glow halo
      const eg = ctx.createRadialGradient(cx, cy, earthR * 0.5, cx, cy, earthR * 1.6);
      eg.addColorStop(0, "rgba(0, 212, 255, 0.08)");
      eg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, earthR * 1.6, 0, Math.PI * 2);
      ctx.fillStyle = eg;
      ctx.fill();

      // Earth body
      ctx.beginPath();
      ctx.arc(cx, cy, earthR, 0, Math.PI * 2);
      ctx.fillStyle = "#0c152a";
      ctx.fill();
      ctx.shadowColor = "rgba(0, 212, 255, 0.4)";
      ctx.shadowBlur = 10;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(0, 212, 255, 0.5)";
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Equatorial ring
      ctx.beginPath();
      ctx.ellipse(cx, cy, earthR, earthR * 0.32, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 212, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Orbital planes & satellites
      const orbits = Array.from({ length: PLANES }, (_, i) => ({
        rot: -Math.PI * 0.4 + (i * Math.PI * 0.8) / (PLANES - 1),
        rx: orbitRx,
        ry: orbitRy,
      }));

      orbits.forEach((o) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(o.rot);

        // Orbit path
        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Satellites with glow
        for (let i = 0; i < SATS_PER_PLANE; i++) {
          const theta = (i * (Math.PI * 2)) / SATS_PER_PLANE + angleOffset;
          const sx = Math.cos(theta) * o.rx;
          const sy = Math.sin(theta) * o.ry;

          ctx.shadowColor = "rgba(0, 212, 255, 0.7)";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(sx, sy, 2 * scale, 0, Math.PI * 2);
          ctx.fillStyle = "#00d4ff";
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.restore();
      });

      // Pulsing satellite count label
      labelPulse += 0.03;
      const labelAlpha = 0.55 + Math.sin(labelPulse) * 0.25;
      ctx.font = `bold ${Math.round(11 * scale)}px 'Inter', monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = `rgba(0, 212, 255, ${labelAlpha})`;
      ctx.fillText(`${PLANES * SATS_PER_PLANE} SATELLITES`, cx, cy + earthR * 2.4);
      ctx.font = `${Math.round(9 * scale)}px 'Inter', monospace`;
      ctx.fillStyle = `rgba(139, 154, 176, ${labelAlpha * 0.7})`;
      ctx.fillText("MEGACONSTELLATION SHELL", cx, cy + earthR * 2.9);

      angleOffset += 0.005;
      animationId = requestAnimationFrame(draw);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} />;
}

function TimelineVisual({ type }: { type: string }) {
  return (
    <div className={`timelineVisual timelineVisual--${type}`}>
      <div className="timelineVisual__inner">
        {type === "orbit" && <SputnikVisual />}
        {type === "document" && <DocumentVisual />}
        {type === "warning" && <WarningVisual />}
        {type === "scatter" && <ScatterVisual />}
        {type === "impact" && <ImpactVisual />}
        {type === "constellation" && <ConstellationVisual />}
      </div>
    </div>
  );
}

function getInitialLiveCount(): number {
  try {
    const raw = localStorage.getItem("spaceTrackSatcatCacheV1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.data && typeof parsed.data.totalTracked === "number") {
        return parsed.data.totalTracked;
      }
    }
  } catch { }
  return 27000;
}

// MAGNETIC BUTTON AUDIT: "Explore The Physics" button uses magnetic effect
export default function CrisisPage() {
  useDocumentMetadata(
    "The Crisis | Space Debris History & Orbital Risks",
    "Follow the growth of space junk from Sputnik to today, compare debris size classes, and see how treaty gaps shaped modern orbital risk."
  );

  const chartRef = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const physicsButtonRef = useRef<HTMLAnchorElement>(null);
  const [chartVisible, setChartVisible] = useState(false);
  const [liveCount, setLiveCount] = useState<number>(getInitialLiveCount);

  useMagneticButton(physicsButtonRef);
  useCardSpotlight(timelineRef);

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const response = await fetchLiveOrbitalEnvironment();
        if (!isCancelled) {
          setLiveCount(response.data.totalTracked);
        }
      } catch { }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setChartVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.35 },
    );

    observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".timelineEvent");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.2 },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const chartData = useMemo(
    () => ({
      labels: debrisGrowthData.map((point) => String(point.year)),
      datasets: [
        {
          label: "Trackable objects",
          data: debrisGrowthData.map((point) => point.count),
          borderColor: "#00d4ff",
          backgroundColor: ((ctx: { chart: ChartJS<"line"> }) => {
            const chart = ctx.chart;
            const area = chart.chartArea;
            if (!area) return "rgba(0,212,255,0.15)";
            const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            gradient.addColorStop(0, "rgba(0,212,255,0.2)");
            gradient.addColorStop(1, "rgba(0,212,255,0)");
            return gradient;
          }) as any,
          fill: true,
          borderWidth: 3,
          tension: 0.25,
          pointRadius: 0,
        },
      ],
    } as any),
    [],
  );

  return (
    <section className="crisisPage">
      <StarfieldCanvas />

      <div className="container crisisHero">
        <h1>How We Got Here</h1>
        <p>
          The history of orbital negligence, from the first satellite to the edge of
          catastrophe.
        </p>
      </div>

      <div className="container crisisChart" ref={chartRef}>
        <h3>Trackable Objects in Earth Orbit</h3>
        {chartVisible ? (
          <Line
            data={chartData}
            plugins={[eventMarkerPlugin, glowLinePlugin]}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              animation: {
                duration: 1600,
                easing: "easeOutQuart",
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "rgba(13,17,23,0.95)",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderWidth: 1,
                  titleColor: "#fff",
                  bodyColor: "#8b9ab0",
                },
              },
              scales: {
                x: {
                  ticks: { color: "#8b9ab0" },
                  grid: { color: "rgba(255,255,255,0.08)" },
                },
                y: {
                  ticks: { color: "#8b9ab0" },
                  grid: { color: "rgba(255,255,255,0.08)" },
                },
              },
            }}
          />
        ) : (
          <div className="crisisChart__skeleton" />
        )}
        <div className="crisisChart__source">Source: ESA Space Environment Report 2025 (data through end of 2024); earlier years illustrative, based on published ESA/NASA ODPO historical trend data.</div>
      </div>

      <div className="container timeline" ref={timelineRef}>
        {crisisEvents.map((event, idx) => (
          <article
            className={`timelineEvent ${idx % 2 === 0 ? "" : "timelineEvent--flip"} ${event.tone === "amber" ? "timelineEvent--amber" : ""
              }`}
            key={event.year}
          >
            <div className="timelineEvent__text">
              <div className="card timelineEvent__content">
                <span className="badge badge--blue timelineEvent__yearPill">{event.year}</span>
                <h3>{event.title}</h3>
                <p>{event.context}</p>
                <div className="timelineEvent__significance">
                  <span>SIGNIFICANCE</span> {event.significance}
                </div>
              </div>
              <div className="timelineEvent__watermark">{event.year}</div>
            </div>
            <div className="timelineEvent__visual">
              <TimelineVisual type={event.visualType} />
            </div>
          </article>
        ))}

        <article className="timelineEvent timelineEvent--today is-visible">
          <div className="timelineEvent__text">
            <div className="card timelineEvent__content">
              <span className="badge badge--red timelineEvent__yearPill">Today</span>
              <h3>The Tipping Point</h3>
            <p>
              <strong style={{ color: "#00d4ff" }}>{liveCount.toLocaleString()}</strong> tracked objects across all orbital regimes — and growing. In LEO alone, 4,772 new objects were added in 2025, 91% of them active megaconstellation payloads. Millions of additional fragments remain too small to track but large enough to destroy a satellite. Active debris removal technology exists but faces legal paralysis under the 1967 Treaty. The window to act may be closing.
            </p>
            <p>
              See the conjunctions being tracked right now on the{" "}
              <Link to="/collision-watch" style={{ color: "var(--accent-blue)", textDecoration: "underline" }}>
                Collision Watch page →
              </Link>
            </p>
            <h2 className="timelineEvent__question">
              Can international policy evolve faster than the debris is multiplying?
            </h2>
            </div>
            <div className="timelineEvent__watermark">TODAY</div>
          </div>
        </article>
      </div>

      <div className="container crisisCTA">
        <h3>What Comes Next</h3>
        <p>The science is clear. The governance gap is not. Explore the next two fronts.</p>
        <div className="crisisCTA__actions">
          <Link ref={physicsButtonRef} className="btn btn--primary" to="/physics">
            Explore The Physics
          </Link>
          <Link className="btn btn--secondary" to="/policy">
            Read Policy Pathways
          </Link>
        </div>
      </div>
    </section>
  );
}

