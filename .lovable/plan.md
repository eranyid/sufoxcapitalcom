

## Switch FX Rates Data Source to Finnhub

### What Changes
Replace the current `open.er-api.com` free API with Finnhub's `/forex/rates` endpoint in the `fetch-fx-rates` edge function, for consistency with the rest of the platform (market prices, fundamental analysis all use Finnhub).

### Why
- Single data provider across the platform = consistent data quality and fewer external dependencies.
- The `FINNHUB_API_KEY` secret is already configured -- no new credentials needed.

### Implementation Details

**File: `supabase/functions/fetch-fx-rates/index.ts`**

1. **Update `fetchRates()` function** to call Finnhub instead of open.er-api.com:
   - Endpoint: `https://finnhub.io/api/v1/forex/rates?base=USD&token={FINNHUB_API_KEY}`
   - Pass the API key from `Deno.env.get("FINNHUB_API_KEY")`
   - Parse the response: Finnhub returns `{ base: "USD", quote: { EUR: 0.92, ILS: 3.70, ... } }`
   - Map each pair from the `quote` object, same logic as current code but adapted to the new response shape

2. **Update the main handler** to read and pass `FINNHUB_API_KEY` to `fetchRates()`:
   - Add `const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY")` at the start
   - Throw a clear error if key is missing
   - Pass key into `fetchRates(apiKey)`

3. **Update source label** from `"auto"` to `"finnhub"` in upsert records for traceability.

4. **No changes needed** to:
   - The database schema (same `fx_rates` table)
   - The frontend FX Rates page
   - The cron schedule
   - The upsert/save logic (identical flow, just different data source)

### Risk Considerations
- Finnhub free tier has rate limits (60 calls/min) but the FX rates endpoint is a single call for all pairs, so no concern.
- ILS may or may not be available in Finnhub forex rates. If missing, the function will report it as an error for that pair (graceful degradation, same as current behavior).

