import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  { year: 2023, count: 25000 },
  { year: 2024, count: 27000 },
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
      ctx.textAlign = "left";
      ctx.fillText(event.label, x + 6, chartArea.top + 16);
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

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Draw Earth grid
      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fillStyle = "#0c152b";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
      ctx.stroke();

      // Earth latitude line
      ctx.beginPath();
      ctx.ellipse(cx, cy, 40, 15, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 212, 255, 0.25)";
      ctx.stroke();

      // Earth longitude line
      ctx.beginPath();
      ctx.ellipse(cx, cy, 15, 40, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Orbit path
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(0, 212, 255, 0.2)";
      ctx.stroke();
      ctx.setLineDash([]);

      // Sputnik Position
      const sx = cx + Math.cos(angle) * 80;
      const sy = cy + Math.sin(angle) * 80;

      // Update beep waves
      if (Math.random() < 0.02) {
        beeps.push({ r: 5, opacity: 1 });
      }

      beeps = beeps.map((b) => ({ r: b.r + 1, opacity: b.opacity - 0.015 })).filter((b) => b.opacity > 0);

      // Draw beep waves
      beeps.forEach((b) => {
        ctx.beginPath();
        ctx.arc(sx, sy, b.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 212, 255, ${b.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Draw Sputnik
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0, 212, 255, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0; // reset

      // Antennas
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1;
      const antAngle = angle + Math.PI; // pointing backward
      const antLengths = [20, 24, 24, 20];
      const antSpreads = [-0.25, -0.1, 0.1, 0.25];
      for (let i = 0; i < 4; i++) {
        const theta = antAngle + antSpreads[i];
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + Math.cos(theta) * antLengths[i], sy + Math.sin(theta) * antLengths[i]);
        ctx.stroke();
      }

      angle += 0.01;
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

function DocumentVisual() {
  return (
    <div className="holographicDoc">
      <div className="holographicDoc__header">
        <span>TREATY_DOC // 1967_OST</span>
        <span>STATUS: ACTIVE</span>
      </div>
      <div className="holographicDoc__lines">
        <div className="holographicDoc__line" />
        <div className="holographicDoc__line" />
        <div className="holographicDoc__line holographicDoc__line--short" />
        <div className="holographicDoc__line" />
      </div>
      <div className="holographicDoc__highlight">
        <div className="holographicDoc__highlightTitle">ARTICLE VIII · SOVEREIGNTY</div>
        <div className="holographicDoc__highlightText">PERMANENT JURISDICTION</div>
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

    interface Satellite {
      orbit: number;
      angle: number;
      speed: number;
      color: string;
      id: number;
    }

    let satellites: Satellite[] = [];
    interface Debris {
      x: number;
      y: number;
      vx: number;
      vy: number;
      opacity: number;
    }
    let debris: Debris[] = [];

    const init = () => {
      satellites = [];
      debris = [];
      let idCounter = 0;
      const lanes = [54, 74, 94];
      lanes.forEach((lane) => {
        const count = Math.floor(lane / 12);
        for (let i = 0; i < count; i++) {
          satellites.push({
            orbit: lane,
            angle: (i * (Math.PI * 2)) / count,
            speed: 0.015 - (lane - 54) * 0.00005,
            color: "#00d4ff",
            id: idCounter++,
          });
        }
      });
    };

    init();

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Draw Earth
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fillStyle = "#0a1021";
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.stroke();

      // Orbits
      const lanes = [54, 74, 94];
      lanes.forEach((lane) => {
        ctx.beginPath();
        ctx.arc(cx, cy, lane, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
        ctx.stroke();
      });

      // Update and draw satellites
      satellites.forEach((s) => {
        s.angle += s.speed;
        const sx = cx + Math.cos(s.angle) * s.orbit;
        const sy = cy + Math.sin(s.angle) * s.orbit;

        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
      });

      // Run Cascade logic
      if (time === 100) {
        const target = satellites.find((s) => s.orbit === 74);
        if (target) {
          target.color = "#f5a623";
          const tx = cx + Math.cos(target.angle) * target.orbit;
          const ty = cy + Math.sin(target.angle) * target.orbit;

          for (let i = 0; i < 12; i++) {
            const theta = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            debris.push({
              x: tx,
              y: ty,
              vx: Math.cos(theta) * speed,
              vy: Math.sin(theta) * speed,
              opacity: 1,
            });
          }
        }
      }

      // Update and draw debris
      debris.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        d.opacity -= 0.002;

        ctx.beginPath();
        ctx.arc(d.x, d.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 166, 35, ${d.opacity})`;
        ctx.fill();

        satellites.forEach((s) => {
          if (s.color === "#00d4ff") {
            const sx = cx + Math.cos(s.angle) * s.orbit;
            const sy = cy + Math.sin(s.angle) * s.orbit;
            const dist = Math.hypot(d.x - sx, d.y - sy);
            if (dist < 5) {
              s.color = "#ff3b3b";
              for (let i = 0; i < 5; i++) {
                const theta = Math.random() * Math.PI * 2;
                const speed = 0.3 + Math.random() * 1.2;
                debris.push({
                  x: sx,
                  y: sy,
                  vx: Math.cos(theta) * speed,
                  vy: Math.sin(theta) * speed,
                  opacity: 1,
                });
              }
            }
          }
        });
      });

      debris = debris.filter((d) => d.opacity > 0);

      time += 1;
      if (time > 500) {
        time = 0;
        init();
      }

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

    let satAngle = 0;
    let missileY = 0;
    let state: "orbiting" | "launching" | "impacted" = "orbiting";
    let particles: Particle[] = [];
    let explosionRadius = 0;

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Draw Earth
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fillStyle = "#091024";
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 212, 255, 0.3)";
      ctx.stroke();

      // Orbit
      ctx.beginPath();
      ctx.arc(cx, cy, 75, 0, Math.PI * 2);
      ctx.setLineDash([2, 6]);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.stroke();
      ctx.setLineDash([]);

      const satX = cx + Math.cos(satAngle) * 75;
      const satY = cy + Math.sin(satAngle) * 75;

      if (state === "orbiting") {
        satAngle += 0.015;
        ctx.beginPath();
        ctx.arc(satX, satY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00d4ff";
        ctx.fill();

        if (time > 80) {
          state = "launching";
          missileY = cy + 32;
        }
      } else if (state === "launching") {
        satAngle += 0.015;
        ctx.beginPath();
        ctx.arc(satX, satY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00d4ff";
        ctx.fill();

        missileY -= 1.8;

        ctx.beginPath();
        ctx.moveTo(cx, cy + 32);
        ctx.lineTo(cx, missileY);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, missileY, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        const satDist = Math.hypot(cx - satX, missileY - satY);
        if (satDist < 6 || missileY <= cy - 75) {
          state = "impacted";
          explosionRadius = 5;
          for (let i = 0; i < 130; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2.5;
            particles.push({
              x: satX,
              y: satY,
              vx: Math.cos(angle) * speed + -Math.sin(satAngle) * 1.1,
              vy: Math.sin(angle) * speed + Math.cos(satAngle) * 1.1,
              size: 1 + Math.random() * 1.5,
              color: i % 3 === 0 ? "#f5a623" : i % 3 === 1 ? "#ff3b3b" : "#8b9ab0",
              decay: 0.001 + Math.random() * 0.003,
              alpha: 1,
            });
          }
        }
      } else if (state === "impacted") {
        if (explosionRadius < 35) {
          ctx.beginPath();
          ctx.arc(satX, satY, explosionRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 120, 0, ${(35 - explosionRadius) / 35})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(satX, satY, explosionRadius / 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${(35 - explosionRadius) / 35})`;
          ctx.fill();

          explosionRadius += 2.5;
        }

        particles.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.hypot(dx, dy);
          p.vx += (dx / dist) * 0.005;
          p.vy += (dy / dist) * 0.005;

          p.alpha -= p.decay;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
      }

      time += 1;
      if (time > 440) {
        time = 0;
        state = "orbiting";
        satAngle = Math.random() * Math.PI;
        particles = [];
      }

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

    let sat1 = { x: -20, y: -20 };
    let sat2 = { x: 300, y: 300 };
    let state: "approach" | "impact" | "shattered" = "approach";
    let fragments: Fragment[] = [];
    let flashOpacity = 0;
    let ringRadius = 0;

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      ctx.beginPath();
      ctx.moveTo(cx - 90, cy - 60);
      ctx.lineTo(cx + 90, cy + 60);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + 90, cy - 60);
      ctx.lineTo(cx - 90, cy + 60);
      ctx.stroke();

      if (state === "approach") {
        const progress = time / 100;

        sat1.x = cx - 90 + progress * 90;
        sat1.y = cy - 60 + progress * 60;

        sat2.x = cx + 90 - progress * 90;
        sat2.y = cy - 60 + progress * 60;

        ctx.beginPath();
        ctx.arc(sat1.x, sat1.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#00d4ff";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sat2.x, sat2.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#8b9ab0";
        ctx.fill();

        if (time >= 100) {
          state = "impact";
          flashOpacity = 1.0;
          ringRadius = 2;

          for (let i = 0; i < 140; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.4 + Math.random() * 3.2;
            fragments.push({
              x: cx,
              y: cy,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              size: 1 + Math.random() * 1.5,
              color: i % 2 === 0 ? "#00d4ff" : "#8b9ab0",
              alpha: 1.0,
              decay: 0.002 + Math.random() * 0.003,
            });
          }
        }
      } else if (state === "impact" || state === "shattered") {
        fragments.forEach((f) => {
          f.x += f.vx;
          f.y += f.vy;
          f.alpha -= f.decay;

          ctx.beginPath();
          ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
          ctx.fillStyle = f.color;
          ctx.globalAlpha = Math.max(0, f.alpha);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;

        if (ringRadius < 45) {
          ctx.beginPath();
          ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 255, 255, ${(45 - ringRadius) / 45})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ringRadius += 1.8;
        }

        if (flashOpacity > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, 50, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${flashOpacity})`);
          gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = gradient;
          ctx.fill();

          flashOpacity -= 0.05;
        } else {
          state = "shattered";
        }
      }

      time += 1;
      if (time > 360) {
        time = 0;
        state = "approach";
        fragments = [];
      }

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

function ConstellationVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let angleOffset = 0;

    const draw = () => {
      if (!canvas || !ctx) return;
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, 38, 0, Math.PI * 2);
      ctx.fillStyle = "#0c152a";
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0, 212, 255, 0.4)";
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy, 38, 12, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(0, 212, 255, 0.2)";
      ctx.stroke();

      const orbits = [
        { rot: -0.8, rx: 76, ry: 24 },
        { rot: -0.4, rx: 76, ry: 24 },
        { rot: 0, rx: 76, ry: 24 },
        { rot: 0.4, rx: 76, ry: 24 },
        { rot: 0.8, rx: 76, ry: 24 },
        { rot: 1.2, rx: 76, ry: 24 },
      ];

      orbits.forEach((o) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(o.rot);

        ctx.beginPath();
        ctx.ellipse(0, 0, o.rx, o.ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.stroke();

        const count = 10;
        for (let i = 0; i < count; i++) {
          const theta = (i * (Math.PI * 2)) / count + angleOffset;
          const sx = Math.cos(theta) * o.rx;
          const sy = Math.sin(theta) * o.ry;

          ctx.beginPath();
          ctx.arc(sx, sy, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#00d464";
          ctx.fill();
        }

        ctx.restore();
      });

      angleOffset += 0.004;
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

export default function CrisisPage() {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartVisible, setChartVisible] = useState(false);

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
        <h3>Trackable Objects in Low Earth Orbit (1957–2024)</h3>
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
        <div className="crisisChart__source">Source: ESA Annual Space Environment Report</div>
      </div>

      <div className="container timeline">
        {crisisEvents.map((event, idx) => (
          <article
            className={`timelineEvent ${idx % 2 === 0 ? "" : "timelineEvent--flip"} ${event.tone === "amber" ? "timelineEvent--amber" : ""
              }`}
            key={event.year}
          >
            <div className="timelineEvent__text">
              <div className="timelineEvent__watermark">{event.year}</div>
              <span className="badge badge--blue timelineEvent__yearPill">{event.year}</span>
              <h3>{event.title}</h3>
              <p>{event.context}</p>
              <div className="timelineEvent__significance">
                <span>SIGNIFICANCE</span> {event.significance}
              </div>
            </div>
            <div className="timelineEvent__visual">
              <TimelineVisual type={event.visualType} />
            </div>
          </article>
        ))}

        <article className="timelineEvent timelineEvent--today is-visible">
          <div className="timelineEvent__text">
            <div className="timelineEvent__watermark">TODAY</div>
            <span className="badge badge--red timelineEvent__yearPill">Today</span>
            <h3>The Tipping Point</h3>
            <p>
              27,000+ trackable objects. Millions of untrackable fragments. Three ISS
              collision avoidance maneuvers in 2023 alone. Active debris removal
              technology exists but faces legal paralysis under the 1967 Treaty. The
              window to act may be closing.
            </p>
            <h2 className="timelineEvent__question">
              Can international policy evolve faster than the debris is multiplying?
            </h2>
          </div>
        </article>
      </div>

      <div className="container crisisCTA">
        <h3>What Comes Next</h3>
        <p>The science is clear. The governance gap is not. Explore the next two fronts.</p>
        <div className="crisisCTA__actions">
          <Link className="btn btn--primary" to="/physics">
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

