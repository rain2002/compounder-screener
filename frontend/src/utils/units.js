export function formatMoney(value, decimals = 1) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(decimals)}T`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(decimals)}B`;
  if (abs >= 1) return `${sign}$${abs.toFixed(decimals)}M`;
  return `${sign}$${(abs * 1_000).toFixed(decimals)}K`;
}

export function unitSuffixFor(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return "T";
  if (abs >= 1_000) return "B";
  if (abs >= 1) return "M";
  return "K";
}

// All internal state is stored in $M (millions) as the base unit, matching
// the finance connector's typical reporting unit. formatMoney() handles
// display scaling to K/M/B/T automatically -- never store raw dollars or
// raw billions in component state, always normalize to millions on input.
export const BASE_UNIT_LABEL = "Stored internally in $M; displayed as K/M/B/T automatically";
