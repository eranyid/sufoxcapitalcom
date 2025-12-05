import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, MonthlyValuation, PortfolioSettings, PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { loadTransactions, saveTransactions, loadValuations, saveValuations, loadSettings, saveSettings } from '@/lib/storage';
import { calculatePerformanceMetrics, calculateRiskMetrics } from '@/lib/calculations';
import { sampleTransactions, sampleValuations } from '@/lib/sampleData';

interface PortfolioContextType {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  settings: PortfolioSettings;
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  sampleDataMode: boolean;
  setSampleDataMode: (enabled: boolean) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addValuation: (val: Omit<MonthlyValuation, 'id'>) => void;
  updateValuation: (id: string, val: Partial<MonthlyValuation>) => void;
  deleteValuation: (id: string) => void;
  updateSettings: (settings: Partial<PortfolioSettings>) => void;
  importTransactions: (txs: Transaction[]) => void;
  importValuations: (vals: MonthlyValuation[]) => void;
  clearAllData: () => void;
  refreshMetrics: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userValuations, setUserValuations] = useState<MonthlyValuation[]>([]);
  const [sampleDataMode, setSampleDataModeState] = useState<boolean>(() => {
    const stored = localStorage.getItem('sampleDataMode');
    return stored === 'true';
  });
  const [settings, setSettings] = useState<PortfolioSettings>({
    riskFreeRate: 4.5,
    benchmarkReturns: [],
    baseCurrency: 'USD'
  });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);

  // Active data based on mode
  const transactions = useMemo(() => 
    sampleDataMode ? sampleTransactions : userTransactions,
    [sampleDataMode, userTransactions]
  );
  
  const valuations = useMemo(() => 
    sampleDataMode ? sampleValuations : userValuations,
    [sampleDataMode, userValuations]
  );

  const setSampleDataMode = (enabled: boolean) => {
    setSampleDataModeState(enabled);
    localStorage.setItem('sampleDataMode', String(enabled));
  };

  // Load data on mount
  useEffect(() => {
    setUserTransactions(loadTransactions());
    setUserValuations(loadValuations());
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

  // Transaction operations (always affect user data)
  const addTransaction = (tx: Omit<Transaction, 'id'>) => {
    const newTx = { ...tx, id: crypto.randomUUID() };
    const updated = [...userTransactions, newTx];
    setUserTransactions(updated);
    saveTransactions(updated);
  };

  const updateTransaction = (id: string, tx: Partial<Transaction>) => {
    const updated = userTransactions.map(t => t.id === id ? { ...t, ...tx } : t);
    setUserTransactions(updated);
    saveTransactions(updated);
  };

  const deleteTransaction = (id: string) => {
    const updated = userTransactions.filter(t => t.id !== id);
    setUserTransactions(updated);
    saveTransactions(updated);
  };

  // Valuation operations (always affect user data)
  const addValuation = (val: Omit<MonthlyValuation, 'id'>) => {
    const newVal = { ...val, id: crypto.randomUUID() };
    const updated = [...userValuations, newVal];
    setUserValuations(updated);
    saveValuations(updated);
  };

  const updateValuation = (id: string, val: Partial<MonthlyValuation>) => {
    const updated = userValuations.map(v => v.id === id ? { ...v, ...val } : v);
    setUserValuations(updated);
    saveValuations(updated);
  };

  const deleteValuation = (id: string) => {
    const updated = userValuations.filter(v => v.id !== id);
    setUserValuations(updated);
    saveValuations(updated);
  };

  // Settings
  const updateSettings = (newSettings: Partial<PortfolioSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    saveSettings(updated);
  };

  // Import operations (always affect user data)
  const importTransactions = (txs: Transaction[]) => {
    const updated = [...userTransactions, ...txs];
    setUserTransactions(updated);
    saveTransactions(updated);
  };

  const importValuations = (vals: MonthlyValuation[]) => {
    const updated = [...userValuations, ...vals];
    setUserValuations(updated);
    saveValuations(updated);
  };

  const clearAllData = () => {
    setUserTransactions([]);
    setUserValuations([]);
    saveTransactions([]);
    saveValuations([]);
  };

  return (
    <PortfolioContext.Provider value={{
      transactions,
      valuations,
      settings,
      performanceMetrics,
      riskMetrics,
      sampleDataMode,
      setSampleDataMode,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addValuation,
      updateValuation,
      deleteValuation,
      updateSettings,
      importTransactions,
      importValuations,
      clearAllData,
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
