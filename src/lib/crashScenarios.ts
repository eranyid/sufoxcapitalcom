// Central configuration for historical crash scenarios

export type CrashScenarioKey = 'DOT_COM' | 'GFC_2008' | 'COVID_2020' | 'TECH_2022';

export interface CrashScenario {
  key: CrashScenarioKey;
  label: string;
  shortLabel: string;
  year: string;
  startYear: number;
  endYear: number;
  drawdowns: Record<string, number>;
}

export const CRASH_SCENARIOS: Record<CrashScenarioKey, CrashScenario> = {
  DOT_COM: {
    key: 'DOT_COM',
    label: 'Dot-Com Crash',
    shortLabel: 'Dot-Com',
    year: '2000-2002',
    startYear: 2000,
    endYear: 2002,
    drawdowns: {
      equity: -49,
      etf: -45,
      mutual_fund: -40,
      crypto: -80, // Would apply if existed
      bond: 5,
      commodity: 10,
      real_estate: -5,
      cash: 0,
      alternative: -20,
      private_equity: -55,
      private_debt: -15,
      hedge_fund: -25
    }
  },
  GFC_2008: {
    key: 'GFC_2008',
    label: 'Financial Crisis',
    shortLabel: 'Financial',
    year: '2008-2009',
    startYear: 2007,
    endYear: 2009,
    drawdowns: {
      equity: -57,
      etf: -55,
      mutual_fund: -50,
      crypto: -80, // Would apply if existed
      bond: -5,
      commodity: -35,
      real_estate: -40,
      cash: 0,
      alternative: -30,
      private_equity: -60,
      private_debt: -25,
      hedge_fund: -35
    }
  },
  COVID_2020: {
    key: 'COVID_2020',
    label: 'COVID-19 Crash',
    shortLabel: 'COVID',
    year: 'Mar 2020',
    startYear: 2020,
    endYear: 2020,
    drawdowns: {
      equity: -34,
      etf: -32,
      mutual_fund: -30,
      crypto: -50,
      bond: 2,
      commodity: -30,
      real_estate: -25,
      cash: 0,
      alternative: -20,
      private_equity: -40,
      private_debt: -10,
      hedge_fund: -18
    }
  },
  TECH_2022: {
    key: 'TECH_2022',
    label: 'Tech Selloff',
    shortLabel: 'Tech 2022',
    year: '2022',
    startYear: 2022,
    endYear: 2022,
    drawdowns: {
      equity: -25,
      etf: -20,
      mutual_fund: -18,
      crypto: -75,
      bond: -15,
      commodity: 15,
      real_estate: -20,
      cash: 0,
      alternative: -15,
      private_equity: -30,
      private_debt: -12,
      hedge_fund: -15
    }
  }
};

// Common inception years for well-known assets
export const KNOWN_INCEPTION_YEARS: Record<string, number> = {
  // Tech stocks
  'AAPL': 1980,
  'MSFT': 1986,
  'GOOGL': 2004,
  'GOOG': 2004,
  'AMZN': 1997,
  'META': 2012,
  'FB': 2012,
  'NVDA': 1999,
  'TSLA': 2010,
  'NFLX': 2002,
  'AMD': 1972,
  'INTC': 1971,
  'ASML': 1995,
  'TSM': 1997,
  
  // Crypto
  'BTC': 2009,
  'ETH': 2015,
  'SOL': 2020,
  'DOGE': 2013,
  'XRP': 2012,
  'ADA': 2017,
  'DOT': 2020,
  'AVAX': 2020,
  
  // ETFs
  'SPY': 1993,
  'QQQ': 1999,
  'IWM': 2000,
  'VTI': 2001,
  'VOO': 2010,
  'AGG': 2003,
  'BND': 2007,
  'EEM': 2003,
  'VWO': 2005,
  'GLD': 2004,
  'SLV': 2006,
  'TLT': 2002,
  'LQD': 2002,
  'HYG': 2007,
  'VNQ': 2004,
  'XLF': 1998,
  'XLE': 1998,
  'XLK': 1998,
  'XLV': 1998,
  'ARKK': 2014,
  
  // Other stocks
  'JPM': 1969,
  'BAC': 1972,
  'WMT': 1972,
  'JNJ': 1944,
  'PG': 1890,
  'V': 2008,
  'MA': 2006,
  'DIS': 1957,
  'KO': 1919,
  'PEP': 1972,
  'COST': 1985,
  'HD': 1981,
  'MCD': 1965,
  'NKE': 1980,
  'SBUX': 1992,
  'BA': 1962,
  'CVX': 1926,
  'XOM': 1920,
};

/**
 * Check if an asset existed during a specific crash scenario
 * @param inceptionYear The year the asset was first listed/launched
 * @param scenario The crash scenario to check against
 * @returns true if the asset existed during the crash, false otherwise
 */
export function assetExistedInScenario(
  inceptionYear: number | undefined | null,
  scenario: CrashScenario
): boolean {
  if (!inceptionYear) return true; // If no inception year set, assume it existed
  return inceptionYear <= scenario.startYear;
}

/**
 * Get the inception year for a ticker from known data
 * @param ticker The asset ticker symbol
 * @returns The inception year or undefined if unknown
 */
export function getKnownInceptionYear(ticker: string): number | undefined {
  return KNOWN_INCEPTION_YEARS[ticker.toUpperCase()];
}

/**
 * Get all crash scenario keys in chronological order
 */
export function getCrashScenarioKeys(): CrashScenarioKey[] {
  return ['DOT_COM', 'GFC_2008', 'COVID_2020', 'TECH_2022'];
}
