const paths = {
  dashboard: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  screener: "M10 18a8 8 0 100-16 8 8 0 000 16zm11 3l-6-6",
  dcf: "M3 3v18h18M7 14l3-3 3 3 5-6",
  technical: "M4 19V6m5 13V10m5 9V4m5 15v-8",
  sentiment: "M4 4h16v12H8l-4 4V4z",
  variance: "M3 12h4l3-9 4 18 3-9h4",
  check: "M20 6L9 17l-5-5",
  warn: "M12 9v4m0 4h.01M10.29 3.86l-8.48 14.7A1 1 0 002.66 20h18.68a1 1 0 00.85-1.44l-8.48-14.7a1 1 0 00-1.72 0z",
  upload: "M12 16V4m0 0L7 9m5-5l5 5M4 20h16",
};

export default function Icon({ name, className = "w-5 h-5" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={paths[name] || ""} />
    </svg>
  );
}
