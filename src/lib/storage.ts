import { Transaction, MonthlyValuation, PortfolioSettings, CashBalances } from '@/types/investment';
import { parseCSV } from './csvParser';
import { validateCSVTransactions, validateCSVValuations } from './validation';

const STORAGE_KEYS = {
  TRANSACTIONS: 'sufox_transactions',
  VALUATIONS: 'sufox_valuations',
  SETTINGS: 'sufox_settings',
  CASH_BALANCES: 'sufox_cash_balances'
};

export function saveTransactions(transactions: Transaction[]) {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

export function loadTransactions(): Transaction[] {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  return data ? JSON.parse(data) : [];
}

export function saveValuations(valuations: MonthlyValuation[]) {
  localStorage.setItem(STORAGE_KEYS.VALUATIONS, JSON.stringify(valuations));
}

export function loadValuations(): MonthlyValuation[] {
  const data = localStorage.getItem(STORAGE_KEYS.VALUATIONS);
  return data ? JSON.parse(data) : [];
}

export function saveSettings(settings: PortfolioSettings) {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadSettings(): PortfolioSettings {
  const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return data ? JSON.parse(data) : {
    riskFreeRate: 4.5,
    benchmarkReturns: [],
    baseCurrency: 'USD'
  };
}

export function saveCashBalances(balances: CashBalances) {
  localStorage.setItem(STORAGE_KEYS.CASH_BALANCES, JSON.stringify(balances));
}

export function loadCashBalances(): CashBalances {
  const data = localStorage.getItem(STORAGE_KEYS.CASH_BALANCES);
  return data ? JSON.parse(data) : { USD: 0, EUR: 0, ILS: 0 };
}

// CSV Export
export function exportToCSV<T extends object>(data: T[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const value = row[h as keyof T];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Re-export parseCSV for backward compatibility
export { parseCSV };

// Import transactions from CSV with validation
export function importTransactionsFromCSV(csvText: string): { 
  transactions: Transaction[]; 
  errors: { row: number; errors: string[] }[] 
} {
  const rows = parseCSV(csvText);
  const { valid, errors } = validateCSVTransactions(rows);
  
  const transactions: Transaction[] = valid.map(row => ({
    id: crypto.randomUUID(),
    assetName: row.assetName,
    ticker: row.ticker,
    assetType: row.assetType,
    transactionType: row.transactionType,
    date: row.date,
    quantity: row.quantity,
    pricePerUnit: row.pricePerUnit,
    fees: row.fees,
    currency: row.currency,
    geography: row.geography,
    inceptionYear: row.inceptionYear
  }));

  return { transactions, errors };
}

// Import valuations from CSV with validation
export function importValuationsFromCSV(csvText: string): {
  valuations: MonthlyValuation[];
  errors: { row: number; errors: string[] }[]
} {
  const rows = parseCSV(csvText);
  const { valid, errors } = validateCSVValuations(rows);
  
  const valuations: MonthlyValuation[] = valid.map(row => ({
    id: crypto.randomUUID(),
    assetId: row.assetId || row.ticker,
    ticker: row.ticker,
    assetName: row.assetName,
    month: row.month,
    pricePerUnit: row.pricePerUnit,
    fxRate: row.fxRate
  }));

  return { valuations, errors };
}
