import { Transaction, MonthlyValuation } from '@/types/investment';

/**
 * Sample Portfolio Data
 * 
 * This data represents a realistic family office / HNW portfolio spanning 2024-2025.
 * All transactions are chronologically consistent:
 * - Buys precede sells
 * - Position sizes evolve logically (scaling in/out)
 * - Prices reflect approximate historical market levels
 * - Asset mix: ~60% equities, ~20% bonds, ~10% crypto, ~10% intl/EM
 */

// ============================================================================
// TRANSACTIONS - Chronologically ordered, internally consistent
// ============================================================================
export const sampleTransactions: Transaction[] = [
  // =========== Q1 2024: Initial Portfolio Construction ===========
  
  // January 2024 - Core equity positions established
  { id: 'tx-001', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2024-01-08', quantity: 100, pricePerUnit: 185.92, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-002', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2024-01-10', quantity: 50, pricePerUnit: 388.47, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-003', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-01-15', quantity: 0.75, pricePerUnit: 42853.00, fees: 32.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-004', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2024-01-18', quantity: 200, pricePerUnit: 98.21, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-005', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2024-01-22', quantity: 150, pricePerUnit: 72.05, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-005a', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2024-01-25', quantity: 80, pricePerUnit: 155.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-005b', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2024-01-29', quantity: 60, pricePerUnit: 141.80, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },

  // February 2024 - Adding growth exposure
  { id: 'tx-006', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-05', quantity: 50, pricePerUnit: 674.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-007', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-02-12', quantity: 4.0, pricePerUnit: 2518.00, fees: 15.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-008', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-20', quantity: 60, pricePerUnit: 128.45, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },
  { id: 'tx-008a', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-22', quantity: 35, pricePerUnit: 484.52, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-008b', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-26', quantity: 45, pricePerUnit: 182.35, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },

  // March 2024 - International diversification
  { id: 'tx-009', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', 
    date: '2024-03-04', quantity: 12, pricePerUnit: 892.50, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  { id: 'tx-010', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2024-03-11', quantity: 250, pricePerUnit: 40.82, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-011', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-03-18', quantity: 0.25, pricePerUnit: 67234.00, fees: 28.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-011a', assetName: 'UnitedHealth Group', ticker: 'UNH', assetType: 'equity', transactionType: 'buy', 
    date: '2024-03-21', quantity: 20, pricePerUnit: 492.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1984 },
  { id: 'tx-011b', assetName: 'Visa Inc.', ticker: 'V', assetType: 'equity', transactionType: 'buy', 
    date: '2024-03-25', quantity: 40, pricePerUnit: 281.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2008 },

  // =========== Q2 2024: Tactical Adjustments ===========

  // April 2024 - Adding Tesla, trimming crypto gains
  { id: 'tx-012', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-04-08', quantity: 40, pricePerUnit: 171.05, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-013', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'sell', 
    date: '2024-04-22', quantity: 1.0, pricePerUnit: 3180.00, fees: 12.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-013a', assetName: 'Costco Wholesale', ticker: 'COST', assetType: 'equity', transactionType: 'buy', 
    date: '2024-04-15', quantity: 25, pricePerUnit: 728.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1985 },
  { id: 'tx-013b', assetName: 'Netflix Inc.', ticker: 'NFLX', assetType: 'equity', transactionType: 'buy', 
    date: '2024-04-18', quantity: 22, pricePerUnit: 542.18, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2002 },

  // May 2024 - Scaling into NVDA on strength
  { id: 'tx-014', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-13', quantity: 15, pricePerUnit: 924.79, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-015', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-20', quantity: 25, pricePerUnit: 189.87, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-015a', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-22', quantity: 40, pricePerUnit: 182.35, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-015b', assetName: 'Salesforce Inc.', ticker: 'CRM', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-28', quantity: 30, pricePerUnit: 272.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },

  // June 2024 - NVDA split adjustment (10:1 split on June 10)
  { id: 'tx-016', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2024-06-17', quantity: 20, pricePerUnit: 442.57, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-016a', assetName: 'Adobe Inc.', ticker: 'ADBE', assetType: 'equity', transactionType: 'buy', 
    date: '2024-06-10', quantity: 18, pricePerUnit: 485.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-016b', assetName: 'Broadcom Inc.', ticker: 'AVGO', assetType: 'equity', transactionType: 'buy', 
    date: '2024-06-21', quantity: 15, pricePerUnit: 1625.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2009 },

  // =========== Q3 2024: Taking Profits, Rebalancing ===========

  // July 2024 - Partial profit taking on winners
  { id: 'tx-017', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2024-07-15', quantity: 0.30, pricePerUnit: 64250.00, fees: 25.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-018', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'sell', 
    date: '2024-07-22', quantity: 20, pricePerUnit: 175.43, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },
  { id: 'tx-018a', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2024-07-08', quantity: 30, pricePerUnit: 185.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-018b', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2024-07-25', quantity: 15, pricePerUnit: 508.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },

  // August 2024 - Volatility, adding to bonds
  { id: 'tx-019', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2024-08-12', quantity: 25, pricePerUnit: 221.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-020', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2024-08-19', quantity: 100, pricePerUnit: 100.15, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-020a', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2024-08-05', quantity: 25, pricePerUnit: 442.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },
  { id: 'tx-020b', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2024-08-22', quantity: 12, pricePerUnit: 892.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },

  // September 2024 - Rotation
  { id: 'tx-021', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-09-09', quantity: 20, pricePerUnit: 227.20, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-021a', assetName: 'Nvidia Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-09-12', quantity: 80, pricePerUnit: 116.38, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-021b', assetName: 'AMD Inc.', ticker: 'AMD', assetType: 'equity', transactionType: 'buy', 
    date: '2024-09-18', quantity: 55, pricePerUnit: 152.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1979 },
  { id: 'tx-021c', assetName: 'ServiceNow Inc.', ticker: 'NOW', assetType: 'equity', transactionType: 'buy', 
    date: '2024-09-25', quantity: 10, pricePerUnit: 865.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },

  // =========== Q4 2024: Year-End Positioning ===========

  // October 2024 - Adding to semi exposure
  { id: 'tx-022', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', 
    date: '2024-10-07', quantity: 5, pricePerUnit: 718.40, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  { id: 'tx-023', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'sell', 
    date: '2024-10-21', quantity: 75, pricePerUnit: 44.92, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-023a', assetName: 'Palantir Technologies', ticker: 'PLTR', assetType: 'equity', transactionType: 'buy', 
    date: '2024-10-14', quantity: 150, pricePerUnit: 42.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2020 },
  { id: 'tx-023b', assetName: 'Intuit Inc.', ticker: 'INTU', assetType: 'equity', transactionType: 'buy', 
    date: '2024-10-28', quantity: 12, pricePerUnit: 628.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1993 },

  // November 2024 - Post-election positioning, crypto rally
  { id: 'tx-024', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-11-11', quantity: 0.20, pricePerUnit: 87420.00, fees: 35.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-025', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'sell', 
    date: '2024-11-18', quantity: 15, pricePerUnit: 428.15, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-025a', assetName: 'Coinbase Global', ticker: 'COIN', assetType: 'equity', transactionType: 'buy', 
    date: '2024-11-08', quantity: 40, pricePerUnit: 285.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2021 },
  { id: 'tx-025b', assetName: 'Block Inc.', ticker: 'SQ', assetType: 'equity', transactionType: 'buy', 
    date: '2024-11-22', quantity: 45, pricePerUnit: 88.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2015 },
  { id: 'tx-025c', assetName: 'Solana', ticker: 'SOL', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-11-25', quantity: 25, pricePerUnit: 245.85, fees: 18.00, currency: 'USD', geography: 'global', inceptionYear: 2020 },

  // December 2024 - Tax-loss harvesting, year-end cleanup
  { id: 'tx-026', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-12-09', quantity: 1.5, pricePerUnit: 3892.00, fees: 18.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-027', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2024-12-16', quantity: 80, pricePerUnit: 73.42, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-027a', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2024-12-05', quantity: 35, pricePerUnit: 242.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-027b', assetName: 'Shopify Inc.', ticker: 'SHOP', assetType: 'equity', transactionType: 'buy', 
    date: '2024-12-12', quantity: 55, pricePerUnit: 108.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2015 },
  { id: 'tx-027c', assetName: 'CrowdStrike Holdings', ticker: 'CRWD', assetType: 'equity', transactionType: 'buy', 
    date: '2024-12-19', quantity: 20, pricePerUnit: 358.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },

  // =========== Q1 2025: New Year Positioning ===========

  // January 2025 - Crypto euphoria, taking profits
  { id: 'tx-028', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2025-01-13', quantity: 0.25, pricePerUnit: 102340.00, fees: 40.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-029', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-01-21', quantity: 30, pricePerUnit: 236.18, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-029a', assetName: 'Palantir Technologies', ticker: 'PLTR', assetType: 'equity', transactionType: 'buy', 
    date: '2025-01-06', quantity: 100, pricePerUnit: 72.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2020 },
  { id: 'tx-029b', assetName: 'Solana', ticker: 'SOL', assetType: 'crypto', transactionType: 'sell', 
    date: '2025-01-15', quantity: 10, pricePerUnit: 268.42, fees: 15.00, currency: 'USD', geography: 'global', inceptionYear: 2020 },

  // February 2025 - DeepSeek disruption, rotating
  { id: 'tx-030', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'sell', 
    date: '2025-02-03', quantity: 100, pricePerUnit: 118.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-031', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', 
    date: '2025-02-18', quantity: 25, pricePerUnit: 198.65, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },
  { id: 'tx-031a', assetName: 'AMD Inc.', ticker: 'AMD', assetType: 'equity', transactionType: 'sell', 
    date: '2025-02-10', quantity: 25, pricePerUnit: 112.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1979 },
  { id: 'tx-031b', assetName: 'Snowflake Inc.', ticker: 'SNOW', assetType: 'equity', transactionType: 'buy', 
    date: '2025-02-24', quantity: 35, pricePerUnit: 168.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2020 },

  // March 2025 - Rebalancing
  { id: 'tx-032', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'sell', 
    date: '2025-03-10', quantity: 20, pricePerUnit: 278.92, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-033', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2025-03-17', quantity: 75, pricePerUnit: 99.87, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-033a', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2025-03-05', quantity: 8, pricePerUnit: 845.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },
  { id: 'tx-033b', assetName: 'Novo Nordisk', ticker: 'NVO', assetType: 'equity', transactionType: 'buy', 
    date: '2025-03-24', quantity: 45, pricePerUnit: 92.85, fees: 9.95, currency: 'USD', geography: 'europe', inceptionYear: 1989 },

  // =========== Q2 2025: Current Quarter ===========

  // April 2025 - Tariff volatility
  { id: 'tx-034', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'sell', 
    date: '2025-04-07', quantity: 1.0, pricePerUnit: 1805.00, fees: 10.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-035', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'sell', 
    date: '2025-04-14', quantity: 5, pricePerUnit: 612.80, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  { id: 'tx-035a', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2025-04-10', quantity: 15, pricePerUnit: 485.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },
  { id: 'tx-035b', assetName: 'Lockheed Martin', ticker: 'LMT', assetType: 'equity', transactionType: 'buy', 
    date: '2025-04-22', quantity: 12, pricePerUnit: 468.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1995 },

  // May 2025 - Adding during dip
  { id: 'tx-036', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2025-05-05', quantity: 15, pricePerUnit: 432.65, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-037', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2025-05-19', quantity: 100, pricePerUnit: 46.23, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-037a', assetName: 'Datadog Inc.', ticker: 'DDOG', assetType: 'equity', transactionType: 'buy', 
    date: '2025-05-12', quantity: 40, pricePerUnit: 128.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-037b', assetName: 'MongoDB Inc.', ticker: 'MDB', assetType: 'equity', transactionType: 'buy', 
    date: '2025-05-26', quantity: 25, pricePerUnit: 285.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2017 },

  // June 2025 - Current month positions
  { id: 'tx-038', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2025-06-09', quantity: 50, pricePerUnit: 131.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-039', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2025-06-23', quantity: 0.10, pricePerUnit: 108750.00, fees: 45.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-039a', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-06-05', quantity: 25, pricePerUnit: 178.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-039b', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2025-06-16', quantity: 30, pricePerUnit: 198.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },

  // July-December 2025 - Future positions
  { id: 'tx-040', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-07-08', quantity: 20, pricePerUnit: 245.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-041', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'sell', 
    date: '2025-07-15', quantity: 20, pricePerUnit: 585.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-042', assetName: 'Solana', ticker: 'SOL', assetType: 'crypto', transactionType: 'buy', 
    date: '2025-08-05', quantity: 15, pricePerUnit: 185.72, fees: 12.00, currency: 'USD', geography: 'global', inceptionYear: 2020 },
  { id: 'tx-043', assetName: 'CrowdStrike Holdings', ticker: 'CRWD', assetType: 'equity', transactionType: 'buy', 
    date: '2025-08-18', quantity: 15, pricePerUnit: 398.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-044', assetName: 'Coinbase Global', ticker: 'COIN', assetType: 'equity', transactionType: 'sell', 
    date: '2025-09-10', quantity: 20, pricePerUnit: 342.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2021 },
  { id: 'tx-045', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2025-09-22', quantity: 60, pricePerUnit: 75.42, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-046', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2025-10-07', quantity: 40, pricePerUnit: 152.85, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-047', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2025-10-21', quantity: 2.0, pricePerUnit: 3285.00, fees: 22.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-048', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2025-11-05', quantity: 12, pricePerUnit: 475.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-049', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2025-11-18', quantity: 0.15, pricePerUnit: 105280.00, fees: 38.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-050', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2025-12-08', quantity: 25, pricePerUnit: 402.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
];

// ============================================================================
// MONTHLY VALUATIONS - Historically plausible price progressions
// ============================================================================

const generateValuations = (): MonthlyValuation[] => {
  const valuations: MonthlyValuation[] = [];
  
  // Monthly dates from Jan 2024 through Dec 2025
  const months = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'
  ];

  // Realistic price progressions reflecting actual market movements
  // Prices are month-end closing approximations
  const priceHistory: Record<string, number[]> = {
    // Apple: WWDC, iPhone cycles, AI narrative. Range: ~$180-260
    'AAPL': [
      185.92, 180.75, 171.48, 169.30, 189.87, 195.87,
      218.36, 221.72, 226.21, 233.85, 237.28, 246.75,
      236.18, 241.53, 228.87, 207.15, 215.42, 232.80,
      238.45, 245.12, 251.38, 248.65, 255.20, 260.85
    ],
    // Microsoft: AI tailwinds, Azure growth. Range: ~$380-485
    'MSFT': [
      388.47, 397.58, 420.72, 389.33, 416.65, 442.57,
      422.92, 411.78, 430.08, 410.37, 428.15, 421.54,
      438.72, 412.35, 428.68, 392.45, 432.65, 445.18,
      452.30, 458.75, 465.42, 468.90, 475.25, 482.60
    ],
    // NVIDIA: AI boom, split-adjusted from June 2024 (10:1)
    'NVDA': [
      674.72, 721.28, 903.56, 877.35, 924.79, 120.48,
      117.52, 109.21, 116.38, 132.45, 141.27, 134.58,
      118.42, 108.75, 122.35, 98.42, 115.28, 131.45,
      138.72, 145.30, 152.18, 148.65, 155.42, 162.85
    ],
    // ASML: European semi leader. Range: €600-950
    'ASML': [
      892.50, 918.35, 945.72, 902.18, 924.56, 968.42,
      892.35, 845.18, 728.65, 718.40, 692.75, 710.28,
      685.42, 652.18, 628.35, 612.80, 645.72, 678.45,
      695.28, 712.35, 728.65, 742.18, 758.42, 775.60
    ],
    // Tesla: EV competition, FSD progress. Range: $150-410
    'TSLA': [
      171.05, 188.52, 163.57, 171.05, 178.34, 197.88,
      232.08, 214.92, 227.20, 252.48, 321.22, 403.84,
      378.52, 352.18, 278.92, 245.68, 282.45, 315.72,
      338.45, 355.28, 372.65, 368.42, 385.18, 402.75
    ],
    // AGG: Interest rate sensitive. Range: $96-103
    'AGG': [
      98.21, 97.85, 97.42, 98.05, 97.68, 98.92,
      99.45, 100.15, 100.72, 99.85, 100.28, 100.65,
      99.87, 99.42, 99.87, 100.35, 100.78, 101.15,
      101.48, 101.85, 102.18, 101.95, 102.35, 102.72
    ],
    // BND: Similar to AGG. Range: $70-76
    'BND': [
      72.05, 71.72, 71.35, 71.85, 71.52, 72.28,
      72.85, 73.35, 73.78, 73.12, 73.58, 73.42,
      72.95, 72.58, 73.15, 73.65, 74.08, 74.45,
      74.78, 75.12, 75.45, 75.28, 75.65, 75.98
    ],
    // Bitcoin: ETF approval rally, halving, election. Range: $40k-115k
    'BTC': [
      42853, 51629, 67234, 64052, 68574, 61325,
      64250, 59142, 63785, 72358, 87420, 93842,
      102340, 95678, 88245, 82156, 95842, 108750,
      105420, 98650, 92480, 98750, 105280, 112450
    ],
    // Ethereum: Following BTC. Range: $1.8k-4k
    'ETH': [
      2518, 2892, 3412, 3180, 3758, 3425,
      3285, 2645, 2418, 2685, 3245, 3892,
      3542, 3125, 2845, 1805, 2542, 3185,
      3425, 3285, 3085, 3245, 3485, 3725
    ],
    // TSM: AI chip demand. Range: $125-245
    'TSM': [
      128.45, 135.72, 142.85, 130.28, 155.42, 168.75,
      175.43, 162.28, 172.85, 182.45, 195.72, 205.28,
      198.65, 185.42, 195.28, 178.65, 192.45, 208.72,
      218.35, 225.48, 232.65, 228.42, 235.18, 242.85
    ],
    // EEM: Emerging markets. Range: $38-53
    'EEM': [
      40.82, 41.35, 40.28, 41.72, 40.95, 42.85,
      44.28, 43.15, 44.52, 44.92, 46.28, 47.15,
      46.42, 45.28, 44.85, 43.72, 46.23, 48.45,
      49.28, 50.15, 51.42, 50.85, 51.72, 52.58
    ],
    // Amazon: E-commerce + AWS. Range: $145-210
    'AMZN': [
      155.72, 168.35, 178.42, 175.85, 182.35, 192.45,
      185.72, 178.45, 185.92, 188.75, 195.42, 198.85,
      192.45, 185.72, 188.35, 178.42, 192.85, 198.85,
      202.45, 205.72, 208.35, 205.85, 208.42, 212.75
    ],
    // Alphabet: Search + Cloud. Range: $135-195
    'GOOGL': [
      141.80, 148.52, 155.42, 162.85, 172.45, 178.92,
      185.42, 168.75, 162.45, 168.85, 175.42, 182.75,
      178.42, 165.85, 172.45, 158.72, 172.85, 178.42,
      185.45, 188.72, 192.35, 188.85, 192.42, 195.75
    ],
    // Meta: Social + AI. Range: $350-600
    'META': [
      484.52, 498.35, 512.72, 485.45, 495.85, 508.42,
      508.75, 482.45, 512.85, 545.72, 572.45, 585.42,
      568.45, 542.85, 528.72, 485.45, 532.85, 568.42,
      585.42, 572.85, 558.42, 565.72, 578.45, 592.85
    ],
    // JPMorgan: Banking leader. Range: $175-225
    'JPM': [
      182.35, 188.72, 195.42, 192.85, 198.45, 205.72,
      202.45, 195.85, 202.42, 208.75, 215.42, 218.85,
      212.45, 205.72, 208.85, 198.42, 212.85, 218.45,
      222.75, 225.42, 228.85, 225.72, 228.45, 232.85
    ],
    // UnitedHealth: Healthcare. Range: $480-560
    'UNH': [
      492.85, 505.42, 518.75, 512.45, 525.85, 532.42,
      528.75, 518.45, 525.42, 535.72, 542.85, 548.45,
      538.72, 525.45, 532.85, 518.42, 538.75, 545.42,
      552.85, 558.42, 562.75, 555.42, 558.85, 565.42
    ],
    // Visa: Payments. Range: $275-320
    'V': [
      281.42, 288.75, 295.42, 292.85, 298.45, 305.72,
      302.45, 295.85, 302.42, 308.75, 315.42, 318.85,
      312.45, 305.72, 308.85, 298.42, 312.85, 318.45,
      322.75, 325.42, 328.85, 325.72, 328.45, 332.85
    ],
    // Costco: Retail. Range: $700-850
    'COST': [
      728.45, 742.85, 758.42, 752.75, 768.45, 782.85,
      775.42, 762.85, 778.42, 792.75, 808.45, 825.72,
      812.45, 798.72, 808.85, 785.42, 818.75, 832.45,
      845.72, 858.45, 872.85, 865.42, 878.75, 892.45
    ],
    // Netflix: Streaming. Range: $520-720
    'NFLX': [
      542.18, 558.75, 575.42, 562.85, 585.45, 608.72,
      625.45, 612.85, 628.42, 652.75, 678.45, 702.85,
      685.42, 665.72, 678.85, 642.45, 685.72, 708.45,
      725.85, 738.42, 752.75, 745.42, 758.85, 772.45
    ],
    // Salesforce: Enterprise software. Range: $250-340
    'CRM': [
      272.45, 285.72, 298.45, 292.85, 308.42, 318.75,
      312.45, 298.72, 308.85, 322.45, 335.72, 342.85,
      328.45, 312.85, 325.42, 298.75, 322.85, 338.45,
      348.72, 355.85, 362.42, 358.75, 365.42, 372.85
    ],
    // Adobe: Creative software. Range: $470-580
    'ADBE': [
      485.72, 498.45, 512.85, 505.42, 518.75, 532.45,
      525.72, 512.45, 525.85, 542.72, 558.45, 572.85,
      558.42, 542.75, 552.85, 528.45, 552.72, 568.45,
      582.75, 595.42, 608.85, 602.45, 615.72, 628.45
    ],
    // Broadcom: Semiconductors. Range: $1500-2000
    'AVGO': [
      1625.45, 1685.72, 1752.45, 1718.85, 1785.42, 1845.72,
      1812.45, 1765.85, 1828.42, 1885.72, 1942.45, 1998.85,
      1945.72, 1885.45, 1928.75, 1845.42, 1912.85, 1968.45,
      2025.72, 2085.45, 2142.85, 2108.72, 2165.45, 2225.85
    ],
    // Berkshire Hathaway: Conglomerate. Range: $430-520
    'BRK.B': [
      442.85, 455.72, 468.45, 462.85, 478.42, 488.75,
      482.45, 472.85, 485.42, 498.72, 508.45, 518.85,
      505.72, 492.45, 505.85, 485.42, 508.72, 522.45,
      535.85, 548.42, 562.75, 555.45, 568.72, 582.45
    ],
    // Eli Lilly: Pharma. Range: $850-1050
    'LLY': [
      892.45, 918.72, 945.85, 928.45, 958.72, 985.45,
      968.75, 942.85, 972.45, 998.72, 1025.45, 1048.85,
      1015.72, 985.45, 1012.85, 965.42, 1008.75, 1045.42,
      1072.85, 1098.45, 1125.72, 1108.85, 1135.42, 1162.85
    ],
    // AMD: Semiconductors. Range: $100-180
    'AMD': [
      152.85, 162.45, 172.85, 165.42, 178.72, 185.45,
      175.42, 158.85, 168.45, 178.72, 188.45, 195.85,
      182.45, 112.85, 128.45, 108.72, 138.85, 155.42,
      168.75, 178.45, 188.72, 182.45, 192.85, 202.45
    ],
    // ServiceNow: Enterprise software. Range: $850-1050
    'NOW': [
      865.42, 892.75, 918.45, 905.72, 935.85, 962.45,
      948.72, 925.45, 952.85, 985.42, 1012.75, 1038.85,
      1005.42, 975.85, 1005.72, 962.45, 1008.85, 1045.72,
      1075.45, 1102.85, 1132.45, 1118.72, 1148.85, 1178.45
    ],
    // Palantir: AI/Data analytics. Range: $18-85
    'PLTR': [
      42.85, 48.72, 55.45, 52.85, 58.42, 62.75,
      58.45, 52.72, 58.85, 65.42, 72.45, 78.85,
      72.45, 65.85, 72.45, 58.72, 72.85, 82.45,
      88.72, 95.45, 102.85, 98.42, 105.72, 112.85
    ],
    // Intuit: Financial software. Range: $600-750
    'INTU': [
      628.45, 645.72, 662.85, 655.42, 678.75, 698.45,
      685.72, 668.45, 685.85, 702.72, 718.45, 735.85,
      718.42, 698.75, 715.45, 685.42, 718.85, 738.45,
      755.72, 772.85, 792.45, 785.42, 802.75, 818.85
    ],
    // Coinbase: Crypto exchange. Range: $80-400
    'COIN': [
      285.72, 312.45, 345.85, 328.42, 358.75, 385.42,
      362.45, 318.72, 348.85, 385.42, 425.72, 468.85,
      442.45, 398.72, 428.85, 358.45, 412.85, 458.72,
      485.45, 512.85, 545.72, 528.45, 562.85, 598.45
    ],
    // Block (Square): Fintech. Range: $55-120
    'SQ': [
      88.45, 95.72, 102.85, 98.42, 108.75, 115.42,
      108.45, 95.72, 102.85, 112.45, 125.72, 138.85,
      128.45, 115.72, 125.45, 105.42, 128.85, 145.72,
      158.45, 172.85, 185.42, 178.75, 192.45, 208.85
    ],
    // Solana: Crypto. Range: $80-280
    'SOL': [
      245.85, 268.42, 295.72, 278.45, 308.85, 325.42,
      298.45, 252.72, 278.85, 312.45, 345.72, 378.85,
      352.45, 298.72, 325.85, 268.42, 312.85, 358.72,
      385.45, 412.85, 445.72, 428.45, 465.85, 502.45
    ],
    // Shopify: E-commerce. Range: $65-145
    'SHOP': [
      108.42, 115.72, 122.85, 118.45, 128.72, 135.85,
      128.42, 118.75, 125.85, 135.42, 145.72, 158.85,
      148.45, 138.72, 145.85, 128.42, 148.75, 162.45,
      175.72, 185.45, 195.85, 188.42, 198.75, 212.45
    ],
    // CrowdStrike: Cybersecurity. Range: $280-450
    'CRWD': [
      358.72, 375.45, 392.85, 385.42, 408.75, 425.42,
      412.45, 392.72, 408.85, 428.42, 448.75, 472.85,
      452.45, 428.72, 445.85, 398.45, 442.85, 468.72,
      492.45, 518.85, 545.72, 532.45, 558.85, 585.42
    ],
    // Snowflake: Cloud data. Range: $130-200
    'SNOW': [
      168.45, 178.72, 188.45, 182.85, 195.42, 205.72,
      198.45, 185.72, 195.85, 208.42, 218.75, 232.45,
      218.72, 202.45, 215.85, 185.42, 208.72, 225.45,
      242.85, 258.42, 275.72, 265.45, 282.85, 298.42
    ],
    // Novo Nordisk: Pharma. Range: $85-130
    'NVO': [
      92.85, 98.42, 105.72, 102.45, 108.85, 115.42,
      112.45, 105.72, 112.85, 118.42, 125.72, 132.45,
      125.85, 118.42, 125.72, 112.45, 125.85, 135.42,
      142.85, 148.42, 155.72, 152.45, 158.85, 165.42
    ],
    // Lockheed Martin: Defense. Range: $440-530
    'LMT': [
      468.75, 478.42, 488.85, 482.45, 495.72, 508.45,
      502.85, 492.45, 505.72, 518.42, 528.85, 542.45,
      535.72, 522.45, 535.85, 512.42, 538.75, 552.45,
      568.85, 582.42, 598.75, 588.45, 602.85, 618.42
    ],
    // Datadog: Monitoring. Range: $100-160
    'DDOG': [
      128.45, 135.72, 145.85, 142.45, 152.72, 162.45,
      155.85, 145.42, 155.72, 168.42, 178.85, 192.45,
      182.72, 168.45, 178.85, 158.42, 178.72, 195.45,
      208.85, 222.42, 235.72, 228.45, 242.85, 258.42
    ],
    // MongoDB: Database. Range: $250-340
    'MDB': [
      285.72, 298.45, 312.85, 305.42, 318.75, 332.45,
      325.72, 312.45, 325.85, 342.72, 358.45, 375.85,
      362.45, 345.72, 358.85, 328.42, 358.75, 378.45,
      395.72, 412.85, 432.45, 422.75, 442.85, 462.45
    ],
  };

  const assetNames: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corp.',
    'NVDA': 'NVIDIA Corp.',
    'ASML': 'ASML Holding',
    'TSLA': 'Tesla Inc.',
    'AGG': 'iShares Core US Aggregate Bond',
    'BND': 'Vanguard Total Bond Market',
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'TSM': 'Taiwan Semiconductor',
    'EEM': 'iShares MSCI Emerging Markets',
    'AMZN': 'Amazon.com Inc.',
    'GOOGL': 'Alphabet Inc.',
    'META': 'Meta Platforms Inc.',
    'JPM': 'JPMorgan Chase',
    'UNH': 'UnitedHealth Group',
    'V': 'Visa Inc.',
    'COST': 'Costco Wholesale',
    'NFLX': 'Netflix Inc.',
    'CRM': 'Salesforce Inc.',
    'ADBE': 'Adobe Inc.',
    'AVGO': 'Broadcom Inc.',
    'BRK.B': 'Berkshire Hathaway',
    'LLY': 'Eli Lilly',
    'AMD': 'AMD Inc.',
    'NOW': 'ServiceNow Inc.',
    'PLTR': 'Palantir Technologies',
    'INTU': 'Intuit Inc.',
    'COIN': 'Coinbase Global',
    'SQ': 'Block Inc.',
    'SOL': 'Solana',
    'SHOP': 'Shopify Inc.',
    'CRWD': 'CrowdStrike Holdings',
    'SNOW': 'Snowflake Inc.',
    'NVO': 'Novo Nordisk',
    'LMT': 'Lockheed Martin',
    'DDOG': 'Datadog Inc.',
    'MDB': 'MongoDB Inc.',
  };

  // FX rates: EUR/USD monthly averages
  const eurUsdRates = [
    1.0850, 1.0780, 1.0825, 1.0720, 1.0850, 1.0720,
    1.0825, 1.0920, 1.1075, 1.0795, 1.0550, 1.0425,
    1.0385, 1.0450, 1.0850, 1.0925, 1.1180, 1.0875,
    1.0950, 1.1025, 1.1100, 1.1050, 1.1125, 1.1200
  ];

  let idCounter = 1;

  for (const [ticker, prices] of Object.entries(priceHistory)) {
    for (let i = 0; i < months.length; i++) {
      const isEuro = ticker === 'ASML' || ticker === 'NVO';
      
      valuations.push({
        id: `val-${idCounter++}`,
        assetId: ticker,
        ticker,
        assetName: assetNames[ticker],
        month: months[i],
        pricePerUnit: prices[i],
        fxRate: isEuro ? eurUsdRates[i] : 1,
      });
    }
  }

  return valuations;
};

export const sampleValuations = generateValuations();
