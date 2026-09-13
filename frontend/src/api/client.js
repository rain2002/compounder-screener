const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/health"),
  companies: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/companies${qs ? `?${qs}` : ""}`);
  },
  company: (ticker) => request(`/companies/${ticker}`),
  screenerResults: (rating) =>
    request(`/screener/results${rating ? `?rating=${rating}` : ""}`),
  testScore: (params) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/screener/test-score?${qs}`, { method: "POST" });
  },
};
