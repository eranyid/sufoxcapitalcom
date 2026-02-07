

## Add "Economy" Page

Create a new dedicated Economy page that consolidates economic data and indicators into a standalone view, separate from the Research page.

### What will be built

A new page at `/economy` route called "Economy" that includes:
- The TradingEconomics live widget (currently embedded elsewhere)
- The FRED Economic Indicators component (currently on the Research page)
- The TradingView Ticker Tape for live market context
- All wrapped in the standard page layout with consistent styling

### Changes

1. **New page file**: `src/pages/Economy.tsx`
   - TradingView Ticker Tape at the top
   - TradingEconomics widget (the embed with `cl-pro` dark theme)
   - FRED Economic Indicators grid below
   - Page header with "ECONOMY" title and Activity icon

2. **New icon**: `src/components/icons/EconomyIcon.tsx`
   - Custom icon consistent with existing icon system (Activity/TrendingUp style)

3. **Route registration**: `src/App.tsx`
   - Add lazy import for Economy page
   - Add `/economy` route inside the protected DashboardLayout

4. **Sidebar navigation**: `src/components/layout/Sidebar.tsx`
   - Add "Economy" entry under the RESEARCH group (after Research, before Analysis)
   - Import the new EconomyIcon

5. **Mobile navigation**: `src/components/layout/MobileNav.tsx`
   - Add Economy to the "More" menu items

### Technical details

```text
File: src/pages/Economy.tsx
- Import TradingViewTickerTape, EconomicIndicators
- Embed TradingEconomics widget via useRef/useEffect (same pattern as existing)
- Standard animate-fade-in wrapper, section-spacing layout

File: src/components/icons/EconomyIcon.tsx
- SVG icon following existing icon component pattern (size, strokeWidth props)

File: src/App.tsx
- const Economy = lazy(() => import("./pages/Economy"));
- <Route path="/economy" element={<Suspense ...><Economy /></Suspense>} />

File: src/components/layout/Sidebar.tsx
- Add { path: '/economy', icon: EconomyIcon, label: 'Economy' } to RESEARCH group

File: src/components/layout/MobileNav.tsx
- Add Economy to moreNavItems array
```

No database changes required.

