import { Transaction, MonthlyValuation } from '@/types/investment';

/**
 * Sample Portfolio Data - Institutional Family Office
 * 
 * Date Range: January 2018 - December 2025 (8 years)
 * Target CAGR: ~12% (11.5%-12.5% annualized)
 * Target Portfolio Value: ~$2.1M-$2.25M (latest)
 * Transactions per Year: 8-17 (distributed across months)
 * 
 * Asset Class Coverage:
 * - equity (public stocks)
 * - etf (exchange traded funds)
 * - bond (fixed income)
 * - crypto (digital assets)
 * - hedge_fund (alternative liquid)
 * - private_equity (illiquid alternatives)
 * - private_debt (illiquid credit)
 * - real_estate (real estate funds)
 * - mutual_fund (active funds)
 * - commodity (commodity exposure)
 * - alternative (other alternatives)
 */

// ============================================================================
// TRANSACTIONS - 2018-2025, chronologically ordered
// Each year: 8-17 transactions distributed across months
// ============================================================================
export const sampleTransactions: Transaction[] = [
  // =========== 2018: Initial Portfolio Construction (12 transactions) ===========
  
  // Q1 2018 - Core equity positions
  { id: 'tx-2018-001', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2018-01-15', quantity: 400, pricePerUnit: 43.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2018-002', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2018-02-12', quantity: 200, pricePerUnit: 92.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2018-003', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2018-02-28', quantity: 500, pricePerUnit: 105.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  
  // Q2 2018 - Adding diversification
  { id: 'tx-2018-004', assetName: 'Vanguard Total International Stock', ticker: 'VXUS', assetType: 'etf', transactionType: 'buy', 
    date: '2018-04-10', quantity: 300, pricePerUnit: 56.80, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2011 },
  { id: 'tx-2018-005', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2018-05-22', quantity: 50, pricePerUnit: 1580.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2018-006', assetName: 'Bridgewater Pure Alpha Fund', ticker: 'BWPA', assetType: 'hedge_fund', transactionType: 'buy', 
    date: '2018-06-15', quantity: 1, pricePerUnit: 50000.00, fees: 250.00, currency: 'USD', geography: 'global', inceptionYear: 1991 },
  
  // Q3 2018 - More core positions
  { id: 'tx-2018-007', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2018-07-18', quantity: 150, pricePerUnit: 108.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  { id: 'tx-2018-008', assetName: 'PIMCO Total Return Fund', ticker: 'PTTRX', assetType: 'mutual_fund', transactionType: 'buy', 
    date: '2018-08-09', quantity: 2000, pricePerUnit: 10.15, fees: 0.00, currency: 'USD', geography: 'north_america', inceptionYear: 1987 },
  { id: 'tx-2018-009', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2018-09-20', quantity: 3, pricePerUnit: 6350.00, fees: 95.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  
  // Q4 2018 - Adding alternatives
  { id: 'tx-2018-010', assetName: 'Blackstone Real Estate Partners IX', ticker: 'BREP9', assetType: 'real_estate', transactionType: 'buy', 
    date: '2018-10-15', quantity: 1, pricePerUnit: 100000.00, fees: 500.00, currency: 'USD', geography: 'north_america', inceptionYear: 2018 },
  { id: 'tx-2018-011', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2018-11-12', quantity: 200, pricePerUnit: 115.40, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2018-012', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2018-12-20', quantity: 75, pricePerUnit: 198.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },

  // =========== 2019: Building Core + Adding Alternatives (14 transactions) ===========
  
  // Q1 2019 - Recovery positions
  { id: 'tx-2019-001', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2019-01-28', quantity: 200, pricePerUnit: 39.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2019-002', assetName: 'KKR Private Credit Fund', ticker: 'KPFC', assetType: 'private_debt', transactionType: 'buy', 
    date: '2019-02-18', quantity: 1, pricePerUnit: 75000.00, fees: 375.00, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-2019-003', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2019-03-15', quantity: 40, pricePerUnit: 1175.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  
  // Q2 2019 - Adding growth
  { id: 'tx-2019-004', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2019-04-22', quantity: 400, pricePerUnit: 44.25, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-2019-005', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2019-05-13', quantity: 150, pricePerUnit: 35.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2019-006', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2019-06-10', quantity: 100, pricePerUnit: 133.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  
  // Q3 2019 - Private equity commitment
  { id: 'tx-2019-007', assetName: 'Sequoia Capital Global Equities', ticker: 'SCGE', assetType: 'private_equity', transactionType: 'buy', 
    date: '2019-07-15', quantity: 1, pricePerUnit: 100000.00, fees: 500.00, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-2019-008', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2019-08-05', quantity: 25, pricePerUnit: 215.00, fees: 54.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2019-009', assetName: 'Visa Inc.', ticker: 'V', assetType: 'equity', transactionType: 'buy', 
    date: '2019-09-18', quantity: 100, pricePerUnit: 175.80, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2008 },
  
  // Q4 2019 - Year-end additions
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
  
  // Q1 2020 - Pre-crash and crash buying
  { id: 'tx-2020-001', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-01-21', quantity: 100, pricePerUnit: 108.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2020-002', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2020-02-10', quantity: 2, pricePerUnit: 9850.00, fees: 98.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2020-003', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2020-03-16', quantity: 300, pricePerUnit: 60.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2020-004', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2020-03-23', quantity: 150, pricePerUnit: 138.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  
  // Q2 2020 - Recovery buying
  { id: 'tx-2020-005', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2020-04-14', quantity: 25, pricePerUnit: 2375.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2020-006', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-05-11', quantity: 100, pricePerUnit: 72.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2020-007', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2020-06-08', quantity: 30, pricePerUnit: 242.00, fees: 73.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2020-008', assetName: 'Oaktree Capital Private Credit', ticker: 'OCPC', assetType: 'private_debt', transactionType: 'buy', 
    date: '2020-06-22', quantity: 1, pricePerUnit: 50000.00, fees: 250.00, currency: 'USD', geography: 'north_america', inceptionYear: 2020 },
  
  // Q3 2020 - Tech leadership
  { id: 'tx-2020-009', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2020-07-20', quantity: 30, pricePerUnit: 1510.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2020-010', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2020-08-10', quantity: 300, pricePerUnit: 88.45, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  { id: 'tx-2020-011', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2020-09-02', quantity: 200, pricePerUnit: 129.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  
  // Q4 2020 - Rotation and year-end
  { id: 'tx-2020-012', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2020-10-19', quantity: 75, pricePerUnit: 420.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
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
  
  // Q1 2021 - Crypto & growth
  { id: 'tx-2021-001', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2021-01-11', quantity: 1, pricePerUnit: 35250.00, fees: 176.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2021-002', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2021-02-08', quantity: 80, pricePerUnit: 130.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2021-003', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2021-03-15', quantity: 15, pricePerUnit: 1780.00, fees: 134.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-2021-004', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', 
    date: '2021-03-29', quantity: 20, pricePerUnit: 585.00, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  
  // Q2 2021 - Taking profits, rebalancing
  { id: 'tx-2021-005', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'sell', 
    date: '2021-04-26', quantity: 50, pricePerUnit: 720.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-2021-006', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2021-05-10', quantity: 80, pricePerUnit: 315.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2021-007', assetName: 'Apollo Credit Opportunities', ticker: 'ACOF', assetType: 'private_debt', transactionType: 'buy', 
    date: '2021-06-14', quantity: 1, pricePerUnit: 50000.00, fees: 250.00, currency: 'USD', geography: 'north_america', inceptionYear: 2021 },
  
  // Q3 2021 - Continued growth
  { id: 'tx-2021-008', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2021-07-19', quantity: 50, pricePerUnit: 280.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2021-009', assetName: 'Costco Wholesale', ticker: 'COST', assetType: 'equity', transactionType: 'buy', 
    date: '2021-08-16', quantity: 30, pricePerUnit: 445.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1985 },
  { id: 'tx-2021-010', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2021-09-07', quantity: 1.5, pricePerUnit: 52450.00, fees: 394.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  
  // Q4 2021 - Peak positioning
  { id: 'tx-2021-011', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2021-10-18', quantity: 25, pricePerUnit: 2850.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2021-012', assetName: 'Starwood Real Estate Income Trust', ticker: 'SREIT', assetType: 'real_estate', transactionType: 'buy', 
    date: '2021-11-08', quantity: 1, pricePerUnit: 50000.00, fees: 250.00, currency: 'USD', geography: 'north_america', inceptionYear: 2018 },
  { id: 'tx-2021-013', assetName: 'Adobe Inc.', ticker: 'ADBE', assetType: 'equity', transactionType: 'buy', 
    date: '2021-11-22', quantity: 25, pricePerUnit: 680.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2021-014', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2021-12-06', quantity: 150, pricePerUnit: 114.20, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2021-015', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'sell', 
    date: '2021-12-20', quantity: 10, pricePerUnit: 3950.00, fees: 198.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },

  // =========== 2022: Bear Market (11 transactions) ===========
  
  // Q1 2022 - Defensive positioning
  { id: 'tx-2022-001', assetName: 'SPDR Gold Shares', ticker: 'GLD', assetType: 'commodity', transactionType: 'buy', 
    date: '2022-01-18', quantity: 150, pricePerUnit: 168.50, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2004 },
  { id: 'tx-2022-002', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2022-02-14', quantity: 150, pricePerUnit: 168.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2022-003', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2022-03-21', quantity: 200, pricePerUnit: 78.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  
  // Q2 2022 - Buying the dip
  { id: 'tx-2022-004', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2022-05-09', quantity: 60, pricePerUnit: 110.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2022-005', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2022-06-20', quantity: 20, pricePerUnit: 1050.00, fees: 105.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  
  // Q3 2022 - Value rotation
  { id: 'tx-2022-006', assetName: 'Berkshire Hathaway', ticker: 'BRK.B', assetType: 'equity', transactionType: 'buy', 
    date: '2022-07-18', quantity: 50, pricePerUnit: 275.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1996 },
  { id: 'tx-2022-007', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'sell', 
    date: '2022-08-22', quantity: 40, pricePerUnit: 165.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2022-008', assetName: 'JPMorgan Chase', ticker: 'JPM', assetType: 'equity', transactionType: 'buy', 
    date: '2022-09-12', quantity: 75, pricePerUnit: 112.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1968 },
  
  // Q4 2022 - Year-end positioning
  { id: 'tx-2022-009', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2022-10-24', quantity: 100, pricePerUnit: 28.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2022-010', assetName: 'Vanguard Total International Stock', ticker: 'VXUS', assetType: 'etf', transactionType: 'buy', 
    date: '2022-11-14', quantity: 200, pricePerUnit: 49.75, fees: 4.95, currency: 'USD', geography: 'global', inceptionYear: 2011 },
  { id: 'tx-2022-011', assetName: 'AQR Managed Futures Strategy', ticker: 'AQMIX', assetType: 'alternative', transactionType: 'buy', 
    date: '2022-12-12', quantity: 2000, pricePerUnit: 11.85, fees: 0.00, currency: 'USD', geography: 'global', inceptionYear: 2010 },

  // =========== 2023: AI Rally (13 transactions) ===========
  
  // Q1 2023 - Tech recovery
  { id: 'tx-2023-001', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2023-01-23', quantity: 40, pricePerUnit: 242.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2023-002', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2023-02-13', quantity: 50, pricePerUnit: 175.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2023-003', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2023-03-20', quantity: 1, pricePerUnit: 27500.00, fees: 138.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  
  // Q2 2023 - AI momentum
  { id: 'tx-2023-004', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2023-04-17', quantity: 75, pricePerUnit: 68.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2023-005', assetName: 'CrowdStrike Holdings', ticker: 'CRWD', assetType: 'equity', transactionType: 'buy', 
    date: '2023-05-08', quantity: 40, pricePerUnit: 145.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-2023-006', assetName: 'Blackstone Real Estate Partners IX', ticker: 'BREP9', assetType: 'real_estate', transactionType: 'sell', 
    date: '2023-06-19', quantity: 0.5, pricePerUnit: 115000.00, fees: 288.00, currency: 'USD', geography: 'north_america', inceptionYear: 2018 },
  
  // Q3 2023 - Continued tech
  { id: 'tx-2023-007', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2023-07-24', quantity: 50, pricePerUnit: 193.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2023-008', assetName: 'Palantir Technologies', ticker: 'PLTR', assetType: 'equity', transactionType: 'buy', 
    date: '2023-08-14', quantity: 200, pricePerUnit: 15.75, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2020 },
  { id: 'tx-2023-009', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2023-09-11', quantity: 10, pricePerUnit: 1635.00, fees: 82.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  
  // Q4 2023 - Year-end rally
  { id: 'tx-2023-010', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', 
    date: '2023-10-16', quantity: 50, pricePerUnit: 88.50, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },
  { id: 'tx-2023-011', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', 
    date: '2023-11-06', quantity: 10, pricePerUnit: 665.00, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  { id: 'tx-2023-012', assetName: 'Broadcom Inc.', ticker: 'AVGO', assetType: 'equity', transactionType: 'buy', 
    date: '2023-11-27', quantity: 20, pricePerUnit: 945.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2009 },
  { id: 'tx-2023-013', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'sell', 
    date: '2023-12-18', quantity: 200, pricePerUnit: 99.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },

  // =========== 2024: Rate Cut Rally (15 transactions) ===========
  
  // Q1 2024 - Crypto ETF approval rally
  { id: 'tx-2024-001', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-01-15', quantity: 0.5, pricePerUnit: 42850.00, fees: 107.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-2024-002', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-12', quantity: 50, pricePerUnit: 722.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2024-003', assetName: 'Amazon.com Inc.', ticker: 'AMZN', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-26', quantity: 40, pricePerUnit: 172.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1997 },
  { id: 'tx-2024-004', assetName: 'ServiceNow Inc.', ticker: 'NOW', assetType: 'equity', transactionType: 'buy', 
    date: '2024-03-18', quantity: 15, pricePerUnit: 768.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  
  // Q2 2024 - AI expansion
  { id: 'tx-2024-005', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2024-04-22', quantity: 25, pricePerUnit: 402.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-2024-006', assetName: 'Eli Lilly', ticker: 'LLY', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-13', quantity: 15, pricePerUnit: 785.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1972 },
  { id: 'tx-2024-007', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-06-10', quantity: 5, pricePerUnit: 3580.00, fees: 90.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  
  // Q3 2024 - Profit taking and rebalancing
  { id: 'tx-2024-008', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2024-07-15', quantity: 100, pricePerUnit: 228.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2024-009', assetName: 'Datadog Inc.', ticker: 'DDOG', assetType: 'equity', transactionType: 'buy', 
    date: '2024-08-05', quantity: 50, pricePerUnit: 115.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2019 },
  { id: 'tx-2024-010', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2024-09-16', quantity: 150, pricePerUnit: 74.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  
  // Q4 2024 - Election rally
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
  
  // Q1 2025 - New year positioning
  { id: 'tx-2025-001', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2025-01-13', quantity: 40, pricePerUnit: 138.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-2025-002', assetName: 'Alphabet Inc.', ticker: 'GOOGL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-02-10', quantity: 30, pricePerUnit: 188.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2004 },
  { id: 'tx-2025-003', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2025-03-17', quantity: 0.5, pricePerUnit: 85000.00, fees: 213.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  
  // Q2 2025 - Spring rebalancing
  { id: 'tx-2025-004', assetName: 'Meta Platforms Inc.', ticker: 'META', assetType: 'equity', transactionType: 'buy', 
    date: '2025-04-14', quantity: 20, pricePerUnit: 545.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2012 },
  { id: 'tx-2025-005', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2025-05-12', quantity: 100, pricePerUnit: 101.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-2025-006', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', 
    date: '2025-06-09', quantity: 25, pricePerUnit: 205.00, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },
  
  // Q3-Q4 2025 - Year continuation
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
// MONTHLY VALUATIONS - Jan 2018 through Dec 2025 (96 months)
// Calibrated to achieve ~12% CAGR with realistic volatility
// ============================================================================

const generateValuations = (): MonthlyValuation[] => {
  const valuations: MonthlyValuation[] = [];
  
  // Generate all months from Jan 2018 through Dec 2025
  const months: string[] = [];
  for (let year = 2018; year <= 2025; year++) {
    for (let month = 1; month <= 12; month++) {
      months.push(`${year}-${month.toString().padStart(2, '0')}`);
    }
  }

  // Price progressions designed to achieve ~12% CAGR overall
  // Each array has 96 values (8 years * 12 months)
  const priceHistory: Record<string, number[]> = {
    // Apple: Strong performer, 4:1 split Aug 2020 (prices pre-split adjusted)
    'AAPL': generatePriceSeries(43.75, 258.00, 96, 0.18, 0.22),
    
    // Microsoft: Steady growth with AI tailwind
    'MSFT': generatePriceSeries(92.00, 468.00, 96, 0.16, 0.18),
    
    // Amazon: Strong e-commerce/cloud growth (20:1 split 2022 adjusted)
    'AMZN': generatePriceSeries(79.00, 225.00, 96, 0.14, 0.24),
    
    // NVIDIA: Explosive AI growth (10:1 split 2024 adjusted)
    'NVDA': generatePriceSeries(35.50, 142.00, 96, 0.35, 0.45),
    
    // Alphabet: Steady tech growth
    'GOOGL': generatePriceSeries(58.75, 195.00, 96, 0.12, 0.20),
    
    // Tesla: High volatility growth
    'TSLA': generatePriceSeries(21.70, 385.00, 96, 0.40, 0.55),
    
    // Meta: Recovery story after 2022 crash
    'META': generatePriceSeries(178.00, 580.00, 96, 0.15, 0.40),
    
    // JPMorgan: Financial leader
    'JPM': generatePriceSeries(108.50, 242.00, 96, 0.08, 0.18),
    
    // Visa: Payments growth
    'V': generatePriceSeries(175.80, 338.00, 96, 0.08, 0.15),
    
    // UnitedHealth: Healthcare giant
    'UNH': generatePriceSeries(285.40, 575.00, 96, 0.09, 0.14),
    
    // Taiwan Semi: Chip leader
    'TSM': generatePriceSeries(52.15, 248.00, 96, 0.20, 0.28),
    
    // ASML: European semi leader (EUR)
    'ASML': generatePriceSeries(585.00, 785.00, 96, 0.12, 0.22),
    
    // Berkshire: Value compounder
    'BRK.B': generatePriceSeries(198.50, 485.00, 96, 0.10, 0.12),
    
    // Eli Lilly: Pharma growth (GLP-1)
    'LLY': generatePriceSeries(168.50, 885.00, 96, 0.25, 0.28),
    
    // Costco: Retail strength
    'COST': generatePriceSeries(445.00, 925.00, 96, 0.09, 0.14),
    
    // Adobe: Creative software
    'ADBE': generatePriceSeries(680.00, 545.00, 96, -0.02, 0.25),
    
    // Broadcom: Semi + software
    'AVGO': generatePriceSeries(945.00, 1250.00, 96, 0.10, 0.25),
    
    // CrowdStrike: Cybersecurity
    'CRWD': generatePriceSeries(145.00, 395.00, 96, 0.22, 0.35),
    
    // ServiceNow: Enterprise software
    'NOW': generatePriceSeries(768.00, 1085.00, 96, 0.12, 0.22),
    
    // Palantir: AI/Data
    'PLTR': generatePriceSeries(15.75, 78.00, 96, 0.35, 0.55),
    
    // Datadog: Monitoring
    'DDOG': generatePriceSeries(115.00, 155.00, 96, 0.08, 0.35),
    
    // Coinbase: Crypto exposure
    'COIN': generatePriceSeries(312.00, 285.00, 96, -0.01, 0.65),
    
    // Bonds - Low volatility, modest returns
    'AGG': generatePriceSeries(105.50, 102.00, 96, -0.005, 0.04),
    'BND': generatePriceSeries(84.00, 76.00, 96, -0.01, 0.05),
    
    // International ETFs
    'VXUS': generatePriceSeries(56.80, 68.00, 96, 0.025, 0.15),
    'EEM': generatePriceSeries(44.25, 52.00, 96, 0.02, 0.18),
    
    // Gold - Inflation hedge
    'GLD': generatePriceSeries(115.40, 245.00, 96, 0.10, 0.12),
    
    // Crypto - High volatility
    'BTC': generatePriceSeries(6350.00, 102000.00, 96, 0.45, 0.70),
    'ETH': generatePriceSeries(215.00, 3450.00, 96, 0.50, 0.80),
    'SOL': generatePriceSeries(3.50, 195.00, 96, 0.85, 1.20),
    
    // Alternative funds - Smoother NAV
    'BWPA': generatePriceSeries(50000.00, 72500.00, 96, 0.05, 0.08),
    'RIEF': generatePriceSeries(75000.00, 105000.00, 96, 0.045, 0.10),
    'PTTRX': generatePriceSeries(10.15, 9.85, 96, -0.003, 0.03),
    'AQMIX': generatePriceSeries(8.45, 14.50, 96, 0.07, 0.15),
    
    // Private funds - Quarterly NAV updates, smoother
    'KPFC': generatePriceSeries(75000.00, 98000.00, 96, 0.035, 0.04),
    'OCPC': generatePriceSeries(50000.00, 68500.00, 96, 0.042, 0.05),
    'ACOF': generatePriceSeries(50000.00, 62500.00, 96, 0.038, 0.04),
    'SCGE': generatePriceSeries(100000.00, 185000.00, 96, 0.085, 0.12),
    'BREP9': generatePriceSeries(100000.00, 135000.00, 96, 0.04, 0.06),
    'CREP5': generatePriceSeries(75000.00, 92500.00, 96, 0.028, 0.05),
    'SREIT': generatePriceSeries(50000.00, 58500.00, 96, 0.02, 0.08),
  };

  const assetNames: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corp.',
    'AMZN': 'Amazon.com Inc.',
    'NVDA': 'NVIDIA Corp.',
    'GOOGL': 'Alphabet Inc.',
    'TSLA': 'Tesla Inc.',
    'META': 'Meta Platforms Inc.',
    'JPM': 'JPMorgan Chase',
    'V': 'Visa Inc.',
    'UNH': 'UnitedHealth Group',
    'TSM': 'Taiwan Semiconductor',
    'ASML': 'ASML Holding',
    'BRK.B': 'Berkshire Hathaway',
    'LLY': 'Eli Lilly',
    'COST': 'Costco Wholesale',
    'ADBE': 'Adobe Inc.',
    'AVGO': 'Broadcom Inc.',
    'CRWD': 'CrowdStrike Holdings',
    'NOW': 'ServiceNow Inc.',
    'PLTR': 'Palantir Technologies',
    'DDOG': 'Datadog Inc.',
    'COIN': 'Coinbase Global',
    'AGG': 'iShares Core US Aggregate Bond',
    'BND': 'Vanguard Total Bond Market',
    'VXUS': 'Vanguard Total International Stock',
    'EEM': 'iShares MSCI Emerging Markets',
    'GLD': 'SPDR Gold Shares',
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana',
    'BWPA': 'Bridgewater Pure Alpha Fund',
    'RIEF': 'Renaissance Institutional Equities',
    'PTTRX': 'PIMCO Total Return Fund',
    'AQMIX': 'AQR Managed Futures Strategy',
    'KPFC': 'KKR Private Credit Fund',
    'OCPC': 'Oaktree Capital Private Credit',
    'ACOF': 'Apollo Credit Opportunities',
    'SCGE': 'Sequoia Capital Global Equities',
    'BREP9': 'Blackstone Real Estate Partners IX',
    'CREP5': 'Carlyle Real Estate Partners V',
    'SREIT': 'Starwood Real Estate Income Trust',
  };

  // EUR/USD rates 2018-2025 (96 months)
  const eurUsdRates = generatePriceSeries(1.22, 1.08, 96, -0.015, 0.06);

  // Generate valuations
  Object.entries(priceHistory).forEach(([ticker, prices]) => {
    months.forEach((month, index) => {
      if (index < prices.length) {
        const val: MonthlyValuation = {
          id: `val-${ticker}-${month}`,
          assetId: ticker,
          ticker,
          assetName: assetNames[ticker] || ticker,
          month,
          pricePerUnit: Math.round(prices[index] * 100) / 100,
        };
        
        // Add FX rate for EUR assets
        if (ticker === 'ASML') {
          val.fxRate = Math.round(eurUsdRates[index] * 10000) / 10000;
        }
        
        // Add bond-specific fields
        if (ticker === 'AGG' || ticker === 'BND') {
          val.yieldToMaturity = 4.5 + Math.sin(index / 12) * 1.5;
          val.duration = ticker === 'AGG' ? 6.2 : 6.5;
          val.couponRate = 3.5;
        }
        
        valuations.push(val);
      }
    });
  });

  return valuations;
};

/**
 * Generate a price series with target CAGR and volatility
 * Uses geometric brownian motion simulation with mean reversion
 */
function generatePriceSeries(
  startPrice: number, 
  endPrice: number, 
  periods: number,
  annualReturn: number,
  annualVol: number
): number[] {
  const prices: number[] = [startPrice];
  const monthlyReturn = annualReturn / 12;
  const monthlyVol = annualVol / Math.sqrt(12);
  
  // Calculate drift to reach target end price
  const targetGrowth = endPrice / startPrice;
  const naturalGrowth = Math.exp(annualReturn * (periods / 12));
  const driftAdjustment = Math.log(targetGrowth / naturalGrowth) / periods;
  
  // Seed for reproducibility (based on start/end prices)
  let seed = Math.floor(startPrice * 1000 + endPrice * 100);
  const seededRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  
  // Box-Muller for normal distribution
  const normalRandom = () => {
    const u1 = seededRandom();
    const u2 = seededRandom();
    return Math.sqrt(-2 * Math.log(u1 + 0.001)) * Math.cos(2 * Math.PI * u2);
  };
  
  for (let i = 1; i < periods; i++) {
    const lastPrice = prices[i - 1];
    const randomShock = normalRandom() * monthlyVol;
    const drift = monthlyReturn + driftAdjustment;
    
    // Mean reversion toward target path
    const targetAtPeriod = startPrice * Math.pow(targetGrowth, i / periods);
    const meanReversion = (targetAtPeriod - lastPrice) / lastPrice * 0.1;
    
    const monthlyChange = drift + randomShock + meanReversion;
    const newPrice = lastPrice * Math.exp(monthlyChange);
    
    prices.push(Math.max(newPrice, startPrice * 0.1)); // Floor at 10% of start
  }
  
  // Ensure last price hits target
  prices[periods - 1] = endPrice;
  
  return prices;
}

export const sampleValuations: MonthlyValuation[] = generateValuations();

// ============================================================================
// VALIDATION SUMMARY
// ============================================================================
/**
 * Transactions per Year:
 * - 2018: 12 transactions
 * - 2019: 14 transactions
 * - 2020: 17 transactions
 * - 2021: 15 transactions
 * - 2022: 11 transactions
 * - 2023: 13 transactions
 * - 2024: 15 transactions
 * - 2025: 10 transactions
 * 
 * Asset Classes Used:
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
 * Target Portfolio Value: ~$2.1M-$2.25M
 * Target CAGR: ~12% (11.5%-12.5%)
 */
