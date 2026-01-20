import { Transaction, MonthlyValuation } from '@/types/investment';

/**
 * Sample Portfolio Data - Institutional Family Office
 * 
 * Date Range: January 2018 - December 2025 (8 years)
 * Target CAGR: ~12% (11.5%-12.5% annualized)
 * Target Portfolio Value: ~$2.1M-$2.25M (latest)
 * Transactions per Year: 8-17 (distributed across months)
 * 
 * IMPORTANT: All price series are hand-crafted to ensure:
 * - No NaN values
 * - Realistic volatility with both positive AND negative months
 * - Proper data for all calculations (Volatility, Sortino, VaR, etc.)
 */

// ============================================================================
// TRANSACTIONS - 2018-2025, chronologically ordered
// Each year: 8-17 transactions distributed across months
// ============================================================================
export const sampleTransactions: Transaction[] = [
  // =========== 2018: Initial Portfolio Construction (12 transactions) ===========
  { id: 'tx-2018-001', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2018-01-15', quantity: 400, pricePerUnit: 43.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2018-002', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2018-02-12', quantity: 200, pricePerUnit: 92.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2018-003', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2018-02-28', quantity: 500, pricePerUnit: 105.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2018-004', assetName: 'Vanguard Total International Stock', ticker: 'VXUS', assetType: 'etf', transactionType: 'buy', 
    date: '2018-04-10', quantity: 300, pricePerUnit: 56.80, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2011 },
  { id: 'tx-2018-005', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2018-05-22', quantity: 50, pricePerUnit: 79.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2018-006', assetName: 'Bridgewater Pure Alpha Fund', ticker: 'BWPA', assetType: 'hedge_fund', transactionType: 'buy', 
    date: '2018-06-15', quantity: 1, pricePerUnit: 50000.00, fees: 250.00, currency: 'USD', geography: 'global', inceptionYear: 1991 },
  { id: 'tx-2018-007', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2018-07-18', quantity: 150, pricePerUnit: 108.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2018-008', assetName: 'PIMCO Total Return Fund', ticker: 'PTTRX', assetType: 'mutual_fund', transactionType: 'buy', 
    date: '2018-08-09', quantity: 2000, pricePerUnit: 10.15, fees: 0.00, currency: 'USD', geography: 'north_america', inceptionYear: 1987 },
  { id: 'tx-2018-009', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2018-09-20', quantity: 3, pricePerUnit: 6350.00, fees: 95.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2018-010', assetName: 'Blackstone Real Estate Partners IX', ticker: 'BREP9', assetType: 'real_estate', transactionType: 'buy', 
    date: '2018-10-15', quantity: 1, pricePerUnit: 100000.00, fees: 500.00, currency: 'USD', geography: 'north_america', inceptionYear: 2018 },
  { id: 'tx-2018-011', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2018-11-12', quantity: 200, pricePerUnit: 115.40, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2018-012', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2018-12-20', quantity: 75, pricePerUnit: 198.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },

  // =========== 2019: Building Core + Adding Alternatives (14 transactions) ===========
  { id: 'tx-2019-001', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2019-01-28', quantity: 200, pricePerUnit: 39.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2019-002', assetName: 'KKR Private Credit Fund', ticker: 'KPFC', assetType: 'private_debt', transactionType: 'buy', 
    date: '2019-02-18', quantity: 1, pricePerUnit: 75000.00, fees: 375.00, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-2019-003', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2019-03-15', quantity: 40, pricePerUnit: 58.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2019-004', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2019-04-22', quantity: 400, pricePerUnit: 44.25, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-2019-005', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2019-05-13', quantity: 150, pricePerUnit: 35.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2019-006', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2019-06-10', quantity: 100, pricePerUnit: 133.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2019-007', assetName: 'Sequoia Capital Global Equities', ticker: 'SCGE', assetType: 'private_equity', transactionType: 'buy', 
    date: '2019-07-15', quantity: 1, pricePerUnit: 100000.00, fees: 500.00, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-2019-008', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2019-08-05', quantity: 25, pricePerUnit: 215.00, fees: 54.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2019-009', assetName: 'Visa Inc.', ticker: 'V', assetType: 'equity', transactionType: 'buy', 
    date: '2019-09-18', quantity: 100, pricePerUnit: 175.80, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2008 },
  { id: 'tx-2019-010', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', 
    date: '2019-10-14', quantity: 200, pricePerUnit: 52.15, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },
  { id: 'tx-2019-011', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2019-11-08', quantity: 250, pricePerUnit: 111.85, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2019-012', assetName: 'AQR Managed Futures Strategy', ticker: 'AQMIX', assetType: 'alternative', transactionType: 'buy', 
    date: '2019-11-22', quantity: 3000, pricePerUnit: 8.45, fees: 0.00, currency: 'USD', geography: 'global', inceptionYear: 2010 },
  { id: 'tx-2019-013', assetName: 'UnitedHealth Group', ticker: 'UNH', assetType: 'equity', transactionType: 'buy', 
    date: '2019-12-09', quantity: 50, pricePerUnit: 285.40, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1984 },
  { id: 'tx-2019-014', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2019-12-18', quantity: 100, pricePerUnit: 141.25, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },

  // =========== 2020: COVID Volatility & Recovery (17 transactions) ===========
  { id: 'tx-2020-001', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-01-21', quantity: 100, pricePerUnit: 28.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2020-002', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2020-02-10', quantity: 2, pricePerUnit: 9850.00, fees: 98.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2020-003', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2020-03-16', quantity: 300, pricePerUnit: 60.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2020-004', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2020-03-23', quantity: 150, pricePerUnit: 138.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2020-005', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2020-04-14', quantity: 25, pricePerUnit: 118.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2020-006', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-05-11', quantity: 100, pricePerUnit: 18.12, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2020-007', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2020-06-08', quantity: 30, pricePerUnit: 242.00, fees: 73.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2020-008', assetName: 'Oaktree Capital Private Credit', ticker: 'OCPC', assetType: 'private_debt', transactionType: 'buy', 
    date: '2020-06-22', quantity: 1, pricePerUnit: 50000.00, fees: 250.00, currency: 'USD', geography: 'north_america', inceptionYear: 2020 },
  { id: 'tx-2020-009', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2020-07-20', quantity: 30, pricePerUnit: 75.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2020-010', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2020-08-10', quantity: 300, pricePerUnit: 88.45, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-2020-011', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2020-09-02', quantity: 200, pricePerUnit: 129.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2020-012', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-10-19', quantity: 75, pricePerUnit: 84.10, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2020-013', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2020-11-16', quantity: 1.5, pricePerUnit: 16250.00, fees: 122.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2020-014', assetName: 'Carlyle Real Estate Partners V', ticker: 'CREP5', assetType: 'real_estate', transactionType: 'buy', 
    date: '2020-11-30', quantity: 1, pricePerUnit: 75000.00, fees: 375.00, currency: 'USD', geography: 'north_america', inceptionYear: 2020 },
  { id: 'tx-2020-015', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2020-12-07', quantity: 60, pricePerUnit: 168.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },
  { id: 'tx-2020-016', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2020-12-14', quantity: 200, pricePerUnit: 50.35, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-2020-017', assetName: 'Renaissance Institutional Equities', ticker: 'RIEF', assetType: 'hedge_fund', transactionType: 'buy', 
    date: '2020-12-21', quantity: 1, pricePerUnit: 75000.00, fees: 375.00, currency: 'USD', geography: 'north_america', inceptionYear: 2005 },

  // =========== 2021: Bull Market Peak (15 transactions) ===========
  { id: 'tx-2021-001', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2021-01-11', quantity: 1, pricePerUnit: 35250.00, fees: 176.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2021-002', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2021-02-08', quantity: 80, pricePerUnit: 32.62, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2021-003', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2021-03-15', quantity: 15, pricePerUnit: 1780.00, fees: 134.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2021-004', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', 
    date: '2021-03-29', quantity: 20, pricePerUnit: 585.00, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  { id: 'tx-2021-005', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'sell', 
    date: '2021-04-26', quantity: 50, pricePerUnit: 144.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2021-006', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2021-05-10', quantity: 80, pricePerUnit: 315.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2021-007', assetName: 'Apollo Credit Opportunities', ticker: 'ACOF', assetType: 'private_debt', transactionType: 'buy', 
    date: '2021-06-14', quantity: 1, pricePerUnit: 50000.00, fees: 250.00, currency: 'USD', geography: 'north_america', inceptionYear: 2021 },
  { id: 'tx-2021-008', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2021-07-19', quantity: 50, pricePerUnit: 280.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2021-009', assetName: 'Costco Wholesale', ticker: 'COST', assetType: 'equity', transactionType: 'buy', 
    date: '2021-08-16', quantity: 30, pricePerUnit: 445.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1985 },
  { id: 'tx-2021-010', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2021-09-07', quantity: 1.5, pricePerUnit: 52450.00, fees: 394.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2021-011', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2021-10-18', quantity: 25, pricePerUnit: 142.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2021-012', assetName: 'Starwood Real Estate Income Trust', ticker: 'SREIT', assetType: 'real_estate', transactionType: 'buy', 
    date: '2021-11-08', quantity: 1, pricePerUnit: 50000.00, fees: 250.00, currency: 'USD', geography: 'north_america', inceptionYear: 2018 },
  { id: 'tx-2021-013', assetName: 'Adobe Inc.', ticker: 'ADBE', assetType: 'equity', transactionType: 'buy', 
    date: '2021-11-22', quantity: 25, pricePerUnit: 680.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2021-014', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2021-12-06', quantity: 150, pricePerUnit: 114.20, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2021-015', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'sell', 
    date: '2021-12-20', quantity: 10, pricePerUnit: 3950.00, fees: 198.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },

  // =========== 2022: Bear Market (11 transactions) ===========
  { id: 'tx-2022-001', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2022-01-18', quantity: 150, pricePerUnit: 168.50, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2022-002', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2022-02-14', quantity: 150, pricePerUnit: 168.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2022-003', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2022-03-21', quantity: 200, pricePerUnit: 78.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-2022-004', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2022-05-09', quantity: 60, pricePerUnit: 110.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2022-005', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2022-06-20', quantity: 20, pricePerUnit: 1050.00, fees: 105.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2022-006', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2022-07-18', quantity: 50, pricePerUnit: 275.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },
  { id: 'tx-2022-007', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'sell', 
    date: '2022-08-22', quantity: 40, pricePerUnit: 165.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2022-008', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2022-09-12', quantity: 75, pricePerUnit: 112.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2022-009', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2022-10-24', quantity: 100, pricePerUnit: 14.25, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2022-010', assetName: 'Vanguard Total International Stock', ticker: 'VXUS', assetType: 'etf', transactionType: 'buy', 
    date: '2022-11-14', quantity: 200, pricePerUnit: 49.75, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2011 },
  { id: 'tx-2022-011', assetName: 'AQR Managed Futures Strategy', ticker: 'AQMIX', assetType: 'alternative', transactionType: 'buy', 
    date: '2022-12-12', quantity: 2000, pricePerUnit: 11.85, fees: 0.00, currency: 'USD', geography: 'global', inceptionYear: 2010 },

  // =========== 2023: AI Rally (13 transactions) ===========
  { id: 'tx-2023-001', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2023-01-23', quantity: 40, pricePerUnit: 242.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2023-002', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2023-02-13', quantity: 50, pricePerUnit: 175.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2023-003', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2023-03-20', quantity: 1, pricePerUnit: 27500.00, fees: 138.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2023-004', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2023-04-17', quantity: 75, pricePerUnit: 27.20, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2023-005', assetName: 'CrowdStrike Holdings', ticker: 'CRWD', assetType: 'equity', transactionType: 'buy', 
    date: '2023-05-08', quantity: 40, pricePerUnit: 145.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-2023-006', assetName: 'Blackstone Real Estate Partners IX', ticker: 'BREP9', assetType: 'real_estate', transactionType: 'sell', 
    date: '2023-06-19', quantity: 0.5, pricePerUnit: 115000.00, fees: 288.00, currency: 'USD', geography: 'north_america', inceptionYear: 2018 },
  { id: 'tx-2023-007', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2023-07-24', quantity: 50, pricePerUnit: 193.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2023-008', assetName: 'Palantir Technologies', ticker: 'PLTR', assetType: 'equity', transactionType: 'buy', 
    date: '2023-08-14', quantity: 200, pricePerUnit: 15.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2020 },
  { id: 'tx-2023-009', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2023-09-11', quantity: 10, pricePerUnit: 1635.00, fees: 82.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2023-010', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', 
    date: '2023-10-16', quantity: 50, pricePerUnit: 88.50, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },
  { id: 'tx-2023-011', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', 
    date: '2023-11-06', quantity: 10, pricePerUnit: 665.00, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  { id: 'tx-2023-012', assetName: 'Broadcom Inc.', ticker: 'AVGO', assetType: 'equity', transactionType: 'buy', 
    date: '2023-11-27', quantity: 20, pricePerUnit: 945.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2009 },
  { id: 'tx-2023-013', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'sell', 
    date: '2023-12-18', quantity: 200, pricePerUnit: 99.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },

  // =========== 2024: Rate Cut Rally (15 transactions) ===========
  { id: 'tx-2024-001', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-01-15', quantity: 0.5, pricePerUnit: 42850.00, fees: 107.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2024-002', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-12', quantity: 50, pricePerUnit: 72.20, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2024-003', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-26', quantity: 40, pricePerUnit: 172.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2024-004', assetName: 'ServiceNow Inc.', ticker: 'NOW', assetType: 'equity', transactionType: 'buy', 
    date: '2024-03-18', quantity: 15, pricePerUnit: 768.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2024-005', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2024-04-22', quantity: 25, pricePerUnit: 402.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2024-006', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-13', quantity: 15, pricePerUnit: 785.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },
  { id: 'tx-2024-007', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-06-10', quantity: 5, pricePerUnit: 3580.00, fees: 90.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2024-008', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2024-07-15', quantity: 100, pricePerUnit: 228.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2024-009', assetName: 'Datadog Inc.', ticker: 'DDOG', assetType: 'equity', transactionType: 'buy', 
    date: '2024-08-05', quantity: 50, pricePerUnit: 115.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-2024-010', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2024-09-16', quantity: 150, pricePerUnit: 74.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-2024-011', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2024-10-21', quantity: 1, pricePerUnit: 68500.00, fees: 343.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2024-012', assetName: 'Palantir Technologies', ticker: 'PLTR', assetType: 'equity', transactionType: 'buy', 
    date: '2024-11-11', quantity: 100, pricePerUnit: 52.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2020 },
  { id: 'tx-2024-013', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-11-25', quantity: 30, pricePerUnit: 338.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2024-014', assetName: 'Coinbase Global', ticker: 'COIN', assetType: 'equity', transactionType: 'buy', 
    date: '2024-12-09', quantity: 40, pricePerUnit: 312.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2021 },
  { id: 'tx-2024-015', assetName: 'Solana', ticker: 'SOL', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-12-20', quantity: 30, pricePerUnit: 185.00, fees: 28.00, currency: 'USD', geography: 'global', inceptionYear: 2020 },

  // =========== 2025: Current Year (10 transactions through December) ===========
  { id: 'tx-2025-001', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2025-01-13', quantity: 40, pricePerUnit: 138.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2025-002', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-02-10', quantity: 30, pricePerUnit: 188.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2025-003', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2025-03-17', quantity: 0.5, pricePerUnit: 85000.00, fees: 213.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2025-004', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2025-04-14', quantity: 20, pricePerUnit: 545.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2025-005', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2025-05-12', quantity: 100, pricePerUnit: 101.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2025-006', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', 
    date: '2025-06-09', quantity: 25, pricePerUnit: 205.00, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },
  { id: 'tx-2025-007', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'sell', 
    date: '2025-08-18', quantity: 50, pricePerUnit: 468.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2025-008', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2025-09-22', quantity: 8, pricePerUnit: 3250.00, fees: 130.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2025-009', assetName: 'Broadcom Inc.', ticker: 'AVGO', assetType: 'equity', transactionType: 'buy', 
    date: '2025-10-13', quantity: 10, pricePerUnit: 1185.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2009 },
  { id: 'tx-2025-010', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-12-08', quantity: 40, pricePerUnit: 258.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
];

// ============================================================================
// MONTHLY VALUATIONS - Hand-crafted to ensure:
// - No NaN values
// - Realistic volatility with negative months (for Sortino/VaR)
// - Complete coverage for all assets
// ============================================================================

// All months from Jan 2018 through Dec 2025
const allMonths: string[] = [];
for (let year = 2018; year <= 2025; year++) {
  for (let month = 1; month <= 12; month++) {
    allMonths.push(`${year}-${month.toString().padStart(2, '0')}`);
  }
}

// Explicit price arrays with realistic volatility including drawdowns
// Each array has 96 values (8 years * 12 months)
const priceData: Record<string, { name: string; prices: number[]; fxRate?: boolean }> = {
  'AAPL': {
    name: 'Apple Inc.',
    prices: [
      // 2018: Q4 selloff
      43.75, 44.12, 42.85, 41.95, 46.25, 46.82, 47.45, 55.12, 56.78, 54.25, 44.85, 39.48,
      // 2019: Strong recovery
      39.50, 43.25, 47.85, 50.12, 44.12, 49.85, 52.45, 51.85, 55.78, 62.45, 66.12, 73.45,
      // 2020: COVID crash and recovery
      77.38, 68.34, 57.31, 63.57, 79.49, 91.20, 106.26, 129.04, 115.81, 108.86, 119.05, 132.69,
      // 2021: Steady growth
      131.96, 127.79, 122.15, 131.46, 124.61, 136.96, 145.86, 151.83, 141.50, 149.80, 165.30, 177.57,
      // 2022: Bear market
      174.78, 165.12, 174.61, 157.65, 148.84, 136.72, 162.51, 157.22, 138.20, 153.34, 148.03, 129.93,
      // 2023: AI rally
      142.53, 147.41, 164.90, 169.68, 177.25, 193.97, 196.45, 187.65, 171.21, 170.77, 189.95, 192.53,
      // 2024: Continued growth
      185.85, 181.42, 171.15, 169.30, 189.87, 195.87, 228.00, 226.21, 228.87, 233.85, 237.28, 246.75,
      // 2025: Current year
      241.53, 248.87, 252.15, 245.68, 255.42, 258.80, 262.45, 258.12, 265.38, 268.65, 272.20, 275.85
    ]
  },
  'MSFT': {
    name: 'Microsoft Corp.',
    prices: [
      // 2018
      92.00, 93.77, 89.58, 93.52, 98.84, 98.61, 105.37, 108.04, 114.37, 106.81, 110.19, 101.57,
      // 2019
      104.43, 112.03, 117.94, 123.37, 126.24, 133.96, 136.27, 137.86, 139.44, 143.72, 149.70, 157.70,
      // 2020
      170.23, 162.01, 157.71, 179.21, 183.25, 203.51, 205.01, 225.53, 210.33, 202.47, 216.51, 222.42,
      // 2021
      231.60, 232.38, 235.77, 252.18, 249.68, 270.90, 284.91, 301.88, 281.92, 331.62, 330.59, 336.32,
      // 2022
      310.98, 298.79, 308.31, 277.52, 271.87, 256.83, 280.74, 261.47, 232.90, 232.13, 255.14, 239.82,
      // 2023
      242.04, 249.42, 288.30, 307.26, 328.39, 340.54, 337.77, 327.76, 315.75, 329.32, 378.91, 376.04,
      // 2024
      388.47, 397.58, 420.72, 402.00, 416.65, 442.57, 452.92, 411.78, 430.08, 410.37, 428.15, 421.54,
      // 2025
      438.72, 445.35, 458.68, 462.45, 472.65, 478.18, 468.00, 475.75, 482.42, 488.90, 495.25, 502.60
    ]
  },
  'NVDA': {
    name: 'NVIDIA Corp.',
    // Split-adjusted (4:1 in 2021, 10:1 in 2024)
    prices: [
      // 2018 (pre-split adjusted)
      5.88, 6.12, 5.75, 5.62, 6.25, 6.45, 6.32, 7.12, 7.05, 5.25, 3.75, 3.35,
      // 2019
      3.65, 3.82, 4.45, 4.62, 3.55, 4.02, 4.25, 4.45, 4.38, 5.12, 5.45, 5.92,
      // 2020
      5.85, 7.15, 6.25, 7.35, 8.85, 9.52, 10.62, 13.15, 13.52, 13.25, 13.45, 13.12,
      // 2021
      13.05, 14.45, 13.25, 14.82, 15.25, 19.45, 19.72, 22.35, 22.15, 26.85, 32.62, 29.45,
      // 2022 (major drawdown)
      24.85, 24.25, 27.45, 19.05, 18.12, 15.75, 18.45, 17.25, 12.15, 14.25, 16.45, 14.65,
      // 2023 (AI boom)
      19.25, 23.45, 27.85, 27.20, 38.52, 42.35, 47.25, 45.85, 44.72, 40.85, 49.72, 49.52,
      // 2024 (10:1 split in June, prices are post-split)
      72.20, 79.28, 90.35, 87.73, 92.47, 120.48, 117.52, 109.21, 116.38, 132.45, 141.27, 134.58,
      // 2025
      138.50, 128.75, 132.35, 128.42, 135.28, 141.45, 148.72, 145.30, 152.18, 148.65, 155.42, 162.85
    ]
  },
  'AMZN': {
    name: 'Amazon.com Inc.',
    // 20:1 split in 2022
    prices: [
      // 2018 (pre-split adjusted)
      64.75, 73.55, 72.25, 78.25, 79.00, 85.25, 91.35, 99.85, 100.15, 87.45, 82.45, 74.85,
      // 2019
      82.15, 81.05, 88.95, 92.35, 94.55, 94.75, 97.05, 89.35, 86.55, 87.95, 91.55, 92.45,
      // 2020
      94.25, 103.50, 97.25, 118.75, 123.25, 137.25, 157.85, 165.45, 162.35, 158.25, 155.75, 162.85,
      // 2021
      163.25, 162.15, 154.75, 172.85, 163.45, 172.25, 184.15, 165.85, 164.35, 169.45, 176.25, 166.75,
      // 2022 (20:1 split in June, post-split)
      153.25, 145.85, 162.75, 130.85, 110.50, 106.21, 122.28, 138.23, 113.00, 103.41, 100.79, 84.00,
      // 2023
      102.24, 93.76, 103.29, 106.96, 123.43, 130.36, 133.68, 138.01, 127.12, 127.74, 146.09, 151.94,
      // 2024
      155.72, 172.50, 178.42, 175.85, 182.35, 192.45, 185.72, 178.45, 185.92, 188.75, 195.42, 198.85,
      // 2025
      202.45, 205.72, 208.35, 215.85, 218.42, 225.75, 228.45, 225.72, 232.35, 235.85, 238.42, 242.75
    ]
  },
  'GOOGL': {
    name: 'Alphabet Inc.',
    // 20:1 split in 2022
    prices: [
      // 2018 (pre-split adjusted)
      54.75, 55.85, 51.25, 52.45, 54.85, 56.45, 60.25, 61.15, 59.85, 54.65, 52.85, 51.75,
      // 2019
      52.85, 55.75, 58.75, 59.45, 57.15, 54.15, 60.65, 59.35, 60.75, 62.95, 65.15, 67.05,
      // 2020
      72.35, 68.45, 56.15, 60.75, 70.75, 71.25, 75.50, 82.75, 73.65, 79.35, 87.75, 87.65,
      // 2021
      92.55, 103.95, 103.35, 116.85, 118.05, 122.65, 134.75, 144.95, 141.75, 149.65, 148.95, 144.65,
      // 2022 (post-split)
      136.05, 135.35, 139.95, 113.05, 113.37, 109.48, 116.32, 117.09, 96.15, 94.93, 101.42, 88.73,
      // 2023
      99.32, 90.31, 104.00, 108.22, 123.37, 120.97, 130.36, 129.54, 131.85, 125.61, 137.27, 140.93,
      // 2024
      141.80, 148.52, 155.42, 162.85, 172.45, 178.92, 185.42, 168.75, 162.45, 168.85, 175.42, 182.75,
      // 2025
      188.00, 185.85, 192.45, 188.72, 192.85, 198.42, 195.45, 198.72, 202.35, 205.85, 208.42, 212.75
    ]
  },
  'TSLA': {
    name: 'Tesla Inc.',
    // 5:1 split Aug 2020, 3:1 split Aug 2022
    prices: [
      // 2018 (adjusted)
      23.45, 22.85, 21.15, 19.85, 18.75, 22.45, 20.15, 19.85, 18.45, 22.75, 23.45, 22.15,
      // 2019
      21.25, 21.45, 18.85, 17.85, 12.85, 14.75, 16.15, 14.85, 16.05, 21.25, 22.15, 27.85,
      // 2020
      28.50, 53.85, 34.25, 50.35, 55.85, 72.25, 100.45, 166.15, 144.85, 143.35, 196.85, 235.25,
      // 2021
      268.45, 235.85, 219.75, 234.15, 208.65, 226.85, 231.55, 245.15, 258.75, 342.65, 382.75, 352.35,
      // 2022 (post 3:1 split)
      318.25, 285.45, 309.65, 290.25, 244.75, 224.45, 275.85, 265.45, 245.25, 205.75, 182.15, 123.15,
      // 2023
      150.85, 205.75, 207.45, 164.25, 213.95, 261.75, 270.45, 258.75, 250.45, 212.15, 244.05, 248.45,
      // 2024
      248.45, 188.52, 163.57, 171.05, 178.34, 197.88, 232.08, 214.92, 227.20, 252.48, 338.00, 403.84,
      // 2025
      378.52, 352.18, 338.92, 345.68, 362.45, 375.72, 388.45, 385.28, 392.65, 398.42, 405.18, 412.75
    ]
  },
  'META': {
    name: 'Meta Platforms Inc.',
    prices: [
      // 2018
      178.46, 176.62, 159.79, 169.10, 186.85, 194.32, 174.89, 172.90, 162.98, 153.42, 144.82, 131.09,
      // 2019
      166.69, 161.89, 166.69, 178.28, 177.47, 193.00, 193.99, 182.04, 178.08, 186.12, 195.70, 205.25,
      // 2020
      217.94, 192.47, 160.98, 188.54, 230.95, 242.24, 252.96, 273.61, 268.98, 271.09, 275.41, 273.16,
      // 2021
      268.73, 257.62, 294.53, 303.91, 315.50, 355.64, 351.24, 369.79, 343.01, 316.92, 333.12, 336.35,
      // 2022 (major crash)
      323.00, 212.41, 186.35, 174.95, 165.00, 161.25, 169.27, 168.34, 140.36, 97.94, 111.04, 120.26,
      // 2023 (recovery)
      175.00, 167.78, 211.94, 240.42, 264.28, 286.98, 318.60, 299.08, 304.23, 301.74, 342.12, 353.96,
      // 2024
      484.52, 498.35, 512.72, 485.45, 495.85, 508.42, 508.75, 482.45, 512.85, 545.72, 572.45, 585.42,
      // 2025
      545.00, 562.85, 578.72, 565.45, 582.85, 598.42, 585.42, 592.85, 608.42, 615.72, 628.45, 642.85
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
      134.79, 153.91, 155.22, 152.15, 163.36, 155.81, 154.45, 153.13, 163.19, 170.96, 159.46, 158.35,
      // 2022
      158.05, 138.05, 135.18, 124.85, 125.12, 112.50, 118.72, 118.76, 106.76, 117.73, 136.73, 134.10,
      // 2023
      139.66, 142.12, 129.49, 137.05, 133.75, 145.43, 155.55, 150.91, 147.95, 143.13, 158.35, 170.10,
      // 2024
      182.35, 188.72, 195.42, 192.85, 198.45, 205.72, 202.45, 195.85, 202.42, 208.75, 215.42, 218.85,
      // 2025
      222.45, 225.72, 228.85, 225.42, 232.85, 238.45, 242.75, 245.42, 248.85, 252.72, 258.45, 265.85
    ]
  },
  'V': {
    name: 'Visa Inc.',
    prices: [
      // 2018
      122.50, 124.12, 120.85, 124.75, 130.42, 133.25, 140.12, 147.85, 149.72, 139.85, 138.42, 131.85,
      // 2019
      138.72, 145.85, 154.42, 161.25, 159.72, 168.85, 175.80, 176.45, 172.35, 178.42, 183.25, 187.85,
      // 2020
      195.42, 191.25, 155.72, 170.85, 192.42, 195.85, 195.25, 208.72, 199.42, 192.85, 208.42, 218.72,
      // 2021
      213.85, 205.42, 211.72, 223.85, 228.42, 233.72, 245.85, 228.42, 223.72, 228.42, 205.72, 216.42,
      // 2022
      218.85, 215.42, 221.72, 199.85, 204.42, 196.72, 210.85, 209.42, 182.72, 186.85, 212.42, 207.72,
      // 2023
      221.85, 217.42, 226.72, 232.85, 236.42, 237.72, 247.85, 244.42, 245.72, 235.85, 255.42, 260.72,
      // 2024
      281.42, 288.75, 295.42, 292.85, 298.45, 305.72, 302.45, 295.85, 302.42, 308.75, 315.42, 318.85,
      // 2025
      322.75, 325.42, 328.85, 332.72, 338.45, 342.85, 338.72, 345.42, 352.85, 358.72, 365.45, 372.85
    ]
  },
  'UNH': {
    name: 'UnitedHealth Group',
    prices: [
      // 2018
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2019
      248.72, 252.45, 238.85, 241.72, 245.42, 248.85, 258.72, 232.45, 222.85, 248.72, 285.40, 293.85,
      // 2020
      285.42, 278.72, 235.85, 282.45, 295.72, 302.85, 318.42, 315.72, 318.85, 325.42, 342.85, 350.72,
      // 2021
      355.85, 348.72, 362.45, 395.85, 412.72, 398.45, 418.85, 425.72, 405.45, 445.85, 468.72, 502.45,
      // 2022
      498.85, 515.72, 528.45, 508.85, 495.72, 528.45, 545.85, 535.72, 508.45, 542.85, 558.72, 530.45,
      // 2023
      485.72, 478.45, 492.85, 508.72, 485.45, 478.85, 492.72, 478.45, 515.85, 528.72, 545.45, 527.85,
      // 2024
      492.85, 505.42, 518.75, 512.45, 525.85, 532.42, 528.75, 518.45, 525.42, 535.72, 542.85, 548.45,
      // 2025
      552.85, 558.42, 562.75, 568.45, 575.72, 582.85, 578.42, 585.72, 592.85, 598.42, 605.72, 612.85
    ]
  },
  'TSM': {
    name: 'Taiwan Semiconductor',
    prices: [
      // 2018
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2019
      0, 0, 0, 0, 0, 0, 0, 0, 0, 52.15, 54.72, 58.45,
      // 2020
      57.85, 54.25, 47.85, 52.45, 54.72, 56.85, 80.42, 79.85, 82.45, 87.72, 105.45, 109.25,
      // 2021
      127.45, 118.72, 115.45, 117.85, 118.42, 119.75, 120.85, 112.42, 111.72, 118.85, 122.42, 120.75,
      // 2022
      127.85, 112.42, 105.75, 92.85, 88.42, 81.75, 84.85, 81.42, 70.75, 65.85, 85.42, 74.75,
      // 2023
      88.50, 92.42, 95.75, 88.85, 100.42, 107.75, 102.85, 91.42, 88.75, 88.85, 97.42, 103.75,
      // 2024
      128.45, 135.72, 142.85, 130.28, 155.42, 168.75, 175.43, 162.28, 172.85, 182.45, 195.72, 205.28,
      // 2025
      205.00, 215.42, 225.28, 218.65, 232.45, 248.72, 258.35, 265.48, 272.65, 278.42, 285.18, 292.85
    ]
  },
  'BRK.B': {
    name: 'Berkshire Hathaway',
    prices: [
      // 2018
      198.50, 202.45, 198.72, 195.85, 192.42, 188.75, 195.85, 208.72, 212.45, 208.72, 212.45, 198.50,
      // 2019
      202.85, 205.42, 198.75, 205.85, 202.42, 198.75, 205.85, 198.42, 208.75, 212.85, 218.42, 226.75,
      // 2020
      222.85, 218.42, 178.75, 188.85, 185.42, 178.75, 188.85, 205.42, 218.75, 212.85, 225.42, 232.75,
      // 2021
      235.85, 248.42, 255.75, 262.85, 278.42, 275.75, 278.85, 282.42, 278.75, 288.85, 282.42, 298.75,
      // 2022
      318.85, 325.42, 348.75, 332.85, 305.42, 275.00, 288.85, 285.42, 268.75, 288.85, 312.42, 308.75,
      // 2023
      305.85, 302.42, 298.75, 318.85, 325.42, 342.75, 358.85, 355.42, 348.75, 342.85, 358.42, 355.75,
      // 2024
      442.85, 455.72, 468.45, 462.85, 478.42, 488.75, 485.42, 485.42, 505.85, 498.72, 508.45, 518.85,
      // 2025
      522.45, 535.72, 548.85, 555.45, 568.72, 575.45, 582.85, 578.42, 592.75, 605.45, 618.72, 632.45
    ]
  },
  'LLY': {
    name: 'Eli Lilly',
    prices: [
      // 2018-2019 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2020
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 168.50,
      // 2021
      198.72, 205.45, 188.72, 185.45, 195.72, 232.45, 258.72, 248.45, 238.72, 255.45, 272.85, 275.72,
      // 2022
      285.45, 262.72, 298.85, 305.45, 318.72, 325.85, 342.45, 318.72, 342.85, 362.45, 375.72, 365.85,
      // 2023
      358.45, 338.72, 382.85, 418.45, 458.72, 448.85, 468.45, 558.72, 548.85, 582.45, 598.72, 582.85,
      // 2024
      785.00, 798.72, 845.85, 828.45, 858.72, 885.45, 868.75, 842.85, 872.45, 898.72, 925.45, 948.85,
      // 2025
      972.85, 998.42, 1012.85, 985.42, 1028.75, 1045.42, 1072.85, 1098.45, 1125.72, 1108.85, 1135.42, 1162.85
    ]
  },
  'AGG': {
    name: 'iShares Core US Aggregate Bond',
    prices: [
      // 2018 (slight decline with rate hikes)
      105.50, 104.82, 105.15, 104.72, 105.28, 104.92, 105.18, 104.95, 104.52, 103.85, 104.42, 105.85,
      // 2019 (rates cut, bonds rally)
      106.42, 106.15, 107.52, 107.25, 108.42, 109.15, 110.52, 111.25, 111.85, 112.42, 111.85, 112.52,
      // 2020 (COVID flight to safety then recovery)
      114.85, 116.52, 112.25, 114.85, 116.25, 117.52, 118.25, 117.85, 117.52, 117.25, 117.85, 117.52,
      // 2021 (inflation concerns)
      116.52, 115.25, 114.52, 115.25, 115.85, 115.52, 116.25, 115.85, 114.52, 114.25, 114.20, 113.85,
      // 2022 (rate hike crash)
      112.52, 110.25, 108.52, 105.25, 104.85, 102.52, 103.25, 101.85, 98.52, 95.85, 99.52, 99.25,
      // 2023 (stabilization)
      100.52, 98.25, 99.52, 100.25, 98.85, 99.52, 99.50, 97.25, 95.85, 96.52, 99.25, 99.85,
      // 2024 (rate cut rally)
      98.21, 97.85, 97.42, 98.05, 97.68, 98.92, 99.45, 100.15, 100.72, 99.85, 100.28, 100.65,
      // 2025
      101.50, 101.42, 101.87, 102.35, 102.78, 103.15, 103.48, 103.85, 104.18, 103.95, 104.35, 104.72
    ]
  },
  'BND': {
    name: 'Vanguard Total Bond Market',
    prices: [
      // 2018
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2020
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
  'VXUS': {
    name: 'Vanguard Total International Stock',
    prices: [
      // 2018
      56.80, 55.42, 54.85, 55.72, 53.42, 52.25, 53.85, 53.42, 52.85, 48.72, 49.42, 47.85,
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
      // 2018
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2019
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
  'GLD': {
    name: 'SPDR Gold Shares',
    prices: [
      // 2018
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
  'BTC': {
    name: 'Bitcoin',
    prices: [
      // 2018 (bear market)
      0, 0, 0, 0, 0, 0, 0, 0, 6350, 6300, 4000, 3700,
      // 2019 (recovery)
      3500, 3400, 4100, 5200, 8500, 10800, 9500, 10100, 8300, 9200, 7500, 7200,
      // 2020 (halving rally)
      9350, 9850, 6500, 8700, 9500, 9150, 11350, 11650, 10750, 13750, 16250, 29000,
      // 2021 (bull run)
      35250, 45000, 58000, 57000, 37500, 35500, 41500, 47000, 52450, 61000, 57000, 46000,
      // 2022 (bear market crash)
      38000, 43000, 45500, 38000, 29500, 20000, 23250, 19750, 19500, 20500, 17150, 16500,
      // 2023 (recovery)
      23000, 23500, 27500, 29200, 27000, 30500, 29500, 26000, 26800, 34500, 37500, 42500,
      // 2024 (ETF rally)
      42850, 51600, 67200, 64000, 68500, 61300, 64250, 59150, 63800, 68500, 87400, 93850,
      // 2025
      85000, 92500, 85000, 88500, 95000, 102000, 105400, 98650, 92500, 98750, 105300, 112450
    ]
  },
  'ETH': {
    name: 'Ethereum',
    prices: [
      // 2018
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2019
      0, 0, 0, 0, 0, 0, 0, 215, 175, 180, 150, 130,
      // 2020
      135, 225, 135, 175, 210, 242, 315, 390, 355, 385, 575, 730,
      // 2021
      1350, 1450, 1780, 2150, 2500, 2275, 2150, 3100, 3350, 4300, 4650, 3950,
      // 2022 (crash)
      2550, 2750, 2950, 2800, 1850, 1050, 1650, 1550, 1350, 1300, 1250, 1200,
      // 2023 (recovery)
      1550, 1650, 1800, 1900, 1850, 1850, 1900, 1650, 1635, 1800, 2050, 2350,
      // 2024
      2518, 2892, 3412, 3180, 3758, 3580, 3285, 2645, 2418, 2685, 3245, 3892,
      // 2025
      3250, 3425, 3285, 3185, 3542, 3725, 3825, 3650, 3485, 3650, 3825, 3975
    ]
  },
  'SOL': {
    name: 'Solana',
    prices: [
      // 2018-2023 (no position until Dec 2024)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2024
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 185,
      // 2025
      195, 205, 215, 198, 225, 238, 245, 232, 248, 262, 275, 288
    ]
  },
  'ASML': {
    name: 'ASML Holding',
    fxRate: true,
    prices: [
      // 2018-2020 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021 (first purchase March)
      0, 0, 585, 625, 615, 640, 685, 725, 695, 735, 775, 705,
      // 2022
      665, 575, 565, 485, 475, 455, 505, 475, 385, 495, 585, 555,
      // 2023
      615, 625, 635, 655, 665, 715, 725, 635, 595, 615, 665, 715,
      // 2024
      785, 825, 945, 905, 925, 970, 895, 845, 730, 720, 695, 715,
      // 2025
      735, 752, 768, 745, 778, 795, 815, 828, 845, 862, 878, 895
    ]
  },
  'COST': {
    name: 'Costco Wholesale',
    prices: [
      // 2018-2020 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021 (first purchase Aug)
      0, 0, 0, 0, 0, 0, 0, 445, 455, 475, 495, 565,
      // 2022
      545, 485, 545, 525, 475, 485, 535, 545, 475, 485, 525, 455,
      // 2023
      485, 495, 505, 505, 525, 545, 555, 555, 565, 545, 595, 665,
      // 2024
      728.45, 742.85, 758.42, 752.75, 768.45, 782.85, 775.42, 762.85, 778.42, 792.75, 808.45, 825.72,
      // 2025
      845.72, 858.45, 872.85, 865.42, 888.75, 905.45, 925.72, 938.85, 952.45, 965.42, 978.75, 995.45
    ]
  },
  'ADBE': {
    name: 'Adobe Inc.',
    prices: [
      // 2018-2020 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021 (first purchase Nov)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 680, 565,
      // 2022 (crash)
      525, 485, 445, 405, 395, 375, 405, 385, 285, 315, 345, 335,
      // 2023
      345, 365, 385, 395, 425, 485, 525, 535, 515, 535, 595, 595,
      // 2024
      485.72, 498.45, 512.85, 505.42, 518.75, 532.45, 525.72, 512.45, 525.85, 542.72, 558.45, 545.85,
      // 2025
      562.75, 575.42, 588.85, 582.45, 605.72, 618.45, 632.75, 645.42, 658.85, 672.45, 685.72, 698.45
    ]
  },
  'AVGO': {
    name: 'Broadcom Inc.',
    prices: [
      // 2018-2022 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2023 (first purchase Nov)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 945, 1105,
      // 2024
      1205, 1285, 1375, 1318, 1385, 1445, 1412, 1365, 1428, 1485, 1542, 1598,
      // 2025
      1185, 1225, 1278, 1245, 1312, 1368, 1425, 1485, 1542, 1608, 1665, 1725
    ]
  },
  'CRWD': {
    name: 'CrowdStrike Holdings',
    prices: [
      // 2018-2022 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2023 (first purchase May)
      0, 0, 0, 0, 145, 165, 175, 165, 175, 185, 225, 255,
      // 2024
      358.72, 375.45, 392.85, 385.42, 408.75, 425.42, 412.45, 392.72, 408.85, 428.42, 448.75, 472.85,
      // 2025
      492.45, 508.72, 525.85, 512.45, 542.85, 568.72, 592.45, 618.85, 645.72, 672.45, 698.85, 725.42
    ]
  },
  'NOW': {
    name: 'ServiceNow Inc.',
    prices: [
      // 2018-2023 (no position until March 2024)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2024 (first purchase March)
      0, 0, 768, 805, 835, 862, 848, 825, 852, 885, 912, 938,
      // 2025
      975, 1002, 1035, 1018, 1068, 1105, 1145, 1182, 1225, 1268, 1308, 1348
    ]
  },
  'PLTR': {
    name: 'Palantir Technologies',
    prices: [
      // 2018-2022 (no position until Aug 2023)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2023 (first purchase Aug)
      0, 0, 0, 0, 0, 0, 0, 15.75, 16.85, 17.42, 19.75, 16.85,
      // 2024
      17.85, 23.45, 24.85, 22.85, 23.42, 25.75, 28.85, 32.42, 35.85, 42.85, 52.50, 68.85,
      // 2025
      78.00, 72.85, 82.45, 88.72, 95.45, 102.85, 98.42, 105.72, 112.85, 118.42, 125.72, 132.85
    ]
  },
  'DDOG': {
    name: 'Datadog Inc.',
    prices: [
      // 2018-2023 (no position until Aug 2024)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2024 (first purchase Aug)
      0, 0, 0, 0, 0, 0, 0, 115, 125, 135, 145, 155,
      // 2025
      165, 172, 178, 168, 182, 195, 208, 222, 235, 248, 262, 278
    ]
  },
  'COIN': {
    name: 'Coinbase Global',
    prices: [
      // 2018-2023 (no position until Dec 2024)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2024 (first purchase Dec)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 312,
      // 2025
      285, 295, 275, 265, 285, 305, 325, 312, 338, 355, 372, 388
    ]
  },
  // Alternative funds with smoother NAVs
  'BWPA': {
    name: 'Bridgewater Pure Alpha Fund',
    prices: [
      // 2018 (quarterly NAV updates)
      0, 0, 0, 0, 0, 50000, 50250, 50500, 50750, 51000, 51250, 51500,
      // 2019
      51750, 52000, 52250, 52500, 52750, 53000, 53250, 53500, 53750, 54000, 54250, 54500,
      // 2020 (slight dip then recovery)
      54750, 55000, 52500, 53500, 54500, 55500, 56500, 57500, 58500, 59500, 60500, 61500,
      // 2021
      62500, 63500, 64500, 65500, 66500, 67500, 68500, 69500, 70500, 71500, 72500, 73500,
      // 2022 (good year for alternatives)
      74500, 75500, 76500, 77500, 78500, 79500, 80500, 81500, 82500, 83500, 84500, 85500,
      // 2023
      86500, 87500, 88500, 89500, 90500, 91500, 92500, 93500, 94500, 95500, 96500, 97500,
      // 2024
      98500, 99500, 100500, 101500, 102500, 103500, 104500, 105500, 106500, 107500, 108500, 109500,
      // 2025
      110500, 111500, 112500, 113500, 114500, 115500, 116500, 117500, 118500, 119500, 120500, 121500
    ]
  },
  'RIEF': {
    name: 'Renaissance Institutional Equities',
    prices: [
      // 2018-2019 (no position)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2020 (first purchase Dec)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75000,
      // 2021
      76500, 78000, 79500, 81000, 82500, 84000, 85500, 87000, 88500, 90000, 91500, 93000,
      // 2022
      94500, 96000, 97500, 99000, 100500, 102000, 103500, 105000, 106500, 108000, 109500, 111000,
      // 2023
      112500, 114000, 115500, 117000, 118500, 120000, 121500, 123000, 124500, 126000, 127500, 129000,
      // 2024
      130500, 132000, 133500, 135000, 136500, 138000, 139500, 141000, 142500, 144000, 145500, 147000,
      // 2025
      148500, 150000, 151500, 153000, 154500, 156000, 157500, 159000, 160500, 162000, 163500, 165000
    ]
  },
  'PTTRX': {
    name: 'PIMCO Total Return Fund',
    prices: [
      // 2018
      0, 0, 0, 0, 0, 0, 0, 10.15, 10.12, 10.08, 10.15, 10.25,
      // 2019
      10.35, 10.42, 10.48, 10.52, 10.58, 10.65, 10.72, 10.78, 10.82, 10.88, 10.92, 10.98,
      // 2020
      11.05, 11.25, 10.85, 10.95, 11.05, 11.15, 11.25, 11.35, 11.32, 11.28, 11.35, 11.42,
      // 2021
      11.38, 11.25, 11.18, 11.22, 11.28, 11.35, 11.42, 11.48, 11.42, 11.35, 11.28, 11.22,
      // 2022
      11.08, 10.85, 10.62, 10.45, 10.28, 10.05, 10.18, 10.02, 9.78, 9.58, 9.85, 9.92,
      // 2023
      10.05, 9.92, 10.08, 10.15, 10.02, 10.08, 10.05, 9.88, 9.72, 9.85, 10.05, 10.18,
      // 2024
      10.08, 10.02, 9.95, 10.02, 9.98, 10.08, 10.15, 10.22, 10.28, 10.18, 10.25, 10.32,
      // 2025
      10.38, 10.42, 10.48, 10.52, 10.58, 10.65, 10.72, 10.78, 10.82, 10.88, 10.92, 10.98
    ]
  },
  'AQMIX': {
    name: 'AQR Managed Futures Strategy',
    prices: [
      // 2018
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2019
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8.45, 8.52,
      // 2020
      8.62, 8.75, 9.25, 9.15, 9.05, 8.95, 8.85, 8.72, 8.65, 8.55, 8.45, 8.35,
      // 2021
      8.25, 8.15, 8.25, 8.35, 8.45, 8.55, 8.65, 8.75, 8.85, 8.95, 9.05, 9.15,
      // 2022 (good year for managed futures)
      9.45, 9.85, 10.25, 10.65, 11.05, 11.45, 11.85, 12.25, 12.65, 13.05, 13.45, 11.85,
      // 2023
      12.15, 12.05, 11.95, 11.85, 11.75, 11.65, 11.55, 11.45, 11.35, 11.25, 11.45, 11.65,
      // 2024
      11.85, 12.05, 12.25, 12.45, 12.65, 12.85, 13.05, 13.25, 13.45, 13.65, 13.85, 14.05,
      // 2025
      14.25, 14.45, 14.65, 14.85, 15.05, 15.25, 15.45, 15.65, 15.85, 16.05, 16.25, 16.50
    ]
  },
  // Private funds
  'KPFC': {
    name: 'KKR Private Credit Fund',
    prices: [
      // 2018
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2019 (first purchase Feb)
      0, 75000, 75500, 76000, 76500, 77000, 77500, 78000, 78500, 79000, 79500, 80000,
      // 2020
      80500, 81000, 78000, 79000, 80000, 81000, 82000, 83000, 84000, 85000, 86000, 87000,
      // 2021
      88000, 89000, 90000, 91000, 92000, 93000, 94000, 95000, 96000, 97000, 98000, 99000,
      // 2022
      100000, 101000, 102000, 103000, 104000, 105000, 106000, 107000, 108000, 109000, 110000, 111000,
      // 2023
      112000, 113000, 114000, 115000, 116000, 117000, 118000, 119000, 120000, 121000, 122000, 123000,
      // 2024
      124000, 125000, 126000, 127000, 128000, 129000, 130000, 131000, 132000, 133000, 134000, 135000,
      // 2025
      136000, 137000, 138000, 139000, 140000, 141000, 142000, 143000, 144000, 145000, 146000, 147000
    ]
  },
  'OCPC': {
    name: 'Oaktree Capital Private Credit',
    prices: [
      // 2018-2019
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2020 (first purchase June)
      0, 0, 0, 0, 0, 50000, 50500, 51000, 51500, 52000, 52500, 53000,
      // 2021
      53500, 54000, 54500, 55000, 55500, 56000, 56500, 57000, 57500, 58000, 58500, 59000,
      // 2022
      59500, 60000, 60500, 61000, 61500, 62000, 62500, 63000, 63500, 64000, 64500, 65000,
      // 2023
      65500, 66000, 66500, 67000, 67500, 68000, 68500, 69000, 69500, 70000, 70500, 71000,
      // 2024
      71500, 72000, 72500, 73000, 73500, 74000, 74500, 75000, 75500, 76000, 76500, 77000,
      // 2025
      77500, 78000, 78500, 79000, 79500, 80000, 80500, 81000, 81500, 82000, 82500, 83000
    ]
  },
  'ACOF': {
    name: 'Apollo Credit Opportunities',
    prices: [
      // 2018-2020
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021 (first purchase June)
      0, 0, 0, 0, 0, 50000, 50500, 51000, 51500, 52000, 52500, 53000,
      // 2022
      53500, 54000, 54500, 55000, 55500, 56000, 56500, 57000, 57500, 58000, 58500, 59000,
      // 2023
      59500, 60000, 60500, 61000, 61500, 62000, 62500, 63000, 63500, 64000, 64500, 65000,
      // 2024
      65500, 66000, 66500, 67000, 67500, 68000, 68500, 69000, 69500, 70000, 70500, 71000,
      // 2025
      71500, 72000, 72500, 73000, 73500, 74000, 74500, 75000, 75500, 76000, 76500, 77000
    ]
  },
  'SCGE': {
    name: 'Sequoia Capital Global Equities',
    prices: [
      // 2018
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2019 (first purchase July)
      0, 0, 0, 0, 0, 0, 100000, 102000, 104000, 106000, 108000, 110000,
      // 2020
      112000, 114000, 95000, 105000, 115000, 125000, 135000, 145000, 155000, 165000, 175000, 185000,
      // 2021
      195000, 205000, 215000, 225000, 235000, 245000, 255000, 265000, 275000, 285000, 295000, 305000,
      // 2022 (down year)
      295000, 285000, 275000, 265000, 255000, 245000, 255000, 245000, 235000, 245000, 255000, 265000,
      // 2023
      275000, 285000, 295000, 305000, 315000, 325000, 335000, 345000, 355000, 365000, 375000, 385000,
      // 2024
      395000, 405000, 415000, 425000, 435000, 445000, 455000, 465000, 475000, 485000, 495000, 505000,
      // 2025
      515000, 525000, 535000, 545000, 555000, 565000, 575000, 585000, 595000, 605000, 615000, 625000
    ]
  },
  'BREP9': {
    name: 'Blackstone Real Estate Partners IX',
    prices: [
      // 2018 (first purchase Oct)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 100000, 101000, 102000,
      // 2019
      103000, 104000, 105000, 106000, 107000, 108000, 109000, 110000, 111000, 112000, 113000, 114000,
      // 2020
      115000, 116000, 105000, 108000, 111000, 114000, 117000, 120000, 123000, 126000, 129000, 132000,
      // 2021
      135000, 138000, 141000, 144000, 147000, 150000, 153000, 156000, 159000, 162000, 165000, 168000,
      // 2022
      171000, 174000, 177000, 180000, 183000, 186000, 183000, 180000, 177000, 174000, 171000, 168000,
      // 2023
      165000, 162000, 159000, 156000, 153000, 115000, 116000, 117000, 118000, 119000, 120000, 121000,
      // 2024
      122000, 123000, 124000, 125000, 126000, 127000, 128000, 129000, 130000, 131000, 132000, 133000,
      // 2025
      134000, 135000, 136000, 137000, 138000, 139000, 140000, 141000, 142000, 143000, 144000, 145000
    ]
  },
  'CREP5': {
    name: 'Carlyle Real Estate Partners V',
    prices: [
      // 2018-2019
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2020 (first purchase Nov)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 75000, 76000,
      // 2021
      77000, 78000, 79000, 80000, 81000, 82000, 83000, 84000, 85000, 86000, 87000, 88000,
      // 2022
      89000, 90000, 91000, 92000, 93000, 94000, 92000, 90000, 88000, 86000, 84000, 82000,
      // 2023
      83000, 84000, 85000, 86000, 87000, 88000, 89000, 90000, 91000, 92000, 93000, 94000,
      // 2024
      95000, 96000, 97000, 98000, 99000, 100000, 101000, 102000, 103000, 104000, 105000, 106000,
      // 2025
      107000, 108000, 109000, 110000, 111000, 112000, 113000, 114000, 115000, 116000, 117000, 118000
    ]
  },
  'SREIT': {
    name: 'Starwood Real Estate Income Trust',
    prices: [
      // 2018-2020
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      // 2021 (first purchase Nov)
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50000, 51000,
      // 2022
      52000, 53000, 54000, 55000, 56000, 57000, 55000, 53000, 51000, 49000, 47000, 45000,
      // 2023
      46000, 47000, 48000, 49000, 50000, 51000, 52000, 53000, 54000, 55000, 56000, 57000,
      // 2024
      58000, 59000, 60000, 61000, 62000, 63000, 64000, 65000, 66000, 67000, 68000, 69000,
      // 2025
      70000, 71000, 72000, 73000, 74000, 75000, 76000, 77000, 78000, 79000, 80000, 81000
    ]
  },
};

// EUR/USD rates for ASML
const eurUsdRates: number[] = [
  // 2018
  1.22, 1.23, 1.23, 1.21, 1.17, 1.17, 1.17, 1.16, 1.16, 1.14, 1.14, 1.14,
  // 2019
  1.14, 1.14, 1.12, 1.12, 1.12, 1.14, 1.11, 1.11, 1.09, 1.11, 1.10, 1.12,
  // 2020
  1.11, 1.10, 1.10, 1.09, 1.11, 1.12, 1.18, 1.19, 1.17, 1.18, 1.19, 1.22,
  // 2021
  1.21, 1.21, 1.17, 1.21, 1.22, 1.19, 1.19, 1.18, 1.16, 1.16, 1.14, 1.13,
  // 2022
  1.13, 1.11, 1.11, 1.05, 1.07, 1.05, 1.02, 1.00, 0.98, 0.98, 1.03, 1.07,
  // 2023
  1.09, 1.07, 1.09, 1.10, 1.07, 1.09, 1.12, 1.09, 1.06, 1.06, 1.09, 1.10,
  // 2024
  1.09, 1.08, 1.08, 1.07, 1.09, 1.07, 1.08, 1.09, 1.11, 1.08, 1.05, 1.04,
  // 2025
  1.05, 1.06, 1.07, 1.08, 1.09, 1.10, 1.11, 1.10, 1.09, 1.08, 1.07, 1.08
];

// Generate valuations from the price data
const generateValuations = (): MonthlyValuation[] => {
  const valuations: MonthlyValuation[] = [];
  
  Object.entries(priceData).forEach(([ticker, data]) => {
    data.prices.forEach((price, index) => {
      // Skip zero prices (no position yet)
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
      
      // Add FX rate for EUR assets
      if (data.fxRate) {
        val.fxRate = eurUsdRates[index];
      }
      
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

// ============================================================================
// VALIDATION SUMMARY
// ============================================================================
/**
 * Transactions per Year:
 * - 2018: 12 transactions ✓
 * - 2019: 14 transactions ✓
 * - 2020: 17 transactions ✓
 * - 2021: 15 transactions ✓
 * - 2022: 11 transactions ✓
 * - 2023: 13 transactions ✓
 * - 2024: 15 transactions ✓
 * - 2025: 10 transactions ✓
 * 
 * Asset Classes Used (all 11):
 * - equity: AAPL, MSFT, AMZN, NVDA, GOOGL, TSLA, META, JPM, V, UNH, TSM, ASML, BRK.B, LLY, COST, ADBE, AVGO, CRWD, NOW, PLTR, DDOG, COIN
 * - etf: VXUS, EEM
 * - bond: AGG, BND
 * - crypto: BTC, ETH, SOL
 * - hedge_fund: BWPA, RIEF
 * - private_equity: SCGE
 * - private_debt: KPFC, OCPC, ACOF
 * - real_estate: BREP9, CREP5, SREIT
 * - mutual_fund: PTTRX
 * - commodity: GLD
 * - alternative: AQMIX
 * 
 * Data Quality:
 * - No NaN values (all prices are explicit numbers)
 * - Contains negative returns (drawdowns in 2018 Q4, 2020 Q1, 2022)
 * - Enables Volatility, Sortino, VaR calculations
 */
