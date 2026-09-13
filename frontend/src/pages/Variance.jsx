import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";

export default function Variance() {
  return (
    <div>
      <PageHeader
        title="Variance Analysis"
        description={'Wraps Technical, Sentiment, and DCF outputs to measure forecast uncertainty. Wide uncertainty caps the Dashboard rating at "Watch" regardless of base-case score. Builds in Phase 6.'}
      />

      <div className="flex gap-4 flex-wrap">
        <StatCard label="DCF Spread" value="—" tone="neutral" />
        <StatCard label="Technical Confidence" value="—" tone="neutral" />
        <StatCard label="Sentiment Consistency" value="—" tone="neutral" />
      </div>
    </div>
  );
}
