// Factor Model Definitions - Bloomberg PORT / MSCI Barra / Axioma style

export type FactorType = 'style' | 'macro';

export interface Factor {
  key: string;
  label: string;
  source: string;
  type: FactorType;
  description: string;
}

// Equity Style Factors
export const STYLE_FACTORS: Factor[] = [
  {
    key: 'value',
    label: 'Value',
    source: 'IWD/SPY',
    type: 'style',
    description: 'Exposure to undervalued stocks based on P/E, P/B metrics'
  },
  {
    key: 'growth',
    label: 'Growth',
    source: 'IWF/SPY',
    type: 'style',
    description: 'Exposure to high-growth companies based on earnings growth'
  },
  {
    key: 'momentum',
    label: 'Momentum',
    source: 'MTUM/SPY',
    type: 'style',
    description: 'Exposure to stocks with strong recent performance'
  },
  {
    key: 'volatility',
    label: 'Low Volatility',
    source: 'SPLV/SPY',
    type: 'style',
    description: 'Exposure to low-volatility stocks'
  },
  {
    key: 'quality',
    label: 'Quality',
    source: 'QUAL/SPY',
    type: 'style',
    description: 'Exposure to high-quality companies with stable earnings'
  },
  {
    key: 'size',
    label: 'Size (SMB)',
    source: 'IWM/SPY',
    type: 'style',
    description: 'Small-cap minus large-cap factor premium'
  }
];

// Macro Factors
export const MACRO_FACTORS: Factor[] = [
  {
    key: 'market',
    label: 'Market (SPX)',
    source: 'SPX',
    type: 'macro',
    description: 'Broad US equity market exposure'
  },
  {
    key: 'tech',
    label: 'Tech (NDX)',
    source: 'NDX',
    type: 'macro',
    description: 'Technology sector and NASDAQ-100 beta'
  },
  {
    key: 'rates',
    label: 'Interest Rates',
    source: 'US10Y',
    type: 'macro',
    description: 'Sensitivity to US 10-Year Treasury yield changes'
  },
  {
    key: 'usd',
    label: 'USD Currency',
    source: 'DXY',
    type: 'macro',
    description: 'Exposure to US Dollar strength/weakness'
  },
  {
    key: 'inflation',
    label: 'Inflation',
    source: 'TIP/IEF',
    type: 'macro',
    description: 'Sensitivity to inflation expectations (CPI proxy)'
  },
  {
    key: 'credit',
    label: 'Credit Spread',
    source: 'HYG/LQD',
    type: 'macro',
    description: 'Exposure to credit risk premium'
  }
];

export const ALL_FACTORS: Factor[] = [...STYLE_FACTORS, ...MACRO_FACTORS];

// Get factor by key
export function getFactorByKey(key: string): Factor | undefined {
  return ALL_FACTORS.find(f => f.key === key);
}

// Get factors by type
export function getFactorsByType(type: FactorType): Factor[] {
  return ALL_FACTORS.filter(f => f.type === type);
}
