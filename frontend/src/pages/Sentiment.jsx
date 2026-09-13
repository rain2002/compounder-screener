import { useState } from "react";

export default function Sentiment() {
  const [file, setFile] = useState(null);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sentiment Analysis</h2>
      <p className="text-slate-400 text-sm mb-6">
        Upload a 10-K (PDF/HTML) to run MD&A sentiment scoring, YoY tone drift, and red-flag text
        mining. NLP pipeline (Loughran-McDonald lexicon + LLM) is wired up in Phase 5.
      </p>

      <div className="bg-slate-900 border border-dashed border-slate-700 rounded p-8 text-center">
        <input
          type="file"
          accept=".pdf,.html,.htm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm text-slate-300"
        />
        {file && <p className="mt-3 text-sm text-slate-400">Selected: {file.name}</p>}
        <p className="mt-3 text-xs text-slate-600">
          Backend endpoint for 10-K parsing not built yet — this is the upload UI shell.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {["Sentiment Score", "YoY Tone Drift", "Red-Flag Count"].map((label) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded p-4">
            <p className="text-slate-400 text-xs">{label}</p>
            <p className="text-2xl font-bold text-slate-500 mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
