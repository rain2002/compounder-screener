const paths = {
  dashboard: "M4 4h6v7H4V4zm10 0h6v4h-6V4zM4 14h6v6H4v-6zm10-3h6v9h-6v-9z",
  screener: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.35-4.35",
  dcf: "M4 20V10m6 10V4m6 16v-7m6 7v-3",
  technical: "M3 17l5-6 4 4 8-9",
  sentiment: "M4 5h16a1 1 0 011 1v9a1 1 0 01-1 1H9l-4 4v-4H4a1 1 0 01-1-1V6a1 1 0 011-1z",
  variance: "M4 19h16M7 19V9M12 19V5M17 19v-7",
  check: "M20 6L9 17l-5-5",
  warn: "M12 9v4m0 4h.01M4.05 18h15.9a1 1 0 00.87-1.5L13.87 4a1 1 0 00-1.74 0L4.18 16.5a1 1 0 00.87 1.5z",
  upload: "M12 3v12m0-12l-4 4m4-4l4 4M5 21h14",
  wacc: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83",
  arrowRight: "M5 12h14M12 5l7 7-7 7",
  chevronRight: "M9 18l6-6-6-6",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  sparkles: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.857L13 21l-2.286-6.857L5 12l5.714-2.857L13 3z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  bolt: "M13 10V3L4 14h7v7l9-11h-7z",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  compounder: "M12 21a9 9 0 0 1-9-9 9 9 0 0 1 15.5-6.1M21 3l-6 1 1.8 1.8-6.3 6.3 2.8 2.8 6.3-6.3L21 10.5V3z",
};

export default function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <path d={paths[name] || ""} />
    </svg>
  );
}
