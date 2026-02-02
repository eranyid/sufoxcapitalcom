# Plan: Fix Data Consistency and Unrealized P/L Accuracy

## Status: ✅ COMPLETED

## Problem Analysis

Based on database investigation, the **-41.63% Unrealized P/L** was mathematically correct but **misleading** because:

| Asset | Transaction Cost | Has Valuation? | Calculated Current Value |
|-------|-----------------|----------------|--------------------------|
| MPWR | $2,229.33 (2 shares) | Yes ($1,161.78/share) | $2,323.56 |
| SLV | $844.37 | **NO** | $0 |
| GLD | $906.78 | **NO** | $0 |
| **Total** | $3,980.48 | - | $2,323.56 |

The system was treating SLV and GLD as worth $0 because no monthly valuations exist for them.

---

## Implemented Solutions

### ✅ Phase 1: Cost-Basis Fallback (portfolioEngine.ts)

- When a holding has no valuation data, the system now uses **cost basis as current value**
- This prevents misleading -100% P/L for assets without price data
- Unrealized P/L shows as $0 for holdings without valuations (cost = value)
- Added `missingValuation` flag to `PortfolioHolding` interface
- Added `missingValuationCount` to `ComputedPortfolioData`

### ✅ Phase 2: Data Watchdog Enhancement (dataValidation.ts)

- Added **Missing Valuation Check** (severity: error)
  - For each holding with quantity > 0, verifies valuation exists
  - Message: "Asset XYZ has no valuation data"

- Added **Stale Valuation Check** (severity: warning)
  - Warns if latest valuation is older than 60 days
  - Message: "Asset XYZ valuation is outdated (last: YYYY-MM)"

- Added **Summary Issue** when multiple holdings missing valuations

### ✅ Phase 3: Visual Warnings

**HoldingsTable.tsx:**
- Added "No Price" badge for assets without valuations
- Row background highlighted in amber for missing valuations
- Tooltip explains: "No valuation data - value shown at cost basis"

**KPICard.tsx:**
- Added optional `warning` prop for data quality indicators
- Warning displays as amber triangle icon with tooltip

**Overview.tsx:**
- Unrealized P/L KPI now shows warning badge when holdings are missing valuations
- Example: "⚠️ 2 holdings missing valuation"

---

## Expected Behavior After Fix

| Metric | Before (Bug) | After (Fixed) |
|--------|---------------|---------------|
| Holdings Value | Only counted assets with valuations | Includes all assets (at cost if no valuation) |
| Unrealized P/L | Misleading -41% | Shows $0 for assets without price data |
| Unrealized % | Incorrectly negative | 0% for assets without valuations |
| Warnings | None | Clear visual indicators |

---

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/portfolioEngine.ts` | Added cost-basis fallback, missingValuation tracking |
| `src/lib/dataValidation.ts` | Enhanced validation with missing/stale valuation checks |
| `src/components/dashboard/HoldingsTable.tsx` | Added "No Price" badge, amber highlighting |
| `src/components/dashboard/KPICard.tsx` | Added warning prop with tooltip |
| `src/pages/Overview.tsx` | Connected warning indicator to Unrealized P/L KPI |
