
# Plan: Multivariate Monte Carlo Simulation Engine (EnCorr Standard)

## ✅ IMPLEMENTATION COMPLETE

**Status:** All phases implemented and tested.

**Files Created/Modified:**
- ✅ `src/lib/monteCarloEngine.ts` - Core multivariate engine with Cholesky decomposition
- ✅ `src/components/dashboard/MonteCarloSimulation.tsx` - Updated UI with multivariate mode
- ✅ `src/lib/__tests__/monteCarloMultivariate.test.ts` - 37 tests passing
- ✅ `src/pages/Research.tsx` - Integration with asset-level data

---

## Overview

Rebuilt the Monte Carlo simulation to match **Morningstar EnCorr** institutional-grade methodology. The implementation is now **Multivariate** (simulates each asset class individually with correlations preserved via **Cholesky Decomposition**).

---

## What Changes

### Current State
- Single portfolio-level GBM simulation
- One mean (μ) and volatility (σ) for entire portfolio
- No correlation modeling between asset classes

### Target State (EnCorr Standard)
- Asset-level simulation with individual μ and σ per asset
- Correlation matrix between all assets
- Cholesky decomposition to generate correlated random shocks
- Periodic rebalancing to target weights
- Full covariance-based risk decomposition

---

## Implementation Plan

### Phase 1: Mathematical Engine (`src/lib/monteCarloEngine.ts`)

**New file** with institutional-grade functions:

1. **Covariance Matrix Calculation**
   - Build NxN covariance matrix from asset monthly returns
   - Formula: `Cov(i,j) = Σ(Ri - μi)(Rj - μj) / (n-1)`

2. **Cholesky Decomposition**
   - Decompose covariance matrix: `Σ = L × L^T`
   - Required to transform independent random shocks into correlated ones
   - Algorithm: Lower triangular matrix factorization

3. **Correlated Random Generation**
   - Generate N independent standard normal variables (Box-Muller)
   - Transform: `ε_correlated = L × Z`
   - Result: Vector of correlated shocks matching historical relationships

4. **Multivariate GBM Simulation**
   - For each asset: `r_i = μ_i - 0.5σ_i² + σ_i × ε_i`
   - Apply correlated shocks (not independent)
   - Compound: `P_i(t+1) = P_i(t) × exp(r_i)`

5. **Rebalancing Logic**
   - Option: Constant weights (rebalance each period)
   - Option: Buy-and-hold (drift with market)

### Phase 2: Data Collection (`src/lib/monteCarloEngine.ts`)

**Functions to extract parameters from user data:**

1. **Asset Statistics Extraction**
   - Per-asset: μ (mean monthly return), σ (monthly volatility)
   - Annualize: μ_annual = μ_monthly × 12, σ_annual = σ_monthly × √12

2. **Correlation Matrix Building**
   - Use existing `calculateCorrelationMatrix()` from calculations.ts
   - Convert correlation to covariance: `Cov(i,j) = ρ_ij × σ_i × σ_j`

3. **Data Sufficiency Validation**
   - Minimum 12 months per asset for reliable statistics
   - Warning if <12 months (show confidence indicator)
   - Error if <3 months (fallback to univariate)

### Phase 3: UI Update (`src/components/dashboard/MonteCarloSimulation.tsx`)

**Enhanced interface:**

1. **Mode Selector**
   - **Univariate** (current): Fast, portfolio-level (when data insufficient)
   - **Multivariate** (new): Asset-level with correlations (when data sufficient)

2. **Asset Parameters Panel**
   - Display per-asset: Mean, Volatility, Weight
   - Show correlation matrix heatmap (mini version)

3. **Data Quality Indicator**
   - Green: 12+ months per asset (full multivariate)
   - Yellow: 6-11 months (multivariate with warning)
   - Red: <6 months (fallback to univariate)

4. **Rebalancing Option**
   - Toggle: Constant Weights vs. Buy-and-Hold

5. **Results Enhancement**
   - Per-asset projected paths (optional view)
   - Portfolio aggregation with correlation effects
   - Diversification benefit metric

### Phase 4: Integration

1. **Connect to Existing Data**
   - Use `calculateAssetMonthlyReturns()` for per-asset returns
   - Use `calculateCorrelationMatrix()` for relationships
   - Use portfolio context for weights

2. **Update Research Page**
   - Pass asset-level data to Monte Carlo component

---

## Algorithm Details (Morningstar EnCorr Method)

### Cholesky Decomposition (Step-by-Step)

```text
Input: Correlation matrix R (NxN)
Output: Lower triangular matrix L where R = L × L^T

For j = 1 to N:
  For i = j to N:
    If i == j:
      L[i,j] = sqrt(R[i,i] - Σ(k=1 to j-1) L[i,k]²)
    Else:
      L[i,j] = (R[i,j] - Σ(k=1 to j-1) L[i,k]L[j,k]) / L[j,j]
```

### Correlated Returns Generation

```text
1. Generate N independent Z ~ N(0,1) using Box-Muller
2. Compute ε = L × Z (matrix multiplication)
3. For each asset i:
   log_return_i = μ_i - 0.5σ_i² + σ_i × ε_i
4. Portfolio return = Σ(w_i × exp(log_return_i) - 1)
```

### Simulation Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION                               │
├─────────────────────────────────────────────────────────────────┤
│  Transactions + Valuations → Per-Asset Returns                   │
│  Per-Asset Returns → Mean (μ), Volatility (σ), Weights (w)      │
│  Per-Asset Returns → Correlation Matrix (R)                      │
│  Correlation → Covariance Matrix (Σ)                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 CHOLESKY DECOMPOSITION                           │
├─────────────────────────────────────────────────────────────────┤
│  Covariance Matrix Σ → Lower Triangular L                        │
│  Property: Σ = L × L^T                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 SIMULATION LOOP (10,000 paths)                   │
├─────────────────────────────────────────────────────────────────┤
│  For each simulation s = 1 to 10,000:                           │
│    Initialize: asset_values[i] = initial_value × weight[i]      │
│    For each time step t = 1 to T:                               │
│      1. Generate Z = [z1, z2, ..., zN] ~ N(0,1) independent     │
│      2. Transform: ε = L × Z (correlated shocks)                │
│      3. For each asset i:                                        │
│         r_i = μ_i/steps - 0.5(σ_i/√steps)² + (σ_i/√steps)×ε_i   │
│         asset_values[i] = asset_values[i] × exp(r_i)            │
│      4. If rebalancing: reset weights to target                 │
│    portfolio_value[s] = Σ asset_values[i]                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 OUTPUT ANALYSIS                                  │
├─────────────────────────────────────────────────────────────────┤
│  Sort 10,000 final values → Percentiles (5, 25, 50, 75, 95)     │
│  Calculate VaR 95%, CVaR 95%                                    │
│  Probability of gain/loss                                        │
│  Diversification benefit vs. weighted-average individual VaRs   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/monteCarloEngine.ts` | **NEW** | Core multivariate simulation engine |
| `src/components/dashboard/MonteCarloSimulation.tsx` | **MODIFY** | Add multivariate mode, asset panel, data quality |
| `src/lib/__tests__/monteCarlo.test.ts` | **MODIFY** | Add tests for Cholesky, correlation preservation |

---

## Technical Details

### New Types

```typescript
interface AssetParameters {
  ticker: string;
  name: string;
  weight: number;           // Current portfolio weight
  meanReturn: number;       // Annualized expected return
  volatility: number;       // Annualized volatility
  monthsOfData: number;     // For confidence indicator
}

interface MultivariateConfig {
  assets: AssetParameters[];
  correlationMatrix: number[][];
  covarianceMatrix: number[][];
  choleskyL: number[][];
  rebalancing: 'constant' | 'buy_and_hold';
}

interface SimulationMode {
  type: 'univariate' | 'multivariate';
  reason?: string;  // Why fallback to univariate
}
```

### Data Quality Thresholds

| Months of Data | Quality Level | Behavior |
|----------------|---------------|----------|
| 12+ months | High | Full multivariate simulation |
| 6-11 months | Medium | Multivariate with warning badge |
| 3-5 months | Low | Univariate fallback |
| <3 months | Insufficient | Simulation disabled |

---

## Expected Outcomes

1. **Institutional-Grade Accuracy**
   - Correlations preserved through market stress scenarios
   - Realistic diversification effects captured

2. **User Transparency**
   - Clear display of per-asset assumptions
   - Correlation matrix visualization
   - Data quality indicators

3. **Backward Compatibility**
   - Manual input mode still works (univariate)
   - Graceful fallback when data insufficient

4. **Morningstar EnCorr Parity**
   - Same mathematical methodology
   - Parametric Monte Carlo with Lognormal returns
   - Cholesky-based correlated simulation
