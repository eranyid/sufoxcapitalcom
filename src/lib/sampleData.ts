import { Transaction, MonthlyValuation } from '@/types/investment';

export const sampleTransactions: Transaction[] = [
  // Equities
  { id: 'tx-1', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'buy', date: '2024-01-15', quantity: 50, pricePerUnit: 185.50, fees: 9.95, currency: 'USD', geography: 'north_america' },
  { id: 'tx-2', assetName: 'Microsoft Corp.', ticker: 'MSFT', assetType: 'equity', transactionType: 'buy', date: '2024-01-20', quantity: 30, pricePerUnit: 390.00, fees: 9.95, currency: 'USD', geography: 'north_america' },
  { id: 'tx-3', assetName: 'NVIDIA Corp.', ticker: 'NVDA', assetType: 'equity', transactionType: 'buy', date: '2024-02-10', quantity: 20, pricePerUnit: 680.00, fees: 9.95, currency: 'USD', geography: 'north_america' },
  { id: 'tx-4', assetName: 'ASML Holding', ticker: 'ASML', assetType: 'equity', transactionType: 'buy', date: '2024-03-05', quantity: 10, pricePerUnit: 920.00, fees: 14.95, currency: 'EUR', geography: 'europe' },
  { id: 'tx-5', assetName: 'Tesla Inc.', ticker: 'TSLA', assetType: 'equity', transactionType: 'buy', date: '2024-04-12', quantity: 25, pricePerUnit: 165.00, fees: 9.95, currency: 'USD', geography: 'north_america' },
  
  // Bonds/ETFs
  { id: 'tx-6', assetName: 'iShares Core US Aggregate Bond', ticker: 'AGG', assetType: 'bond', transactionType: 'buy', date: '2024-02-01', quantity: 100, pricePerUnit: 98.50, fees: 4.95, currency: 'USD', geography: 'north_america' },
  { id: 'tx-7', assetName: 'Vanguard Total Bond Market', ticker: 'BND', assetType: 'bond', transactionType: 'buy', date: '2024-03-15', quantity: 80, pricePerUnit: 72.30, fees: 4.95, currency: 'USD', geography: 'north_america' },
  
  // Crypto
  { id: 'tx-8', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', date: '2024-01-25', quantity: 0.5, pricePerUnit: 42000.00, fees: 25.00, currency: 'USD', geography: 'global' },
  { id: 'tx-9', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'buy', date: '2024-02-15', quantity: 3, pricePerUnit: 2500.00, fees: 15.00, currency: 'USD', geography: 'global' },
  { id: 'tx-10', assetName: 'Bitcoin', ticker: 'BTC', assetType: 'crypto', transactionType: 'buy', date: '2024-05-10', quantity: 0.25, pricePerUnit: 61000.00, fees: 20.00, currency: 'USD', geography: 'global' },
  
  // Emerging Markets
  { id: 'tx-11', assetName: 'Taiwan Semiconductor', ticker: 'TSM', assetType: 'equity', transactionType: 'buy', date: '2024-04-20', quantity: 40, pricePerUnit: 140.00, fees: 12.95, currency: 'USD', geography: 'asia_pacific' },
  { id: 'tx-12', assetName: 'iShares MSCI Emerging Markets', ticker: 'EEM', assetType: 'etf', transactionType: 'buy', date: '2024-05-01', quantity: 150, pricePerUnit: 42.50, fees: 4.95, currency: 'USD', geography: 'emerging_markets' },
  
  // Partial sell (realized P/L)
  { id: 'tx-13', assetName: 'Apple Inc.', ticker: 'AAPL', assetType: 'equity', transactionType: 'sell', date: '2024-08-15', quantity: 15, pricePerUnit: 225.00, fees: 9.95, currency: 'USD', geography: 'north_america' },
  { id: 'tx-14', assetName: 'Ethereum', ticker: 'ETH', assetType: 'crypto', transactionType: 'sell', date: '2024-09-20', quantity: 1, pricePerUnit: 2650.00, fees: 10.00, currency: 'USD', geography: 'global' },
];

// Helper to generate monthly valuations
const generateValuations = (): MonthlyValuation[] => {
  const valuations: MonthlyValuation[] = [];
  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09', '2024-10', '2024-11'];
  
  const priceHistory: Record<string, number[]> = {
    'AAPL': [185.50, 182.00, 175.00, 170.00, 185.00, 195.00, 210.00, 225.00, 218.00, 228.00, 232.00],
    'MSFT': [390.00, 405.00, 415.00, 400.00, 420.00, 430.00, 445.00, 410.00, 425.00, 418.00, 430.00],
    'NVDA': [680.00, 720.00, 850.00, 880.00, 1050.00, 1150.00, 1200.00, 1100.00, 1180.00, 1320.00, 1400.00],
    'ASML': [920.00, 940.00, 980.00, 1010.00, 980.00, 1050.00, 1080.00, 1020.00, 1040.00, 1100.00, 1150.00],
    'TSLA': [165.00, 175.00, 160.00, 165.00, 180.00, 195.00, 210.00, 230.00, 250.00, 265.00, 280.00],
    'AGG': [98.50, 98.00, 97.80, 98.20, 97.50, 98.00, 99.00, 99.50, 100.00, 99.80, 100.20],
    'BND': [72.30, 72.00, 71.50, 72.00, 71.80, 72.50, 73.00, 73.50, 74.00, 73.80, 74.20],
    'BTC': [42000, 45000, 62000, 64000, 68000, 65000, 58000, 60000, 63000, 69000, 95000],
    'ETH': [2500, 2800, 3400, 3200, 3800, 3500, 3200, 2800, 2650, 2400, 3200],
    'TSM': [140.00, 145.00, 150.00, 140.00, 155.00, 165.00, 175.00, 170.00, 180.00, 185.00, 195.00],
    'EEM': [42.50, 43.00, 42.00, 43.50, 42.50, 44.00, 45.00, 44.50, 45.50, 46.00, 47.00],
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
