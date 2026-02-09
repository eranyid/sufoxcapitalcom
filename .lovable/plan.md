

## Add Card Background to STOCK HEATMAP and UPCOMING ECONOMIC EVENTS

Both sections will be wrapped in a `bg-card` container to match the dark card background used by the ECONOMIC INDICATORS widget, with a header bar styled consistently.

### Changes

**File: `src/pages/Research.tsx`**

1. **STOCK HEATMAP section (lines 29-33)**: Wrap in `bg-card border border-border` container with a styled header bar (`bg-secondary/50`) containing the title, matching the ECONOMIC INDICATORS pattern.

2. **UPCOMING ECONOMIC EVENTS section (lines 35-39)**: Same treatment -- `bg-card border border-border` container with a styled header bar.

Both headers will move inside the card container with the same `px-3 py-1.5 bg-secondary/50 border-b border-border` styling and `text-[10px] font-semibold text-primary uppercase tracking-wider` text style used by the ECONOMIC INDICATORS header.

