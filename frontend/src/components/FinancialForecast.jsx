import { useState, useMemo } from "react";
import Icon from "./Icon.jsx";

function makeScenarios(baseGrowth, gm, ebitda, ebit, net, ocf) {
  return {
    conservative: { growth: Math.max(0, baseGrowth - 5), margins: { grossMargin: Math.max(0, gm - 5), ebitdaMargin: Math.max(0, ebitda - 4), ebitMargin: Math.max(0, ebit - 4), netMargin: Math.max(0, net - 3), ocfMargin: Math.max(0, ocf - 3) } },
    normal: { growth: baseGrowth, margins: { grossMargin: gm, ebitdaMargin: ebitda, ebitMargin: ebit, netMargin: net, ocfMargin: ocf } },
    optimistic: { growth: baseGrowth + 5, margins: { grossMargin: gm + 5, ebitdaMargin: ebitda + 4, ebitMargin: ebit + 4, netMargin: net + 3, ocfMargin: ocf + 3 } },
  };
}

export const SECTORS = {
  general: { label: "General", maxGrowthCap: 40, minGrowthFloor: -20, note: "No sector-specific driver emphasis yet — uses general caps.", templateScenarios: makeScenarios(10, 50, 20, 15, 10, 15) },
  software: { label: "Software / IT Services", maxGrowthCap: 45, minGrowthFloor: -15, note: "Watch for growth slowing sharply after maturity — recurring revenue can mask deceleration.", templateScenarios: makeScenarios(15, 75, 25, 20, 15, 25) },
  retail: { label: "Retail / Consumer", maxGrowthCap: 30, minGrowthFloor: -25, note: "Thin margins and inventory risk — margin assumptions deserve extra scrutiny here.", templateScenarios: makeScenarios(5, 35, 10, 7, 4, 8) },
  industrials: { label: "Industrials", maxGrowthCap: 25, minGrowthFloor: -30, note: "Cyclical — backlog and capacity utilization swing growth more than secular demand.", templateScenarios: makeScenarios(6, 40, 15, 10, 7, 12) },
  healthcare: { label: "Healthcare / Pharma", maxGrowthCap: 35, minGrowthFloor: -20, note: "Patent expiry and pipeline risk can cause step-changes rule-based trend won't catch.", templateScenarios: makeScenarios(8, 65, 25, 20, 15, 20) },
  semiconductors: { label: "Semiconductors", maxGrowthCap: 50, minGrowthFloor: -35, note: "Very cyclical — ASP and inventory cycles can swing growth wildly year to year.", templateScenarios: makeScenarios(12, 55, 30, 25, 20, 25) },
  energy: { label: "Energy / Materials", maxGrowthCap: 40, minGrowthFloor: -40, note: "Commodity-price dependent — revenue growth here is largely price, not volume.", templateScenarios: makeScenarios(4, 30, 20, 15, 10, 15) },
  telecom: { label: "Telecom", maxGrowthCap: 20, minGrowthFloor: -15, note: "High CapEx and leverage — check debt trend alongside growth.", templateScenarios: makeScenarios(3, 50, 35, 20, 10, 30) },
};

function cagr(first, last, years) {
  if (first <= 0 || last <= 0 || years <= 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

function yoyGrowthRates(years, key) {
  const rates = [];
  for (let i = 1; i < years.length; i++) {
    const prev = years[i - 1][key];
    const curr = years[i][key];
    if (prev > 0) rates.push(((curr - prev) / prev) * 100);
  }
  return rates;
}

function weightedRevenueGrowth(years) {
  const n = years.length;
  const rev = years.map((y) => y.revenue);
  const last = rev[n - 1];

  const cagr3 = n >= 4 ? cagr(rev[n - 4], last, 3) : null;
  const cagr5 = n >= 6 ? cagr(rev[n - 6], last, 5) : null;
  const cagr10 = n >= 11 ? cagr(rev[0], last, n - 1) : n >= 2 ? cagr(rev[0], last, n - 1) : null;

  const yoy = yoyGrowthRates(years, "revenue");
  const recentTrend = yoy.length >= 2 ? yoy[yoy.length - 1] - yoy[0] + (yoy[yoy.length - 1]) : yoy[0] || 0;

  const parts = [];
  if (cagr3 !== null) parts.push({ w: 0.45, v: cagr3 });
  if (cagr5 !== null) parts.push({ w: 0.30, v: cagr5 });
  if (cagr10 !== null) parts.push({ w: 0.15, v: cagr10 });
  parts.push({ w: 0.10, v: recentTrend });

  const totalW = parts.reduce((a, p) => a + p.w, 0);
  const weighted = parts.reduce((a, p) => a + p.w * p.v, 0) / (totalW || 1);

  return { weighted, cagr3, cagr5, cagr10, recentTrend };
}

function marginOf(row, numKey) {
  return row.revenue ? (row[numKey] / row.revenue) * 100 : 0;
}

function latestMargins(years) {
  const last = years[years.length - 1];
  return {
    grossMargin: marginOf(last, "grossProfit"),
    ebitdaMargin: marginOf(last, "ebitda"),
    ebitMargin: marginOf(last, "ebit"),
    netMargin: marginOf(last, "netIncome"),
    ocfMargin: marginOf(last, "operatingCashFlow"),
  };
}

function fadeGrowth(g1, terminalLike, fadeFactor, yearIndex) {
  // yearIndex is 1-based (year 1, year 2, ...)
  return terminalLike + (g1 - terminalLike) * Math.pow(1 - fadeFactor, yearIndex - 1);
}

export function buildScenarioForecast({ years, scenario, forecastYears, fadeFactor, terminalGrowth }) {
  const last = years[years.length - 1];
  const { growth, margins } = scenario;

  const rows = [];
  let runningRevenue = last.revenue;
  for (let i = 1; i <= forecastYears; i++) {
    const g = fadeGrowth(growth, terminalGrowth, fadeFactor, i);
    runningRevenue = runningRevenue * (1 + g / 100);
    rows.push({
      year: i,
      growthUsed: g,
      revenue: runningRevenue,
      grossProfit: runningRevenue * (margins.grossMargin / 100),
      ebitda: runningRevenue * (margins.ebitdaMargin / 100),
      ebit: runningRevenue * (margins.ebitMargin / 100),
      netIncome: runningRevenue * (margins.netMargin / 100),
      operatingCashFlow: runningRevenue * (margins.ocfMargin / 100),
    });
  }
  return rows;
}

const METRIC_ROWS = [
  { key: "revenue", label: "Revenue" },
  { key: "grossProfit", label: "Gross Profit" },
  { key: "ebitda", label: "EBITDA" },
  { key: "ebit", label: "EBIT" },
  { key: "netIncome", label: "Net Income" },
  { key: "operatingCashFlow", label: "Operating Cash Flow" },
];

export default function FinancialForecast({ years, sector, onSectorChange, scenarios, onScenariosChange, forecastYears, onForecastYearsChange, fadeFactor, onFadeFactorChange, displayScenario, onDisplayScenarioChange }) {
  const sectorConfig = SECTORS[sector] || SECTORS.general;
  const weighted = useMemo(() => weightedRevenueGrowth(years), [years]);
  const currentMargins = useMemo(() => latestMargins(years), [years]);

  const terminalGrowthFloor = 3; // long-run fade target, distinct from DCF's GDP-capped terminal growth

  function updateScenario(key, field, value) {
    onScenariosChange({
      ...scenarios,
      [key]: { ...scenarios[key], [field]: value },
    });
  }
  function updateScenarioMargin(key, marginKey, value) {
    onScenariosChange({
      ...scenarios,
      [key]: { ...scenarios[key], margins: { ...scenarios[key].margins, [marginKey]: value } },
    });
  }

  const forecasts = useMemo(() => {
    const result = {};
    ["conservative", "normal", "optimistic"].forEach((key) => {
      const clipped = {
        ...scenarios[key],
        growth: Math.max(sectorConfig.minGrowthFloor, Math.min(sectorConfig.maxGrowthCap, scenarios[key].growth)),
      };
      result[key] = buildScenarioForecast({
        years,
        scenario: clipped,
        forecastYears,
        fadeFactor,
        terminalGrowth: terminalGrowthFloor,
      });
    });
    return result;
  }, [years, scenarios, forecastYears, fadeFactor, sectorConfig]);

  const activeForecast = forecasts[displayScenario];

  return (
    <div>
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon name="dcf" size={16} className="text-accent2" />
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Financial Forecast (3–5 Year, Rule-Based)
            </h3>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-slate-500 text-xs uppercase tracking-wide">Sector Template</span>
            <select
              value={sector}
              onChange={(e) => {
                const newSector = e.target.value;
                onSectorChange(newSector);
                if (SECTORS[newSector]?.templateScenarios) {
                  onScenariosChange(SECTORS[newSector].templateScenarios);
                }
              }}
              className="bg-black/30 border border-border rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              {Object.entries(SECTORS).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-slate-500 text-xs mb-3">
          Revenue growth is a weighted blend of 3Y/5Y/10Y CAGR plus recent trend, then faded toward a
          long-run rate over the forecast horizon. Margins are forecast directly (not derived from raw
          profit growth), so you can see whether improvement comes from growth, margin expansion, or both.
          Every number below is editable — this is Stage 1 (rule-based); pooled ML margin/growth
          suggestions are a later addition, not a replacement for this logic.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20 mb-4">
          <Icon name="check" size={14} className="text-accent2 shrink-0" />
          <p className="text-accent2 text-xs">{sectorConfig.note}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">3Y Revenue CAGR</p>
            <p className="stat-value text-lg text-slate-200">{weighted.cagr3 !== null ? `${weighted.cagr3.toFixed(1)}%` : "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">5Y Revenue CAGR</p>
            <p className="stat-value text-lg text-slate-200">{weighted.cagr5 !== null ? `${weighted.cagr5.toFixed(1)}%` : "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">10Y Revenue CAGR</p>
            <p className="stat-value text-lg text-slate-200">{weighted.cagr10 !== null ? `${weighted.cagr10.toFixed(1)}%` : "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wide mb-1">Weighted Suggested Growth</p>
            <p className="stat-value text-lg text-accent2">{weighted.weighted.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-1 uppercase tracking-wide">Scenario Assumptions</h3>
        <p className="text-slate-500 text-xs mb-4">
          "Normal" growth is pre-filled from the weighted CAGR above. Latest actual margins:
          Gross {currentMargins.grossMargin.toFixed(1)}% · EBITDA {currentMargins.ebitdaMargin.toFixed(1)}% ·
          EBIT {currentMargins.ebitMargin.toFixed(1)}% · Net {currentMargins.netMargin.toFixed(1)}% ·
          OCF {currentMargins.ocfMargin.toFixed(1)}%.
        </p>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-border/60">
                <th className="px-2 py-2 font-medium sticky left-0 bg-surface">Assumption</th>
                <th className="px-2 py-2 font-medium text-center">Conservative</th>
                <th className="px-2 py-2 font-medium text-center">Normal</th>
                <th className="px-2 py-2 font-medium text-center">Optimistic</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30">
                <td className="px-2 py-2 text-slate-400 text-xs sticky left-0 bg-base">Revenue Growth (%)</td>
                {["conservative", "normal", "optimistic"].map((key) => (
                  <td key={key} className="px-2 py-1.5">
                    <input
                      type="number"
                      step="0.5"
                      value={scenarios[key].growth}
                      onChange={(e) => updateScenario(key, "growth", parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/30 border border-border rounded px-1.5 py-1 text-slate-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-accent/50"
                    />
                  </td>
                ))}
              </tr>
              {[
                { key: "grossMargin", label: "Gross Margin (%)" },
                { key: "ebitdaMargin", label: "EBITDA Margin (%)" },
                { key: "ebitMargin", label: "EBIT Margin (%)" },
                { key: "netMargin", label: "Net Margin (%)" },
                { key: "ocfMargin", label: "OCF Margin (%)" },
              ].map((m) => (
                <tr key={m.key} className="border-b border-border/30">
                  <td className="px-2 py-2 text-slate-400 text-xs sticky left-0 bg-base">{m.label}</td>
                  {["conservative", "normal", "optimistic"].map((key) => (
                    <td key={key} className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.5"
                        value={scenarios[key].margins[m.key]}
                        onChange={(e) => updateScenarioMargin(key, m.key, parseFloat(e.target.value) || 0)}
                        className="w-full bg-black/30 border border-border rounded px-1.5 py-1 text-slate-200 text-xs text-center focus:outline-none focus:ring-1 focus:ring-accent/50"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-border/60">
          <label className="flex flex-col gap-1.5">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Forecast Horizon</span>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                max="5"
                value={forecastYears}
                onChange={(e) => onForecastYearsChange(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">years</span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Growth Fade Factor</span>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={fadeFactor}
                onChange={(e) => onFadeFactorChange(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
                className="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wide">Table Shows</span>
            <select
              value={displayScenario}
              onChange={(e) => onDisplayScenarioChange(e.target.value)}
              className="bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="conservative">Conservative</option>
              <option value="normal">Normal</option>
              <option value="optimistic">Optimistic</option>
            </select>
          </label>
        </div>
        <p className="text-slate-600 text-xs mt-3">
          Growth fades from each scenario's Year-1 rate toward a {terminalGrowthFloor}% long-run rate as
          the fade factor pulls it down — higher fade factor means faster convergence. This is separate
          from the DCF page's GDP-capped terminal growth, which governs the perpetuity beyond this horizon.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wide">
          {displayScenario.charAt(0).toUpperCase() + displayScenario.slice(1)} Scenario — Forecast Table
        </h3>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-border/60">
                <th className="px-2 py-2 font-medium sticky left-0 bg-surface">Metric ($M)</th>
                <th className="px-2 py-2 font-medium text-center">Latest Actual</th>
                {activeForecast.map((f) => (
                  <th key={f.year} className="px-2 py-2 font-medium text-center">Year +{f.year}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map((m) => (
                <tr key={m.key} className="border-b border-border/30">
                  <td className="px-2 py-2 text-slate-400 text-xs sticky left-0 bg-base whitespace-nowrap">{m.label}</td>
                  <td className="px-2 py-2 text-center text-slate-300 text-xs">
                    ${years[years.length - 1][m.key].toFixed(0)}
                  </td>
                  {activeForecast.map((f, i) => (
                    <td key={i} className="px-2 py-2 text-center text-accent2 font-semibold text-xs">
                      ${f[m.key].toFixed(0)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-accent/5">
                <td className="px-2 py-2.5 text-slate-200 text-xs font-semibold sticky left-0 bg-accent/5">
                  Revenue Growth Used (%)
                </td>
                <td className="px-2 py-2.5 text-center text-slate-500 text-xs">—</td>
                {activeForecast.map((f, i) => (
                  <td key={i} className="px-2 py-2.5 text-center text-slate-300 text-xs">
                    {f.growthUsed.toFixed(1)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
