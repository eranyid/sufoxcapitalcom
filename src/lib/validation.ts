import { z } from 'zod';

// Asset types enum
const assetTypeSchema = z.enum([
  'equity', 'bond', 'commodity', 'crypto', 'real_estate', 
  'cash', 'alternative', 'etf', 'mutual_fund', 
  'private_equity', 'private_debt', 'hedge_fund'
]);

// Transaction types enum
const transactionTypeSchema = z.enum(['buy', 'sell']);

// Geography enum
const geographySchema = z.enum([
  'north_america', 'europe', 'asia_pacific', 
  'emerging_markets', 'global', 'other'
]);

// Currency enum
const currencySchema = z.enum([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 
  'CAD', 'AUD', 'ZAR', 'ILS', 'OTHER'
]);

// Transaction validation schema
export const transactionSchema = z.object({
  assetName: z.string()
    .trim()
    .min(1, 'Asset name is required')
    .max(200, 'Asset name must be less than 200 characters'),
  ticker: z.string()
    .trim()
    .min(1, 'Ticker is required')
    .max(20, 'Ticker must be less than 20 characters')
    .toUpperCase(),
  assetType: assetTypeSchema,
  transactionType: transactionTypeSchema,
  date: z.string()
    .min(1, 'Date is required')
    .refine((date) => {
      const parsed = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      return parsed <= today;
    }, 'Transaction date cannot be in the future'),
  quantity: z.number()
    .positive('Quantity must be greater than 0')
    .max(1e12, 'Quantity is too large'),
  pricePerUnit: z.number()
    .positive('Price must be greater than 0')
    .max(1e12, 'Price is too large'),
  fees: z.number()
    .min(0, 'Fees cannot be negative')
    .max(1e9, 'Fees value is too large')
    .default(0),
  currency: currencySchema,
  geography: geographySchema,
  inceptionYear: z.number()
    .int()
    .min(1800, 'Inception year must be after 1800')
    .max(new Date().getFullYear(), 'Inception year cannot be in the future')
    .optional()
});

// Valuation validation schema
export const valuationSchema = z.object({
  assetId: z.string().optional(),
  ticker: z.string()
    .trim()
    .min(1, 'Ticker is required')
    .max(20, 'Ticker must be less than 20 characters'),
  assetName: z.string()
    .trim()
    .min(1, 'Asset name is required')
    .max(200, 'Asset name must be less than 200 characters'),
  month: z.string()
    .min(1, 'Month is required')
    .regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  pricePerUnit: z.number()
    .positive('Price must be greater than 0')
    .max(1e12, 'Price is too large'),
  fxRate: z.number()
    .positive('FX rate must be greater than 0')
    .max(1e6, 'FX rate is too large')
    .optional()
});

// CSV import transaction schema (converts strings to proper types)
export const csvTransactionSchema = z.object({
  assetName: z.string().trim().min(1, 'Asset name is required'),
  ticker: z.string().trim().min(1, 'Ticker is required').toUpperCase(),
  assetType: assetTypeSchema.catch('equity'),
  transactionType: transactionTypeSchema.catch('buy'),
  date: z.string().min(1, 'Date is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  pricePerUnit: z.coerce.number().positive('Price must be positive'),
  fees: z.coerce.number().min(0).catch(0),
  currency: currencySchema.catch('USD'),
  geography: geographySchema.catch('north_america'),
  inceptionYear: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional().catch(undefined)
});

// CSV import valuation schema
export const csvValuationSchema = z.object({
  ticker: z.string().trim().min(1, 'Ticker is required'),
  assetName: z.string().trim().min(1, 'Asset name is required'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  pricePerUnit: z.coerce.number().positive('Price must be positive'),
  fxRate: z.coerce.number().positive().optional().catch(undefined),
  assetId: z.string().optional()
});

// Type exports
export type TransactionInput = z.infer<typeof transactionSchema>;
export type ValuationInput = z.infer<typeof valuationSchema>;

// Validation result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}

// Validate a single transaction
export function validateTransaction(data: unknown): ValidationResult<TransactionInput> {
  const result = transactionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  };
}

// Validate a single valuation
export function validateValuation(data: unknown): ValidationResult<ValuationInput> {
  const result = valuationSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  };
}

// Validate CSV transaction rows with detailed error reporting
export function validateCSVTransactions(rows: Record<string, string>[]): {
  valid: TransactionInput[];
  errors: { row: number; errors: string[] }[];
} {
  const valid: TransactionInput[] = [];
  const errors: { row: number; errors: string[] }[] = [];

  rows.forEach((row, index) => {
    // Map CSV column names to our schema
    const mapped = {
      assetName: row.assetName || row.asset_name || '',
      ticker: row.ticker || '',
      assetType: row.assetType || row.asset_type || 'equity',
      transactionType: row.transactionType || row.transaction_type || 'buy',
      date: row.date || '',
      quantity: row.quantity || '0',
      pricePerUnit: row.pricePerUnit || row.price_per_unit || row.price || '0',
      fees: row.fees || '0',
      currency: row.currency || 'USD',
      geography: row.geography || 'north_america',
      inceptionYear: row.inceptionYear || row.inception_year || undefined
    };

    const result = csvTransactionSchema.safeParse(mapped);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({
        row: index + 2, // +2 for 1-indexed and header row
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
  });

  return { valid, errors };
}

// Validate CSV valuation rows with detailed error reporting
export function validateCSVValuations(rows: Record<string, string>[]): {
  valid: ValuationInput[];
  errors: { row: number; errors: string[] }[];
} {
  const valid: ValuationInput[] = [];
  const errors: { row: number; errors: string[] }[] = [];

  rows.forEach((row, index) => {
    // Map CSV column names to our schema
    const mapped = {
      assetId: row.assetId || row.asset_id || '',
      ticker: row.ticker || '',
      assetName: row.assetName || row.asset_name || '',
      month: row.month || '',
      pricePerUnit: row.pricePerUnit || row.price_per_unit || row.price || '0',
      fxRate: row.fxRate || row.fx_rate || undefined
    };

    const result = csvValuationSchema.safeParse(mapped);
    if (result.success) {
      valid.push(result.data);
    } else {
      errors.push({
        row: index + 2,
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
  });

  return { valid, errors };
}
