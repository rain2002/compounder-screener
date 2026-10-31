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
  software: { label: "Software & Cloud Services", maxGrowthCap: 45, minGrowthFloor: -15, note: "Recurring revenue dampens short-term swings but watch for growth deceleration.", templateScenarios: makeScenarios(15, 75, 25, 20, 15, 25) },
  retail: { label: "Retail & Consumer Goods", maxGrowthCap: 30, minGrowthFloor: -25, note: "Working capital turnover and inventory cycles dominate margin swings.", templateScenarios: makeScenarios(5, 35, 10, 7, 4, 8) },
  industrials: { label: "Industrials & Manufacturing", maxGrowthCap: 25, minGrowthFloor: -30, note: "Backlog conversion and fixed-asset capacity drive margins.", templateScenarios: makeScenarios(6, 40, 15, 10, 7, 12) },
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
    <div className="space-y-6">
      {/* Weighted CAGR Overview Card */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-white/[0.06]">
          <div>
            <h3 className="text-base font-semibold text-white">
              Multi-Horizon Revenue Weighting
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Blends 3Y (45%), 5Y (30%), 10Y (15%) CAGRs plus recent momentum (10%).
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-400">Sector Template</span>
            <select
              value={sector}
              onChange={(e) => {
                const newSector = e.target.value;
                onSectorChange(newSector);
                if (SECTORS[newSector]?.templateScenarios) {
                  onScenariosChange(SECTORS[newSector].templateScenarios);
                }
              }}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white/30 cursor-pointer"
            >
              {Object.entries(SECTORS).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-900/60 border border-white/[0.06] mb-5 text-xs text-zinc-300">
          <Icon name="check" size={14} className="text-emerald-400 shrink-0" />
          <span>{sectorConfig.note}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">3Y Revenue CAGR</p>
            <p className="text-lg font-semibold text-zinc-200 tabular-nums">
              {weighted.cagr3 !== null ? `${weighted.cagr3.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">5Y Revenue CAGR</p>
            <p className="text-lg font-semibold text-zinc-200 tabular-nums">
              {weighted.cagr5 !== null ? `${weighted.cagr5.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-950/40 border border-white/[0.06]">
            <p className="text-xs text-zinc-400 mb-1">10Y Revenue CAGR</p>
            <p className="text-lg font-semibold text-zinc-200 tabular-nums">
              {weighted.cagr10 !== null ? `${weighted.cagr10.toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10">
            <p className="text-xs text-zinc-200 font-medium mb-1">Weighted Target</p>
            <p className="text-lg font-bold text-emerald-400 tabular-nums">{weighted.weighted.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Scenario Assumptions Matrix */}
      <div className="card p-6">
        <div className="mb-4 pb-3 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white">
            Forward Margin Assumptions
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Latest reporting margins: Gross {currentMargins.grossMargin.toFixed(1)}% · EBITDA {currentMargins.ebitdaMargin.toFixed(1)}% · EBIT {currentMargins.ebitMargin.toFixed(1)}% · Net {currentMargins.netMargin.toFixed(1)}% · OCF {currentMargins.ocfMargin.toFixed(1)}%.
          </p>
        </div>

        <div className="overflow-x-auto -mx-2 mb-5">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400 bg-white/[0.02]">
                <th className="px-3 py-2 text-left font-medium sticky left-0 bg-[#111114] z-10">
                  Assumption
                </th>
                <th className="px-2 py-2 text-center font-medium text-zinc-300">Conservative</th>
                <th className="px-2 py-2 text-center font-medium text-zinc-300">Normal Baseline</th>
                <th className="px-2 py-2 text-center font-medium text-zinc-300">Optimistic</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/[0.04]">
                <td className="px-3 py-2 text-zinc-400 sticky left-0 bg-[#111114] z-10">
                  Revenue Growth (%)
                </td>
                {["conservative", "normal", "optimistic"].map((key) => (
                  <td key={key} className="px-2 py-1 text-center">
                    <input
                      type="number"
                      step="0.5"
                      value={scenarios[key].growth}
                      onChange={(e) => updateScenario(key, "growth", parseFloat(e.target.value) || 0)}
                      className="w-24 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-zinc-200 text-xs text-center focus:outline-none focus:border-white/30 tabular-nums"
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
                <tr key={m.key} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-3 py-2 text-zinc-400 sticky left-0 bg-[#111114] z-10">
                    {m.label}
                  </td>
                  {["conservative", "normal", "optimistic"].map((key) => (
                    <td key={key} className="px-2 py-1 text-center">
                      <input
                        type="number"
                        step="0.5"
                        value={scenarios[key].margins[m.key]}
                        onChange={(e) => updateScenarioMargin(key, m.key, parseFloat(e.target.value) || 0)}
                        className="w-24 bg-zinc-900 border border-white/10 rounded px-2 py-1 text-zinc-200 text-xs text-center focus:outline-none focus:border-white/30 tabular-nums"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Global Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">Forecast Horizon</span>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                max="5"
                value={forecastYears}
                onChange={(e) => onForecastYearsChange(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-white/30 tabular-nums"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs pointer-events-none">years</span>
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">Growth Fade Factor</span>
            <input
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={fadeFactor}
              onChange={(e) => onFadeFactorChange(Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)))}
              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-zinc-100 text-xs focus:outline-none focus:border-white/30 tabular-nums"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-zinc-400">Display Scenario</span>
            <select
              value={displayScenario}
              onChange={(e) => onDisplayScenarioChange(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-white/30 cursor-pointer"
            >
              <option value="conservative">Conservative Case</option>
              <option value="normal">Normal Baseline</option>
              <option value="optimistic">Optimistic Case</option>
            </select>
          </label>
        </div>
      </div>

      {/* Projection Table */}
      <div className="card p-6">
        <div className="mb-4 pb-3 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-white capitalize">
            {displayScenario} Scenario — Pro Forma Forecast ($M)
          </h3>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs min-w-[600px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400 bg-white/[0.02]">
                <th className="px-3 py-2 text-left font-medium sticky left-0 bg-[#111114] z-10">
                  Metric ($M)
                </th>
                <th className="px-2 py-2 text-center text-zinc-300">Latest Actual</th>
                {activeForecast.map((f) => (
                  <th key={f.year} className="px-2 py-2 text-center text-zinc-200 font-semibold">
                    Year +{f.year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ROWS.map((m) => (
                <tr key={m.key} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-3 py-2 text-zinc-400 sticky left-0 bg-[#111114] z-10 whitespace-nowrap">
                    {m.label}
                  </td>
                  <td className="px-2 py-2 text-center text-zinc-300 tabular-nums">
                    ${years[years.length - 1][m.key].toFixed(0)}
                  </td>
                  {activeForecast.map((f, i) => (
                    <td key={i} className="px-2 py-2 text-center font-medium text-zinc-100 tabular-nums">
                      ${f[m.key].toFixed(0)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-white/[0.03] border-t border-white/10 font-medium">
                <td className="px-3 py-2 text-zinc-200 sticky left-0 bg-[#151518] z-10">
                  Revenue Growth Used (%)
                </td>
                <td className="px-2 py-2 text-center text-zinc-500">—</td>
                {activeForecast.map((f, i) => (
                  <td key={i} className="px-2 py-2 text-center text-zinc-300 tabular-nums">
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
