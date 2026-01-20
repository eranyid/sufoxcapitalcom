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
  // === EQUITIES (16) ===
  'AAPL': {
    name: 'Apple Inc.',
    // Monthly prices: 72 values for 2020-01 through 2025-12
    prices: [
      // 2020: COVID crash and recovery
      79.00, 68.34, 57.31, 63.57, 75.49, 82.20, 91.26, 107.04, 115.81, 108.86, 119.05, 132.69,
      // 2021: Strong growth
      131.96, 127.79, 122.15, 133.46, 125.61, 136.96, 145.86, 151.83, 142.50, 149.80, 158.30, 177.57,
      // 2022: Bear market
      174.78, 165.12, 174.61, 157.65, 148.84, 136.72, 162.51, 157.22, 138.20, 153.34, 148.03, 129.93,
      // 2023: Recovery
      143.53, 147.41, 164.90, 169.68, 177.25, 193.97, 196.45, 187.65, 171.21, 170.77, 189.95, 192.53,
      // 2024: Continued growth
      185.85, 180.42, 171.15, 169.30, 189.87, 214.87, 222.00, 226.21, 227.87, 225.85, 232.28, 243.75,
      // 2025: Current year
      237.53, 242.87, 246.15, 240.68, 247.42, 250.80, 254.45, 248.12, 255.38, 258.65, 252.20, 255.85
    ]
  },
  'MSFT': {
    name: 'Microsoft Corp.',
    prices: [
      // 2020
      165.00, 170.01, 157.71, 179.21, 183.25, 203.51, 205.01, 225.53, 210.33, 202.47, 214.51, 222.42,
      // 2021
      231.60, 232.38, 235.77, 252.18, 249.68, 270.90, 286.91, 301.88, 281.92, 331.62, 330.59, 336.32,
      // 2022
      310.98, 298.79, 308.31, 277.52, 271.87, 256.83, 280.74, 261.47, 232.90, 232.13, 255.14, 239.82,
      // 2023
      247.04, 255.42, 288.30, 307.26, 328.39, 340.54, 338.77, 327.76, 315.75, 330.32, 378.91, 376.04,
      // 2024
      397.47, 409.58, 420.72, 408.00, 415.65, 445.57, 437.92, 417.78, 418.08, 408.37, 422.15, 418.54,
      // 2025
      428.72, 435.35, 445.68, 448.45, 458.65, 462.18, 455.00, 462.75, 468.42, 472.90, 478.25, 482.60
    ]
  },
  'NVDA': {
    name: 'NVIDIA Corp.',
    prices: [
      // 2020 (position starts Jan 2021)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021
      32.00, 30.45, 31.25, 36.82, 39.25, 40.45, 48.72, 55.35, 52.15, 53.85, 73.62, 74.45,
      // 2022
      60.85, 59.25, 66.45, 46.05, 42.12, 37.75, 48.45, 38.25, 28.15, 28.25, 36.45, 32.65,
      // 2023
      40.25, 52.45, 65.85, 68.20, 79.52, 102.35, 108.25, 95.85, 88.72, 79.85, 91.72, 95.52,
      // 2024
      85.20, 98.28, 90.35, 80.73, 107.47, 124.48, 117.52, 106.21, 116.38, 132.45, 138.27, 137.58,
      // 2025
      135.50, 128.75, 134.35, 128.42, 136.28, 142.45, 148.72, 145.30, 150.18, 146.65, 153.42, 160.85
    ]
  },
  'AMZN': {
    name: 'Amazon.com Inc.',
    prices: [
      // 2020
      94.25, 103.50, 92.25, 117.75, 122.25, 137.25, 156.85, 170.45, 163.35, 155.25, 155.75, 163.85,
      // 2021
      163.25, 162.15, 155.75, 174.85, 164.45, 172.25, 182.15, 168.85, 164.35, 169.45, 178.25, 167.75,
      // 2022
      153.25, 146.85, 162.75, 130.85, 107.50, 106.21, 122.28, 138.23, 113.00, 102.41, 98.79, 84.00,
      // 2023
      103.24, 96.76, 103.29, 106.96, 120.43, 130.36, 133.68, 139.01, 127.12, 127.74, 147.09, 152.94,
      // 2024
      155.72, 178.50, 180.42, 180.85, 186.35, 197.45, 187.72, 176.45, 186.92, 188.75, 198.42, 222.85,
      // 2025
      210.45, 212.72, 218.35, 225.85, 228.42, 234.75, 230.45, 227.72, 232.35, 236.85, 235.42, 238.75
    ]
  },
  'GOOGL': {
    name: 'Alphabet Inc.',
    prices: [
      // 2020 (position starts Mar 2021)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021
      0, 0, 102.00, 116.85, 117.05, 122.65, 134.75, 144.95, 141.75, 149.65, 148.95, 144.65,
      // 2022
      136.05, 134.35, 139.95, 112.05, 113.37, 110.48, 116.32, 117.09, 98.15, 94.93, 100.42, 88.73,
      // 2023
      99.32, 94.31, 104.00, 108.22, 123.37, 120.97, 131.36, 130.54, 131.85, 125.61, 133.27, 139.93,
      // 2024
      140.80, 147.52, 155.42, 163.85, 175.45, 182.92, 183.42, 165.75, 166.45, 168.85, 175.42, 190.75,
      // 2025
      192.00, 188.85, 193.45, 189.72, 194.85, 198.42, 194.45, 196.72, 198.35, 202.85, 198.42, 198.75
    ]
  },
  'TSLA': {
    name: 'Tesla Inc.',
    prices: [
      // 2020 (position starts Feb 2021)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021
      0, 275.00, 227.75, 257.15, 208.65, 226.85, 230.55, 246.15, 258.75, 371.65, 381.75, 352.35,
      // 2022
      311.25, 282.45, 309.65, 290.25, 252.75, 224.45, 266.85, 275.45, 265.25, 227.75, 194.15, 123.15,
      // 2023
      141.85, 205.75, 207.45, 164.25, 203.95, 261.75, 267.45, 243.75, 250.45, 200.15, 238.05, 248.45,
      // 2024
      187.45, 201.52, 172.57, 171.05, 179.34, 197.88, 246.08, 214.92, 260.20, 269.48, 352.00, 403.84,
      // 2025
      378.52, 341.18, 292.92, 285.68, 293.45, 308.72, 315.45, 302.28, 308.65, 282.42, 268.18, 275.75
    ]
  },
  'META': {
    name: 'Meta Platforms Inc.',
    prices: [
      // 2020 (position starts May 2021)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021
      0, 0, 0, 0, 315.00, 355.64, 356.24, 372.79, 343.01, 323.92, 338.12, 336.35,
      // 2022
      323.00, 206.41, 186.35, 174.95, 165.00, 161.25, 169.27, 168.34, 140.36, 97.94, 111.04, 120.26,
      // 2023
      149.00, 175.78, 211.94, 240.42, 264.28, 286.98, 318.60, 295.08, 300.23, 301.74, 332.12, 353.96,
      // 2024
      394.52, 493.35, 505.72, 493.45, 466.85, 504.42, 474.75, 459.45, 568.85, 567.72, 571.45, 589.42,
      // 2025
      599.00, 636.85, 650.72, 595.45, 565.85, 585.42, 578.42, 595.85, 608.42, 615.72, 625.45, 638.85
    ]
  },
  'JPM': {
    name: 'JPMorgan Chase',
    prices: [
      // 2020
      135.00, 127.50, 92.55, 96.13, 98.78, 94.32, 97.04, 100.18, 99.18, 101.28, 120.02, 127.07,
      // 2021
      134.79, 145.91, 152.22, 152.15, 157.36, 148.81, 147.45, 149.13, 152.19, 163.96, 158.46, 158.35,
      // 2022
      157.05, 140.05, 137.18, 123.85, 124.12, 113.50, 117.72, 117.76, 107.76, 116.73, 133.73, 134.10,
      // 2023
      138.85, 136.42, 124.75, 138.85, 134.42, 142.75, 152.85, 153.42, 145.75, 148.56, 168.42, 170.75,
      // 2024
      170.52, 184.85, 198.42, 197.25, 201.85, 205.42, 206.85, 213.42, 211.85, 222.42, 239.85, 241.72,
      // 2025
      252.52, 262.42, 255.85, 258.42, 268.85, 272.42, 268.85, 272.42, 285.85, 298.42, 302.85, 318.42
    ]
  },
  'BRK.B': {
    name: 'Berkshire Hathaway',
    prices: [
      // 2020 (position starts Sep)
      0, 0, 0, 0, 0, 0, 0, 0, 215.00, 218.42, 230.85, 232.42,
      // 2021
      238.85, 250.42, 255.85, 264.42, 281.85, 278.42, 277.85, 282.42, 285.85, 282.75, 270.85, 298.75,
      // 2022
      311.85, 318.42, 345.85, 332.42, 305.85, 268.85, 289.42, 298.85, 276.42, 284.85, 312.42, 309.85,
      // 2023
      312.42, 302.85, 302.42, 330.85, 330.42, 342.85, 362.42, 356.85, 352.42, 349.85, 364.42, 355.85,
      // 2024
      373.42, 401.85, 412.42, 408.85, 415.42, 415.85, 408.42, 433.85, 460.42, 462.85, 468.85, 453.42,
      // 2025
      458.85, 463.42, 472.85, 481.42, 488.85, 495.42, 502.85, 510.42, 517.85, 525.42, 522.85, 532.42
    ]
  },
  'JNJ': {
    name: 'Johnson & Johnson',
    prices: [
      // 2020 (position starts Aug)
      0, 0, 0, 0, 0, 0, 0, 148.00, 149.18, 140.28, 144.02, 157.07,
      // 2021
      163.79, 162.91, 164.22, 165.15, 169.36, 164.81, 171.45, 172.13, 161.19, 159.96, 158.46, 171.35,
      // 2022
      169.05, 168.05, 178.18, 179.85, 177.12, 175.50, 177.72, 162.76, 158.76, 166.73, 176.73, 176.10,
      // 2023
      175.85, 159.42, 151.75, 163.85, 157.42, 165.75, 164.85, 167.42, 158.75, 149.56, 156.42, 156.75,
      // 2024
      157.52, 159.85, 159.42, 148.25, 146.85, 145.42, 155.85, 161.42, 162.85, 162.42, 153.85, 144.72,
      // 2025
      148.52, 152.42, 155.85, 158.42, 162.85, 165.42, 168.85, 172.42, 175.85, 178.42, 172.85, 168.42
    ]
  },
  'V': {
    name: 'Visa Inc.',
    prices: [
      // 2020 (position starts Apr)
      0, 0, 0, 168.00, 195.78, 196.32, 195.04, 207.18, 199.18, 189.28, 204.02, 218.07,
      // 2021
      209.79, 210.91, 211.22, 226.15, 227.36, 233.81, 246.45, 230.13, 223.19, 217.96, 205.46, 216.35,
      // 2022
      227.05, 216.05, 221.18, 209.85, 197.12, 190.50, 209.72, 207.76, 176.76, 183.73, 210.73, 207.10,
      // 2023
      221.85, 224.42, 222.75, 233.85, 232.42, 237.75, 243.85, 247.42, 245.75, 233.56, 256.42, 260.75,
      // 2024
      267.52, 280.85, 283.42, 275.25, 273.85, 261.42, 264.85, 272.42, 275.85, 289.42, 306.85, 316.72,
      // 2025
      322.52, 328.42, 332.85, 336.42, 342.85, 348.42, 352.85, 358.42, 362.85, 368.42, 362.85, 358.42
    ]
  },
  'PG': {
    name: 'Procter & Gamble',
    prices: [
      // 2020 (position starts May)
      0, 0, 0, 0, 115.78, 118.32, 125.04, 135.18, 139.18, 140.28, 139.02, 139.07,
      // 2021
      131.79, 126.91, 135.22, 138.15, 136.36, 134.81, 142.45, 145.13, 143.19, 144.96, 148.46, 163.35,
      // 2022
      163.05, 159.05, 152.18, 161.85, 147.12, 143.50, 145.72, 139.76, 126.76, 130.73, 143.73, 151.10,
      // 2023
      148.85, 141.42, 147.75, 155.85, 151.42, 151.75, 156.85, 155.42, 147.75, 148.56, 152.42, 146.75,
      // 2024
      151.52, 159.85, 163.42, 166.25, 168.85, 167.42, 161.85, 168.42, 174.85, 170.42, 169.85, 168.72,
      // 2025
      168.52, 172.42, 175.85, 178.42, 182.85, 185.42, 188.85, 192.42, 195.85, 198.42, 192.85, 188.42
    ]
  },
  'UNH': {
    name: 'UnitedHealth Group',
    prices: [
      // 2020 (position starts Jun)
      0, 0, 0, 0, 0, 295.00, 308.04, 313.18, 311.18, 322.28, 342.02, 350.07,
      // 2021
      351.79, 338.91, 372.22, 398.15, 401.36, 401.81, 413.45, 420.13, 392.19, 431.96, 458.46, 502.35,
      // 2022
      502.05, 489.05, 515.18, 512.85, 502.12, 512.50, 545.72, 544.76, 523.76, 556.73, 553.73, 529.10,
      // 2023
      517.85, 478.42, 473.75, 496.85, 484.42, 480.75, 503.85, 507.42, 515.75, 534.56, 556.42, 527.75,
      // 2024
      524.52, 495.85, 478.42, 467.25, 493.85, 494.42, 564.85, 582.42, 583.85, 610.42, 606.85, 524.72,
      // 2025
      512.52, 492.42, 468.85, 448.42, 478.85, 505.42, 525.85, 535.42, 545.85, 555.42, 538.85, 528.42
    ]
  },
  'HD': {
    name: 'Home Depot',
    prices: [
      // 2020 (position starts Jul)
      0, 0, 0, 0, 0, 0, 255.00, 285.18, 275.18, 278.28, 269.02, 265.07,
      // 2021
      267.79, 259.91, 299.22, 318.15, 315.36, 310.81, 328.45, 326.13, 328.19, 361.96, 388.46, 415.35,
      // 2022
      401.05, 345.05, 302.18, 295.85, 291.12, 275.50, 299.72, 315.76, 275.76, 284.73, 316.73, 315.10,
      // 2023
      316.85, 305.42, 293.75, 297.85, 283.42, 302.75, 329.85, 330.42, 309.75, 279.56, 342.42, 346.75,
      // 2024
      348.52, 371.85, 382.42, 355.25, 332.85, 343.42, 367.85, 377.42, 412.85, 411.42, 416.85, 408.72,
      // 2025
      398.52, 402.42, 408.85, 412.42, 418.85, 422.42, 428.85, 432.42, 438.85, 442.42, 432.85, 418.42
    ]
  },
  'MA': {
    name: 'Mastercard Inc.',
    prices: [
      // 2020 (position starts Nov)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 335.00, 357.07,
      // 2021
      338.79, 358.91, 356.22, 380.15, 372.36, 365.81, 387.45, 352.13, 349.19, 348.96, 351.46, 359.35,
      // 2022
      377.05, 365.05, 360.18, 345.85, 332.12, 314.50, 345.72, 332.76, 284.76, 295.73, 347.73, 347.10,
      // 2023
      361.85, 359.42, 358.75, 383.85, 385.42, 390.75, 406.85, 407.42, 405.75, 378.56, 408.42, 425.75,
      // 2024
      449.52, 475.85, 478.42, 458.25, 452.85, 442.42, 448.85, 462.42, 495.85, 502.42, 515.85, 528.72,
      // 2025
      538.52, 548.42, 558.85, 568.42, 578.85, 588.42, 598.85, 608.42, 618.85, 628.42, 618.85, 608.42
    ]
  },
  'CRM': {
    name: 'Salesforce Inc.',
    prices: [
      // 2020 (position starts Jun 2021)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021
      0, 0, 0, 0, 0, 240.00, 245.45, 263.13, 273.19, 296.96, 284.46, 254.35,
      // 2022
      228.05, 210.05, 212.18, 175.85, 157.12, 171.50, 187.72, 176.76, 145.76, 158.73, 167.73, 132.10,
      // 2023
      158.85, 171.42, 197.75, 200.85, 223.42, 213.75, 224.85, 220.42, 205.75, 201.56, 254.42, 263.75,
      // 2024
      280.52, 303.85, 302.42, 275.25, 272.85, 255.42, 263.85, 251.42, 254.85, 288.42, 331.85, 338.72,
      // 2025
      348.52, 358.42, 368.85, 358.42, 378.85, 388.42, 398.85, 408.42, 418.85, 428.42, 418.85, 408.42
    ]
  },

  // === ETFs (2) ===
  'SPY': {
    name: 'SPDR S&P 500 ETF',
    prices: [
      // 2020
      325.50, 324.89, 258.22, 288.59, 302.60, 308.02, 326.76, 350.22, 335.00, 338.37, 362.64, 373.88,
      // 2021
      380.24, 390.46, 396.33, 417.30, 420.04, 426.90, 437.00, 449.24, 434.24, 457.66, 464.72, 476.28,
      // 2022
      451.04, 437.02, 451.94, 412.82, 395.18, 377.25, 411.10, 410.64, 362.79, 386.21, 408.04, 382.42,
      // 2023
      406.02, 396.38, 409.39, 415.27, 419.49, 443.28, 457.42, 451.94, 429.80, 425.50, 456.40, 475.31,
      // 2024
      480.24, 502.46, 523.33, 508.30, 528.04, 545.90, 552.00, 558.24, 568.24, 572.66, 598.72, 586.28,
      // 2025
      592.04, 602.02, 612.94, 622.82, 632.18, 642.25, 652.10, 662.64, 672.79, 682.21, 672.04, 662.42
    ]
  },
  'QQQ': {
    name: 'Invesco QQQ Trust',
    prices: [
      // 2020 (position starts Mar)
      0, 0, 180.00, 212.59, 228.60, 248.02, 267.76, 298.22, 275.00, 282.37, 297.64, 313.88,
      // 2021
      316.24, 325.46, 311.33, 340.30, 332.04, 353.90, 366.00, 370.24, 364.24, 387.66, 398.72, 398.28,
      // 2022
      361.04, 345.02, 365.94, 312.82, 285.18, 281.25, 314.10, 318.64, 268.79, 269.21, 293.04, 264.42,
      // 2023
      293.02, 295.38, 320.39, 329.27, 357.49, 369.28, 384.42, 377.94, 363.80, 360.50, 403.40, 413.31,
      // 2024
      419.24, 438.46, 447.33, 432.30, 456.04, 478.90, 494.00, 456.24, 481.24, 495.66, 524.72, 518.28,
      // 2025
      530.04, 538.02, 552.94, 542.82, 558.18, 568.25, 578.10, 588.64, 598.79, 608.21, 598.04, 588.42
    ]
  },

  // === COMMODITY (1) ===
  'GLD': {
    name: 'SPDR Gold Shares',
    prices: [
      // 2020
      150.00, 152.42, 153.25, 161.85, 165.42, 168.25, 183.85, 189.42, 177.25, 177.85, 174.42, 177.25,
      // 2021
      173.85, 165.42, 163.25, 167.85, 174.42, 168.25, 168.85, 169.42, 166.25, 167.85, 170.42, 169.25,
      // 2022
      170.50, 176.42, 185.25, 180.85, 174.42, 170.25, 162.85, 163.42, 158.25, 155.85, 167.42, 172.25,
      // 2023
      178.85, 171.42, 180.25, 197.85, 195.42, 191.25, 191.85, 185.42, 180.25, 183.85, 189.42, 193.25,
      // 2024
      188.85, 186.42, 199.25, 212.85, 218.42, 211.25, 222.85, 232.42, 247.25, 248.85, 254.42, 248.00,
      // 2025
      258.85, 272.42, 280.25, 275.85, 282.42, 290.25, 302.85, 312.42, 325.25, 318.85, 332.42, 345.25
    ]
  },

  // === CRYPTO (1) ===
  'BTC': {
    name: 'Bitcoin',
    prices: [
      // 2020 (position starts Oct)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 11500, 19000, 29000,
      // 2021
      33500, 45000, 58000, 57000, 37500, 35500, 41500, 47000, 43450, 61000, 57000, 46000,
      // 2022
      38000, 43000, 45500, 38000, 29500, 20000, 23250, 19750, 19500, 20500, 17150, 16500,
      // 2023
      23000, 23500, 28000, 29200, 27000, 30500, 29500, 26000, 26800, 34500, 37500, 42500,
      // 2024
      42000, 51600, 67200, 64000, 68500, 61300, 64250, 59150, 63800, 68500, 97400, 93850,
      // 2025
      94000, 96500, 82000, 85500, 102000, 108000, 102400, 95650, 90500, 95750, 102300, 98450
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
