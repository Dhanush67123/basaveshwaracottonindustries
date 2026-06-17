"use client";

import React, { useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw, Radio } from "lucide-react";
import { useLiveRates } from "./live-rates-provider";

interface SparklineProps {
  data: number[];
  color: string;
  gradientId: string;
}

const CustomSparkline: React.FC<SparklineProps> = ({ data, color, gradientId }) => {
  if (data.length === 0) return null;

  const width = 500;
  const height = 150;
  const padding = 15;

  const min = Math.min(...data) * 0.999;
  const max = Math.max(...data) * 1.001;
  const range = max - min || 1;

  const points = data.map((val, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const fillD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border)" strokeOpacity="0.2" strokeDasharray="4 4" />
      <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="var(--border)" strokeOpacity="0.2" strokeDasharray="4 4" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border)" strokeOpacity="0.2" strokeDasharray="4 4" />

      {/* Gradient area */}
      <path d={fillD} fill={`url(#${gradientId})`} />

      {/* Path line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dynamic Data Points */}
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <g key={i}>
            {isLast && (
              <>
                <circle cx={p.x} cy={p.y} r="8" fill={color} fillOpacity="0.2" className="animate-pulse" />
                <circle cx={p.x} cy={p.y} r="4" fill={color} />
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export const PriceChart: React.FC = () => {
  const {
    usCotton,
    usCottonChange,
    inCotton,
    inCottonChange,
    history,
    isSimulating,
    toggleSimulation,
    triggerManualRefresh,
  } = useLiveRates();

  const [activeTab, setActiveTab] = useState<"in" | "us">("in");
  const activeChange = activeTab === "in" ? inCottonChange : usCottonChange;
  const activeHistory = activeTab === "in" ? history.inCotton : history.usCotton;
  const activeColor = activeChange >= 0 ? "oklch(0.82 0.09 160)" : "oklch(0.72 0.11 85)"; // Luminous Green vs Gold

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border/60 rounded-2xl p-6 relative overflow-hidden shadow-2xl transition-all duration-300 hover:border-primary/30">
      {/* Dynamic light rays decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 z-10 relative">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 relative">
              {isSimulating && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSimulating ? "bg-emerald-500" : "bg-zinc-500"}`}></span>
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
              Live Commodity Ticker
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Global Cotton Indices</h2>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={triggerManualRefresh}
            className="p-2 rounded-xl bg-secondary/80 border border-border/80 text-foreground transition-all duration-200 hover:bg-secondary hover:border-muted-foreground/40 active:scale-95"
            title="Manual Tick Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={toggleSimulation}
            className={`px-3 py-1.5 rounded-xl border font-medium text-xs flex items-center gap-1.5 transition-all duration-200 ${
              isSimulating
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary/80 border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${isSimulating ? "animate-pulse" : ""}`} />
            {isSimulating ? "Streaming" : "Paused"}
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-secondary/40 rounded-xl mb-6 border border-border/30">
        <button
          onClick={() => setActiveTab("in")}
          className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex flex-col items-center gap-1 ${
            activeTab === "in"
              ? "bg-card text-foreground shadow-md border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">MCX SPOT (INDIA)</span>
          <span className="font-bold text-sm">₹{(inCotton).toLocaleString()} <span className="text-xs text-muted-foreground">/Quintal</span></span>
        </button>
        <button
          onClick={() => setActiveTab("us")}
          className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 flex flex-col items-center gap-1 ${
            activeTab === "us"
              ? "bg-card text-foreground shadow-md border border-border/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest">ICE FUTURES (US)</span>
          <span className="font-bold text-sm">{usCotton}¢ <span className="text-xs text-muted-foreground">/lb</span></span>
        </button>
      </div>

      {/* Main Graph Card */}
      <div className="bg-secondary/20 border border-border/40 rounded-xl p-4 mb-4">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-widest mb-1">
              Current Benchmark Price
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-tight">
                {activeTab === "in" ? `₹${inCotton.toLocaleString()}` : `${usCotton}¢`}
              </span>
              <span className="text-xs text-muted-foreground">
                {activeTab === "in" ? "per Quintal (100 kg)" : "per pound (lb)"}
              </span>
            </div>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              activeChange >= 0
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {activeChange >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {activeChange >= 0 ? "+" : ""}
            {activeChange}%
          </div>
        </div>

        {/* The SVG Sparkline */}
        <div className="h-[150px] w-full flex items-center justify-center relative">
          <CustomSparkline data={activeHistory} color={activeColor} gradientId={`grad-${activeTab}`} />
        </div>
      </div>

      {/* Info details */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div className="bg-secondary/15 border border-border/30 rounded-lg p-3">
          <span className="text-muted-foreground block mb-0.5 font-medium">Daily High</span>
          <span className="font-bold text-foreground">
            {activeTab === "in"
              ? `₹${Math.round(Math.max(...activeHistory)).toLocaleString()}`
              : `${Math.max(...activeHistory).toFixed(2)}¢`}
          </span>
        </div>
        <div className="bg-secondary/15 border border-border/30 rounded-lg p-3">
          <span className="text-muted-foreground block mb-0.5 font-medium">Daily Low</span>
          <span className="font-bold text-foreground">
            {activeTab === "in"
              ? `₹${Math.round(Math.min(...activeHistory)).toLocaleString()}`
              : `${Math.min(...activeHistory).toFixed(2)}¢`}
          </span>
        </div>
      </div>
    </div>
  );
};
