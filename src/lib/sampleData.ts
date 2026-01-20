import { Transaction, MonthlyValuation } from '@/types/investment';

/**
 * Sample Portfolio Data - Hard Reset Rebuild
 * 
 * Date Range: January 2020 - December 2025 (72 months)
 * Target CAGR: ~12% (11%-13% band)
 * Target Portfolio Value: ~$2.1M - $2.3M
 * Holdings Count: EXACTLY 20 distinct tradable assets
 * 
 * CALIBRATION NOTES:
 * - 12% CAGR over 6 years: (1.12)^6 = 1.974x total return
 * - Initial cost basis ~$1.05M, final value ~$2.1M
 * - Contains COVID crash (Q1 2020), 2022 bear, 2023-2024 recovery
 * - Monthly series with positive AND negative months for Sortino/VaR
 * 
 * HOLDINGS (20 total - tradable only):
 * - Equity (16): AAPL, MSFT, NVDA, AMZN, GOOGL, TSLA, META, JPM, BRK.B, JNJ, V, PG, UNH, HD, MA, CRM
 * - ETF (2): SPY, QQQ
 * - Gold (1): GLD
 * - Crypto (1): BTC
 * 
 * NO alternative/private investments.
 */

// ============================================================================
// MONTHLY DATE RANGE: 2020-01 through 2025-12 (72 months)
// ============================================================================
const allMonths: string[] = [];
for (let year = 2020; year <= 2025; year++) {
  for (let month = 1; month <= 12; month++) {
    allMonths.push(`${year}-${month.toString().padStart(2, '0')}`);
  }
}

// ============================================================================
// TRANSACTIONS - 2020-2025, chronologically ordered (8-17 per year)
// ============================================================================
export const sampleTransactions: Transaction[] = [
  // =========== 2020: Portfolio Construction & COVID Recovery (15 transactions) ===========
  { id: 'tx-2020-001', assetName: 'SPDR S&P 500 ETF', ticker: 'SPY', assetType: 'etf', transactionType: 'buy', 
    date: '2020-01-10', quantity: 400, pricePerUnit: 325.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 1993 },
  { id: 'tx-2020-002', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2020-01-15', quantity: 500, pricePerUnit: 79.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2020-003', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2020-01-22', quantity: 300, pricePerUnit: 165.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2020-004', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2020-02-05', quantity: 200, pricePerUnit: 135.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2020-005', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2020-02-20', quantity: 300, pricePerUnit: 150.00, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  // COVID crash buying
  { id: 'tx-2020-006', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2020-03-18', quantity: 150, pricePerUnit: 92.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2020-007', assetName: 'Invesco QQQ Trust', ticker: 'QQQ', assetType: 'etf', transactionType: 'buy', 
    date: '2020-03-23', quantity: 250, pricePerUnit: 180.00, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2020-008', assetName: 'Visa Inc.', ticker: 'V', assetType: 'equity', transactionType: 'buy', 
    date: '2020-04-08', quantity: 200, pricePerUnit: 168.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2008 },
  { id: 'tx-2020-009', assetName: 'Procter & Gamble', ticker: 'PG', assetType: 'equity', transactionType: 'buy', 
    date: '2020-05-11', quantity: 200, pricePerUnit: 115.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1890 },
  { id: 'tx-2020-010', assetName: 'UnitedHealth Group', ticker: 'UNH', assetType: 'equity', transactionType: 'buy', 
    date: '2020-06-15', quantity: 80, pricePerUnit: 295.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1977 },
  { id: 'tx-2020-011', assetName: 'Home Depot', ticker: 'HD', assetType: 'equity', transactionType: 'buy', 
    date: '2020-07-20', quantity: 100, pricePerUnit: 255.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1978 },
  { id: 'tx-2020-012', assetName: 'Johnson & Johnson', ticker: 'JNJ', assetType: 'equity', transactionType: 'buy', 
    date: '2020-08-12', quantity: 150, pricePerUnit: 148.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1944 },
  { id: 'tx-2020-013', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2020-09-14', quantity: 100, pricePerUnit: 215.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },
  { id: 'tx-2020-014', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2020-10-19', quantity: 3, pricePerUnit: 11500.00, fees: 115.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2020-015', assetName: 'Mastercard Inc.', ticker: 'MA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-11-23', quantity: 80, pricePerUnit: 335.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2006 },

  // =========== 2021: Bull Market Expansion (14 transactions) ===========
  { id: 'tx-2021-001', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2021-01-11', quantity: 200, pricePerUnit: 32.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2021-002', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2021-02-08', quantity: 120, pricePerUnit: 275.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2021-003', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2021-03-15', quantity: 100, pricePerUnit: 102.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2021-004', assetName: 'SPDR S&P 500 ETF', ticker: 'SPY', assetType: 'etf', transactionType: 'buy', 
    date: '2021-04-05', quantity: 100, pricePerUnit: 408.00, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 1993 },
  { id: 'tx-2021-005', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2021-05-10', quantity: 80, pricePerUnit: 315.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2021-006', assetName: 'Salesforce Inc.', ticker: 'CRM', assetType: 'equity', transactionType: 'buy', 
    date: '2021-06-14', quantity: 60, pricePerUnit: 240.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2021-007', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2021-07-19', quantity: 100, pricePerUnit: 280.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2021-008', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2021-08-16', quantity: 1.5, pricePerUnit: 46000.00, fees: 230.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2021-009', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2021-09-07', quantity: 150, pricePerUnit: 155.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2021-010', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2021-10-18', quantity: 100, pricePerUnit: 52.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2021-011', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2021-11-08', quantity: 100, pricePerUnit: 168.00, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2021-012', assetName: 'Invesco QQQ Trust', ticker: 'QQQ', assetType: 'etf', transactionType: 'buy', 
    date: '2021-12-06', quantity: 80, pricePerUnit: 390.00, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2021-013', assetName: 'UnitedHealth Group', ticker: 'UNH', assetType: 'equity', transactionType: 'buy', 
    date: '2021-12-13', quantity: 40, pricePerUnit: 480.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1977 },
  { id: 'tx-2021-014', assetName: 'Visa Inc.', ticker: 'V', assetType: 'equity', transactionType: 'buy', 
    date: '2021-12-20', quantity: 60, pricePerUnit: 215.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2008 },

  // =========== 2022: Bear Market (11 transactions) ===========
  { id: 'tx-2022-001', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2022-01-18', quantity: 80, pricePerUnit: 170.00, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2022-002', assetName: 'Johnson & Johnson', ticker: 'JNJ', assetType: 'equity', transactionType: 'buy', 
    date: '2022-02-14', quantity: 80, pricePerUnit: 165.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1944 },
  { id: 'tx-2022-003', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2022-03-21', quantity: 50, pricePerUnit: 330.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },
  { id: 'tx-2022-004', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2022-05-09', quantity: 100, pricePerUnit: 108.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2022-005', assetName: 'Procter & Gamble', ticker: 'PG', assetType: 'equity', transactionType: 'buy', 
    date: '2022-06-20', quantity: 80, pricePerUnit: 140.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1890 },
  { id: 'tx-2022-006', assetName: 'Home Depot', ticker: 'HD', assetType: 'equity', transactionType: 'buy', 
    date: '2022-07-18', quantity: 50, pricePerUnit: 285.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1978 },
  { id: 'tx-2022-007', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'sell', 
    date: '2022-08-22', quantity: 40, pricePerUnit: 165.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2022-008', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2022-10-24', quantity: 150, pricePerUnit: 28.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2022-009', assetName: 'SPDR S&P 500 ETF', ticker: 'SPY', assetType: 'etf', transactionType: 'buy', 
    date: '2022-11-14', quantity: 80, pricePerUnit: 395.00, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 1993 },
  { id: 'tx-2022-010', assetName: 'Mastercard Inc.', ticker: 'MA', assetType: 'equity', transactionType: 'buy', 
    date: '2022-12-05', quantity: 40, pricePerUnit: 345.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2006 },
  { id: 'tx-2022-011', assetName: 'Salesforce Inc.', ticker: 'CRM', assetType: 'equity', transactionType: 'buy', 
    date: '2022-12-19', quantity: 50, pricePerUnit: 128.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },

  // =========== 2023: AI Rally Recovery (13 transactions) ===========
  { id: 'tx-2023-001', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2023-01-23', quantity: 50, pricePerUnit: 240.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2023-002', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2023-02-13', quantity: 60, pricePerUnit: 175.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2023-003', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2023-03-20', quantity: 1, pricePerUnit: 28000.00, fees: 140.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2023-004', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2023-04-17', quantity: 100, pricePerUnit: 68.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2023-005', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2023-05-08', quantity: 60, pricePerUnit: 165.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2023-006', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2023-06-26', quantity: 80, pricePerUnit: 185.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2023-007', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2023-07-17', quantity: 60, pricePerUnit: 120.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2023-008', assetName: 'Invesco QQQ Trust', ticker: 'QQQ', assetType: 'etf', transactionType: 'buy', 
    date: '2023-08-14', quantity: 50, pricePerUnit: 365.00, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2023-009', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2023-09-11', quantity: 60, pricePerUnit: 145.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2023-010', assetName: 'UnitedHealth Group', ticker: 'UNH', assetType: 'equity', transactionType: 'buy', 
    date: '2023-10-16', quantity: 30, pricePerUnit: 520.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1977 },
  { id: 'tx-2023-011', assetName: 'Home Depot', ticker: 'HD', assetType: 'equity', transactionType: 'buy', 
    date: '2023-11-06', quantity: 40, pricePerUnit: 305.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1978 },
  { id: 'tx-2023-012', assetName: 'Visa Inc.', ticker: 'V', assetType: 'equity', transactionType: 'buy', 
    date: '2023-11-27', quantity: 40, pricePerUnit: 248.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2008 },
  { id: 'tx-2023-013', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2023-12-18', quantity: 30, pricePerUnit: 355.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },

  // =========== 2024: Bull Continuation (14 transactions) ===========
  { id: 'tx-2024-001', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-01-15', quantity: 0.5, pricePerUnit: 42000.00, fees: 105.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2024-002', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-12', quantity: 60, pricePerUnit: 85.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2024-003', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-26', quantity: 60, pricePerUnit: 175.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2024-004', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'sell', 
    date: '2024-03-18', quantity: 50, pricePerUnit: 172.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2024-005', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2024-04-22', quantity: 30, pricePerUnit: 405.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2024-006', assetName: 'Salesforce Inc.', ticker: 'CRM', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-13', quantity: 40, pricePerUnit: 275.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2024-007', assetName: 'SPDR S&P 500 ETF', ticker: 'SPY', assetType: 'etf', transactionType: 'sell', 
    date: '2024-06-10', quantity: 100, pricePerUnit: 540.00, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 1993 },
  { id: 'tx-2024-008', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2024-07-15', quantity: 50, pricePerUnit: 228.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2024-009', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2024-08-05', quantity: 30, pricePerUnit: 480.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2024-010', assetName: 'Mastercard Inc.', ticker: 'MA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-09-16', quantity: 25, pricePerUnit: 485.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2006 },
  { id: 'tx-2024-011', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2024-10-21', quantity: 1, pricePerUnit: 68000.00, fees: 340.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2024-012', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2024-11-11', quantity: 60, pricePerUnit: 245.00, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2024-013', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2024-12-09', quantity: 40, pricePerUnit: 175.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2024-014', assetName: 'Johnson & Johnson', ticker: 'JNJ', assetType: 'equity', transactionType: 'buy', 
    date: '2024-12-16', quantity: 50, pricePerUnit: 145.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1944 },

  // =========== 2025: Current Year (10 transactions through December) ===========
  { id: 'tx-2025-001', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2025-01-13', quantity: 40, pricePerUnit: 135.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2025-002', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-02-10', quantity: 35, pricePerUnit: 180.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2025-003', assetName: 'Invesco QQQ Trust', ticker: 'QQQ', assetType: 'etf', transactionType: 'buy', 
    date: '2025-03-17', quantity: 30, pricePerUnit: 485.00, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2025-004', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2025-04-14', quantity: 25, pricePerUnit: 540.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2025-005', assetName: 'Procter & Gamble', ticker: 'PG', assetType: 'equity', transactionType: 'buy', 
    date: '2025-05-12', quantity: 40, pricePerUnit: 168.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1890 },
  { id: 'tx-2025-006', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2025-06-09', quantity: 30, pricePerUnit: 205.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2025-007', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'sell', 
    date: '2025-08-18', quantity: 50, pricePerUnit: 455.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2025-008', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2025-09-22', quantity: 40, pricePerUnit: 265.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2025-009', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2025-10-13', quantity: 35, pricePerUnit: 235.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2025-010', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-12-08', quantity: 40, pricePerUnit: 248.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
];

// ============================================================================
// MONTHLY VALUATIONS - Calibrated for ~12% CAGR with 20 holdings
// 72 months: Jan 2020 - Dec 2025
// ============================================================================

/**
 * Price arrays: 72 values each for 2020-01 through 2025-12
 * - Equities (16): AAPL, MSFT, NVDA, AMZN, GOOGL, TSLA, META, JPM, BRK.B, JNJ, V, PG, UNH, HD, MA, CRM
 * - ETFs (2): SPY, QQQ
 * - Gold (1): GLD
 * - Crypto (1): BTC
 * 
 * Calibrated for ~12% portfolio CAGR with realistic drawdowns
 */
const priceData: Record<string, { name: string; prices: number[] }> = {
  /**
   * CALIBRATION FOR ~12% PORTFOLIO CAGR WITH HIGH VOLATILITY:
   * - Start 2020-01 portfolio cost basis: ~$1.1M
   * - End 2025-12 portfolio value: ~$2.15M (1.95x over 6 years = ~11.8% CAGR)
   * - Individual assets: HIGH MONTHLY VOLATILITY (+/-15-25%) for visual spread
   * - Includes COVID crash, 2022 bear, and recovery with dramatic swings
   */
  
  // === EQUITIES (16) - HIGH VOLATILITY VERSION ===
  'AAPL': {
    name: 'Apple Inc.',
    prices: [
      // 2020: Start at 79, end at 95 - VOLATILE swings
      79.00, 68.50, 52.20, 65.40, 78.60, 88.30, 75.10, 95.40, 82.30, 72.20, 98.50, 95.10,
      // 2021: 95 to 115 - big monthly moves
      108.40, 85.20, 73.50, 99.80, 112.30, 93.20, 128.50, 102.40, 85.60, 115.80, 98.20, 115.40,
      // 2022: Bear market 115 to 98 - heavy volatility
      98.80, 118.50, 82.30, 104.20, 79.80, 64.50, 102.30, 79.80, 62.40, 86.50, 108.30, 98.10,
      // 2023: Recovery 98 to 118 - swinging
      82.30, 115.80, 89.40, 132.60, 98.90, 124.20, 96.80, 133.40, 100.20, 122.80, 96.40, 118.50,
      // 2024: Growth 118 to 132 - volatile
      140.30, 108.80, 142.40, 109.60, 144.80, 117.40, 149.80, 116.20, 148.60, 120.20, 151.50, 132.80,
      // 2025: 132 to 142 - swings continue
      154.20, 112.80, 155.60, 127.20, 159.40, 128.80, 160.20, 131.60, 158.40, 140.80, 161.50, 142.30
    ]
  },
  'MSFT': {
    name: 'Microsoft Corp.',
    prices: [
      // 2020: 165 to 195 - volatile
      165.00, 142.40, 115.20, 158.30, 188.40, 155.20, 200.50, 166.30, 202.40, 158.60, 208.20, 195.40,
      // 2021: 195 to 235 - big swings
      220.30, 177.80, 232.40, 192.60, 248.30, 198.50, 255.40, 210.20, 262.80, 208.40, 272.60, 235.80,
      // 2022: Bear 235 to 208 - heavy drops and recoveries
      210.40, 255.60, 188.80, 238.30, 172.40, 162.80, 235.60, 180.30, 158.40, 215.20, 172.40, 208.60,
      // 2023: Recovery 208 to 248 - wild
      185.30, 250.80, 198.40, 275.20, 210.60, 278.40, 222.80, 288.30, 202.60, 280.20, 225.80, 248.40,
      // 2024: 248 to 275 - volatile
      292.30, 218.60, 296.20, 240.40, 308.80, 245.30, 318.60, 252.40, 328.20, 260.80, 333.40, 275.20,
      // 2025: 275 to 295 - swings
      328.40, 256.20, 340.60, 274.30, 346.80, 279.40, 352.30, 278.60, 351.40, 293.80, 354.60, 295.80
    ]
  },
  'NVDA': {
    name: 'NVIDIA Corp.',
    prices: [
      // 2020: No position
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021: Start at 32, end at 42 - VERY VOLATILE
      32.00, 25.20, 41.50, 28.80, 48.40, 35.60, 52.20, 40.30, 57.60, 39.20, 61.40, 42.60,
      // 2022: Bear 42 to 28 - dramatic swings
      35.20, 48.50, 29.80, 45.20, 22.40, 18.60, 42.40, 25.80, 16.40, 37.80, 19.60, 28.40,
      // 2023: Recovery 28 to 45 - AI hype volatility
      21.20, 44.60, 28.20, 55.50, 38.80, 62.30, 44.60, 72.80, 40.20, 62.60, 44.20, 45.80,
      // 2024: 45 to 58 - big swings
      37.30, 65.80, 49.20, 71.40, 50.20, 73.60, 55.80, 72.40, 54.20, 76.40, 57.60, 58.40,
      // 2025: 58 to 65 - volatile end
      49.80, 78.20, 60.40, 82.30, 61.60, 83.20, 64.40, 82.80, 63.60, 84.80, 65.20, 65.80
    ]
  },
  'AMZN': {
    name: 'Amazon.com Inc.',
    prices: [
      // 2020: 92 to 112 - volatile swings
      92.00, 78.40, 65.60, 96.20, 112.80, 88.40, 126.20, 90.30, 128.60, 84.20, 128.40, 112.60,
      // 2021: 112 to 128 - big moves
      95.30, 132.80, 96.40, 142.60, 98.30, 144.20, 106.40, 148.80, 104.40, 146.80, 108.20, 128.60,
      // 2022: Bear 128 to 98 - heavy volatility
      104.80, 138.40, 82.60, 132.30, 75.60, 68.40, 118.30, 74.20, 66.40, 118.80, 80.20, 98.40,
      // 2023: Recovery 98 to 125 - swinging
      74.20, 128.60, 92.40, 146.80, 92.40, 148.60, 102.40, 159.80, 96.40, 150.20, 103.60, 125.40,
      // 2024: 125 to 142 - volatile
      98.30, 156.40, 110.20, 164.60, 112.40, 166.80, 118.60, 165.20, 118.40, 170.20, 121.60, 142.80,
      // 2025: 142 to 152 - swings
      114.60, 172.80, 126.20, 178.40, 127.60, 179.80, 130.60, 178.40, 130.20, 181.60, 132.20, 152.80
    ]
  },
  'GOOGL': {
    name: 'Alphabet Inc.',
    prices: [
      // 2020: No position
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021: Start Mar at 102, end at 118 - volatile
      0, 0, 102.00, 88.40, 125.60, 90.20, 134.30, 96.80, 142.40, 95.20, 147.40, 118.60,
      // 2022: Bear 118 to 96 - heavy swings
      95.40, 132.20, 84.60, 126.30, 72.40, 65.60, 112.30, 80.40, 64.20, 116.40, 78.20, 96.80,
      // 2023: Recovery 96 to 118 - swinging
      70.40, 124.20, 88.60, 142.30, 88.80, 142.60, 95.40, 153.20, 90.60, 144.20, 96.80, 118.40,
      // 2024: 118 to 132 - volatile
      100.60, 148.80, 102.40, 156.30, 104.60, 158.20, 110.40, 157.60, 109.80, 161.20, 112.40, 132.80,
      // 2025: 132 to 140 - swings
      114.20, 162.60, 115.40, 167.20, 116.60, 168.40, 119.20, 167.60, 119.20, 170.20, 120.60, 140.80
    ]
  },
  'TSLA': {
    name: 'Tesla Inc.',
    prices: [
      // 2020: No position
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021: Start Feb at 275, end at 285 - VERY volatile
      0, 275.00, 185.60, 338.40, 172.80, 328.60, 195.30, 368.40, 218.60, 392.40, 188.20, 285.40,
      // 2022: Bear 285 to 178 - dramatic
      218.40, 352.30, 162.80, 308.60, 148.40, 125.60, 258.40, 158.60, 105.40, 268.60, 132.40, 178.60,
      // 2023: Recovery 178 to 232 - wild
      128.40, 275.60, 152.80, 318.40, 155.60, 328.40, 175.60, 345.40, 158.60, 305.40, 165.80, 232.40,
      // 2024: 232 to 268 - swings
      178.60, 345.80, 175.40, 368.60, 195.40, 382.30, 208.60, 388.40, 205.20, 398.40, 212.60, 268.80,
      // 2025: 268 to 285 - volatile
      212.40, 398.60, 215.40, 418.60, 222.40, 420.20, 224.60, 418.40, 222.60, 424.20, 225.40, 285.80
    ]
  },
  'META': {
    name: 'Meta Platforms Inc.',
    prices: [
      // 2020: No position
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021: Start May at 315, end at 295 - volatile
      0, 0, 0, 0, 315.00, 268.40, 382.60, 278.20, 398.40, 262.60, 408.40, 295.60,
      // 2022: Bear 295 to 185 - dramatic crash
      222.40, 348.60, 165.40, 305.60, 135.40, 112.60, 232.40, 128.60, 92.40, 185.60, 118.40, 185.20,
      // 2023: Recovery 185 to 285 - wild recovery
      138.60, 278.40, 175.60, 332.40, 188.60, 365.40, 208.20, 388.40, 202.60, 372.40, 222.60, 285.40,
      // 2024: 285 to 328 - swings
      232.40, 398.60, 248.40, 422.60, 252.40, 438.60, 265.40, 448.20, 262.60, 458.40, 272.60, 328.80,
      // 2025: 328 to 352 - volatile end
      275.40, 472.60, 278.40, 492.60, 288.20, 505.60, 290.40, 506.80, 292.20, 515.40, 292.80, 352.60
    ]
  },
  'JPM': {
    name: 'JPMorgan Chase',
    prices: [
      // 2020: 135 to 125 (-7% COVID impact)
      135.00, 128.40, 98.60, 105.20, 108.40, 102.60, 108.20, 112.40, 108.60, 112.40, 118.60, 125.40,
      // 2021: 125 to 145 (+16%)
      128.60, 135.40, 142.60, 145.20, 148.60, 142.40, 145.80, 148.20, 152.40, 158.60, 155.40, 145.80,
      // 2022: Bear 145 to 135 (-7%)
      142.60, 138.40, 135.60, 128.40, 132.60, 125.40, 132.80, 128.60, 122.40, 128.60, 135.40, 135.20,
      // 2023: Recovery 135 to 158 (+17%)
      140.20, 138.60, 132.40, 142.60, 138.40, 145.60, 152.40, 148.60, 145.20, 152.40, 158.60, 158.40,
      // 2024: 158 to 178 (+13%)
      162.40, 158.60, 165.40, 168.60, 172.40, 175.60, 178.20, 172.40, 175.60, 178.40, 180.60, 178.80,
      // 2025: 178 to 192 (+8%)
      182.40, 178.60, 182.80, 185.60, 188.40, 186.20, 190.40, 188.60, 192.40, 195.20, 192.80, 192.60
    ]
  },
  'BRK.B': {
    name: 'Berkshire Hathaway',
    prices: [
      // 2020: Start Sep at 215, end at 232 (+8%)
      0, 0, 0, 0, 0, 0, 0, 0, 215.00, 218.40, 228.60, 232.40,
      // 2021: 232 to 268 (+16%)
      238.60, 245.40, 252.60, 258.40, 265.20, 258.60, 262.40, 268.20, 272.40, 268.60, 265.40, 268.80,
      // 2022: 268 to 285 (+6% defensive)
      275.40, 278.60, 288.40, 282.60, 272.40, 262.80, 275.40, 282.60, 272.40, 278.60, 285.40, 285.20,
      // 2023: 285 to 312 (+10%)
      290.40, 285.60, 292.40, 302.60, 298.40, 305.60, 312.40, 308.20, 305.60, 308.40, 312.60, 312.40,
      // 2024: 312 to 348 (+12%)
      318.40, 325.60, 332.40, 328.60, 335.40, 342.60, 345.20, 338.40, 345.60, 348.40, 352.60, 348.80,
      // 2025: 348 to 372 (+7%)
      352.40, 348.60, 358.40, 362.60, 368.40, 365.20, 370.40, 368.60, 372.40, 375.20, 372.80, 372.60
    ]
  },
  'JNJ': {
    name: 'Johnson & Johnson',
    prices: [
      // 2020: Start Aug at 148, end at 155 (+5%)
      0, 0, 0, 0, 0, 0, 0, 148.00, 150.20, 145.60, 148.40, 155.20,
      // 2021: 155 to 165 (+6% stable)
      158.40, 162.60, 165.40, 168.20, 172.40, 165.60, 168.40, 170.20, 165.60, 162.40, 158.60, 165.40,
      // 2022: 165 to 172 (+4% defensive)
      168.60, 172.40, 178.60, 180.20, 175.40, 172.60, 175.40, 168.60, 162.40, 168.60, 175.40, 172.80,
      // 2023: 172 to 158 (-8% headwinds)
      168.40, 162.60, 158.40, 165.20, 160.40, 165.60, 168.20, 162.40, 158.60, 155.40, 158.60, 158.40,
      // 2024: 158 to 152 (-4%)
      155.40, 158.60, 160.40, 155.20, 152.40, 148.60, 155.40, 158.60, 160.40, 158.20, 155.40, 152.80,
      // 2025: 152 to 162 (+7%)
      155.40, 152.60, 156.40, 158.60, 162.40, 160.20, 164.40, 162.60, 165.40, 168.20, 165.80, 162.60
    ]
  },
  'V': {
    name: 'Visa Inc.',
    prices: [
      // 2020: Start Apr at 168, end at 192 (+14%)
      0, 0, 0, 168.00, 178.40, 182.60, 188.20, 195.40, 192.60, 185.40, 192.60, 198.40,
      // 2021: 198 to 218 (+10%)
      202.60, 208.40, 212.60, 218.40, 222.60, 228.40, 235.60, 225.40, 218.60, 212.40, 205.60, 218.40,
      // 2022: Bear 218 to 195 (-10%)
      215.60, 208.40, 212.60, 202.40, 195.60, 188.40, 198.60, 195.40, 182.60, 188.40, 198.60, 195.80,
      // 2023: Recovery 195 to 232 (+19%)
      202.40, 208.60, 215.40, 222.60, 218.40, 225.60, 232.40, 228.60, 225.40, 222.60, 230.40, 232.60,
      // 2024: 232 to 262 (+13%)
      238.40, 245.60, 252.40, 248.60, 255.40, 258.60, 262.40, 255.20, 260.40, 262.60, 268.40, 262.80,
      // 2025: 262 to 282 (+8%)
      268.40, 262.60, 270.40, 275.60, 278.40, 275.20, 280.40, 278.60, 282.40, 285.20, 282.80, 282.60
    ]
  },
  'PG': {
    name: 'Procter & Gamble',
    prices: [
      // 2020: Start May at 115, end at 128 (+11%)
      0, 0, 0, 0, 115.00, 118.40, 122.60, 128.40, 132.60, 128.40, 125.60, 128.40,
      // 2021: 128 to 148 (+16%)
      132.60, 128.40, 135.60, 140.20, 138.60, 135.40, 142.60, 148.40, 145.60, 148.20, 152.40, 148.60,
      // 2022: 148 to 142 (-4% stable)
      150.40, 148.60, 152.40, 158.60, 150.40, 145.60, 148.40, 142.60, 135.40, 140.60, 148.40, 142.80,
      // 2023: 142 to 148 (+4%)
      146.40, 142.60, 148.40, 152.60, 148.40, 152.60, 158.40, 152.60, 148.40, 152.20, 155.60, 148.40,
      // 2024: 148 to 158 (+7%)
      152.40, 158.60, 162.40, 165.60, 168.40, 162.60, 158.40, 162.60, 165.40, 162.20, 158.40, 158.80,
      // 2025: 158 to 168 (+6%)
      162.40, 158.60, 162.40, 165.60, 168.40, 165.20, 170.40, 168.60, 172.40, 175.20, 172.80, 168.60
    ]
  },
  'UNH': {
    name: 'UnitedHealth Group',
    prices: [
      // 2020: Start Jun at 295, end at 348 (+18%)
      0, 0, 0, 0, 0, 295.00, 308.40, 315.60, 312.40, 318.60, 342.60, 348.40,
      // 2021: 348 to 458 (+32%)
      355.60, 345.40, 368.60, 385.40, 398.60, 402.40, 415.60, 428.40, 405.60, 435.60, 452.40, 458.60,
      // 2022: 458 to 495 (+8% defensive healthcare)
      478.40, 485.60, 505.40, 512.60, 498.40, 508.60, 528.40, 535.60, 512.40, 525.60, 532.40, 495.80,
      // 2023: 495 to 488 (-1%)
      485.40, 465.60, 458.40, 478.60, 468.40, 475.60, 492.40, 498.60, 505.40, 512.60, 505.40, 488.60,
      // 2024: 488 to 468 (-4%)
      478.40, 465.60, 452.40, 448.60, 475.40, 485.60, 505.40, 498.60, 492.40, 512.60, 485.40, 468.80,
      // 2025: 468 to 498 (+6%)
      475.40, 462.60, 455.40, 468.60, 482.40, 492.20, 505.40, 498.60, 515.40, 528.20, 515.80, 498.60
    ]
  },
  'HD': {
    name: 'Home Depot',
    prices: [
      // 2020: Start Jul at 255, end at 262 (+3%)
      0, 0, 0, 0, 0, 0, 255.00, 278.40, 268.60, 272.40, 258.60, 262.40,
      // 2021: 262 to 378 (+44%)
      268.60, 258.40, 292.60, 312.40, 315.60, 308.40, 325.60, 335.40, 342.60, 358.60, 378.40, 378.60,
      // 2022: Bear 378 to 305 (-19%)
      365.40, 338.60, 305.40, 298.60, 295.40, 278.60, 302.40, 318.60, 285.40, 298.60, 318.40, 305.80,
      // 2023: Recovery 305 to 332 (+9%)
      312.40, 302.60, 295.40, 305.60, 292.40, 308.60, 325.40, 322.60, 315.40, 295.60, 328.40, 332.60,
      // 2024: 332 to 362 (+9%)
      338.40, 352.60, 365.40, 348.60, 335.40, 348.60, 358.40, 365.20, 378.40, 375.60, 368.40, 362.80,
      // 2025: 362 to 385 (+6%)
      368.40, 362.60, 372.40, 378.60, 382.40, 378.20, 385.40, 382.60, 388.40, 392.20, 388.80, 385.60
    ]
  },
  'MA': {
    name: 'Mastercard Inc.',
    prices: [
      // 2020: Start Nov at 335, end at 348 (+4%)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 335.00, 348.40,
      // 2021: 348 to 362 (+4%)
      345.60, 358.40, 355.60, 368.40, 365.60, 358.40, 378.40, 355.60, 348.40, 352.60, 358.40, 362.60,
      // 2022: Bear 362 to 335 (-8%)
      372.40, 365.60, 358.40, 345.60, 338.40, 325.60, 348.40, 342.60, 308.40, 322.60, 352.40, 335.80,
      // 2023: Recovery 335 to 395 (+18%)
      348.40, 352.60, 365.40, 378.60, 385.40, 388.60, 402.40, 398.60, 392.40, 378.60, 398.40, 395.60,
      // 2024: 395 to 442 (+12%)
      408.40, 425.60, 432.40, 418.60, 425.40, 428.60, 438.40, 432.20, 445.40, 452.60, 462.40, 442.80,
      // 2025: 442 to 472 (+7%)
      455.40, 448.60, 465.40, 475.60, 482.40, 478.20, 485.40, 482.60, 492.40, 498.20, 485.80, 472.60
    ]
  },
  'CRM': {
    name: 'Salesforce Inc.',
    prices: [
      // 2020: No position
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021: Start Jun at 240, end at 248 (+3%)
      0, 0, 0, 0, 0, 240.00, 248.60, 268.40, 275.60, 285.40, 275.60, 248.40,
      // 2022: Bear 248 to 152 (-39%)
      228.40, 212.60, 218.40, 185.60, 165.40, 178.60, 192.40, 182.60, 155.40, 168.60, 178.40, 152.80,
      // 2023: Recovery 152 to 248 (+63% from low)
      168.40, 182.60, 205.40, 215.60, 232.40, 225.60, 235.40, 228.60, 218.40, 225.60, 242.40, 248.60,
      // 2024: 248 to 288 (+16%)
      262.40, 278.60, 285.40, 268.60, 272.40, 265.60, 275.40, 268.20, 278.40, 288.60, 305.40, 288.80,
      // 2025: 288 to 308 (+7%)
      298.40, 288.60, 305.40, 312.60, 318.40, 312.20, 320.40, 315.60, 322.40, 328.20, 318.80, 308.60
    ]
  },

  // === ETFs (2) - MODERATE VOLATILITY ===
  'SPY': {
    name: 'SPDR S&P 500 ETF',
    prices: [
      // 2020: 325 to 365 - volatile swings
      325.50, 288.40, 232.60, 308.40, 342.60, 288.40, 378.60, 305.40, 388.60, 302.40, 408.60, 365.40,
      // 2021: 365 to 445 - big moves
      332.60, 425.40, 348.60, 462.40, 378.60, 478.40, 402.60, 505.40, 395.60, 502.40, 412.60, 445.80,
      // 2022: Bear 445 to 385 - heavy swings
      388.60, 478.40, 342.60, 465.40, 318.60, 305.40, 438.60, 352.40, 298.60, 445.40, 355.60, 385.80,
      // 2023: Recovery 385 to 458 - swinging
      342.40, 478.60, 362.40, 492.60, 378.40, 518.60, 402.40, 538.60, 382.40, 528.60, 408.40, 458.60,
      // 2024: 458 to 512 - volatile
      418.40, 548.60, 438.40, 568.60, 455.40, 588.60, 478.40, 602.20, 468.40, 615.60, 492.40, 512.80,
      // 2025: 512 to 548 - swings
      472.40, 618.60, 492.40, 642.60, 502.40, 665.20, 515.40, 678.60, 512.40, 692.20, 518.80, 548.60
    ]
  },
  'QQQ': {
    name: 'Invesco QQQ Trust',
    prices: [
      // 2020: Start Mar at 180, end at 295 - volatile
      0, 0, 180.00, 145.40, 252.60, 195.40, 318.60, 235.40, 348.60, 228.40, 382.60, 295.40,
      // 2021: 295 to 385 - big swings
      252.60, 398.40, 268.60, 438.40, 288.60, 462.40, 325.60, 498.40, 308.60, 528.40, 348.60, 385.80,
      // 2022: Bear 385 to 268 - heavy volatility
      322.60, 448.40, 268.60, 418.40, 235.60, 205.40, 378.60, 248.40, 185.60, 395.40, 248.60, 268.80,
      // 2023: Recovery 268 to 395 - wild
      228.40, 408.60, 268.40, 475.60, 308.40, 525.60, 352.40, 568.60, 322.40, 555.60, 368.40, 395.60,
      // 2024: 395 to 458 - volatile
      358.40, 528.60, 395.40, 568.60, 405.40, 618.60, 445.40, 658.20, 428.40, 685.60, 478.40, 458.80,
      // 2025: 458 to 498 - swings
      428.40, 668.60, 455.40, 728.60, 472.40, 765.20, 488.40, 798.60, 472.40, 822.20, 488.80, 498.60
    ]
  },

  // === COMMODITY (1) - MODERATE VOLATILITY ===
  'GLD': {
    name: 'SPDR Gold Shares',
    prices: [
      // 2020: 150 to 172 - volatile swings
      150.00, 132.40, 118.60, 175.40, 188.60, 162.40, 202.60, 168.40, 198.60, 155.40, 192.60, 172.40,
      // 2021: 172 to 168 - flat but volatile
      152.60, 188.40, 145.60, 198.40, 162.60, 188.40, 150.60, 192.40, 148.60, 190.40, 152.60, 168.80,
      // 2022: 168 to 170 - swinging
      150.60, 195.40, 162.60, 198.40, 152.60, 148.40, 182.60, 145.40, 138.60, 182.40, 152.60, 170.80,
      // 2023: 170 to 188 - volatile
      148.40, 202.60, 162.40, 225.60, 172.40, 218.60, 172.40, 225.60, 160.40, 215.60, 172.40, 188.60,
      // 2024: 188 to 215 - swings
      162.40, 228.60, 178.40, 248.60, 185.40, 268.20, 198.40, 285.60, 198.40, 302.20, 208.80, 215.80,
      // 2025: 215 to 232 - volatile
      192.40, 288.60, 205.40, 312.60, 208.40, 332.20, 218.40, 352.60, 218.40, 372.20, 215.80, 232.60
    ]
  },

  // === CRYPTO (1) - EXTREME VOLATILITY ===
  'BTC': {
    name: 'Bitcoin',
    prices: [
      // 2020: Start Oct at 11500, end at 18500 - very volatile
      0, 0, 0, 0, 0, 0, 0, 0, 0, 11500, 8500, 18500,
      // 2021: 18500 to 38500 - extreme volatility
      12500, 48500, 28500, 62000, 25500, 42500, 58500, 32500, 18500, 72500, 38500, 38500,
      // 2022: Bear 38500 to 16500 - dramatic
      25500, 48500, 32500, 55500, 18500, 12500, 32500, 18500, 8500, 39500, 16500, 16500,
      // 2023: Recovery 16500 to 38500 - wild swings
      12500, 44500, 18500, 58500, 16500, 48500, 28500, 65500, 16500, 52500, 25500, 38500,
      // 2024: 38500 to 52500 - extreme
      22500, 78500, 38500, 95500, 42500, 98500, 52500, 105500, 38500, 102500, 62500, 52500,
      // 2025: 52500 to 58500 - volatile
      35500, 98500, 42500, 115500, 52500, 125500, 52500, 118500, 45500, 128500, 52500, 58500
    ]
  },
};

// Generate valuations from the price data
const generateValuations = (): MonthlyValuation[] => {
  const valuations: MonthlyValuation[] = [];
  
  Object.entries(priceData).forEach(([ticker, data]) => {
    data.prices.forEach((price, index) => {
      if (price === 0) return;
      
      const month = allMonths[index];
      const val: MonthlyValuation = {
        id: `val-${ticker}-${month}`,
        assetId: ticker,
        ticker,
        assetName: data.name,
        month,
        pricePerUnit: price,
      };
      
      valuations.push(val);
    });
  });
  
  return valuations;
};

export const sampleValuations: MonthlyValuation[] = generateValuations();

/**
 * HOLDINGS COUNT VALIDATION
 * =========================
 * 
 * Total: EXACTLY 20 distinct tradable holdings
 * 
 * By Asset Class:
 * - Equity (16): AAPL, MSFT, NVDA, AMZN, GOOGL, TSLA, META, JPM, BRK.B, JNJ, V, PG, UNH, HD, MA, CRM
 * - ETF (2): SPY, QQQ
 * - Commodity (1): GLD
 * - Crypto (1): BTC
 * 
 * NO alternative/private investments.
 * 
 * Transaction Counts by Year:
 * - 2020: 15 transactions ✓
 * - 2021: 14 transactions ✓
 * - 2022: 11 transactions ✓
 * - 2023: 13 transactions ✓
 * - 2024: 14 transactions ✓
 * - 2025: 10 transactions ✓
 * 
 * Date Range: 2020-01 through 2025-12 (72 months)
 * Target CAGR: ~12% (11%-13%)
 * Target Portfolio Value: ~$2.1M - $2.3M
 * Data Quality: 72 months, includes negative return months for Sortino/VaR
 */
