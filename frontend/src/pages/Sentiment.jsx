import { useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import Icon from "../components/Icon.jsx";

export default function Sentiment() {
  const [file, setFile] = useState(null);

  return (
    <div>
      <PageHeader
        title="Sentiment Analysis"
        description="Upload a 10-K (PDF/HTML) to run MD&A sentiment scoring, YoY tone drift, and red-flag text mining. NLP pipeline wiring is Phase 5."
      />

      <label className="card p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-accent/40 transition-colors mb-6 border-dashed">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <Icon name="upload" className="w-6 h-6 text-accent2" />
        </div>
        <p className="text-slate-300 text-sm font-medium mb-1">
          {file ? file.name : "Drop a 10-K or click to browse"}
        </p>
        <p className="text-slate-600 text-xs">PDF or HTML — parsing endpoint not built yet</p>
        <input
          type="file"
          accept=".pdf,.html,.htm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>

      <div className="flex gap-4 flex-wrap">
        <StatCard label="Sentiment Score" value="—" tone="neutral" />
        <StatCard label="YoY Tone Drift" value="—" tone="neutral" />
        <StatCard label="Red-Flag Count" value="—" tone="neutral" />
      </div>
    </div>
  );
}
