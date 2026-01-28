
# Monthly FX Rate Entry and Portfolio Recalculation

## Overview
Adding a monthly FX rate entry interface (similar to stock valuations) to the FX Rates page, and integrating these user-entered rates into portfolio value calculations instead of using hardcoded rates.

## Current Problem
The system uses hardcoded exchange rates for portfolio calculations:
- `ILS_TO_USD = 1 / 3.6`
- `EUR_TO_USD = 1.08`
- Missing GBP, CHF, JPY support entirely

User-entered rates in the `fx_rates` table are stored but **not used** for portfolio calculations.

## Solution Components

### 1. Quick FX Rate Entry Panel on FX Page
Add a "Monthly FX Rates" quick-entry panel similar to the Valuations page QuickAddForm:
- Shows all currency pairs vs base currency (USD)
- Month selector (defaults to current month)
- Single input per currency for that month's rate
- "Save All" button to batch-save rates

Layout:
```
Month: [2026-01]  [Use Last Month's Rates]

Currency    Rate vs USD    Last Rate
EUR         [1.0850]       1.0800
ILS         [0.2700]       0.2750
GBP         [1.2700]       1.2650
CHF         [1.1400]       1.1350
JPY         [0.0067]       0.0068

[Save All Rates]
```

### 2. Dynamic FX Rate Loading in PortfolioContext
Modify `PortfolioContext.tsx` to:
- Load latest FX rates from `fx_rates` table on mount
- Store rates in context state: `fxRates: Record<CashCurrency, number>`
- Provide fallback to default rates from `fxService.ts` if no database rates exist

### 3. Update Calculation Functions
Modify `calculateTotalCashInBaseCurrency` in `calculations.ts`:
- Add optional `fxRates` parameter
- If provided, use dynamic rates; otherwise use defaults
- Support all 6 currencies (USD, EUR, ILS, GBP, CHF, JPY)

### 4. Update Portfolio Engine
Modify `computePortfolioData` in `portfolioEngine.ts`:
- Accept optional `fxRates` parameter
- Pass rates to `calculateTotalCashInBaseCurrency`
- Ensure cash value is calculated with user-defined rates

### 5. Update CashManagement Component
Modify `CashManagement.tsx`:
- Use dynamic FX rates from context for "Total (approx. USD)" calculation
- Include all 6 currencies in the total
- Show which rates are being used

---

## Technical Details

### Files to Create
- `src/components/fx/MonthlyFxRatesForm.tsx` - Quick entry component for monthly rates

### Files to Modify
1. **`src/pages/FXRates.tsx`**
   - Add MonthlyFxRatesForm component
   - Pass callbacks for saving rates and refreshing

2. **`src/context/PortfolioContext.tsx`**
   - Add `fxRates` state with type `Record<CashCurrency, number>`
   - Load rates from database in useEffect (fetch latest rate for each currency pair)
   - Expose `fxRates` in context value
   - Refresh rates after FX updates

3. **`src/lib/calculations.ts`**
   - Update `calculateTotalCashInBaseCurrency` signature to accept optional rates
   - Support all 6 currencies with proper cross-rate calculation

4. **`src/lib/portfolioEngine.ts`**
   - Pass fxRates to calculation function

5. **`src/components/dashboard/CashManagement.tsx`**
   - Use context fxRates for total calculation
   - Display all 6 currencies in USD equivalent

### Database
No schema changes required - `fx_rates` table already exists with:
- `from_currency`, `to_currency`, `rate`, `rate_date`, `user_id`

### Data Flow
```
User enters rates on FX page
        ↓
Saves to fx_rates table
        ↓
PortfolioContext fetches latest rates
        ↓
computePortfolioData uses dynamic rates
        ↓
Dashboard shows correct Total Value
```

### Fallback Strategy
If no user rates exist for a currency pair:
1. Check fx_rates table for any historical rate
2. Fall back to DEFAULT_FX_RATES in fxService.ts
3. Display indicator showing which source is being used

## User Experience
1. Navigate to FX Rates page
2. See "Monthly FX Rates" panel at top
3. Select month (defaults to current)
4. Enter rates for each currency vs USD
5. Click "Save All Rates"
6. Dashboard immediately reflects updated portfolio value
7. Historical rates preserved for accurate historical analysis
