import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface IncomeStatementData {
  period: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  ebitda: number;
}

export interface BalanceSheetData {
  period: string;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalDebt: number;
  cash: number;
}

export interface CashFlowData {
  period: string;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  freeCashFlow: number;
  capex: number;
}

interface FundamentalsResponse {
  status: string;
  symbol: string;
  companyName?: string;
  statementType: string;
  period: string;
  data: any[];
  isMock?: boolean;
  message?: string;
  latency_ms?: number;
}

export const useAlpacaFundamentals = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockData, setIsMockData] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);

  const fetchFundamentals = useCallback(async <T>(
    symbol: string,
    statementType: 'income' | 'balance' | 'cashflow',
    period: 'quarterly' | 'annual' = 'quarterly',
    limit: number = 8
  ): Promise<T[] | null> => {
    setLoading(true);
    setError(null);
    setIsMockData(false);
    setCompanyName(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke<FundamentalsResponse>(
        'alpaca-fundamentals',
        {
          body: { symbol, statementType, period, limit },
        }
      );

      if (fnError) {
        console.error('Fundamentals fetch error:', fnError);
        setError('Failed to fetch financial data');
        return null;
      }

      if (data?.status === 'error') {
        setError(data.message || 'Failed to fetch financial data');
        return null;
      }

      if (data?.isMock) {
        setIsMockData(true);
      }
      
      if (data?.companyName) {
        setCompanyName(data.companyName);
      }

      return (data?.data as T[]) || null;
    } catch (err) {
      console.error('Fundamentals error:', err);
      setError('An error occurred while fetching financial data');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIncomeStatement = useCallback(
    (symbol: string, period: 'quarterly' | 'annual' = 'quarterly', limit = 8) =>
      fetchFundamentals<IncomeStatementData>(symbol, 'income', period, limit),
    [fetchFundamentals]
  );

  const fetchBalanceSheet = useCallback(
    (symbol: string, period: 'quarterly' | 'annual' = 'quarterly', limit = 8) =>
      fetchFundamentals<BalanceSheetData>(symbol, 'balance', period, limit),
    [fetchFundamentals]
  );

  const fetchCashFlow = useCallback(
    (symbol: string, period: 'quarterly' | 'annual' = 'quarterly', limit = 8) =>
      fetchFundamentals<CashFlowData>(symbol, 'cashflow', period, limit),
    [fetchFundamentals]
  );

  return {
    loading,
    error,
    isMockData,
    companyName,
    fetchIncomeStatement,
    fetchBalanceSheet,
    fetchCashFlow,
  };
};
