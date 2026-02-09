
# יצירת עמוד Test עם TradingView Stock Heatmap

## סקירה
יצירת עמוד חדש בשם "Test" עם ווידג'ט Stock Heatmap של TradingView (כמו בתמונה שהעלית -- treemap של מניות לפי סקטור, גודל לפי שווי שוק, צבע לפי שינוי יומי).

## מה ייבנה

### 1. קומפוננטת Heatmap חדשה
קובץ: `src/components/dashboard/TradingViewStockHeatmap.tsx`

- הטמעת ווידג'ט בדיוק כמו ה-Pattern של `TradingViewTickerTape` הקיים (script injection + useRef + useEffect)
- Script: `https://s3.tradingview.com/external-embedding/embed-widget-stock-heatmap.js`
- הגדרות: S&P 500, קיבוץ לפי סקטור, גודל לפי market cap, צבע לפי שינוי יומי, dark theme
- גובה ~600px, רוחב מלא
- הסתרת copyright

### 2. עמוד Test חדש
קובץ: `src/pages/Test.tsx`

- עמוד פשוט שמציג את ה-Heatmap ברוחב מלא
- כותרת "Stock Heatmap"

### 3. הוספת Route
קובץ: `src/App.tsx`

- הוספת route `/test` עם lazy loading, בתוך ה-DashboardLayout (מוגן)

## פרטים טכניים

**קבצים חדשים:**
- `src/components/dashboard/TradingViewStockHeatmap.tsx`
- `src/pages/Test.tsx`

**קבצים שישתנו:**
- `src/App.tsx` -- הוספת import + route
