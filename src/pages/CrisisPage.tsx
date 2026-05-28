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
      const x = xScale.getPixelForValue(String(event.year));
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
      "China's People's Liberation Army destroyed the defunct Fengyun-1C weather satellite with a direct-ascent anti-satellite missile. The single impact created 3,000+ trackable fragments and an estimated 150,000 untrackable pieces — the largest debris-generating event in history. The fragments spread across altitudes from 200km to 3,800km.",
    significance: "The most destructive deliberate act in orbital history.",
    visualType: "scatter",
  },
  {
    year: "2009",
    title: "The Zombie Strike",
    context:
      "On February 10, 2009, the active Iridium-33 communications satellite collided with the decommissioned Russian Cosmos-2251 at a closing speed of 11.7 km/s — roughly 26,000 mph. The collision was the first accidental hypervelocity impact between two intact satellites in history, generating over 2,000 trackable fragments. No one had been monitoring Cosmos-2251 because it was 'dead.'",
    significance: "The Kessler Syndrome stopped being theoretical.",
    visualType: "impact",
  },
  {
    year: "2022",
    title: "Too Little, Too Late?",
    context:
      "The FCC passed the 5-Year Rule, requiring US-licensed satellites to de-orbit within five years of mission end — replacing the previous 25-year standard. Progress, but only binding on US operators. Meanwhile, SpaceX's Starlink constellation was adding hundreds of satellites per year, and China was building its own megaconstellation.",
    significance: "The first enforceable rule. Still only covers one nation.",
    visualType: "warning",
    tone: "amber",
  },
];

function TimelineVisual({ type }: { type: string }) {
  return (
    <div className={`timelineVisual timelineVisual--${type}`}>
      <div className="timelineVisual__inner" />
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
          backgroundColor: (ctx: { chart: ChartJS<"line"> }) => {
            const chart = ctx.chart;
            const area = chart.chartArea;
            if (!area) return "rgba(0,212,255,0.15)";
            const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
            gradient.addColorStop(0, "rgba(0,212,255,0.2)");
            gradient.addColorStop(1, "rgba(0,212,255,0)");
            return gradient;
          },
          fill: true,
          borderWidth: 3,
          tension: 0.25,
          pointRadius: 0,
        },
      ],
    }),
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
            className={`timelineEvent ${idx % 2 === 0 ? "" : "timelineEvent--flip"} ${
              event.tone === "amber" ? "timelineEvent--amber" : ""
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

