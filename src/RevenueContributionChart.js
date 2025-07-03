import React, { useState } from "react";
import chroma from "chroma-js";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Generate week labels and data
function getWeekLabels() {
  const start = new Date(2023, 9, 1); // Oct 1, 2023
  const end = new Date(2025, 5, 21); // Jun 21, 2025 (approx W3)
  const weeks = [];
  let current = new Date(start);
  let weekNum = 1;
  let lastMonth = current.getMonth();
  let lastYear = current.getFullYear();

  while (current <= end) {
    const month = current.toLocaleString('default', { month: 'short' });
    const year = current.getFullYear();
    if (current.getMonth() !== lastMonth || year !== lastYear) {
      weekNum = 1;
    }
    weeks.push(`${month} ${year} W${weekNum}`);
    // Advance by 7 days
    current.setDate(current.getDate() + 7);
    weekNum++;
    lastMonth = current.getMonth();
    lastYear = current.getFullYear();
    if (weekNum > 5) weekNum = 1; // Max 5 weeks per month
  }
  return weeks;
}
const weekLabels = getWeekLabels();
const weekCohorts = weekLabels;
const weekData = weekLabels.map((week, i) => {
  const entry = { week };
  weekCohorts.forEach((cohort, j) => {
    if (j <= i) {
      const base = 200 * Math.exp(-(i - j) / (8 + Math.random() * 6));
      const noise = 40 * (Math.random() - 0.5);
      const spike = Math.random() < 0.03 ? 100 + 100 * Math.random() : 0;
      const dip = Math.random() < 0.02 ? -80 * Math.random() : 0;
      entry[cohort] = Math.max(0, Math.round(base + noise + spike + dip));
    } else {
      entry[cohort] = 0;
    }
  });
  return entry;
});

// Generate month labels and data
function getMonthLabels() {
  const start = new Date(2023, 9, 1); // Oct 2023
  const end = new Date(2025, 5, 1);   // Jun 2025
  const months = [];
  let current = new Date(start);
  while (current <= end) {
    const month = current.toLocaleString('default', { month: 'short' });
    const year = current.getFullYear();
    months.push(`${month} ${year}`);
    current.setMonth(current.getMonth() + 1);
  }
  return months;
}
const monthLabels = getMonthLabels();
const monthCohorts = monthLabels;
const monthData = monthLabels.map((month, i) => {
  const entry = { month };
  monthCohorts.forEach((cohort, j) => {
    if (j <= i) {
      const base = 800 * Math.exp(-(i - j) / (3 + Math.random() * 2));
      const noise = 120 * (Math.random() - 0.5);
      const spike = Math.random() < 0.1 ? 200 + 200 * Math.random() : 0;
      const dip = Math.random() < 0.05 ? -160 * Math.random() : 0;
      entry[cohort] = Math.max(0, Math.round(base + noise + spike + dip));
    } else {
      entry[cohort] = 0;
    }
  });
  return entry;
});

const BREWER_PALETTES = Object.keys(chroma.brewer);

const COLOR_STRATEGIES = [
  {
    label: "2-Stop Gradient",
    value: "2stop",
    getColors: (num, start, end) => chroma.scale([start, end]).mode('lch').colors(num),
  },
  {
    label: "3-Stop Gradient",
    value: "3stop",
    getColors: (num, start, end, mid) => chroma.scale([start, mid, end]).mode('lch').colors(num),
  },
  // Add all chroma.brewer palettes
  ...BREWER_PALETTES.map(palette => ({
    label: `ColorBrewer ${palette}`,
    value: palette.toLowerCase(),
    getColors: (num) => chroma.scale(chroma.brewer[palette]).colors(num),
  })),
];

export default function RevenueContributionChart() {
  const [startColor, setStartColor] = useState("#00C49F");
  const [endColor, setEndColor] = useState("#FF4444");
  const [midColor, setMidColor] = useState("#0088FE");
  const [pendingStartColor, setPendingStartColor] = useState(startColor);
  const [pendingEndColor, setPendingEndColor] = useState(endColor);
  const [pendingMidColor, setPendingMidColor] = useState(midColor);
  const [colorStrategy, setColorStrategy] = useState("3stop");
  const [view, setView] = useState("weekly");
  const [chartType, setChartType] = useState("linear");
  const [showOutline, setShowOutline] = useState(true);

  // Pick data and cohorts based on view
  const isWeekly = view === "weekly";
  const data = isWeekly ? weekData : monthData;
  const cohorts = isWeekly ? weekCohorts : monthCohorts;
  const xKey = isWeekly ? "week" : "month";

  // Pick color strategy
  const strategy = COLOR_STRATEGIES.find(s => s.value === colorStrategy);
  const COLORS = strategy.value === "3stop"
    ? strategy.getColors(cohorts.length, startColor, endColor, midColor)
    : strategy.getColors(cohorts.length, startColor, endColor);

  return (
    <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}>
      <h2 style={{ fontFamily: 'inherit' }}>Revenue Contribution</h2>
      {/* Segmented control */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setView("weekly")}
          style={{
            padding: "6px 18px",
            borderRadius: "6px 0 0 6px",
            border: "1px solid #ccc",
            background: isWeekly ? "#0088FE" : "#f5f5f5",
            color: isWeekly ? "#fff" : "#222",
            fontWeight: isWeekly ? 600 : 400,
            cursor: "pointer"
          }}
        >
          Weekly
        </button>
        <button
          onClick={() => setView("monthly")}
          style={{
            padding: "6px 18px",
            borderRadius: "0 6px 6px 0",
            border: "1px solid #ccc",
            background: !isWeekly ? "#0088FE" : "#f5f5f5",
            color: !isWeekly ? "#fff" : "#222",
            fontWeight: !isWeekly ? 600 : 400,
            cursor: "pointer"
          }}
        >
          Monthly
        </button>
        {/* Chart type toggle */}
        <div style={{ marginLeft: 24, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'inherit', fontSize: 15 }}>Chart Type:</span>
          <button
            onClick={() => setChartType("linear")}
            style={{
              padding: "4px 12px",
              borderRadius: "6px 0 0 6px",
              border: "1px solid #ccc",
              background: chartType === "linear" ? "#0088FE" : "#f5f5f5",
              color: chartType === "linear" ? "#fff" : "#222",
              fontWeight: chartType === "linear" ? 600 : 400,
              cursor: "pointer"
            }}
          >
            Linear (Jagged)
          </button>
          <button
            onClick={() => setChartType("monotone")}
            style={{
              padding: "4px 12px",
              borderRadius: "0 6px 6px 0",
              border: "1px solid #ccc",
              background: chartType === "monotone" ? "#0088FE" : "#f5f5f5",
              color: chartType === "monotone" ? "#fff" : "#222",
              fontWeight: chartType === "monotone" ? 600 : 400,
              cursor: "pointer"
            }}
          >
            Monotone (Smooth)
          </button>
        </div>
        {/* Outline toggle */}
        <div style={{ marginLeft: 24, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontFamily: 'inherit', fontSize: 15 }}>Outline:</span>
          <button
            onClick={() => setShowOutline(true)}
            style={{
              padding: "4px 12px",
              borderRadius: "6px 0 0 6px",
              border: "1px solid #ccc",
              background: showOutline ? "#0088FE" : "#f5f5f5",
              color: showOutline ? "#fff" : "#222",
              fontWeight: showOutline ? 600 : 400,
              cursor: "pointer"
            }}
          >
            Outline
          </button>
          <button
            onClick={() => setShowOutline(false)}
            style={{
              padding: "4px 12px",
              borderRadius: "0 6px 6px 0",
              border: "1px solid #ccc",
              background: !showOutline ? "#0088FE" : "#f5f5f5",
              color: !showOutline ? "#fff" : "#222",
              fontWeight: !showOutline ? 600 : 400,
              cursor: "pointer"
            }}
          >
            No Outline
          </button>
        </div>
      </div>
      <div style={{ marginBottom: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <label style={{ fontFamily: 'inherit' }}>
          Start Color: {" "}
          <input
            type="color"
            value={pendingStartColor}
            onChange={e => setPendingStartColor(e.target.value)}
            style={{ marginRight: 8 }}
            disabled={colorStrategy === 'paired'}
          />
        </label>
        {colorStrategy === "3stop" && (
          <label style={{ fontFamily: 'inherit' }}>
            Mid Color: {" "}
            <input
              type="color"
              value={pendingMidColor}
              onChange={e => setPendingMidColor(e.target.value)}
              style={{ marginRight: 8 }}
            />
          </label>
        )}
        <label style={{ fontFamily: 'inherit' }}>
          End Color: {" "}
          <input
            type="color"
            value={pendingEndColor}
            onChange={e => setPendingEndColor(e.target.value)}
            disabled={colorStrategy === 'paired'}
          />
        </label>
        <button
          style={{
            marginLeft: 8,
            padding: "6px 16px",
            fontFamily: 'inherit',
            fontSize: 15,
            borderRadius: 6,
            border: "1px solid #ccc",
            background: "#f5f5f5",
            cursor: "pointer"
          }}
          onClick={() => {
            setStartColor(pendingStartColor);
            setEndColor(pendingEndColor);
            setMidColor(pendingMidColor);
          }}
          disabled={colorStrategy === 'paired'}
        >
          Apply Colors
        </button>
        <label style={{ fontFamily: 'inherit', marginLeft: 16 }}>
          Color Strategy: {" "}
          <select
            value={colorStrategy}
            onChange={e => setColorStrategy(e.target.value)}
            style={{ fontFamily: 'inherit', fontSize: 15, marginLeft: 4 }}
          >
            {COLOR_STRATEGIES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} minTickGap={20} tick={{ fontFamily: 'inherit' }} />
          <YAxis tick={{ fontFamily: 'inherit' }} />
          <Tooltip wrapperStyle={{ fontFamily: 'inherit' }} />
          {cohorts.map((key, idx) => (
            <Area
              key={key}
              type={chartType}
              dataKey={key}
              stackId="1"
              stroke={showOutline ? COLORS[idx] : "none"}
              fill={COLORS[idx]}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      {/* Custom Legend */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "16px 24px",
        marginTop: 24,
        maxWidth: 1000,
        fontFamily: 'inherit'
      }}>
        {cohorts.map((key, idx) => (
          <div key={key + idx} style={{ display: "flex", alignItems: "center", minWidth: 100, fontFamily: 'inherit' }}>
            <span style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: COLORS[idx],
              marginRight: 8
            }} />
            <span style={{ fontSize: 15, fontFamily: 'inherit' }}>{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 