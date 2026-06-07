import { describe, it, expect } from 'vitest';
import {
  validateTransaction,
  validateValuation,
  validateCSVTransactions,
  validateCSVValuations,
  transactionSchema,
  valuationSchema,
  csvTransactionSchema,
  csvValuationSchema,
} from '../validation';

// --------------- helpers ---------------

function validTx(overrides: Record<string, unknown> = {}) {
  return {
    assetName: 'Apple Inc',
    ticker: 'aapl',
    assetType: 'equity',
    transactionType: 'buy',
    date: '2024-01-15',
    quantity: 10,
    pricePerUnit: 150,
    fees: 5,
    currency: 'USD',
    geography: 'north_america',
    ...overrides,
  };
}

function validVal(overrides: Record<string, unknown> = {}) {
  return {
    ticker: 'AAPL',
    assetName: 'Apple Inc',
    month: '2024-01',
    pricePerUnit: 185,
    ...overrides,
  };
}

// --------------- transactionSchema ---------------

describe('transactionSchema', () => {
  it('accepts a valid transaction', () => {
    const result = transactionSchema.safeParse(validTx());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.ticker).toBe('AAPL'); // toUpperCase
    }
  });

  it('trims and uppercases ticker', () => {
    const result = transactionSchema.safeParse(validTx({ ticker: '  msft  ' }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.ticker).toBe('MSFT');
  });

  it('rejects empty asset name', () => {
    const result = transactionSchema.safeParse(validTx({ assetName: '' }));
    expect(result.success).toBe(false);
  });

  it('rejects asset name over 200 chars', () => {
    const result = transactionSchema.safeParse(validTx({ assetName: 'A'.repeat(201) }));
    expect(result.success).toBe(false);
  });

  it('rejects future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const result = transactionSchema.safeParse(validTx({ date: futureDate.toISOString() }));
    expect(result.success).toBe(false);
  });

  it('rejects zero quantity', () => {
    const result = transactionSchema.safeParse(validTx({ quantity: 0 }));
    expect(result.success).toBe(false);
  });

  it('rejects negative quantity', () => {
    const result = transactionSchema.safeParse(validTx({ quantity: -5 }));
    expect(result.success).toBe(false);
  });

  it('rejects quantity over 1e12', () => {
    const result = transactionSchema.safeParse(validTx({ quantity: 1e12 + 1 }));
    expect(result.success).toBe(false);
  });

  it('rejects negative fees', () => {
    const result = transactionSchema.safeParse(validTx({ fees: -1 }));
    expect(result.success).toBe(false);
  });

  it('defaults fees to 0', () => {
    const { fees: _fees, ...noFees } = validTx();
    const result = transactionSchema.safeParse(noFees);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fees).toBe(0);
  });

  it('accepts optional inceptionYear', () => {
    const result = transactionSchema.safeParse(validTx({ inceptionYear: 2000 }));
    expect(result.success).toBe(true);
  });

  it('rejects inceptionYear before 1800', () => {
    const result = transactionSchema.safeParse(validTx({ inceptionYear: 1799 }));
    expect(result.success).toBe(false);
  });

  it('rejects unknown asset type', () => {
    const result = transactionSchema.safeParse(validTx({ assetType: 'forex' }));
    expect(result.success).toBe(false);
  });

  it('rejects unknown currency', () => {
    const result = transactionSchema.safeParse(validTx({ currency: 'BTC' }));
    expect(result.success).toBe(false);
  });

  it('accepts all valid asset types', () => {
    const types = [
      'equity', 'bond', 'commodity', 'crypto', 'real_estate',
      'cash', 'alternative', 'etf', 'mutual_fund',
      'private_equity', 'private_debt', 'hedge_fund',
    ];
    for (const t of types) {
      const result = transactionSchema.safeParse(validTx({ assetType: t }));
      expect(result.success).toBe(true);
    }
  });
});

// --------------- valuationSchema ---------------

describe('valuationSchema', () => {
  it('accepts a valid valuation', () => {
    const result = valuationSchema.safeParse(validVal());
    expect(result.success).toBe(true);
  });

  it('rejects invalid month format', () => {
    const result = valuationSchema.safeParse(validVal({ month: '01-2024' }));
    expect(result.success).toBe(false);
  });

  it('rejects missing pricePerUnit', () => {
    const { pricePerUnit: _, ...rest } = validVal();
    const result = valuationSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects zero price', () => {
    const result = valuationSchema.safeParse(validVal({ pricePerUnit: 0 }));
    expect(result.success).toBe(false);
  });

  it('accepts optional fxRate', () => {
    const result = valuationSchema.safeParse(validVal({ fxRate: 3.7 }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fxRate).toBe(3.7);
  });

  it('rejects negative fxRate', () => {
    const result = valuationSchema.safeParse(validVal({ fxRate: -1 }));
    expect(result.success).toBe(false);
  });
});

// --------------- validateTransaction ---------------

describe('validateTransaction', () => {
  it('returns success for valid data', () => {
    const result = validateTransaction(validTx());
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('returns errors for invalid data', () => {
    const result = validateTransaction({ quantity: -1 });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('error messages contain field paths', () => {
    const result = validateTransaction({ ...validTx(), quantity: -1 });
    expect(result.success).toBe(false);
    expect(result.errors!.some((e: string) => e.includes('quantity'))).toBe(true);
  });
});

// --------------- validateValuation ---------------

describe('validateValuation', () => {
  it('returns success for valid data', () => {
    const result = validateValuation(validVal());
    expect(result.success).toBe(true);
  });

  it('returns errors for bad month format', () => {
    const result = validateValuation({ ...validVal(), month: 'bad' });
    expect(result.success).toBe(false);
    expect(result.errors!.some((e: string) => e.includes('month'))).toBe(true);
  });
});

// --------------- csvTransactionSchema ---------------

describe('csvTransactionSchema', () => {
  it('coerces string numbers', () => {
    const result = csvTransactionSchema.safeParse({
      assetName: 'Apple',
      ticker: 'aapl',
      quantity: '10',
      pricePerUnit: '150.5',
      fees: '2',
      date: '2024-01-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(10);
      expect(result.data.pricePerUnit).toBe(150.5);
      expect(result.data.fees).toBe(2);
    }
  });

  it('falls back to defaults for missing optional fields', () => {
    const result = csvTransactionSchema.safeParse({
      assetName: 'Apple',
      ticker: 'aapl',
      quantity: '10',
      pricePerUnit: '150',
      date: '2024-01-01',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.assetType).toBe('equity');
      expect(result.data.transactionType).toBe('buy');
      expect(result.data.currency).toBe('USD');
      expect(result.data.geography).toBe('north_america');
      expect(result.data.fees).toBe(0);
    }
  });
});

// --------------- validateCSVTransactions ---------------

describe('validateCSVTransactions', () => {
  it('separates valid and invalid rows', () => {
    const rows = [
      { assetName: 'Apple', ticker: 'AAPL', quantity: '10', pricePerUnit: '150', date: '2024-01-01' },
      { assetName: '', ticker: '', quantity: 'bad', pricePerUnit: '150', date: '2024-01-01' },
    ];
    const { valid, errors } = validateCSVTransactions(rows);
    expect(valid.length).toBe(1);
    expect(errors.length).toBe(1);
    expect(errors[0].row).toBe(3); // 1-indexed + header
  });

  it('maps alternative column names (snake_case)', () => {
    const rows = [
      {
        asset_name: 'Apple',
        ticker: 'AAPL',
        asset_type: 'equity',
        transaction_type: 'sell',
        date: '2024-06-01',
        quantity: '5',
        price_per_unit: '200',
        fees: '1',
      },
    ];
    const { valid } = validateCSVTransactions(rows);
    expect(valid.length).toBe(1);
    expect(valid[0].assetName).toBe('Apple');
    expect(valid[0].transactionType).toBe('sell');
  });

  it('returns empty arrays for empty input', () => {
    const { valid, errors } = validateCSVTransactions([]);
    expect(valid).toEqual([]);
    expect(errors).toEqual([]);
  });
});

// --------------- validateCSVValuations ---------------

describe('validateCSVValuations', () => {
  it('parses valid valuation rows', () => {
    const rows = [
      { ticker: 'AAPL', assetName: 'Apple', month: '2024-06', pricePerUnit: '195' },
    ];
    const { valid, errors } = validateCSVValuations(rows);
    expect(valid.length).toBe(1);
    expect(errors.length).toBe(0);
  });

  it('reports errors for invalid month format', () => {
    const rows = [
      { ticker: 'AAPL', assetName: 'Apple', month: '2024-6', pricePerUnit: '195' },
    ];
    const { valid, errors } = validateCSVValuations(rows);
    expect(valid.length).toBe(0);
    expect(errors.length).toBe(1);
  });

  it('maps snake_case column names', () => {
    const rows = [
      { ticker: 'MSFT', asset_name: 'Microsoft', month: '2024-03', price_per_unit: '410' },
    ];
    const { valid } = validateCSVValuations(rows);
    expect(valid.length).toBe(1);
    expect(valid[0].assetName).toBe('Microsoft');
  });
});
