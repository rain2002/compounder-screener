// src/utils/unitConversion.js
export const UNIT_SYSTEMS = { INTERNATIONAL: 'international', INDIAN: 'indian' };
export const CURRENCIES = { USD: 'USD', INR: 'INR' };

const DIVISORS = {
  international: { million: 1e6, billion: 1e9 },
  indian: { lakh: 1e5, crore: 1e7 },
};

export function formatValue(rawValue, { unitSystem, currency, fxRate = 1, decimals = 2 }) {
  if (rawValue === null || rawValue === undefined || isNaN(rawValue)) return '-';
  const converted = currency === CURRENCIES.INR ? rawValue * fxRate : rawValue;
  const abs = Math.abs(converted);

  if (unitSystem === UNIT_SYSTEMS.INDIAN) {
    if (abs >= DIVISORS.indian.crore) return `${(converted / DIVISORS.indian.crore).toFixed(decimals)} Cr`;
    return `${(converted / DIVISORS.indian.lakh).toFixed(decimals)} L`;
  }
  if (abs >= DIVISORS.international.billion) return `${(converted / DIVISORS.international.billion).toFixed(decimals)} B`;
  return `${(converted / DIVISORS.international.million).toFixed(decimals)} M`;
}

export function currencySymbol(currency) {
  return currency === CURRENCIES.INR ? '\u20B9' : '$';
}

export function autoDetectDisplay(country) {
  if (country === 'IN' || country === 'India') return { unitSystem: UNIT_SYSTEMS.INDIAN, currency: CURRENCIES.INR };
  return { unitSystem: UNIT_SYSTEMS.INTERNATIONAL, currency: CURRENCIES.USD };
}

export async function fetchUsdInrRate() {
  try {
    const res = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
    const data = await res.json();
    return data.usd.inr;
  } catch (e) {
    return 83.5;
  }
}
