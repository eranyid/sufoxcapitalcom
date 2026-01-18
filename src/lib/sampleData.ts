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

  // February 2024 - Adding growth exposure
  { id: 'tx-006', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-05', quantity: 25, pricePerUnit: 674.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-007', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-02-12', quantity: 4.0, pricePerUnit: 2518.00, fees: 15.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-008', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', 
    date: '2024-02-20', quantity: 60, pricePerUnit: 128.45, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },

  // March 2024 - International diversification
  { id: 'tx-009', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', 
    date: '2024-03-04', quantity: 12, pricePerUnit: 892.50, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  { id: 'tx-010', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2024-03-11', quantity: 250, pricePerUnit: 40.82, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  { id: 'tx-011', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-03-18', quantity: 0.25, pricePerUnit: 67234.00, fees: 28.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },

  // =========== Q2 2024: Tactical Adjustments ===========

  // April 2024 - Adding Tesla, trimming crypto gains
  { id: 'tx-012', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-04-08', quantity: 40, pricePerUnit: 171.05, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-013', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'sell', 
    date: '2024-04-22', quantity: 1.0, pricePerUnit: 3180.00, fees: 12.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },

  // May 2024 - Scaling into NVDA on strength
  { id: 'tx-014', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-13', quantity: 15, pricePerUnit: 924.79, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-015', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2024-05-20', quantity: 25, pricePerUnit: 189.87, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },

  // June 2024 - NVDA split adjustment (10:1 split on June 10)
  // Post-split: 40 shares → 400 shares at ~$120 each
  { id: 'tx-016', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2024-06-17', quantity: 20, pricePerUnit: 442.57, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },

  // =========== Q3 2024: Taking Profits, Rebalancing ===========

  // July 2024 - Partial profit taking on winners
  { id: 'tx-017', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2024-07-15', quantity: 0.30, pricePerUnit: 64250.00, fees: 25.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-018', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'sell', 
    date: '2024-07-22', quantity: 20, pricePerUnit: 175.43, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },

  // August 2024 - Volatility, adding to bonds
  { id: 'tx-019', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', 
    date: '2024-08-12', quantity: 25, pricePerUnit: 221.72, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-020', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2024-08-19', quantity: 100, pricePerUnit: 100.15, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },

  // September 2024 - Rotation
  { id: 'tx-021', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', 
    date: '2024-09-09', quantity: 20, pricePerUnit: 227.20, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },

  // =========== Q4 2024: Year-End Positioning ===========

  // October 2024 - Adding to semi exposure
  { id: 'tx-022', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', 
    date: '2024-10-07', quantity: 5, pricePerUnit: 718.40, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  { id: 'tx-023', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'sell', 
    date: '2024-10-21', quantity: 75, pricePerUnit: 44.92, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },

  // November 2024 - Post-election positioning, crypto rally
  { id: 'tx-024', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-11-11', quantity: 0.20, pricePerUnit: 87420.00, fees: 35.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-025', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'sell', 
    date: '2024-11-18', quantity: 15, pricePerUnit: 428.15, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },

  // December 2024 - Tax-loss harvesting, year-end cleanup
  { id: 'tx-026', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', 
    date: '2024-12-09', quantity: 1.5, pricePerUnit: 3892.00, fees: 18.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-027', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', 
    date: '2024-12-16', quantity: 80, pricePerUnit: 73.42, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },

  // =========== Q1 2025: New Year Positioning ===========

  // January 2025 - Crypto euphoria, taking profits
  { id: 'tx-028', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'sell', 
    date: '2025-01-13', quantity: 0.25, pricePerUnit: 102340.00, fees: 40.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-029', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', 
    date: '2025-01-21', quantity: 30, pricePerUnit: 236.18, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },

  // February 2025 - DeepSeek disruption, rotating
  { id: 'tx-030', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'sell', 
    date: '2025-02-03', quantity: 100, pricePerUnit: 118.42, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-031', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', 
    date: '2025-02-18', quantity: 25, pricePerUnit: 198.65, fees: 12.95, currency: 'USD', geography: 'other', inceptionYear: 1997 },

  // March 2025 - Rebalancing
  { id: 'tx-032', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'sell', 
    date: '2025-03-10', quantity: 20, pricePerUnit: 278.92, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  { id: 'tx-033', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', 
    date: '2025-03-17', quantity: 75, pricePerUnit: 99.87, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },

  // =========== Q2 2025: Current Quarter ===========

  // April 2025 - Tariff volatility
  { id: 'tx-034', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'sell', 
    date: '2025-04-07', quantity: 1.0, pricePerUnit: 1805.00, fees: 10.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-035', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'sell', 
    date: '2025-04-14', quantity: 5, pricePerUnit: 612.80, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },

  // May 2025 - Adding during dip
  { id: 'tx-036', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', 
    date: '2025-05-05', quantity: 15, pricePerUnit: 432.65, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-037', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', 
    date: '2025-05-19', quantity: 100, pricePerUnit: 46.23, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },

  // June 2025 - Current month positions
  { id: 'tx-038', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', 
    date: '2025-06-09', quantity: 50, pricePerUnit: 131.45, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-039', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', 
    date: '2025-06-23', quantity: 0.10, pricePerUnit: 108750.00, fees: 45.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
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
    // Apple: WWDC, iPhone cycles, AI narrative. Range: ~$180-250
    'AAPL': [
      185.92, 180.75, 171.48, 169.30, 189.87, 195.87,
      218.36, 221.72, 226.21, 233.85, 237.28, 246.75,
      236.18, 241.53, 228.87, 207.15, 215.42, 232.80,
      238.45, 245.12, 251.38, 248.65, 255.20, 260.85
    ],
    // Microsoft: AI tailwinds, Azure growth. Range: ~$380-475
    'MSFT': [
      388.47, 397.58, 420.72, 389.33, 416.65, 442.57,
      422.92, 411.78, 430.08, 410.37, 428.15, 421.54,
      438.72, 412.35, 428.68, 392.45, 432.65, 445.18,
      452.30, 458.75, 465.42, 468.90, 475.25, 482.60
    ],
    // NVIDIA: AI boom, split-adjusted from June 2024 (10:1). Pre-split range: $450-1200, post-split: $90-150
    'NVDA': [
      674.72, 721.28, 903.56, 877.35, 924.79, 120.48,  // Split happens between May/June
      117.52, 109.21, 116.38, 132.45, 141.27, 134.58,
      118.42, 108.75, 122.35, 98.42, 115.28, 131.45,
      138.72, 145.30, 152.18, 148.65, 155.42, 162.85
    ],
    // ASML: European semi leader, China exposure concerns. Range: €600-950
    'ASML': [
      892.50, 918.35, 945.72, 902.18, 924.56, 968.42,
      892.35, 845.18, 728.65, 718.40, 692.75, 710.28,
      685.42, 652.18, 628.35, 612.80, 645.72, 678.45,
      695.28, 712.35, 728.65, 742.18, 758.42, 775.60
    ],
    // Tesla: EV competition, FSD progress, Musk volatility. Range: $150-400
    'TSLA': [
      171.05, 188.52, 163.57, 171.05, 178.34, 197.88,
      232.08, 214.92, 227.20, 252.48, 321.22, 403.84,
      378.52, 352.18, 278.92, 245.68, 282.45, 315.72,
      338.45, 355.28, 372.65, 368.42, 385.18, 402.75
    ],
    // AGG: Interest rate sensitive, Fed pivot narrative. Range: $96-103
    'AGG': [
      98.21, 97.85, 97.42, 98.05, 97.68, 98.92,
      99.45, 100.15, 100.72, 99.85, 100.28, 100.65,
      99.87, 99.42, 99.87, 100.35, 100.78, 101.15,
      101.48, 101.85, 102.18, 101.95, 102.35, 102.72
    ],
    // BND: Similar to AGG, Vanguard equivalent. Range: $70-76
    'BND': [
      72.05, 71.72, 71.35, 71.85, 71.52, 72.28,
      72.85, 73.35, 73.78, 73.12, 73.58, 73.42,
      72.95, 72.58, 73.15, 73.65, 74.08, 74.45,
      74.78, 75.12, 75.45, 75.28, 75.65, 75.98
    ],
    // Bitcoin: ETF approval rally, halving, election. Range: $40k-110k
    'BTC': [
      42853, 51629, 67234, 64052, 68574, 61325,
      64250, 59142, 63785, 72358, 87420, 93842,
      102340, 95678, 88245, 82156, 95842, 108750,
      105420, 98650, 92480, 98750, 105280, 112450
    ],
    // Ethereum: Following BTC but with more volatility, staking dynamics. Range: $2k-4.2k
    'ETH': [
      2518, 2892, 3412, 3180, 3758, 3425,
      3285, 2645, 2418, 2685, 3245, 3892,
      3542, 3125, 2845, 1805, 2542, 3185,
      3425, 3285, 3085, 3245, 3485, 3725
    ],
    // TSM: AI chip demand, geopolitical risk premium. Range: $90-240
    'TSM': [
      128.45, 135.72, 142.85, 130.28, 155.42, 168.75,
      175.43, 162.28, 172.85, 182.45, 195.72, 205.28,
      198.65, 185.42, 195.28, 178.65, 192.45, 208.72,
      218.35, 225.48, 232.65, 228.42, 235.18, 242.85
    ],
    // EEM: China recovery/slump cycles, EM resilience. Range: $38-52
    'EEM': [
      40.82, 41.35, 40.28, 41.72, 40.95, 42.85,
      44.28, 43.15, 44.52, 44.92, 46.28, 47.15,
      46.42, 45.28, 44.85, 43.72, 46.23, 48.45,
      49.28, 50.15, 51.42, 50.85, 51.72, 52.58
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
  };

  // FX rates: EUR/USD monthly averages (realistic range: 1.05-1.12)
  const eurUsdRates = [
    1.0850, 1.0780, 1.0825, 1.0720, 1.0850, 1.0720,
    1.0825, 1.0920, 1.1075, 1.0795, 1.0550, 1.0425,
    1.0385, 1.0450, 1.0850, 1.0925, 1.1180, 1.0875,
    1.0950, 1.1025, 1.1100, 1.1050, 1.1125, 1.1200
  ];

  let idCounter = 1;

  for (const [ticker, prices] of Object.entries(priceHistory)) {
    for (let i = 0; i < months.length; i++) {
      const isEuro = ticker === 'ASML';
      
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

// ============================================================================
// CURRENT POSITIONS SUMMARY (for reference, derived from transactions above)
// ============================================================================
// After all transactions:
// AAPL: 100 + 25 - 25 + 30 = 130 shares
// MSFT: 50 + 20 - 15 + 15 = 70 shares  
// NVDA: 400 (post-split) - 100 + 50 = 350 shares
// ASML: 12 + 5 - 5 = 12 shares
// TSLA: 40 + 20 - 20 = 40 shares
// AGG: 200 + 100 + 75 = 375 shares
// BND: 150 + 80 = 230 shares
// BTC: 0.75 + 0.25 - 0.30 + 0.20 - 0.25 + 0.10 = 0.75 BTC
// ETH: 4.0 - 1.0 + 1.5 - 1.0 = 3.5 ETH
// TSM: 60 - 20 + 25 = 65 shares
// EEM: 250 - 75 + 100 = 275 shares
