import { Transaction, MonthlyValuation } from '@/types/investment';

export const sampleTransactions: Transaction[] = [
  // Equities - Core Holdings (Started in 2024)
  { id: 'tx-1', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', date: '2024-01-15', quantity: 50, pricePerUnit: 185.50, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-2', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', date: '2024-01-20', quantity: 30, pricePerUnit: 390.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-3', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', date: '2024-02-10', quantity: 20, pricePerUnit: 680.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-4', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', date: '2024-03-05', quantity: 10, pricePerUnit: 920.00, fees: 14.95, currency: 'EUR', geography: 'europe', inceptionYear: 1995 },
  { id: 'tx-5', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', date: '2024-04-12', quantity: 25, pricePerUnit: 165.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
  
  // Bonds/ETFs
  { id: 'tx-6', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', date: '2024-02-01', quantity: 100, pricePerUnit: 98.50, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2003 },
  { id: 'tx-7', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', date: '2024-03-15', quantity: 80, pricePerUnit: 72.30, fees: 4.95, currency: 'USD', geography: 'north_america', inceptionYear: 2007 },
  
  // Crypto
  { id: 'tx-8', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', date: '2024-01-25', quantity: 0.5, pricePerUnit: 42000.00, fees: 25.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-9', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', date: '2024-02-15', quantity: 3, pricePerUnit: 2500.00, fees: 15.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  { id: 'tx-10', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', date: '2024-05-10', quantity: 0.25, pricePerUnit: 61000.00, fees: 20.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  
  // Emerging Markets
  { id: 'tx-11', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', date: '2024-04-20', quantity: 40, pricePerUnit: 140.00, fees: 12.95, currency: 'USD', geography: 'israel', inceptionYear: 1997 },
  { id: 'tx-12', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', date: '2024-05-01', quantity: 150, pricePerUnit: 42.50, fees: 4.95, currency: 'USD', geography: 'emerging_markets', inceptionYear: 2003 },
  
  // Partial sells in 2024 (realized P/L)
  { id: 'tx-13', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', date: '2024-08-15', quantity: 15, pricePerUnit: 225.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1980 },
  { id: 'tx-14', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'sell', date: '2024-09-20', quantity: 1, pricePerUnit: 2650.00, fees: 10.00, currency: 'USD', geography: 'global', inceptionYear: 2015 },
  
  // 2025 additions
  { id: 'tx-15', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', date: '2025-01-08', quantity: 10, pricePerUnit: 145.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1999 },
  { id: 'tx-16', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', date: '2025-02-12', quantity: 0.15, pricePerUnit: 96000.00, fees: 30.00, currency: 'USD', geography: 'global', inceptionYear: 2009 },
  { id: 'tx-17', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'sell', date: '2025-03-10', quantity: 10, pricePerUnit: 415.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 1986 },
  { id: 'tx-18', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', date: '2025-04-05', quantity: 15, pricePerUnit: 245.00, fees: 9.95, currency: 'USD', geography: 'north_america', inceptionYear: 2010 },
];

// Helper to generate monthly valuations
const generateValuations = (): MonthlyValuation[] => {
  const valuations: MonthlyValuation[] = [];
  const months = [
    // 2024 months
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', 
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12',
    // 2025 months (up to current)
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06',
    '2025-07', '2025-08', '2025-09', '2025-10', '2025-11'
  ];
  
  // Realistic price progressions based on actual market movements
  const priceHistory: Record<string, number[]> = {
    // Apple: Stable growth, slight pullback mid-year, strong finish
    'AAPL': [185.50, 182.00, 175.00, 170.00, 185.00, 195.00, 210.00, 225.00, 218.00, 228.00, 232.00, 240.00, 
             235.00, 242.00, 238.00, 245.00, 252.00, 248.00, 255.00, 260.00, 258.00, 265.00, 270.00],
    // Microsoft: AI tailwinds, steady performer
    'MSFT': [390.00, 405.00, 415.00, 400.00, 420.00, 430.00, 445.00, 410.00, 425.00, 418.00, 430.00, 438.00,
             435.00, 442.00, 450.00, 448.00, 455.00, 462.00, 458.00, 470.00, 478.00, 485.00, 492.00],
    // NVIDIA: AI boom stock, volatile but strong uptrend
    'NVDA': [680.00, 720.00, 850.00, 880.00, 1050.00, 1150.00, 1200.00, 1100.00, 1180.00, 1320.00, 1400.00, 1450.00,
             145.00, 138.00, 142.00, 148.00, 152.00, 145.00, 155.00, 162.00, 158.00, 168.00, 175.00], // Post 10:1 split
    // ASML: Semi equipment leader, Europe exposure
    'ASML': [920.00, 940.00, 980.00, 1010.00, 980.00, 1050.00, 1080.00, 1020.00, 1040.00, 1100.00, 1150.00, 1180.00,
             1150.00, 1120.00, 1085.00, 1050.00, 1020.00, 990.00, 1010.00, 1035.00, 1060.00, 1080.00, 1100.00],
    // Tesla: Volatile, EV market challenges then recovery
    'TSLA': [165.00, 175.00, 160.00, 165.00, 180.00, 195.00, 210.00, 230.00, 250.00, 265.00, 280.00, 295.00,
             285.00, 275.00, 255.00, 245.00, 265.00, 285.00, 305.00, 325.00, 340.00, 355.00, 370.00],
    // AGG: Bond ETF, interest rate sensitive, modest moves
    'AGG': [98.50, 98.00, 97.80, 98.20, 97.50, 98.00, 99.00, 99.50, 100.00, 99.80, 100.20, 100.50,
            100.80, 101.00, 100.60, 100.80, 101.20, 101.50, 101.80, 102.00, 101.70, 102.20, 102.50],
    // BND: Similar to AGG
    'BND': [72.30, 72.00, 71.50, 72.00, 71.80, 72.50, 73.00, 73.50, 74.00, 73.80, 74.20, 74.50,
            74.80, 75.00, 74.60, 74.80, 75.20, 75.50, 75.80, 76.00, 75.70, 76.20, 76.50],
    // Bitcoin: Bull run through 2024, reaching new ATHs in 2025
    'BTC': [42000, 45000, 62000, 64000, 68000, 65000, 58000, 60000, 63000, 69000, 95000, 98000,
            102000, 96000, 88000, 92000, 97000, 105000, 98000, 92000, 88000, 95000, 100000],
    // Ethereum: Following BTC but with more volatility
    'ETH': [2500, 2800, 3400, 3200, 3800, 3500, 3200, 2800, 2650, 2400, 3200, 3400,
            3600, 3300, 2900, 3100, 3400, 3700, 3500, 3200, 3000, 3300, 3500],
    // TSM: Chip demand, AI beneficiary
    'TSM': [140.00, 145.00, 150.00, 140.00, 155.00, 165.00, 175.00, 170.00, 180.00, 185.00, 195.00, 200.00,
            195.00, 188.00, 192.00, 198.00, 205.00, 212.00, 218.00, 225.00, 220.00, 228.00, 235.00],
    // EEM: Emerging markets, China recovery hopes
    'EEM': [42.50, 43.00, 42.00, 43.50, 42.50, 44.00, 45.00, 44.50, 45.50, 46.00, 47.00, 47.50,
            47.00, 46.50, 45.80, 46.20, 47.00, 47.80, 48.50, 49.00, 48.50, 49.50, 50.00],
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

  let idCounter = 1;
  
  for (const [ticker, prices] of Object.entries(priceHistory)) {
    for (let i = 0; i < months.length; i++) {
      valuations.push({
        id: `val-${idCounter++}`,
        assetId: ticker,
        ticker,
        assetName: assetNames[ticker],
        month: months[i],
        pricePerUnit: prices[i],
        fxRate: ticker === 'ASML' ? 1.08 : 1, // EUR to USD conversion
      });
    }
  }

  return valuations;
};

export const sampleValuations = generateValuations();
