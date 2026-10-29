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
  general: { label: "General Industrial / Mixed", maxGrowthCap: 40, minGrowthFloor: -20, note: "Standard cross-industry guardrails applied.", templateScenarios: makeScenarios(10, 50, 20, 15, 10, 15) },
  software: { label: "Software / Cloud / SaaS", maxGrowthCap: 45, minGrowthFloor: -15, note: "Recurring revenue dampens short-term swings but watch for deceleration.", templateScenarios: makeScenarios(15, 75, 25, 20, 15, 25) },
  retail: { label: "Retail & Consumer Discretionary", maxGrowthCap: 30, minGrowthFloor: -25, note: "Working capital turnover and inventory inventory cycles dominate.", templateScenarios: makeScenarios(5, 35, 10, 7, 4, 8) },
  industrials: { label: "Heavy Industrials & Capital Goods", maxGrowthCap: 25, minGrowthFloor: -30, note: "Backlog conversion and fixed-asset capacity drive margins.", templateScenarios: makeScenarios(6, 40, 15, 10, 7, 12) },
  healthcare: { label: "Healthcare & Pharmaceuticals", maxGrowthCap: 35, minGrowthFloor: -20, note: "Patent expiration curves and pipeline milestones dictate long-term ROIC.", templateScenarios: makeScenarios(8, 65, 25, 20, 15, 20) },
  semiconductors: { label: "Semiconductors & Equipment", maxGrowthCap: 50, minGrowthFloor: -35, note: "High cyclicality: silicon capex waves cause massive margin swings.", templateScenarios: makeScenarios(12, 55, 30, 25, 20, 25) },
  energy: { label: "Energy & Commodity Materials", maxGrowthCap: 40, minGrowthFloor: -40, note: "Topline is heavily tied to underlying benchmark pricing.", templateScenarios: makeScenarios(4, 30, 20, 15, 10, 15) },
  telecom: { label: "Telecom & Digital Infrastructure", maxGrowthCap: 20, minGrowthFloor: -15, note: "High network CapEx requires careful scrutiny of leverage.", templateScenarios: makeScenarios(3, 50, 35, 20, 10, 30) },
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
  { key: "ebit", label: "EBIT (Operating Income)" },
  { key: "netIncome", label: "Net Income" },
  { key: "operatingCashFlow", label: "Operating Cash Flow" },
];

export default function FinancialForecast({
  years,
  sector,
  onSectorChange,
  scenarios,
  onScenariosChange,
  forecastYears,
  onForecastYearsChange,
  fadeFactor,
  onFadeFactorChange,
  displayScenario,
  onDisplayScenarioChange,
}) {
  const sectorConfig = SECTORS[sector] || SECTORS.general;
  const weighted = useMemo(() => weightedRevenueGrowth(years), [years]);
  const currentMargins = useMemo(() => latestMargins(years), [years]);
  const terminalGrowthFloor = 3;

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
    <div className="space-y-8">
      {/* Weighted CAGR Overview Card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/5">
          <div>
            <span className="section-index text-[10px] mb-1 block">[ 02 // FORWARD PROJECTIONS ]</span>
            <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
              MULTI-HORIZON REVENUE WEIGHTING
            </h3>
          </div>
          <div className="flex flex-col gap-1">
            <span className="section-index text-[10px]">SECTOR MATRIX TEMPLATE</span>
            <select
              value={sector}
              onChange={(e) => {
                const newSector = e.target.value;
                onSectorChange(newSector);
                if (SECTORS[newSector]?.templateScenarios) {
                  onScenariosChange(SECTORS[newSector].templateScenarios);
                }
              }}
              className="bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-white cursor-pointer"
            >
              {Object.entries(SECTORS).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-neutral-400 font-sans text-xs mb-4 leading-relaxed max-w-3xl">
          Blends 3Y (45%), 5Y (30%), 10Y (15%) CAGRs plus recent momentum (10%) to estimate base revenue expansion before asymptotic growth decay.
        </p>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 mb-6">
          <Icon name="check" size={14} className="text-white shrink-0" />
          <p className="font-mono text-xs text-neutral-300">{sectorConfig.note}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">3Y Revenue CAGR</p>
            <p className="font-syne font-bold text-xl text-white">
              {weighted.cagr3 !== null ? `${weighted.cagr3.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">5Y Revenue CAGR</p>
            <p className="font-syne font-bold text-xl text-white">
              {weighted.cagr5 !== null ? `${weighted.cagr5.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 mb-1">10Y Revenue CAGR</p>
            <p className="font-syne font-bold text-xl text-white">
              {weighted.cagr10 !== null ? `${weighted.cagr10.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/15">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white mb-1">Weighted Target</p>
            <p className="font-syne font-bold text-xl text-white">{weighted.weighted.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Scenario Assumptions Matrix */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2 pb-3 border-b border-white/5">
          <div>
            <span className="section-index text-[10px] mb-1 block">[ 02.1 // SCENARIO MARGIN MATRIX ]</span>
            <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
              PROJECTION MARGIN ASSUMPTIONS
            </h3>
          </div>
        </div>
        <p className="text-neutral-400 font-sans text-xs mb-5 leading-relaxed">
          Latest historical reporting margins: Gross {currentMargins.grossMargin.toFixed(1)}% · EBITDA {currentMargins.ebitdaMargin.toFixed(1)}% · EBIT {currentMargins.ebitMargin.toFixed(1)}% · Net {currentMargins.netMargin.toFixed(1)}% · OCF {currentMargins.ocfMargin.toFixed(1)}%.
        </p>

        <div className="overflow-x-auto -mx-2 mb-6">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-neutral-400 sticky left-0 bg-[#111111] z-10">
                  VARIABLE
                </th>
                <th className="px-2 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  CONSERVATIVE
                </th>
                <th className="px-2 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  NORMAL BASELINE
                </th>
                <th className="px-2 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  OPTIMISTIC
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/5">
                <td className="px-3 py-2 font-mono text-neutral-400 sticky left-0 bg-[#111111] z-10">
                  Revenue Growth (%)
                </td>
                {["conservative", "normal", "optimistic"].map((key) => (
                  <td key={key} className="px-2 py-1.5 text-center">
                    <input
                      type="number"
                      step="0.5"
                      value={scenarios[key].growth}
                      onChange={(e) => updateScenario(key, "growth", parseFloat(e.target.value) || 0)}
                      className="w-24 bg-neutral-900 border border-white/10 rounded-full px-2 py-1 text-white font-mono text-xs text-center focus:outline-none focus:border-white"
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
                <tr key={m.key} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2 font-mono text-neutral-400 sticky left-0 bg-[#111111] z-10">
                    {m.label}
                  </td>
                  {["conservative", "normal", "optimistic"].map((key) => (
                    <td key={key} className="px-2 py-1.5 text-center">
                      <input
                        type="number"
                        step="0.5"
                        value={scenarios[key].margins[m.key]}
                        onChange={(e) => updateScenarioMargin(key, m.key, parseFloat(e.target.value) || 0)}
                        className="w-24 bg-neutral-900 border border-white/10 rounded-full px-2 py-1 text-white font-mono text-xs text-center focus:outline-none focus:border-white"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-white/10">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">FORECAST HORIZON</span>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                max="5"
                value={forecastYears}
                onChange={(e) => onForecastYearsChange(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                className="w-full bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-white font-mono text-xs focus:outline-none focus:border-white"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-neutral-400 text-xs pointer-events-none">YEARS</span>
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">GROWTH FADE FACTOR</span>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={fadeFactor}
              onChange={(e) => onFadeFactorChange(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
              className="w-full bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-white font-mono text-xs focus:outline-none focus:border-white"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">ACTIVE SCENARIO VIEW</span>
            <select
              value={displayScenario}
              onChange={(e) => onDisplayScenarioChange(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-full px-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-white cursor-pointer"
            >
              <option value="conservative">CONSERVATIVE CASE</option>
              <option value="normal">NORMAL BASELINE</option>
              <option value="optimistic">OPTIMISTIC CASE</option>
            </select>
          </label>
        </div>
      </div>

      {/* Projection Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <div>
            <span className="section-index text-[10px] mb-1 block">[ 02.2 // PRO FORMA OUTPUT ]</span>
            <h3 className="font-syne font-bold text-lg text-white uppercase tracking-tight">
              {displayScenario.toUpperCase()} CASE — FORWARD STATEMENTS ($M)
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-neutral-400 sticky left-0 bg-[#111111] z-10">
                  STATEMENT METRIC ($M)
                </th>
                <th className="px-2 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                  LATEST ACTUAL
                </th>
                {activeForecast.map((f) => (
                  <th key={f.year} className="px-2 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-white">
                    YEAR +{f.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map((m) => (
                <tr key={m.key} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2 font-mono text-neutral-400 sticky left-0 bg-[#111111] z-10 whitespace-nowrap">
                    {m.label}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-neutral-300">
                    ${years[years.length - 1][m.key].toFixed(0)}
                  </td>
                  {activeForecast.map((f, i) => (
                    <td key={i} className="px-2 py-2 text-center font-mono font-bold text-white">
                      ${f[m.key].toFixed(0)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-white/[0.03] border-t border-white/10">
                <td className="px-3 py-2.5 font-mono font-bold text-white uppercase sticky left-0 bg-[#161616] z-10">
                  REVENUE FADE VELOCITY (%)
                </td>
                <td className="px-2 py-2.5 text-center font-mono text-neutral-500">—</td>
                {activeForecast.map((f, i) => (
                  <td key={i} className="px-2 py-2.5 text-center font-mono font-bold text-neutral-300">
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
