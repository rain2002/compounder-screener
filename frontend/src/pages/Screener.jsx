import { useState, useMemo, useEffect } from "react";
import PageHeader from "../components/PageHeader.jsx";
import RatingBadge from "../components/RatingBadge.jsx";
import CriteriaChecklist from "../components/CriteriaChecklist.jsx";
import CriteriaEditor from "../components/CriteriaEditor.jsx";
import Icon from "../components/Icon.jsx";
import { SCREENER_MODES } from "../data/screenerCriteria.js";
import { SAMPLE_INDIA_STOCKS, SAMPLE_US_STOCKS } from "../data/sampleStocks.js";
import { evaluateIndiaLynch, evaluateIndiaBuffett, evaluateIndiaCombined, evaluateUsBuffettLynch } from "../utils/screenerLogic.js";

export default function Screener() {
  const [market, setMarket] = useState("india");
  const [mode, setMode] = useState("lynch");
  const [expandedTicker, setExpandedTicker] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [customCriteria, setCustomCriteria] = useState({});

  const modes = SCREENER_MODES[market];

  useEffect(() => {
    if (!modes.find((m) => m.key === mode)) {
      setMode(modes[0].key);
    }
  }, [market]);

  const defaultMode = modes.find((m) => m.key === mode) || modes[0];
  const criteriaKey = `${market}_${mode}`;
  const activeCriteria = customCriteria[criteriaKey] || defaultMode.criteria;

  function updateCriteria(newCriteria) {
    setCustomCriteria({ ...customCriteria, [criteriaKey]: newCriteria });
  }

  function resetCriteria() {
    const next = { ...customCriteria };
    delete next[criteriaKey];
    setCustomCriteria(next);
  }

  const stocks = market === "india" ? SAMPLE_INDIA_STOCKS : SAMPLE_US_STOCKS;
  const currencySymbol = market === "india" ? "₹" : "$";
  const capUnit = market === "india" ? "Cr" : "M";

  const results = useMemo(() => {
    return stocks.map((stock) => {
      let evaluation;
      if (market === "india") {
        if (mode === "lynch") evaluation = evaluateIndiaLynch(stock, activeCriteria);
        else if (mode === "buffett") evaluation = evaluateIndiaBuffett(stock, activeCriteria);
        else evaluation = evaluateIndiaCombined(stock, activeCriteria);
      } else {
        evaluation = evaluateUsBuffettLynch(stock, activeCriteria, mode);
      }
      return { stock, evaluation };
    });
  }, [stocks, mode, market, activeCriteria]);

  return (
    <div>
      <PageHeader
        title="Screener"
        description="Filters candidates against Buffett quality and Lynch GARP criteria — separately scored per market since US and India have different accounting norms and typical valuation ranges. Sample data shown; connect real data via the finance connector (US) or your own trusted India source."
        action={
          <div className="flex gap-2">
            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="bg-surface border border-border rounded-lg px-4 py-2 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="india">🇮🇳 India</option>
              <option value="us">🇺🇸 United States</option>
            </select>
          </div>
        }
      />

      <div className="card p-4 mb-6 flex items-center gap-2 flex-wrap">
        <Icon name="screener" size={16} className="text-accent2" />
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wide mr-2">
          Screen
        </span>
        <div className="flex gap-2 flex-wrap flex-1">
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                mode === m.key ? "bg-accent/20 text-accent2" : "bg-white/5 text-slate-400 hover:bg-white/10"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowEditor(!showEditor)}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            showEditor ? "bg-accent/20 text-accent2" : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
        >
          <Icon name="wacc" size={14} />
          {showEditor ? "Hide Editor" : "Edit Thresholds"}
        </button>
      </div>

      {showEditor && (
        <CriteriaEditor criteria={activeCriteria} onChange={updateCriteria} onReset={resetCriteria} />
      )}

      {mode === "combined" && market === "india" && (
        <div className="card p-4 mb-6 border border-caution/30 bg-caution/5 flex items-start gap-3">
          <Icon name="warn" size={16} className="text-caution shrink-0 mt-0.5" />
          <p className="text-caution text-xs leading-relaxed">
            Experimental: pairs PEG&lt;1 with a PE cap of 40, which implicitly requires very high
            growth (~40%+) alongside Buffett-style low debt and ROE discipline — few real
            companies sustain both simultaneously. Treat results here more skeptically than the
            pure Lynch or pure Buffett screens.
          </p>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 text-xs uppercase tracking-wide border-b border-border/60">
              <th className="px-6 py-3 font-medium">Ticker</th>
              <th className="px-6 py-3 font-medium">Sector</th>
              <th className="px-6 py-3 font-medium">Checks Passed</th>
              <th className="px-6 py-3 font-medium">Rating</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ stock, evaluation }, i) => (
              <>
                <tr
                  key={stock.ticker}
                  className={`border-b border-border/40 hover:bg-white/[0.03] transition-colors cursor-pointer ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}
                  onClick={() => setExpandedTicker(expandedTicker === stock.ticker ? null : stock.ticker)}
                >
                  <td className="px-6 py-3.5">
                    <p className="font-semibold text-slate-100">{stock.ticker}</p>
                    <p className="text-slate-500 text-xs">{stock.name}</p>
                  </td>
                  <td className="px-6 py-3.5 text-slate-400">{stock.sector}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-slate-300 tabular-nums">
                      {evaluation.passed}/{evaluation.total}
                    </span>
                    <span className="text-slate-500 text-xs ml-1.5">
                      ({(evaluation.passRate * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <RatingBadge rating={evaluation.rating} />
                  </td>
                  <td className="px-6 py-3.5 text-slate-500 text-xs">
                    {expandedTicker === stock.ticker ? "▲ Hide" : "▼ Details"}
                  </td>
                </tr>
                {expandedTicker === stock.ticker && (
                  <tr className="bg-black/20">
                    <td colSpan={5} className="px-6 py-4">
                      <CriteriaChecklist checks={evaluation.checks} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-4 mt-6 text-slate-500 text-xs">
        Market cap / sales figures shown in {currencySymbol}
        {capUnit} ({market === "india" ? "₹ Crore" : "$ Millions"}). Click any row for the full
        pass/fail breakdown. Click "Edit Thresholds" above to override any criterion live.
      </div>
    </div>
  );
}
