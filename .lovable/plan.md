

# זיהוי אוטומטי ETF / מניה עם תצוגה מותאמת (ללא AI)

## סקירה
הרחבת ה-Edge Function `analyze-fundamental` כך שיזהה אוטומטית אם הטיקר הוא ETF או מניה, ויחזיר נתונים מותאמים מ-Finnhub בלבד (ללא שום חיבור AI). בצד ה-UI, העמוד יציג תצוגה שונה לכל סוג נכס.

## לוגיקת זיהוי

```text
1. קריאה ל-/stock/profile2?symbol=XXX
2. אם יש profile.name --> זו מניה (STOCK) --> הזרימה הקיימת
3. אם profile ריק --> קריאה ל-/etf/profile?symbol=XXX
4. אם יש נתוני ETF --> זה ETF --> זרימת ETF ייעודית
5. אם גם ETF ריק --> 404 "Ticker not found"
```

## שינויים

### 1. Edge Function (`supabase/functions/analyze-fundamental/index.ts`)

**ETF Detection:**
- לאחר ש-`/stock/profile2` מחזיר פרופיל ריק, ננסה `/etf/profile?symbol=XXX&isin=`
- אם נמצא ETF, קריאות מקבילות ל-4 endpoints:
  - `/etf/profile` -- שם, AUM, expense ratio, inception date, description
  - `/etf/holdings` -- רשימת אחזקות עם ticker, name, share, percent
  - `/etf/sector` -- חשיפה סקטוריאלית (sector name + percentage)
  - `/etf/country` -- חשיפה גיאוגרפית (country + percentage)
  - `/quote` -- מחיר נוכחי
  - `/company-news` -- חדשות (אותו endpoint, עובד גם ל-ETF)

**Response חדש עבור ETF:**
```text
{
  asset_type: "etf",
  name: "SPDR S&P 500 ETF Trust",
  ticker: "SPY",
  current_price: 520.45,
  aum: 500000000000,          // בדולרים
  expense_ratio: 0.0945,      // באחוזים
  inception_date: "1993-01-22",
  description: "...",
  nav: 519.80,
  holdings: [
    { symbol: "AAPL", name: "Apple Inc", share: 150000, percent: 7.2 },
    ...
  ],
  sector_exposure: [
    { sector: "Technology", percentage: 32.5 },
    ...
  ],
  country_exposure: [
    { country: "US", percentage: 98.5 },
    ...
  ],
  news: [ ... ]   // אותו פורמט כמו מניות
}
```

**Response קיים למניות** -- ללא שינוי, רק הוספת `asset_type: "stock"`.

### 2. Frontend (`src/pages/Market.tsx`)

**שינויים:**
- הוספת `EtfData` interface חדש
- שינוי state ל-union type שתומך בשני סוגי הנתונים
- בדיקת `asset_type` מה-response לקביעת התצוגה
- **מניה:** התצוגה הקיימת נשארת כמו שהיא, ללא שום שינוי

**תצוגת ETF חדשה:**
- **Header:** שם ETF, טיקר, מחיר, badge "ETF"
- **KPI Strip:** AUM (formatted), Expense Ratio, Inception Date, NAV
- **Top Holdings Table:** טבלה עם Symbol (כ-TickerLink), Name, Weight %
- **Sector Exposure:** Horizontal bar chart (Recharts) עם שמות סקטורים ואחוזים
- **Country Exposure:** Horizontal bar chart עם מדינות ואחוזים
- **News:** אותו רכיב חדשות קיים

```text
Layout ETF:
+--------------------------------------------------+
| [Search] | ETF Name | "ETF" badge | Price | AUM  |
+--------------------------------------------------+
| AUM | Expense Ratio | Inception | NAV            |
+--------------------------------------------------+
| Top Holdings (table)     | Sector Exposure (bar) |
+--------------------------------------------------+
| Country Exposure (bar)   | News Feed             |
+--------------------------------------------------+
```

### קבצים שישתנו
1. `supabase/functions/analyze-fundamental/index.ts` -- הוספת ETF detection + ETF data fetching
2. `src/pages/Market.tsx` -- הוספת ETF interface + תצוגה מותאמת

### מה לא ישתנה
- אין חיבור AI, אין Lovable AI, אין שום מודל שפה
- אין שינוי לטבלאות DB
- אין שינוי לניווט או routing
- תצוגת מניות נשארת זהה לחלוטין
- אותו FINNHUB_API_KEY קיים

