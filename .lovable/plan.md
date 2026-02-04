# Plan: Portfolio Accounting Redesign - Transaction-Driven Valuations

## Status: ✅ COMPLETED

## Problem Analysis

Previously, there was a delay between adding a transaction and seeing the asset in the portfolio. Users had to:
1. Add a transaction (BUY)
2. Separately add a valuation for that asset/month

This caused confusion and data inconsistency. Assets without valuations showed as $0 or with "No Price" badges.

---

## Implemented Solution

### New Transaction-Driven Flow

1. **BUY Transaction → Auto-Creates Valuation**
   - When a BUY transaction is entered, the system automatically creates a valuation entry for that month
   - Valuation price = transaction price per unit
   - Asset appears immediately in portfolio (no delay)

2. **Later Valuations → Upsert (Update if Exists)**
   - When adding a valuation for an existing ticker+month, it UPDATES instead of creating duplicate
   - Each asset has only ONE valuation per month (time-series integrity)
   - Manual valuation updates overwrite transaction-derived values

3. **Data Integrity Rules (Enforced)**
   - Each asset exists only once per month in valuations
   - Ticker is normalized to uppercase for consistency
   - Valuation history is a clean time-series by month

---

## Technical Changes

### `src/context/PortfolioContext.tsx`

**addTransaction() - Enhanced:**
```typescript
// After creating transaction, auto-create valuation for BUY
if (tx.transactionType === 'buy') {
  const transactionMonth = tx.date.substring(0, 7); // YYYY-MM
  
  // Check if valuation exists for ticker+month
  const existing = await checkExistingValuation(ticker, month);
  
  if (existing) {
    // UPDATE existing valuation
    await updateValuation(existing.id, { pricePerUnit, fxRate });
  } else {
    // INSERT new valuation from transaction
    await insertValuation({ ticker, month, pricePerUnit, fxRate });
  }
}
```

**addValuation() - Enhanced with Upsert:**
```typescript
// Check if valuation exists for ticker+month
const existing = await checkExistingValuation(ticker, month);

if (existing) {
  // UPDATE existing - no duplicate
  await updateValuation(existing.id, { ...fields });
} else {
  // INSERT new valuation
  await insertValuation({ ...fields });
}
```

---

## Expected Behavior

| Scenario | Before (Bug) | After (Fixed) |
|----------|--------------|---------------|
| Add BUY transaction | Asset not in portfolio until valuation added | Asset appears immediately with transaction price |
| Add valuation for existing ticker+month | Creates duplicate | Updates existing valuation |
| Portfolio value | Delayed/incorrect | Always reflects latest transaction or valuation |
| Data integrity | Possible duplicates | One valuation per asset per month |

---

## Logical Flow Diagram

```
┌─────────────────────┐
│  User adds BUY TX   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Transaction saved   │
│ to database         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Check: Valuation    │
│ exists for          │
│ ticker + month?     │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
   YES           NO
    │             │
    ▼             ▼
┌────────┐  ┌────────────┐
│ UPDATE │  │ INSERT new │
│existing│  │ valuation  │
│  val   │  │ from TX    │
└────────┘  └────────────┘
           │
           ▼
┌─────────────────────┐
│ Asset visible in    │
│ portfolio NOW       │
└─────────────────────┘
```

---

## Previous Plan: Data Consistency Fix (Archived)

The previous plan addressed cost-basis fallback for missing valuations. This is now less critical since valuations are auto-created, but the fallback still exists as a safety net for legacy data.
