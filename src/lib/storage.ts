import { Transaction, MonthlyValuation, PortfolioSettings } from '@/types/investment';

const STORAGE_KEYS = {
  TRANSACTIONS: 'sufox_transactions',
  VALUATIONS: 'sufox_valuations',
  SETTINGS: 'sufox_settings'
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

// CSV Export
export function exportToCSV<T extends object>(data: T[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(h => {
        const value = row[h];
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

// CSV Import
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  return lines.slice(1).map(line => {
    const values = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

export function importTransactionsFromCSV(csvText: string): Transaction[] {
  const rows = parseCSV(csvText);
  return rows.map((row, index) => ({
    id: crypto.randomUUID(),
    assetName: row.assetName || row.asset_name || '',
    ticker: row.ticker || '',
    assetType: (row.assetType || row.asset_type || 'equity') as Transaction['assetType'],
    transactionType: (row.transactionType || row.transaction_type || 'buy') as Transaction['transactionType'],
    date: row.date || '',
    quantity: parseFloat(row.quantity) || 0,
    pricePerUnit: parseFloat(row.pricePerUnit || row.price_per_unit || row.price) || 0,
    fees: parseFloat(row.fees) || 0,
    currency: (row.currency || 'USD') as Transaction['currency'],
    geography: (row.geography || 'north_america') as Transaction['geography']
  }));
}

export function importValuationsFromCSV(csvText: string): MonthlyValuation[] {
  const rows = parseCSV(csvText);
  return rows.map(row => ({
    id: crypto.randomUUID(),
    assetId: row.assetId || row.asset_id || '',
    ticker: row.ticker || '',
    assetName: row.assetName || row.asset_name || '',
    month: row.month || '',
    pricePerUnit: parseFloat(row.pricePerUnit || row.price_per_unit || row.price) || 0,
    fxRate: row.fxRate || row.fx_rate ? parseFloat(row.fxRate || row.fx_rate) : undefined
  }));
}
