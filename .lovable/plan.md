

## Restructure: Quant → Analytics as Default

### Current State
- `/quant` shows a landing page with 2 cards: Data and Analytics
- `/quant/analytics` shows the Analytics landing (7 category cards)
- `/quant/data` shows Data page

### New Structure
- `/quant` → directly shows the Analytics landing page (the 7 category cards with time selector)
- Add a "Data" button/link inside the Quant page header area to navigate to `/quant/data`
- Remove the intermediate landing hub (the 2-card page)

### Changes

**1. `src/pages/Quant.tsx`** — Rewrite
- When at `/quant` (landing), render the Analytics landing content directly (time selector + 7 category cards) instead of the current Data/Analytics card selector
- Add a small "Data" link/button in the header area (next to the "Quant" title) that navigates to `/quant/data`
- Keep the breadcrumb logic for child routes (`/quant/data`, `/quant/analytics/*`)

**2. `src/App.tsx`** — Minor route cleanup
- The `/quant/analytics` route currently renders `QuantAnalyticsLanding` — keep it as-is (so deep links still work), but the same content will also appear at `/quant` directly

**3. No other files change.** The 7 analytics sub-pages, Data page, and all hooks remain untouched.

### Result
- User navigates to Quant → sees Analytics hub immediately
- "Data" button in the header → goes to `/quant/data`
- All existing `/quant/analytics/*` deep links continue to work

