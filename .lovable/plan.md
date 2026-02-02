
# Plan: Fix Data Consistency and Unrealized P/L Accuracy

## Problem Analysis

Based on database investigation, the **-41.63% Unrealized P/L** shown is mathematically correct but **misleading** because:

| Asset | Transaction Cost | Has Valuation? | Calculated Current Value |
|-------|-----------------|----------------|--------------------------|
| MPWR | $2,229.33 (2 shares) | Yes ($1,161.78/share) | $2,323.56 |
| SLV | $844.37 | **NO** | $0 |
| GLD | $906.78 | **NO** | $0 |
| **Total** | $3,980.48 | - | $2,323.56 |

**Unrealized P/L = $2,323.56 - $3,980.48 = -$1,656.92** → Exactly what you see!

The system is treating SLV and GLD as worth $0 because no monthly valuations exist for them.

---

## Root Causes

### 1. Missing Valuations for Active Holdings
The system has transactions for SLV and GLD but no corresponding valuation data. This makes their current value appear as $0.

### 2. No Warning for Missing Valuations
The UI doesn't alert users when holdings exist without current price data.

### 3. FX Rate Data Gap
Only one date (2026-01-01) has FX rates entered. Valuations need FX rates for the same month to calculate P/L correctly.

---

## Solution Plan

### Phase 1: Data Watchdog Enhancement

**File: `src/lib/dataValidation.ts`**

Add new validation checks:

1. **Missing Valuation Check**
   - For each holding with quantity > 0, verify a valuation exists for current month
   - Severity: **Error** (critical data gap)
   - Message: "Asset XYZ has no current valuation - P/L will be incorrect"

2. **Stale Valuation Check**
   - Warn if latest valuation is older than 60 days
   - Severity: **Warning**
   - Message: "Asset XYZ valuation is outdated (last: 2026-01)"

### Phase 2: Holdings Table Visual Warning

**File: `src/components/dashboard/HoldingsTable.tsx`**

1. Add "Missing Price" indicator column/badge
2. Show warning icon for assets without current valuation
3. Tooltip: "No valuation data - current value shown as cost basis"

### Phase 3: Fallback to Cost Basis

**File: `src/lib/calculations.ts`** and `src/lib/portfolioEngine.ts`

When valuation is missing for an active holding:

**Option A: Zero Value (Current)**
- Current behavior: Treat as $0 value
- Problem: Creates massively misleading P/L

**Option B: Cost Basis Fallback (Recommended)**
- If no valuation exists, use average cost as current price
- Unrealized P/L = $0 for that holding
- Clear indicator that it's estimated

**Option C: Last Transaction Price**
- Use most recent buy price as current value
- Similar to Option B but more explicit

### Phase 4: KPI Card Quality Badges

**File: `src/pages/Overview.tsx`**

Display data quality indicators on KPI cards:

```
┌─────────────────────────────┐
│ UNREALIZED P/L         ⚠️  │
│ -$1,657                     │
│ 2 of 4 holdings missing     │
│ valuations                  │
└─────────────────────────────┘
```

### Phase 5: FX Rate Completeness Check

**File: `src/lib/dataValidation.ts`**

Add check for FX rate gaps:
- If holding is in foreign currency (EUR, ILS, etc.)
- And valuation month has no FX rate entry
- Show warning: "FX rate missing for January 2026"

---

## Implementation Details

### Cost Basis Fallback Logic

```typescript
// In calculatePerformanceMetrics:
for (const [ticker, pos] of Object.entries(positions)) {
  const val = latestVals[ticker];
  
  if (!val && pos.quantity > 0) {
    // FALLBACK: Use cost basis as current value
    holdingsValue += pos.totalCost;
    // No P/L contribution (effectively 0%)
    missingValuationCount++;
    continue;
  }
  
  // Normal calculation with valuation
  const currentValue = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
  holdingsValue += currentValue;
  // ... rest of P/L calculation
}
```

### Holdings Table Warning Badge

```typescript
// In HoldingsTable row render:
{!hasCurrentValuation && (
  <Badge variant="warning" className="text-xs">
    <AlertTriangle className="h-3 w-3 mr-1" />
    No Price
  </Badge>
)}
```

### Data Watchdog New Rule

```typescript
// In validateHoldings:
const holdingsWithoutValuation = holdings.filter(h => {
  const hasValuation = valuations.some(
    v => v.ticker === h.ticker && v.month === currentMonth
  );
  return !hasValuation;
});

if (holdingsWithoutValuation.length > 0) {
  issues.push({
    type: 'error',
    category: 'data_completeness',
    message: `${holdingsWithoutValuation.length} holdings missing current valuations`,
    details: holdingsWithoutValuation.map(h => h.ticker).join(', ')
  });
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/dataValidation.ts` | Add missing valuation checks |
| `src/lib/calculations.ts` | Add cost-basis fallback for missing valuations |
| `src/lib/portfolioEngine.ts` | Add cost-basis fallback for missing valuations |
| `src/components/dashboard/HoldingsTable.tsx` | Add visual warning for missing prices |
| `src/pages/Overview.tsx` | Add data quality indicator to KPIs |
| `src/components/dashboard/KPICard.tsx` | Add optional warning badge prop |

---

## Expected Outcome

After implementation:

1. **Immediate**: Users see clear warnings when valuations are missing
2. **P/L Accuracy**: Assets without valuations show 0% P/L (not -100%)
3. **Data Watchdog**: Proactive alerts for incomplete data
4. **Total Value**: More accurate representation ($27,910 should include SLV/GLD at cost)

### Before vs After

| Metric | Current (Bug) | After (Fixed) |
|--------|---------------|---------------|
| Holdings Value | $2,324 | ~$6,304 |
| Unrealized P/L | -$1,657 | ~$95 (MPWR only) |
| Unrealized % | -41.63% | ~2.4% (MPWR only) |
| Warnings | None | "2 holdings missing valuations" |

---

## Immediate Action Required

Before any code changes, you need to **add valuations for SLV and GLD**:

1. Go to Valuations page
2. Add January 2026 valuation for SLV (current price ~$30/share for iShares Silver Trust)
3. Add January 2026 valuation for GLD (current price ~$265/share for SPDR Gold Trust)

This will immediately fix the -41% issue because the system will have actual current prices.
