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
  apple: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.74 1.04-1.77.92-2.81-.9.04-2 .6-2.65 1.36-.56.64-1.06 1.68-.92 2.69 1.01.08 2.03-.5 2.65-1.24z",
};

export default function Icon({ name, size = 18, className = "" }) {
  const isApple = name === "apple";
  return (
    <svg
      width={size}
      height={size}
      viewBox={isApple ? "0 0 24 24" : "0 0 24 24"}
      fill={isApple ? "currentColor" : "none"}
      stroke={isApple ? "none" : "currentColor"}
      strokeWidth={isApple ? "0" : "2"}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <path d={paths[name] || ""} />
    </svg>
  );
}
