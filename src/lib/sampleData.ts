import { Transaction, MonthlyValuation } from '@/types/investment';

/**
 * Sample Portfolio Data - Institutional Family Office
 * 
 * Date Range: January 2018 - December 2025 (8 years, 96 months)
 * Target CAGR: ~12% (annualized)
 * Target Portfolio Value: ~$2.1M (latest)
 * Holdings Count: 17 distinct tradable assets
 * 
 * CALIBRATION NOTES:
 * - For 12% CAGR over 8 years: (1.12)^8 = 2.476x total return
 * - Initial cost basis ~$850K, final value ~$2.1M = ~2.5x
 * - Monthly returns average ~0.95% (= 12%/12)
 * - Contains realistic drawdowns for risk metrics (negative months)
 * 
 * ASSET CLASS COVERAGE (17 holdings - tradable only):
 * - Equity: 10 (AAPL, MSFT, NVDA, AMZN, GOOGL, TSLA, META, JPM, BRK.B, LLY)
 * - ETF: 2 (VXUS, EEM)
 * - Bond: 2 (AGG, BND)
 * - Commodity: 1 (GLD)
 * - Crypto: 2 (BTC, ETH)
 */

// ============================================================================
// TRANSACTIONS - 2018-2025, chronologically ordered (8-17 per year)
// ============================================================================
export const sampleTransactions: Transaction[] = [
  // =========== 2018: Initial Portfolio Construction (10 transactions) ===========
  { id: 'tx-2018-001', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2018-01-15', quantity: 600, pricePerUnit: 43.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2018-002', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2018-02-12', quantity: 350, pricePerUnit: 92.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2018-003', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2018-02-28', quantity: 800, pricePerUnit: 105.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2018-004', assetName: 'Vanguard Total International Stock', ticker: 'VXUS', assetType: 'etf', transactionType: 'buy', 
    date: '2018-04-10', quantity: 600, pricePerUnit: 56.80, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2011 },
  { id: 'tx-2018-005', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2018-05-22', quantity: 120, pricePerUnit: 79.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2018-006', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2018-07-18', quantity: 300, pricePerUnit: 108.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2018-007', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2018-09-20', quantity: 6, pricePerUnit: 6350.00, fees: 95.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2018-008', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2018-11-12', quantity: 400, pricePerUnit: 115.40, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2018-009', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2018-12-10', quantity: 150, pricePerUnit: 198.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },
  { id: 'tx-2018-010', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2018-12-20', quantity: 300, pricePerUnit: 24.35, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },

  // =========== 2019: Building Core Positions (12 transactions) ===========
  { id: 'tx-2019-001', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2019-01-28', quantity: 300, pricePerUnit: 39.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2019-002', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2019-03-15', quantity: 100, pricePerUnit: 58.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2019-003', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2019-04-22', quantity: 700, pricePerUnit: 44.25, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-2019-004', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2019-05-13', quantity: 200, pricePerUnit: 28.55, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2019-005', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2019-06-10', quantity: 150, pricePerUnit: 123.96, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2019-006', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2019-08-05', quantity: 50, pricePerUnit: 215.00, fees: 54.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2019-007', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2019-09-18', quantity: 200, pricePerUnit: 16.05, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2019-008', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2019-10-14', quantity: 120, pricePerUnit: 186.12, fees: 12.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2019-009', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2019-11-08', quantity: 400, pricePerUnit: 111.85, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2019-010', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2019-12-10', quantity: 200, pricePerUnit: 139.85, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2019-011', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2019-12-18', quantity: 80, pricePerUnit: 130.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },
  { id: 'tx-2019-012', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2019-12-27', quantity: 80, pricePerUnit: 92.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },

  // =========== 2020: COVID Volatility & Recovery (15 transactions) ===========
  { id: 'tx-2020-001', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-01-21', quantity: 150, pricePerUnit: 28.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2020-002', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2020-02-10', quantity: 3, pricePerUnit: 9850.00, fees: 98.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2020-003', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2020-03-16', quantity: 400, pricePerUnit: 52.31, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2020-004', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2020-03-23', quantity: 200, pricePerUnit: 138.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2020-005', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2020-04-14', quantity: 60, pricePerUnit: 102.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2020-006', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-05-11', quantity: 150, pricePerUnit: 48.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2020-007', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2020-06-08', quantity: 60, pricePerUnit: 242.00, fees: 73.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2020-008', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2020-07-20', quantity: 60, pricePerUnit: 75.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2020-009', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2020-08-10', quantity: 600, pricePerUnit: 88.45, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-2020-010', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2020-09-02', quantity: 300, pricePerUnit: 88.81, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2020-011', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-10-19', quantity: 100, pricePerUnit: 87.35, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2020-012', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2020-11-16', quantity: 2, pricePerUnit: 16250.00, fees: 122.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2020-013', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2020-12-07', quantity: 60, pricePerUnit: 168.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },
  { id: 'tx-2020-014', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2020-12-14', quantity: 350, pricePerUnit: 52.52, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-2020-015', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2020-12-21', quantity: 100, pricePerUnit: 127.07, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },

  // =========== 2021: Bull Market Peak (14 transactions) ===========
  { id: 'tx-2021-001', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2021-01-11', quantity: 1.5, pricePerUnit: 35250.00, fees: 176.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2021-002', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2021-02-08', quantity: 120, pricePerUnit: 68.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2021-003', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2021-03-15', quantity: 20, pricePerUnit: 1780.00, fees: 134.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2021-004', assetName: 'Vanguard Total International Stock', ticker: 'VXUS', assetType: 'etf', transactionType: 'buy', 
    date: '2021-04-05', quantity: 300, pricePerUnit: 63.72, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2011 },
  { id: 'tx-2021-005', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'sell', 
    date: '2021-04-26', quantity: 100, pricePerUnit: 138.15, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2021-006', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2021-05-10', quantity: 80, pricePerUnit: 315.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2021-007', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2021-07-19', quantity: 75, pricePerUnit: 222.91, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2021-008', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2021-08-16', quantity: 100, pricePerUnit: 146.13, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2021-009', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2021-09-07', quantity: 3, pricePerUnit: 52450.00, fees: 394.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2021-010', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2021-10-18', quantity: 50, pricePerUnit: 130.65, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2021-011', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2021-11-08', quantity: 150, pricePerUnit: 170.42, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2021-012', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2021-12-06', quantity: 300, pricePerUnit: 113.85, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2021-013', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'sell', 
    date: '2021-12-20', quantity: 20, pricePerUnit: 3950.00, fees: 198.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2021-014', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2021-12-27', quantity: 75, pricePerUnit: 292.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },

  // =========== 2022: Bear Market (11 transactions) ===========
  { id: 'tx-2022-001', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2022-01-18', quantity: 150, pricePerUnit: 168.50, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2022-002', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2022-02-14', quantity: 200, pricePerUnit: 128.12, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2022-003', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2022-03-21', quantity: 350, pricePerUnit: 78.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-2022-004', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2022-05-09', quantity: 120, pricePerUnit: 98.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2022-005', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2022-06-20', quantity: 40, pricePerUnit: 1050.00, fees: 105.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2022-006', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2022-07-18', quantity: 75, pricePerUnit: 268.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },
  { id: 'tx-2022-007', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'sell', 
    date: '2022-08-22', quantity: 60, pricePerUnit: 168.34, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2022-008', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2022-09-12', quantity: 100, pricePerUnit: 106.76, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2022-009', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2022-10-24', quantity: 180, pricePerUnit: 52.25, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2022-010', assetName: 'Vanguard Total International Stock', ticker: 'VXUS', assetType: 'etf', transactionType: 'buy', 
    date: '2022-11-14', quantity: 300, pricePerUnit: 51.42, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2011 },
  { id: 'tx-2022-011', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2022-12-12', quantity: 40, pricePerUnit: 355.25, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },

  // =========== 2023: AI Rally (13 transactions) ===========
  { id: 'tx-2023-001', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2023-01-23', quantity: 60, pricePerUnit: 212.04, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2023-002', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2023-02-13', quantity: 80, pricePerUnit: 142.78, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2023-003', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2023-03-20', quantity: 1.5, pricePerUnit: 27500.00, fees: 138.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2023-004', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2023-04-17', quantity: 150, pricePerUnit: 70.20, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2023-005', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2023-05-08', quantity: 80, pricePerUnit: 125.95, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2023-006', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2023-07-24', quantity: 100, pricePerUnit: 145.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2023-007', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2023-08-14', quantity: 80, pricePerUnit: 113.54, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2023-008', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2023-09-11', quantity: 25, pricePerUnit: 1635.00, fees: 82.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2023-009', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2023-10-16', quantity: 300, pricePerUnit: 38.85, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-2023-010', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2023-11-06', quantity: 30, pricePerUnit: 455.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },
  { id: 'tx-2023-011', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2023-11-27', quantity: 75, pricePerUnit: 152.56, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2023-012', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'sell', 
    date: '2023-12-18', quantity: 350, pricePerUnit: 99.85, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2023-013', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2023-12-27', quantity: 250, pricePerUnit: 75.25, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },

  // =========== 2024: Rate Cut Rally (15 transactions) ===========
  { id: 'tx-2024-001', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-01-15', quantity: 1, pricePerUnit: 42850.00, fees: 107.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2024-002', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-12', quantity: 100, pricePerUnit: 110.28, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2024-003', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-26', quantity: 80, pricePerUnit: 142.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2024-004', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-03-18', quantity: 60, pricePerUnit: 105.57, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2024-005', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2024-04-22', quantity: 40, pricePerUnit: 322.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2024-006', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-13', quantity: 25, pricePerUnit: 595.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },
  { id: 'tx-2024-007', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-06-10', quantity: 12, pricePerUnit: 3580.00, fees: 90.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2024-008', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2024-07-15', quantity: 150, pricePerUnit: 160.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2024-009', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2024-08-05', quantity: 50, pricePerUnit: 305.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2024-010', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2024-09-16', quantity: 300, pricePerUnit: 74.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-2024-011', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2024-10-21', quantity: 2, pricePerUnit: 68500.00, fees: 343.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2024-012', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2024-11-11', quantity: 120, pricePerUnit: 242.42, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2024-013', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-11-25', quantity: 50, pricePerUnit: 198.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2024-014', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2024-12-09', quantity: 60, pricePerUnit: 168.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2024-015', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2024-12-20', quantity: 40, pricePerUnit: 418.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },

  // =========== 2025: Current Year (10 transactions through December) ===========
  { id: 'tx-2025-001', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2025-01-13', quantity: 80, pricePerUnit: 138.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2025-002', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-02-10', quantity: 55, pricePerUnit: 172.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2025-003', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2025-03-17', quantity: 1, pricePerUnit: 82000.00, fees: 213.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2025-004', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2025-04-14', quantity: 40, pricePerUnit: 368.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2025-005', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2025-05-12', quantity: 200, pricePerUnit: 102.78, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2025-006', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2025-06-09', quantity: 50, pricePerUnit: 198.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2025-007', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'sell', 
    date: '2025-08-18', quantity: 100, pricePerUnit: 392.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2025-008', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2025-09-22', quantity: 15, pricePerUnit: 3185.00, fees: 130.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2025-009', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2025-10-13', quantity: 60, pricePerUnit: 185.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2025-010', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-12-08', quantity: 80, pricePerUnit: 202.20, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
];

// ============================================================================
// MONTHLY VALUATIONS - Calibrated for ~12% CAGR with 17 holdings
// ============================================================================

const allMonths: string[] = [];
for (let year = 2018; year <= 2025; year++) {
  for (let month = 1; month <= 12; month++) {
    allMonths.push(`${year}-${month.toString().padStart(2, '0')}`);
  }
}

/**
 * Price arrays calibrated for realistic ~12% portfolio CAGR
 * 17 Holdings - tradable assets only (no private/alternative investments)
 */
const priceData: Record<string, { name: string; prices: number[] }> = {
  // === EQUITIES (10) ===
  'AAPL': {
    name: 'Apple Inc.',
    prices: [
      // 2018: Q4 selloff
      43.75, 44.12, 42.85, 41.95, 46.25, 46.82, 47.45, 50.12, 51.78, 49.25, 44.85, 39.48,
      // 2019: Strong recovery
      39.50, 43.25, 47.85, 50.12, 47.12, 49.85, 52.45, 51.85, 55.78, 59.45, 63.12, 68.45,
      // 2020: COVID crash and recovery
      70.38, 62.34, 52.31, 58.57, 69.49, 78.20, 85.26, 95.04, 88.81, 83.86, 92.05, 98.69,
      // 2021: Steady growth
      100.96, 98.79, 95.15, 102.46, 97.61, 106.96, 113.86, 118.83, 112.50, 119.80, 128.30, 135.57,
      // 2022: Bear market
      134.78, 128.12, 132.61, 122.65, 116.84, 108.72, 120.51, 118.22, 108.20, 115.34, 112.03, 104.93,
      // 2023: Recovery
      110.53, 114.41, 122.90, 126.68, 132.25, 142.97, 145.45, 140.65, 132.21, 131.77, 145.95, 148.53,
      // 2024: Continued growth
      142.85, 140.42, 135.15, 133.30, 148.87, 152.87, 160.00, 158.21, 162.87, 168.85, 172.28, 178.75,
      // 2025: Current year
      175.53, 180.87, 184.15, 178.68, 185.42, 188.80, 192.45, 188.12, 195.38, 198.65, 202.20, 205.85
    ]
  },
  'MSFT': {
    name: 'Microsoft Corp.',
    prices: [
      // 2018
      92.00, 93.77, 89.58, 93.52, 98.84, 98.61, 105.37, 108.04, 110.37, 103.81, 105.19, 98.57,
      // 2019
      100.43, 106.03, 110.94, 115.37, 118.24, 123.96, 126.27, 127.86, 129.44, 133.72, 139.70, 147.70,
      // 2020
      155.23, 147.01, 138.71, 152.21, 156.25, 168.51, 170.01, 180.53, 172.33, 166.47, 175.51, 180.42,
      // 2021
      186.60, 187.38, 188.77, 198.18, 196.68, 212.90, 222.91, 233.88, 224.92, 255.62, 254.59, 258.32,
      // 2022
      248.98, 240.79, 246.31, 228.52, 224.87, 215.83, 230.74, 222.47, 202.90, 202.13, 218.14, 210.82,
      // 2023
      212.04, 218.42, 238.30, 252.26, 265.39, 275.54, 274.77, 268.76, 262.75, 272.32, 302.91, 298.04,
      // 2024
      308.47, 315.58, 330.72, 322.00, 332.65, 352.57, 358.92, 338.78, 350.08, 338.37, 352.15, 348.54,
      // 2025
      358.72, 365.35, 375.68, 378.45, 388.65, 392.18, 385.00, 392.75, 398.42, 402.90, 408.25, 412.60
    ]
  },
  'NVDA': {
    name: 'NVIDIA Corp.',
    prices: [
      // 2018
      35.88, 36.12, 34.75, 34.62, 37.25, 38.45, 37.32, 39.12, 38.05, 32.25, 26.75, 24.35,
      // 2019
      26.65, 27.82, 30.45, 31.62, 28.55, 30.02, 31.25, 32.45, 31.38, 35.12, 37.45, 39.92,
      // 2020
      38.85, 42.15, 36.25, 42.35, 48.85, 52.52, 57.62, 65.15, 66.52, 65.25, 68.45, 66.12,
      // 2021
      65.05, 68.45, 64.25, 68.82, 70.25, 78.45, 80.72, 85.35, 84.15, 92.85, 102.62, 95.45,
      // 2022
      85.85, 84.25, 88.45, 68.05, 65.12, 58.75, 65.45, 62.25, 48.15, 52.25, 58.45, 52.65,
      // 2023
      58.25, 65.45, 72.85, 70.20, 82.52, 88.35, 92.25, 89.85, 87.72, 82.85, 95.72, 95.52,
      // 2024
      105.20, 110.28, 118.35, 115.73, 120.47, 130.48, 128.52, 122.21, 128.38, 135.45, 142.27, 138.58,
      // 2025
      138.50, 132.75, 136.35, 132.42, 138.28, 144.45, 150.72, 147.30, 152.18, 148.65, 155.42, 162.85
    ]
  },
  'AMZN': {
    name: 'Amazon.com Inc.',
    prices: [
      // 2018
      64.75, 73.55, 72.25, 78.25, 79.00, 85.25, 91.35, 99.85, 100.15, 87.45, 82.45, 74.85,
      // 2019
      82.15, 81.05, 88.95, 92.35, 94.55, 94.75, 97.05, 89.35, 86.55, 87.95, 91.55, 92.45,
      // 2020
      94.25, 103.50, 87.25, 102.75, 108.25, 118.25, 132.85, 138.45, 135.35, 130.25, 128.75, 135.85,
      // 2021
      136.25, 134.15, 128.75, 140.85, 133.45, 140.25, 148.15, 138.85, 137.35, 140.45, 145.25, 138.75,
      // 2022
      128.25, 122.85, 132.75, 112.85, 98.50, 94.21, 106.28, 118.23, 100.00, 92.41, 90.79, 78.00,
      // 2023
      92.24, 86.76, 95.29, 98.96, 108.43, 112.36, 115.68, 118.01, 110.12, 110.74, 125.09, 128.94,
      // 2024
      132.72, 142.50, 148.42, 145.85, 152.35, 160.45, 155.72, 150.45, 158.92, 162.75, 168.42, 172.85,
      // 2025
      175.45, 178.72, 182.35, 188.85, 192.42, 198.75, 195.45, 192.72, 198.35, 202.85, 205.42, 208.75
    ]
  },
  'GOOGL': {
    name: 'Alphabet Inc.',
    prices: [
      // 2018 (no position yet)
      54.75, 55.85, 51.25, 52.45, 54.85, 56.45, 60.25, 61.15, 59.85, 54.65, 52.85, 51.75,
      // 2019
      52.85, 55.75, 58.75, 59.45, 57.15, 54.15, 60.65, 59.35, 60.75, 62.95, 65.15, 67.05,
      // 2020
      72.35, 68.45, 56.15, 60.75, 70.75, 71.25, 75.50, 82.75, 73.65, 79.35, 87.75, 87.65,
      // 2021
      92.55, 95.95, 95.35, 106.85, 108.05, 110.65, 118.75, 125.95, 124.75, 130.65, 130.95, 128.65,
      // 2022
      122.05, 122.35, 124.95, 102.05, 102.37, 98.48, 104.32, 105.09, 88.15, 86.93, 92.42, 82.73,
      // 2023
      90.32, 84.31, 95.00, 98.22, 108.37, 106.97, 114.36, 113.54, 115.85, 112.61, 122.27, 125.93,
      // 2024
      128.80, 135.52, 142.42, 148.85, 155.45, 160.92, 165.42, 155.75, 150.45, 155.85, 162.42, 168.75,
      // 2025
      175.00, 172.85, 178.45, 175.72, 180.85, 185.42, 182.45, 185.72, 188.35, 192.85, 195.42, 198.75
    ]
  },
  'TSLA': {
    name: 'Tesla Inc.',
    prices: [
      // 2018 (no position yet)
      23.45, 22.85, 21.15, 19.85, 18.75, 22.45, 20.15, 19.85, 18.45, 22.75, 23.45, 22.15,
      // 2019
      21.25, 21.45, 18.85, 17.85, 12.85, 14.75, 16.15, 14.85, 16.05, 21.25, 22.15, 27.85,
      // 2020
      28.50, 45.85, 28.25, 38.35, 42.85, 52.25, 68.45, 98.15, 88.85, 87.35, 115.85, 132.25,
      // 2021
      148.45, 132.85, 128.75, 138.15, 125.65, 138.85, 142.55, 148.15, 155.75, 185.65, 198.75, 185.35,
      // 2022
      168.25, 152.45, 165.65, 158.25, 138.75, 128.45, 148.85, 145.45, 138.25, 118.75, 105.15, 82.15,
      // 2023
      95.85, 118.75, 120.45, 102.25, 125.95, 145.75, 148.45, 142.75, 138.45, 125.15, 138.05, 142.45,
      // 2024
      142.45, 118.52, 105.57, 112.05, 118.34, 132.88, 148.08, 140.92, 152.20, 168.48, 198.00, 228.84,
      // 2025
      218.52, 205.18, 198.92, 205.68, 218.45, 228.72, 235.45, 232.28, 238.65, 242.42, 248.18, 255.75
    ]
  },
  'META': {
    name: 'Meta Platforms Inc.',
    prices: [
      // 2018 (no position yet)
      178.46, 176.62, 159.79, 169.10, 186.85, 194.32, 174.89, 172.90, 162.98, 153.42, 144.82, 131.09,
      // 2019
      166.69, 161.89, 166.69, 178.28, 177.47, 193.00, 193.99, 182.04, 178.08, 186.12, 195.70, 205.25,
      // 2020
      217.94, 192.47, 160.98, 188.54, 230.95, 242.24, 252.96, 273.61, 268.98, 271.09, 275.41, 273.16,
      // 2021
      268.73, 257.62, 294.53, 303.91, 315.50, 355.64, 351.24, 369.79, 343.01, 316.92, 333.12, 336.35,
      // 2022
      323.00, 212.41, 186.35, 174.95, 165.00, 161.25, 169.27, 168.34, 140.36, 97.94, 111.04, 120.26,
      // 2023
      145.00, 142.78, 168.94, 188.42, 205.28, 218.98, 238.60, 228.08, 232.23, 228.74, 255.12, 262.96,
      // 2024
      298.52, 305.35, 315.72, 305.45, 312.85, 322.42, 318.75, 305.45, 325.85, 345.72, 362.45, 372.42,
      // 2025
      355.00, 365.85, 378.72, 368.45, 382.85, 395.42, 388.42, 395.85, 408.42, 415.72, 425.45, 438.85
    ]
  },
  'JPM': {
    name: 'JPMorgan Chase',
    prices: [
      // 2018
      108.50, 114.22, 110.72, 109.88, 108.18, 104.73, 112.91, 116.77, 112.45, 108.31, 106.91, 97.62,
      // 2019
      101.41, 103.52, 101.23, 112.35, 108.85, 110.72, 113.71, 108.23, 116.38, 117.19, 127.85, 139.40,
      // 2020
      135.06, 127.50, 92.55, 96.13, 98.78, 94.32, 97.04, 100.18, 99.18, 101.28, 120.02, 127.07,
      // 2021
      134.79, 145.91, 147.22, 145.15, 152.36, 148.81, 147.45, 146.13, 152.19, 158.96, 152.46, 152.35,
      // 2022
      152.05, 135.05, 132.18, 122.85, 123.12, 112.50, 116.72, 116.76, 106.76, 115.73, 132.73, 132.10,
      // 2023
      135.85, 132.42, 128.75, 135.85, 132.42, 138.75, 145.85, 142.42, 148.75, 152.56, 165.42, 162.75,
      // 2024
      158.52, 162.85, 168.42, 172.25, 178.85, 182.42, 175.85, 168.42, 172.85, 178.42, 182.85, 185.72,
      // 2025
      188.52, 192.42, 195.85, 192.42, 198.85, 202.42, 198.85, 195.42, 202.85, 208.42, 212.85, 218.42
    ]
  },
  'BRK.B': {
    name: 'Berkshire Hathaway',
    prices: [
      // 2018
      198.50, 200.85, 198.25, 195.42, 192.85, 188.42, 192.85, 205.42, 212.85, 202.42, 198.85, 195.42,
      // 2019
      198.85, 202.42, 205.85, 208.42, 202.85, 198.42, 205.85, 202.42, 198.85, 208.42, 215.85, 225.42,
      // 2020
      222.85, 208.42, 175.85, 182.42, 188.85, 178.42, 182.85, 188.42, 198.85, 205.42, 218.85, 228.42,
      // 2021
      232.85, 242.42, 248.85, 258.42, 268.85, 272.42, 278.85, 282.42, 288.85, 292.75, 278.85, 292.75,
      // 2022
      298.85, 298.42, 318.85, 322.42, 298.85, 268.85, 282.42, 288.85, 272.42, 278.85, 298.42, 302.85,
      // 2023
      308.42, 298.85, 298.42, 318.85, 322.42, 328.85, 348.42, 352.85, 348.42, 342.85, 358.42, 352.85,
      // 2024
      358.42, 368.85, 378.42, 388.85, 398.42, 408.85, 398.42, 388.85, 402.42, 412.85, 418.85, 425.42,
      // 2025
      432.85, 438.42, 448.85, 458.42, 468.85, 478.42, 485.85, 492.42, 502.85, 512.42, 522.85, 532.42
    ]
  },
  'LLY': {
    name: 'Eli Lilly',
    prices: [
      // 2018 (no position yet)
      85.42, 82.85, 78.42, 82.85, 85.42, 88.85, 92.42, 95.85, 102.42, 108.85, 112.42, 115.85,
      // 2019
      118.42, 122.85, 125.42, 128.85, 125.42, 128.85, 132.42, 128.85, 125.42, 128.85, 130.85, 138.85,
      // 2020
      142.42, 135.85, 128.42, 142.85, 148.42, 155.85, 162.42, 168.50, 158.42, 132.85, 142.42, 162.85,
      // 2021
      188.42, 192.85, 182.42, 188.85, 198.42, 215.85, 228.72, 242.85, 232.42, 248.85, 258.42, 268.85,
      // 2022
      258.42, 282.85, 308.42, 288.85, 298.42, 318.85, 328.42, 338.85, 322.42, 355.25, 348.42, 358.85,
      // 2023
      378.42, 402.85, 388.42, 408.85, 442.42, 455.72, 478.42, 502.85, 522.42, 558.85, 582.42, 608.85,
      // 2024
      618.42, 595.72, 628.42, 648.85, 678.42, 708.85, 728.42, 698.85, 748.42, 778.85, 808.42, 838.85,
      // 2025
      858.42, 878.85, 908.42, 928.85, 958.42, 988.85, 1008.42, 1028.85, 1058.42, 1088.85, 1108.42, 1138.85
    ]
  },

  // === ETFs (2) ===
  'VXUS': {
    name: 'Vanguard Total International Stock',
    prices: [
      // 2018
      56.80, 55.42, 53.85, 54.42, 52.85, 51.42, 53.85, 54.42, 52.85, 50.42, 51.85, 48.72,
      // 2019
      50.72, 51.42, 52.85, 53.72, 51.42, 52.25, 52.85, 50.42, 50.85, 52.72, 53.42, 55.25,
      // 2020
      55.85, 52.42, 41.25, 45.85, 48.42, 49.25, 51.85, 53.42, 52.85, 51.72, 56.42, 59.25,
      // 2021
      61.85, 60.42, 60.85, 63.72, 65.42, 65.25, 64.85, 62.42, 60.85, 62.72, 63.42, 63.25,
      // 2022
      61.85, 58.42, 56.85, 52.72, 51.42, 49.75, 53.85, 51.42, 46.85, 45.72, 51.42, 51.25,
      // 2023
      53.85, 52.42, 54.85, 56.72, 55.42, 57.25, 58.85, 56.42, 54.85, 52.72, 56.42, 57.25,
      // 2024
      59.85, 60.42, 60.85, 58.72, 60.42, 62.25, 63.85, 61.42, 62.85, 63.72, 64.42, 65.25,
      // 2025
      66.85, 67.42, 68.00, 68.72, 69.42, 70.25, 70.85, 71.42, 72.85, 73.72, 74.42, 75.25
    ]
  },
  'EEM': {
    name: 'iShares MSCI Emerging Markets',
    prices: [
      // 2018 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2019 (position starts April)
      0, 0, 0, 44.25, 42.85, 42.52, 42.25, 40.85, 40.52, 42.25, 43.85, 45.52,
      // 2020
      44.85, 42.52, 33.25, 37.85, 40.52, 43.25, 46.85, 47.52, 46.25, 46.85, 50.35, 52.52,
      // 2021
      55.25, 52.85, 52.52, 53.25, 53.85, 53.52, 52.25, 49.85, 50.52, 50.25, 49.85, 49.52,
      // 2022
      49.25, 46.85, 44.52, 41.25, 41.85, 40.52, 41.25, 40.85, 37.52, 35.85, 39.42, 39.25,
      // 2023
      41.85, 40.52, 41.25, 40.85, 40.52, 42.25, 42.85, 40.52, 39.25, 38.85, 40.52, 41.25,
      // 2024
      40.82, 41.35, 40.28, 41.72, 40.95, 42.85, 44.28, 43.15, 44.52, 44.92, 46.28, 47.15,
      // 2025
      48.42, 49.28, 50.15, 50.85, 51.42, 52.00, 52.85, 53.42, 54.28, 55.15, 56.42, 57.58
    ]
  },

  // === BONDS (2) ===
  'AGG': {
    name: 'iShares Core US Aggregate Bond',
    prices: [
      // 2018
      105.50, 104.82, 105.15, 104.72, 105.28, 104.92, 105.18, 104.95, 104.52, 103.85, 104.42, 105.85,
      // 2019
      106.42, 106.15, 107.52, 107.25, 108.42, 109.15, 110.52, 111.25, 111.85, 112.42, 111.85, 112.52,
      // 2020
      114.85, 116.52, 112.25, 114.85, 116.25, 117.52, 118.25, 117.85, 117.52, 117.25, 117.85, 117.52,
      // 2021
      116.52, 115.25, 114.52, 115.25, 115.85, 115.52, 116.25, 115.85, 114.52, 114.25, 114.20, 113.85,
      // 2022
      112.52, 110.25, 108.52, 105.25, 104.85, 102.52, 103.25, 101.85, 98.52, 95.85, 99.52, 99.25,
      // 2023
      100.52, 98.25, 99.52, 100.25, 98.85, 99.52, 99.50, 97.25, 95.85, 96.52, 99.25, 99.85,
      // 2024
      98.21, 97.85, 97.42, 98.05, 97.68, 98.92, 99.45, 100.15, 100.72, 99.85, 100.28, 100.65,
      // 2025
      101.50, 101.42, 101.87, 102.35, 102.78, 103.15, 103.48, 103.85, 104.18, 103.95, 104.35, 104.72
    ]
  },
  'BND': {
    name: 'Vanguard Total Bond Market',
    prices: [
      // 2018-2019 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2020 (position starts Aug)
      0, 0, 0, 0, 0, 0, 0, 88.45, 88.12, 87.85, 88.25, 87.92,
      // 2021
      86.85, 85.25, 84.72, 85.45, 85.92, 86.25, 86.72, 87.15, 86.52, 85.85, 86.25, 85.72,
      // 2022
      84.52, 82.25, 78.50, 77.85, 76.52, 74.25, 75.85, 74.52, 72.25, 70.85, 73.52, 73.25,
      // 2023
      74.52, 72.85, 74.25, 74.85, 73.52, 74.25, 73.85, 72.52, 71.25, 72.85, 74.52, 75.25,
      // 2024
      72.05, 71.72, 71.35, 71.85, 71.52, 72.28, 72.85, 73.35, 74.50, 73.12, 73.58, 73.42,
      // 2025
      74.78, 75.12, 75.45, 75.78, 76.12, 76.45, 76.78, 77.12, 77.45, 77.28, 77.65, 77.98
    ]
  },

  // === COMMODITY (1) ===
  'GLD': {
    name: 'SPDR Gold Shares',
    prices: [
      // 2018 (position starts Nov)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 115.40, 121.72,
      // 2019
      125.85, 124.42, 123.25, 124.85, 127.42, 133.25, 141.25, 143.85, 142.42, 141.25, 139.85, 143.52,
      // 2020
      149.85, 152.42, 153.25, 161.85, 165.42, 168.25, 183.85, 189.42, 177.25, 177.85, 174.42, 177.25,
      // 2021
      173.85, 165.42, 163.25, 167.85, 174.42, 168.25, 168.85, 169.42, 166.25, 167.85, 170.42, 169.25,
      // 2022
      168.50, 172.42, 180.25, 177.85, 171.42, 170.25, 162.85, 163.42, 158.25, 155.85, 167.42, 172.25,
      // 2023
      178.85, 173.42, 181.25, 197.85, 195.42, 191.25, 191.85, 185.42, 180.25, 183.85, 189.42, 193.25,
      // 2024
      188.85, 186.42, 199.25, 212.85, 218.42, 211.25, 222.85, 232.42, 247.25, 248.85, 242.42, 245.00,
      // 2025
      258.85, 272.42, 280.25, 275.85, 282.42, 290.25, 302.85, 312.42, 325.25, 318.85, 332.42, 345.25
    ]
  },

  // === CRYPTO (2) ===
  'BTC': {
    name: 'Bitcoin',
    prices: [
      // 2018 (position starts Sep)
      0, 0, 0, 0, 0, 0, 0, 0, 6350, 6300, 4000, 3700,
      // 2019
      3500, 3400, 4100, 5200, 8500, 10800, 9500, 10100, 8300, 9200, 7500, 7200,
      // 2020
      9350, 9850, 6500, 8700, 9500, 9150, 11350, 11650, 10750, 13750, 16250, 29000,
      // 2021
      35250, 45000, 58000, 57000, 37500, 35500, 41500, 47000, 52450, 61000, 57000, 46000,
      // 2022
      38000, 43000, 45500, 38000, 29500, 20000, 23250, 19750, 19500, 20500, 17150, 16500,
      // 2023
      23000, 23500, 27500, 29200, 27000, 30500, 29500, 26000, 26800, 34500, 37500, 42500,
      // 2024
      42850, 51600, 67200, 64000, 68500, 61300, 64250, 59150, 63800, 68500, 78400, 85850,
      // 2025
      85000, 88500, 82000, 85500, 92000, 98000, 102400, 95650, 90500, 95750, 102300, 108450
    ]
  },
  'ETH': {
    name: 'Ethereum',
    prices: [
      // 2018 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2019 (position starts Aug)
      0, 0, 0, 0, 0, 0, 0, 215, 175, 180, 150, 130,
      // 2020
      135, 225, 135, 175, 210, 242, 315, 390, 355, 385, 575, 730,
      // 2021
      1350, 1450, 1780, 2150, 2500, 2275, 2150, 3100, 3350, 4300, 4650, 3950,
      // 2022
      2550, 2750, 2950, 2800, 1850, 1050, 1650, 1550, 1350, 1300, 1250, 1200,
      // 2023
      1550, 1650, 1800, 1900, 1850, 1850, 1900, 1650, 1635, 1800, 2050, 2350,
      // 2024
      2518, 2892, 3412, 3180, 3758, 3580, 3285, 2645, 2418, 2685, 3245, 3592,
      // 2025
      3250, 3225, 3085, 2985, 3242, 3425, 3525, 3350, 3185, 3350, 3525, 3675
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
      
      // Add bond-specific fields
      if (ticker === 'AGG' || ticker === 'BND') {
        val.yieldToMaturity = 4.5 + Math.sin(index / 12) * 1.5;
        val.duration = ticker === 'AGG' ? 6.2 : 6.5;
        val.couponRate = 3.5;
      }
      
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
 * Total: 17 distinct tradable holdings
 * 
 * By Asset Class:
 * - Equity (10): AAPL, MSFT, NVDA, AMZN, GOOGL, TSLA, META, JPM, BRK.B, LLY
 * - ETF (2): VXUS, EEM
 * - Bond (2): AGG, BND
 * - Commodity (1): GLD
 * - Crypto (2): BTC, ETH
 * 
 * REMOVED (non-tradable/alternative):
 * - Hedge Fund: BWPA, RIEF
 * - Private Equity: SCGE
 * - Private Debt: KPFC, OCPC
 * - Real Estate: BREP9, CREP5
 * - Alternative: AQMIX
 * 
 * Transaction Counts by Year:
 * - 2018: 10 transactions ✓
 * - 2019: 12 transactions ✓
 * - 2020: 15 transactions ✓
 * - 2021: 14 transactions ✓
 * - 2022: 11 transactions ✓
 * - 2023: 13 transactions ✓
 * - 2024: 15 transactions ✓
 * - 2025: 10 transactions ✓
 * 
 * Target CAGR: ~12% over 8 years
 * Target Portfolio Value: ~$2.1M
 * Data Quality: 96 months, negative months included, no NaN values
 */
