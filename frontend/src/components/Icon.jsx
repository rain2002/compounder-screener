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
