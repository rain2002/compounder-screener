# Compounder Screener

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![React](https://img.shields.io/badge/Frontend-React_18_%7C_Vite_%7C_Tailwind-black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_%7C_Python_3.13-009688)](https://fastapi.tiangolo.com/)
[![FinBERT](https://img.shields.io/badge/NLP-ProsusAI%2FFinBERT-orange)](https://huggingface.co/ProsusAI/finbert)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost_%7C_Scikit--Learn-green)](https://xgboost.readthedocs.io/)

A quantitative equity research workstation engineered to screen, forecast, and value high-quality **compounding businesses** across **United States (NASDAQ / NYSE)** and **India (NSE / BSE)** markets.

The platform unites **Warren Buffett's economic moat principles**, **Peter Lynch's GARP valuation discipline**, **Messod Beneish's M-Score forensic accounting filter**, **cross-sectional machine learning growth ensembles**, and **3,000-trial Monte Carlo DCF simulations** under a modern monochromatic architectural dark design.

---

## 1. Investment Philosophy & Core Logic

A true **Compounder** is a business that reinvests large amounts of retained earnings at consistently high incremental returns on invested capital over multi-decade cycles. Most traditional stock screeners look only at static single-year valuation ratios (such as P/E or P/B), which systematically misprice durable franchises with strong economic moats.

Compounder Screener evaluates companies through **three foundational pillars**:

```
                              ┌────────────────────────────────────────┐
                              │          COMPOUNDER SCREENER           │
                              └──────────────────┬─────────────────────┘
                                                 │
          ┌──────────────────────────────────────┼──────────────────────────────────────┐
          │                                      │                                      │
          ▼                                      ▼                                      ▼
┌──────────────────┐                   ┌──────────────────┐                   ┌──────────────────┐
│  BUFFETT QUALITY │                   │    LYNCH GARP    │                   │ BENEISH M-SCORE  │
│  Economic Moat,  │                   │ Valuation vs     │                   │ Forensic Fraud   │
│  ROIC, FCF yield │                   │ Growth Velocity  │                   │ & Manipulation   │
└──────────────────┘                   └──────────────────┘                   └──────────────────┘
```

### Pillar 1: Warren Buffett Economic Moat & Capital Allocation
- **Return on Invested Capital (ROIC > 15%)**: Measures core business earnings generation independent of leverage or capital structure.
- **Return on Equity (ROE > 15%)**: Ensures shareholder capital compounds efficiently over rolling 10-year periods.
- **Owner Earnings**: True economic cash generated for owners:
  $$\text{Owner Earnings} = \text{Net Income} + \text{D\&A} - \text{Maintenance CapEx} \pm \Delta \text{Working Capital}$$
- **Capital Discipline**: Conservative leverage ($\text{Debt} / \text{Equity} \le 0.5$, $\text{Debt} / \text{EBITDA} \le 3.0\text{x}$) and strong interest coverage ($\ge 5.0\text{x}$).

### Pillar 2: Peter Lynch GARP (Growth at a Reasonable Price)
- Evaluates earnings velocity against the prevailing valuation multiple using the PEG ratio:
  $$\text{PEG Ratio} = \frac{\text{Price-to-Earnings Ratio}}{\text{EPS Growth Rate}}$$
  - **$\text{PEG} < 1.0$**: Substantial margin of safety relative to earnings momentum.
  - **$1.0 \le \text{PEG} \le 1.5$**: Fair compounder pricing tier.
  - **$\text{PEG} > 2.0$**: Unfavorable risk-reward; future growth is fully priced in.

### Pillar 3: Messod Beneish Forensic Accounting & Fraud Filter
Detects financial statement manipulation and aggressive revenue recognition using an 8-variable probabilistic model:
$$\begin{aligned}
\text{M-Score} = &-4.84 + 0.920 \times \text{DSRI} + 0.528 \times \text{GMI} + 0.404 \times \text{AQI} + 0.892 \times \text{SGI} \\
&+ 0.115 \times \text{DEPI} - 0.172 \times \text{SGAI} + 4.037 \times \text{TATA} + 0.0327 \times \text{LVGI}
\end{aligned}$$

- **Threshold**: An **$\text{M-Score} > -2.22$** flags high probability of earnings distortion, automatically penalizing the security and triggering disqualification warnings.

---

## 2. Factors & Quantitative Metrics Considered

Every analyzed company is evaluated across audited 10-year historical statements, multi-scenario forward models, and machine learning feature matrices:

| Dimension | Metric | Benchmark Threshold | Analytical Purpose |
| :--- | :--- | :--- | :--- |
| **Moat Quality** | ROIC | $> 15.0\%$ | Validates pricing power and competitive barriers |
| **Shareholder Compound** | ROE | $> 15.0\%$ | Verifies equity reinvestment compounding |
| **Solvency** | Net Debt / Equity | $\le 0.50$ | Guards against bankruptcy and distress dilution |
| **Leverage Capacity** | Net Debt / EBITDA | $\le 3.0\text{x}$ | Ensures manageable debt service across cycles |
| **Liquidity** | Current Ratio | $> 1.0\text{x}$ | Validates near-term working capital cushion |
| **Debt Coverage** | Interest Coverage | $\ge 5.0\text{x}$ | Guards operating profit against interest rate spikes |
| **Margin Durability** | Gross Margin Trend | Expanding / Stable | Identifies whether the company can pass on input inflation |
| **Operating Leverage** | Operating Margin | Expanding / Stable | Measures SG&A control and production scalability |
| **Earnings Quality** | Cash Conversion Ratio | $\ge 1.0\text{x}$ | Compares Operating Cash Flow to Net Income ($\text{OCF}/\text{NI}$) |
| **Cash Velocity** | 10-Yr FCF CAGR | $> 0\%$ | Confirms sustained generation of unencumbered cash |
| **Forensic Integrity** | Beneish M-Score | $\le -2.22$ | Identifies aggressive accruals or revenue inflation |
| **Valuation Discipline** | PEG Ratio | $\le 1.5\text{x}$ | Prevents overpaying for historical growth |

---

## 3. The 9-Stage Quantitative Pipeline

```
┌────────────────────────────────────────────────────────────────────────┐
│                        QUANTITATIVE PIPELINE                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
 1. DATA INGESTION                 │ SEC EDGAR (US) & Screener.in / NSE (India)
                                   ▼
 2. AUDITED STATEMENTS             │ 10-Year Income, Balance Sheet & Cash Flow normalization
                                   ▼
 3. BUFFER / QUALITY MATRIX        │ 12-Factor Moat & Capital Allocation Checklist
                                   ▼
 4. RULE-BASED FORECAST            │ Weighted 3Y/5Y/10Y CAGRs + Asymptotic Exponential Fade
                                   ▼
 5. MACHINE LEARNING ENSEMBLE      │ Ridge + Random Forest + XGBoost (Inverse-MAE weighted)
                                   ▼
 6. CAPM WACC ESTIMATOR            │ Risk-Free Rate, Beta, ERP, after-tax Cost of Debt
                                   ▼
 7. MONTE CARLO DCF ENGINE         │ 3,000 iterations across normal distribution (P10–P90)
                                   ▼
 8. QUALITATIVE NLP SENTIMENT      │ Hugging Face FinBERT analyzing 10-K risk & MD&A text
                                   ▼
 9. CROSS-MODEL VARIANCE           │ Dispersion envelope synthesis & Watch rating caps
```

### Detailed Pipeline Stages

1. **Dual-Market Data Ingestion**:
   - **United States**: Direct SEC EDGAR 10-K and 10-Q filing ingestion normalized into standardized GAAP metrics.
   - **India**: Consolidated BSE/NSE statement normalization converting Lakhs/Crores to international raw scale.
2. **10-Year Audited Fundamental Normalization**:
   - Accounts for non-operating items, working capital movements, and capitalized R&D. Automatically handles founding dates and pre-IPO reporting gaps.
3. **Moat & Quality Checklist**:
   - Cross-checks all 12 Buffett & Lynch metrics simultaneously to establish a quantitative quality rating: **Buy**, **Watch**, or **Avoid**.
4. **Rule-Based Pro Forma Statement Forecast**:
   - Calculates a weighted topline expansion rate ($45\%$ 3-Year CAGR, $30\%$ 5-Year CAGR, $15\%$ 10-Year CAGR, $10\%$ momentum).
   - Incorporates sector-specific guardrails (Software, Semiconductors, Industrials, Retail, Healthcare, Energy, Telecom).
   - Fades growth toward a long-run statutory rate using exponential decay:
     $$g(t) = g_{\text{terminal}} + (g_{\text{initial}} - g_{\text{terminal}}) \times (1 - \text{fadeFactor})^{t-1}$$
5. **Machine Learning Predictive Growth Ensemble**:
   - Pre-trained on **1,100+ public non-financial companies'** fundamentals over historical corporate cycles.
   - Evaluates 11 features: 1Y FCF growth, 1Y Revenue growth, 1Y Net Income growth, FCF margin, Net margin, Operating margin, ROIC, Net Debt to EBIT, CapEx to Revenue, 3Y FCF CAGR, and 3Y Revenue CAGR.
   - Combines **Ridge Regression**, **Random Forest Regressor**, and **XGBoost Regressor** weighted by inverse Mean Absolute Error (MAE).
6. **CAPM WACC Hurdle Rate Engine**:
   - Solves for the true cost of capital:
     $$\text{WACC} = \left(\frac{E}{V} \times K_e\right) + \left(\frac{D}{V} \times K_d \times (1 - t)\right)$$
     $$K_e = R_f + \beta \times \text{ERP}$$
   - Automatically presets statutory risk-free rates and equity risk premiums for US and Indian jurisdictions.
7. **Probabilistic Monte Carlo DCF**:
   - Replaces single-point-estimate bias with a 3,000-trial simulation sampling growth rate and WACC from normal distributions.
   - Generates **P10 (Bear)**, **P50 (Median)**, and **P90 (Bull)** intrinsic price targets.
   - Imposes hard **statutory terminal growth caps** matching historical macroeconomic GDP expansion: **2.5% for US** and **7.0% for India**.
8. **10-K NLP Sentiment Analysis**:
   - PyTorch pipeline using **`ProsusAI/finbert`** (a financial-domain BERT model) to score annual report risk disclosures and executive MD&A tone.
   - Verifies whether management commentary aligns with audited statement numbers.
9. **Cross-Model Variance Envelope**:
   - Evaluates the spread between P10 and P90 outcomes:
     $$\text{Relative Spread} = \frac{\text{P90} - \text{P10}}{\text{P50}} \times 100$$
   - If the relative DCF spread exceeds $80\%$ or forecast confidence is low, the final asset recommendation is **automatically capped at Watch**, enforcing strict risk management.

---

## 4. Dual-Market Architecture: US & India

Compounder Screener accommodates structural differences between Western and Indian equity markets:

| Parameter | US Equities (NASDAQ / NYSE) | India Equities (NSE / BSE) |
| :--- | :--- | :--- |
| **Currency** | USD ($) | INR (₹) with live FX conversion |
| **Unit Scales** | Millions ($M) / Billions ($B) / Trillions ($T) | Lakhs (L) / Crores (Cr) with auto-detect toggle |
| **GDP Terminal Cap** | **2.5%** (Developed Economy Benchmark) | **7.0%** (Emerging Economy Expansion Benchmark) |
| **Risk-Free Rate ($R_f$)** | ~4.2% (10-Yr US Treasury Yield) | ~7.0% (10-Yr India G-Sec Yield) |
| **Equity Risk Premium** | ~4.5% | ~6.5% |
| **Data Provider** | SEC EDGAR & Market API | Consolidated Screener.in / Exchange Filings |

---

## 5. Technology Stack & Design System

### Design System: Neozen Dark Architectural Theme
- **Theme Canvas**: Pure `#080808` obsidian canvas with subtle 40px grid lines (`bg-grid`) and `#111111` structural cards.
- **Typography**:
  - **Headings**: **Syne** (`font-syne`, extra-bold uppercase tracking-tight).
  - **Body Copy**: **Inter** (`font-sans`, high legibility).
  - **Technical Meta**: **JetBrains Mono** (`font-mono`, uppercase indices like `[ 01 // OVERVIEW ]`).
- **Interactive Elements**: Monochromatic rounded pill controls (`.neo-btn-primary`, `.neo-btn-ghost`) and micro-border cards.

### Backend Infrastructure
- **FastAPI**: Asynchronous Python API with strict Pydantic schemas.
- **SQLAlchemy & PostgreSQL / SQLite**: Multi-tenant table schema storing company snapshots, watchlist records, and per-page JSON blobs.
- **Machine Learning & NLP**: `scikit-learn`, `xgboost`, `torch`, `transformers` (`ProsusAI/finbert`), `pypdf`.

---

## 6. Getting Started

### Prerequisites
- Python 3.11+ (Python 3.13 tested)
- Node.js 18+ and npm
- PostgreSQL (or local SQLite fallback)

### One-Click Launch (Recommended)
Double-click `start.bat` in the project root:
```cmd
start.bat
```
*Triggers FastAPI on port `8000` and Vite on port `5173` simultaneously in the background and opens `http://localhost:5173` in your browser.*

### Manual Startup
```powershell
# 1. Start the FastAPI backend
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# 2. In a separate terminal, start the Vite frontend
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

---

## 7. License & Copyright

**Copyright (C) 2026 Raja Nithin (<nitinbatchu15@gmail.com>). All rights reserved.**

This project is licensed under the **GNU Affero General Public License v3.0 (GNU AGPLv3)**.

### Freedom & Anti-Privatization Guarantee:
- **Freedom to Fork & Contribute**: Anyone is free to study, fork, modify, improve, and run this software.
- **No Private Ownership**: Under AGPLv3's strong copyleft terms, any fork, modification, or network-hosted deployment (including web apps and SaaS services) **must remain 100% free and open-source under the exact same AGPLv3 license**. No proprietary closed-source forks are permitted.

See the full legal terms in the [LICENSE](LICENSE) file.
