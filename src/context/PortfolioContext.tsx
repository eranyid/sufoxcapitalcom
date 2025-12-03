import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, MonthlyValuation, PortfolioSettings, PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { loadTransactions, saveTransactions, loadValuations, saveValuations, loadSettings, saveSettings } from '@/lib/storage';
import { calculatePerformanceMetrics, calculateRiskMetrics } from '@/lib/calculations';

interface PortfolioContextType {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  settings: PortfolioSettings;
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addValuation: (val: Omit<MonthlyValuation, 'id'>) => void;
  updateValuation: (id: string, val: Partial<MonthlyValuation>) => void;
  deleteValuation: (id: string) => void;
  updateSettings: (settings: Partial<PortfolioSettings>) => void;
  importTransactions: (txs: Transaction[]) => void;
  importValuations: (vals: MonthlyValuation[]) => void;
  refreshMetrics: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [valuations, setValuations] = useState<MonthlyValuation[]>([]);
  const [settings, setSettings] = useState<PortfolioSettings>({
    riskFreeRate: 4.5,
    benchmarkReturns: [],
    baseCurrency: 'USD'
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);

  // Load data on mount
  useEffect(() => {
    setTransactions(loadTransactions());
    setValuations(loadValuations());
    setSettings(loadSettings());
  }, []);

  // Recalculate metrics when data changes
  const refreshMetrics = useCallback(() => {
    if (transactions.length > 0 && valuations.length > 0) {
      const perfMetrics = calculatePerformanceMetrics(transactions, valuations, settings.riskFreeRate);
      setPerformanceMetrics(perfMetrics);
      
      const riskMet = calculateRiskMetrics(transactions, valuations, settings.riskFreeRate, settings.benchmarkReturns);
      setRiskMetrics(riskMet);
    } else {
      setPerformanceMetrics(null);
      setRiskMetrics(null);
    }
  }, [transactions, valuations, settings]);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  // Transaction operations
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx = { ...tx, id: crypto.randomUUID() };
    const updated = [...transactions, newTx];
    setTransactions(updated);
    saveTransactions(updated);
  };

  const updateTransaction = (id: string, tx: Partial<Transaction>) => {
    const updated = transactions.map(t => t.id === id ? { ...t, ...tx } : t);
    setTransactions(updated);
    saveTransactions(updated);
  };

  const deleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveTransactions(updated);
  };

  // Valuation operations
  const addValuation = (val: Omit<MonthlyValuation, 'id'>) => {
    const newVal = { ...val, id: crypto.randomUUID() };
    const updated = [...valuations, newVal];
    setValuations(updated);
    saveValuations(updated);
  };

  const updateValuation = (id: string, val: Partial<MonthlyValuation>) => {
    const updated = valuations.map(v => v.id === id ? { ...v, ...val } : v);
    setValuations(updated);
    saveValuations(updated);
  };

  const deleteValuation = (id: string) => {
    const updated = valuations.filter(v => v.id !== id);
    setValuations(updated);
    saveValuations(updated);
  };

  // Settings
  const updateSettings = (newSettings: Partial<PortfolioSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  // Import operations
  const importTransactions = (txs: Transaction[]) => {
    const updated = [...transactions, ...txs];
    setTransactions(updated);
    saveTransactions(updated);
  };

  const importValuations = (vals: MonthlyValuation[]) => {
    const updated = [...valuations, ...vals];
    setValuations(updated);
    saveValuations(updated);
  };

  return (
    <PortfolioContext.Provider value={{
      transactions,
      valuations,
      settings,
      performanceMetrics,
      riskMetrics,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addValuation,
      updateValuation,
      deleteValuation,
      updateSettings,
      importTransactions,
      importValuations,
      refreshMetrics
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
