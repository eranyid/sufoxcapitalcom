import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction, MonthlyValuation, PortfolioSettings, PerformanceMetrics, RiskMetrics, CashBalances, CashCurrency } from '@/types/investment';
import { calculatePerformanceMetrics, calculateRiskMetrics, calculateTotalCashInBaseCurrency } from '@/lib/calculations';
import { computePortfolioData, ComputedPortfolioData, runConsistencyChecks } from '@/lib/portfolioEngine';
import { sampleTransactions, sampleValuations } from '@/lib/sampleData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { syncCrmFromTransaction } from '@/hooks/useCrmSync';
import { createLedgerEntry, LedgerEntryType } from '@/lib/capitalLedger';
import { getFxRate } from '@/lib/fxService';
interface PortfolioContextType {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  settings: PortfolioSettings;
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  cashBalances: CashBalances;
  sampleDataMode: boolean;
  loading: boolean;
  // NEW: Computed portfolio data - Single Source of Truth
  computedData: ComputedPortfolioData;
  setSampleDataMode: (enabled: boolean) => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addValuation: (val: Omit<MonthlyValuation, 'id'>) => Promise<void>;
  updateValuation: (id: string, val: Partial<MonthlyValuation>) => Promise<void>;
  deleteValuation: (id: string) => Promise<void>;
  updateSettings: (settings: Partial<PortfolioSettings>) => Promise<void>;
  updateCashBalance: (currency: CashCurrency, amount: number) => Promise<void>;
  addCash: (currency: CashCurrency, amount: number, description?: string) => Promise<void>;
  addCashWithType: (currency: CashCurrency, amount: number, entryType: LedgerEntryType, description?: string) => Promise<void>;
  importTransactions: (txs: Transaction[]) => Promise<void>;
  importValuations: (vals: MonthlyValuation[]) => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshMetrics: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [userValuations, setUserValuations] = useState<MonthlyValuation[]>([]);
  const [companySectors, setCompanySectors] = useState<Map<string, string>>(new Map());
  const [companyTimeHorizons, setCompanyTimeHorizons] = useState<Map<string, number>>(new Map());
  const [sampleDataMode, setSampleDataModeState] = useState<boolean>(() => {
    const stored = localStorage.getItem('sampleDataMode');
    return stored === 'true';
  });
  const [settings, setSettings] = useState<PortfolioSettings>({
    riskFreeRate: 4.5,
    benchmarkReturns: [],
    baseCurrency: 'USD'
  });
  const [cashBalances, setCashBalances] = useState<CashBalances>({ USD: 0, EUR: 0, ILS: 0, GBP: 0, CHF: 0, JPY: 0 });
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Load data from Supabase when user changes
  useEffect(() => {
    if (!user) {
      setUserTransactions([]);
      setUserValuations([]);
      setSettings({ riskFreeRate: 4.5, benchmarkReturns: [], baseCurrency: 'USD' });
      setCashBalances({ USD: 0, EUR: 0, ILS: 0, GBP: 0, CHF: 0, JPY: 0 });
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        // Load transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null);
        
        if (txData) {
          setUserTransactions(txData.map(tx => ({
            id: tx.id,
            assetName: tx.asset_name,
            ticker: tx.ticker,
            assetType: tx.asset_type as Transaction['assetType'],
            transactionType: tx.transaction_type as Transaction['transactionType'],
            date: tx.date,
            quantity: Number(tx.quantity),
            pricePerUnit: Number(tx.price_per_unit),
            fees: Number(tx.fees),
            currency: tx.currency as Transaction['currency'],
            geography: tx.geography as Transaction['geography'],
            inceptionYear: tx.inception_year ?? undefined,
            // FX tracking fields
            fxRateAtEntry: tx.fx_rate_at_entry ? Number(tx.fx_rate_at_entry) : undefined,
            costLocal: tx.cost_local ? Number(tx.cost_local) : undefined,
            costBase: tx.cost_base ? Number(tx.cost_base) : undefined
          })));
        }

        // Load valuations
        const { data: valData } = await supabase
          .from('valuations')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null);
        
        if (valData) {
          setUserValuations(valData.map(val => ({
            id: val.id,
            assetId: val.asset_id ?? '',
            ticker: val.ticker,
            assetName: val.asset_name,
            month: val.month,
            pricePerUnit: Number(val.price_per_unit),
            fxRate: val.fx_rate ? Number(val.fx_rate) : undefined,
            linkedCompanyId: val.linked_company_id ?? undefined
          })));
        }

        // Load settings
        const { data: settingsData } = await supabase
          .from('portfolio_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (settingsData) {
          setSettings({
            riskFreeRate: Number(settingsData.risk_free_rate),
            benchmarkReturns: (settingsData.benchmark_returns as number[]) ?? [],
            baseCurrency: settingsData.base_currency as PortfolioSettings['baseCurrency']
          });
        }

        // Load cash balances
        const { data: cashData } = await supabase
          .from('cash_balances')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (cashData) {
          setCashBalances({
            USD: Number(cashData.usd ?? 0),
            EUR: Number(cashData.eur ?? 0),
            ILS: Number(cashData.ils ?? 0),
            GBP: Number(cashData.gbp ?? 0),
            CHF: Number(cashData.chf ?? 0),
            JPY: Number(cashData.jpy ?? 0)
          });
        }

        // Load CRM companies to get sector and time_horizon data
        const { data: companiesData } = await supabase
          .from('crm_companies')
          .select('ticker, sector, time_horizon')
          .eq('user_id', user.id)
          .is('deleted_at', null);
        
        if (companiesData) {
          const sectorMap = new Map<string, string>();
          const timeHorizonMap = new Map<string, number>();
          companiesData.forEach(c => {
            if (c.ticker) {
              if (c.sector) {
                sectorMap.set(c.ticker.toUpperCase(), c.sector);
              }
              if (c.time_horizon) {
                const years = parseInt(c.time_horizon.replace(/[^0-9]/g, ''));
                if (!isNaN(years) && years > 0) {
                  timeHorizonMap.set(c.ticker.toUpperCase(), years);
                }
              }
            }
          });
          setCompanySectors(sectorMap);
          setCompanyTimeHorizons(timeHorizonMap);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // SINGLE SOURCE OF TRUTH: Compute all portfolio data centrally
  // Enrich holdings with sector data from CRM companies
  const computedData = useMemo(() => {
    const baseCurrency = settings.baseCurrency === 'ILS' ? 'ILS' : 'USD';
    const data = computePortfolioData(transactions, valuations, cashBalances, baseCurrency);
    
    // Enrich holdings with sector from CRM companies
    data.holdings.forEach(holding => {
      const sector = companySectors.get(holding.ticker.toUpperCase());
      if (sector) {
        holding.sector = sector;
      }
    });
    
    // Recalculate sector allocation after enrichment
    const sectorMap = new Map<string, number>();
    for (const holding of data.holdings) {
      const sector = holding.sector || 'Unknown';
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + holding.currentValue);
    }
    
    data.sectorAllocation = Array.from(sectorMap.entries())
      .map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value,
        percentage: data.totalPortfolioValue > 0 ? (value / data.totalPortfolioValue) * 100 : 0
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    // Recalculate sector rings
    const SECTOR_COLORS = ['#4A90D9', '#FF8C00', '#50C878', '#9370DB', '#FF6B6B', '#FFD700', '#20B2AA', '#DDA0DD', '#87CEEB', '#F0E68C', '#DEB887', '#98FB98'];
    data.sectorRings = Array.from(sectorMap.entries()).map(([name, value], idx) => ({
      id: `sector-${name}`,
      name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value,
      weight: data.totalPortfolioValue > 0 ? (value / data.totalPortfolioValue) * 100 : 0,
      color: SECTOR_COLORS[idx % SECTOR_COLORS.length]
    }));
    
    // Calculate time horizon distribution from holdings
    const timeHorizonMap = new Map<number, { value: number; holdings: string[] }>();
    for (const holding of data.holdings) {
      const years = companyTimeHorizons.get(holding.ticker.toUpperCase());
      if (years && years > 0) {
        const existing = timeHorizonMap.get(years) || { value: 0, holdings: [] };
        existing.value += holding.currentValue;
        existing.holdings.push(holding.ticker);
        timeHorizonMap.set(years, existing);
      }
    }
    
    data.timeHorizonDistribution = Array.from(timeHorizonMap.entries())
      .map(([years, { value, holdings }]) => ({
        years,
        value,
        percentage: data.totalPortfolioValue > 0 ? (value / data.totalPortfolioValue) * 100 : 0,
        holdingsCount: holdings.length
      }))
      .sort((a, b) => a.years - b.years);
    
    return data;
  }, [transactions, valuations, cashBalances, settings.baseCurrency, companySectors, companyTimeHorizons]);

  // Recalculate metrics when data changes
  // Now includes cashBalances in totalValue for unified NAV
  const refreshMetrics = useCallback(() => {
    if (transactions.length > 0 && valuations.length > 0) {
      const baseCurrency = settings.baseCurrency === 'ILS' ? 'ILS' : 'USD';
      const perfMetrics = calculatePerformanceMetrics(
        transactions, 
        valuations, 
        settings.riskFreeRate,
        cashBalances,
        baseCurrency
      );
      setPerformanceMetrics(perfMetrics);
      
      const riskMet = calculateRiskMetrics(transactions, valuations, settings.riskFreeRate, settings.benchmarkReturns);
      setRiskMetrics(riskMet);
      
      // Run consistency checks against computed data
      if (process.env.NODE_ENV === 'development') {
        const consistencyResult = runConsistencyChecks(computedData, perfMetrics);
        if (!consistencyResult.isValid) {
          console.warn('[Portfolio Consistency] Some checks failed:', consistencyResult.checks.filter(c => !c.passed));
        }
      }
    } else {
      setPerformanceMetrics(null);
      setRiskMetrics(null);
    }
  }, [transactions, valuations, settings, cashBalances, computedData]);

  // Trigger metrics recalculation when data changes
  // Using specific dependencies to avoid infinite loop - don't include refreshMetrics itself
  useEffect(() => {
    const baseCurrency = settings.baseCurrency === 'ILS' ? 'ILS' : 'USD';
    
    if (transactions.length > 0 && valuations.length > 0) {
      const perfMetrics = calculatePerformanceMetrics(
        transactions, 
        valuations, 
        settings.riskFreeRate,
        cashBalances,
        baseCurrency
      );
      setPerformanceMetrics(perfMetrics);
      
      const riskMet = calculateRiskMetrics(transactions, valuations, settings.riskFreeRate, settings.benchmarkReturns);
      setRiskMetrics(riskMet);
    } else {
      // Even without holdings, show cash value as Total Portfolio Value
      const cashValue = calculateTotalCashInBaseCurrency(cashBalances, baseCurrency);
      if (cashValue > 0) {
        setPerformanceMetrics({
          totalValue: cashValue,
          holdingsValue: 0,
          cashValue,
          totalCost: 0,
          unrealizedPL: 0,
          realizedPL: 0,
          totalPL: 0,
          marketPL: 0,
          fxPL: 0,
          totalReturn: 0,
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          monthlyReturns: [],
          cumulativeReturns: [],
          drawdownSeries: [],
          irr: 0,
          twr: 0,
          winLossRatio: 0,
        });
      } else {
        setPerformanceMetrics(null);
      }
      setRiskMetrics(null);
    }
  }, [transactions, valuations, settings.riskFreeRate, settings.benchmarkReturns, settings.baseCurrency, cashBalances]);

  // Transaction operations
  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    // Get FX rate at transaction date for accurate P/L tracking
    const baseCurrency = settings.baseCurrency;
    const fxRateAtEntry = tx.currency === baseCurrency 
      ? 1 
      : await getFxRate(user.id, tx.currency, baseCurrency, tx.date);
    
    // Calculate cost in local and base currency
    const costLocal = tx.quantity * tx.pricePerUnit + tx.fees;
    const costBase = costLocal * fxRateAtEntry;
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        asset_name: tx.assetName,
        ticker: tx.ticker,
        asset_type: tx.assetType,
        transaction_type: tx.transactionType,
        date: tx.date,
        quantity: tx.quantity,
        price_per_unit: tx.pricePerUnit,
        fees: tx.fees,
        currency: tx.currency,
        geography: tx.geography,
        inception_year: tx.inceptionYear,
        // FX tracking fields for accurate P/L calculation
        base_currency: baseCurrency,
        fx_rate_at_entry: fxRateAtEntry,
        cost_local: costLocal,
        cost_base: costBase
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding transaction:', error);
      return;
    }
    
    const newTx: Transaction = {
      id: data.id,
      assetName: data.asset_name,
      ticker: data.ticker,
      assetType: data.asset_type as Transaction['assetType'],
      transactionType: data.transaction_type as Transaction['transactionType'],
      date: data.date,
      quantity: Number(data.quantity),
      pricePerUnit: Number(data.price_per_unit),
      fees: Number(data.fees),
      currency: data.currency as Transaction['currency'],
      geography: data.geography as Transaction['geography'],
      inceptionYear: data.inception_year ?? undefined,
      fxRateAtEntry: data.fx_rate_at_entry ? Number(data.fx_rate_at_entry) : undefined,
      costLocal: data.cost_local ? Number(data.cost_local) : undefined,
      costBase: data.cost_base ? Number(data.cost_base) : undefined
    };
    
    setUserTransactions(prev => [...prev, newTx]);
    
    // Update cash balance for ALL supported currencies
    const SUPPORTED_CASH_CURRENCIES: CashCurrency[] = ['USD', 'EUR', 'ILS', 'GBP', 'CHF', 'JPY'];
    const txCurrency = tx.currency as CashCurrency;
    
    if (SUPPORTED_CASH_CURRENCIES.includes(txCurrency)) {
      const totalCost = tx.quantity * tx.pricePerUnit + tx.fees;
      const cashImpact = tx.transactionType === 'buy' 
        ? -totalCost  // BUY = deduct cash
        : (tx.quantity * tx.pricePerUnit - tx.fees);  // SELL = add cash
      
      const newAmount = cashBalances[txCurrency] + cashImpact;
      await updateCashBalance(txCurrency, newAmount);
      
      // Record in Capital Ledger for audit trail
      const entryType: LedgerEntryType = tx.transactionType === 'buy' ? 'BUY' : 'SELL';
      await createLedgerEntry({
        userId: user.id,
        transactionId: data.id,
        entryType,
        currency: txCurrency,
        amount: cashImpact,
        description: `${tx.transactionType.toUpperCase()} ${tx.quantity} ${tx.ticker} @ ${tx.pricePerUnit} ${tx.currency}`,
        metadata: {
          ticker: tx.ticker,
          quantity: tx.quantity,
          pricePerUnit: tx.pricePerUnit,
          fees: tx.fees,
          assetType: tx.assetType
        }
      });
    }
    
    // Sync CRM Companies board based on transaction (only for equity asset types)
    if (tx.assetType === 'equity' || tx.assetType === 'etf') {
      try {
        await syncCrmFromTransaction(user.id, userTransactions, tx, data.id);
      } catch (err) {
        console.error('CRM sync failed:', err);
        // Don't fail the transaction if CRM sync fails
      }
    }
  };

  const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
    if (!user) return;
    
    const updateData: Record<string, unknown> = {};
    if (tx.assetName !== undefined) updateData.asset_name = tx.assetName;
    if (tx.ticker !== undefined) updateData.ticker = tx.ticker;
    if (tx.assetType !== undefined) updateData.asset_type = tx.assetType;
    if (tx.transactionType !== undefined) updateData.transaction_type = tx.transactionType;
    if (tx.date !== undefined) updateData.date = tx.date;
    if (tx.quantity !== undefined) updateData.quantity = tx.quantity;
    if (tx.pricePerUnit !== undefined) updateData.price_per_unit = tx.pricePerUnit;
    if (tx.fees !== undefined) updateData.fees = tx.fees;
    if (tx.currency !== undefined) updateData.currency = tx.currency;
    if (tx.geography !== undefined) updateData.geography = tx.geography;
    if (tx.inceptionYear !== undefined) updateData.inception_year = tx.inceptionYear;
    
    const { error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error updating transaction:', error);
      return;
    }
    
    setUserTransactions(prev => prev.map(t => t.id === id ? { ...t, ...tx } : t));
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting transaction:', error);
      return;
    }
    
    setUserTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Valuation operations
  const addValuation = async (val: Omit<MonthlyValuation, 'id'>) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('valuations')
      .insert({
        user_id: user.id,
        asset_id: val.assetId,
        ticker: val.ticker,
        asset_name: val.assetName,
        month: val.month,
        price_per_unit: val.pricePerUnit,
        fx_rate: val.fxRate,
        linked_company_id: val.linkedCompanyId || null
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding valuation:', error);
      return;
    }
    
    const newVal: MonthlyValuation = {
      id: data.id,
      assetId: data.asset_id ?? '',
      ticker: data.ticker,
      assetName: data.asset_name,
      month: data.month,
      pricePerUnit: Number(data.price_per_unit),
      fxRate: data.fx_rate ? Number(data.fx_rate) : undefined,
      linkedCompanyId: data.linked_company_id ?? undefined
    };
    
    setUserValuations(prev => [...prev, newVal]);
  };

  const updateValuation = async (id: string, val: Partial<MonthlyValuation>) => {
    if (!user) return;
    
    const updateData: Record<string, unknown> = {};
    if (val.assetId !== undefined) updateData.asset_id = val.assetId;
    if (val.ticker !== undefined) updateData.ticker = val.ticker;
    if (val.assetName !== undefined) updateData.asset_name = val.assetName;
    if (val.month !== undefined) updateData.month = val.month;
    if (val.pricePerUnit !== undefined) updateData.price_per_unit = val.pricePerUnit;
    if (val.fxRate !== undefined) updateData.fx_rate = val.fxRate;
    
    const { error } = await supabase
      .from('valuations')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error updating valuation:', error);
      return;
    }
    
    setUserValuations(prev => prev.map(v => v.id === id ? { ...v, ...val } : v));
  };

  const deleteValuation = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('valuations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error deleting valuation:', error);
      return;
    }
    
    setUserValuations(prev => prev.filter(v => v.id !== id));
  };

  // Settings
  const updateSettings = async (newSettings: Partial<PortfolioSettings>) => {
    if (!user) return;
    
    const updated = { ...settings, ...newSettings };
    
    const { error } = await supabase
      .from('portfolio_settings')
      .upsert({
        user_id: user.id,
        risk_free_rate: updated.riskFreeRate,
        benchmark_returns: updated.benchmarkReturns,
        base_currency: updated.baseCurrency
      }, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Error updating settings:', error);
      return;
    }
    
    setSettings(updated);
  };

  // Import operations
  const importTransactions = async (txs: Transaction[]) => {
    if (!user) return;
    
    const insertData = txs.map(tx => ({
      user_id: user.id,
      asset_name: tx.assetName,
      ticker: tx.ticker,
      asset_type: tx.assetType,
      transaction_type: tx.transactionType,
      date: tx.date,
      quantity: tx.quantity,
      price_per_unit: tx.pricePerUnit,
      fees: tx.fees,
      currency: tx.currency,
      geography: tx.geography,
      inception_year: tx.inceptionYear
    }));
    
    const { data, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('Error importing transactions:', error);
      return;
    }
    
    if (data) {
      const newTxs = data.map(d => ({
        id: d.id,
        assetName: d.asset_name,
        ticker: d.ticker,
        assetType: d.asset_type as Transaction['assetType'],
        transactionType: d.transaction_type as Transaction['transactionType'],
        date: d.date,
        quantity: Number(d.quantity),
        pricePerUnit: Number(d.price_per_unit),
        fees: Number(d.fees),
        currency: d.currency as Transaction['currency'],
        geography: d.geography as Transaction['geography'],
        inceptionYear: d.inception_year ?? undefined
      }));
      setUserTransactions(prev => [...prev, ...newTxs]);
    }
  };

  const importValuations = async (vals: MonthlyValuation[]) => {
    if (!user) return;
    
    const insertData = vals.map(val => ({
      user_id: user.id,
      asset_id: val.assetId,
      ticker: val.ticker,
      asset_name: val.assetName,
      month: val.month,
      price_per_unit: val.pricePerUnit,
      fx_rate: val.fxRate
    }));
    
    const { data, error } = await supabase
      .from('valuations')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('Error importing valuations:', error);
      return;
    }
    
    if (data) {
      const newVals = data.map(d => ({
        id: d.id,
        assetId: d.asset_id ?? '',
        ticker: d.ticker,
        assetName: d.asset_name,
        month: d.month,
        pricePerUnit: Number(d.price_per_unit),
        fxRate: d.fx_rate ? Number(d.fx_rate) : undefined
      }));
      setUserValuations(prev => [...prev, ...newVals]);
    }
  };

  const clearAllData = async () => {
    if (!user) return;
    
    await Promise.all([
      supabase.from('transactions').delete().eq('user_id', user.id),
      supabase.from('valuations').delete().eq('user_id', user.id),
      supabase.from('cash_balances').delete().eq('user_id', user.id)
    ]);
    
    setUserTransactions([]);
    setUserValuations([]);
    setCashBalances({ USD: 0, EUR: 0, ILS: 0, GBP: 0, CHF: 0, JPY: 0 });
  };

  // Cash balance operations
  const updateCashBalance = async (currency: CashCurrency, amount: number) => {
    if (!user) return;
    
    const newBalances = { ...cashBalances, [currency]: amount };
    
    const { error } = await supabase
      .from('cash_balances')
      .upsert({
        user_id: user.id,
        usd: newBalances.USD,
        eur: newBalances.EUR,
        ils: newBalances.ILS,
        gbp: newBalances.GBP,
        chf: newBalances.CHF,
        jpy: newBalances.JPY
      }, { onConflict: 'user_id' });
    
    if (error) {
      console.error('Error updating cash balance:', error);
      return;
    }
    
    setCashBalances(newBalances);
  };

  const addCash = async (currency: CashCurrency, amount: number, description?: string) => {
    if (!user) return;
    
    const newAmount = cashBalances[currency] + amount;
    await updateCashBalance(currency, newAmount);
    
    // Record in Capital Ledger
    const entryType: LedgerEntryType = amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL';
    await createLedgerEntry({
      userId: user.id,
      entryType,
      currency,
      amount,
      description: description || (amount > 0 ? 'Manual deposit' : 'Manual withdrawal')
    });
  };

  // Add cash with specific entry type (for dividend, interest, fee, etc.)
  const addCashWithType = async (currency: CashCurrency, amount: number, entryType: LedgerEntryType, description?: string) => {
    if (!user) return;
    
    const newAmount = cashBalances[currency] + amount;
    await updateCashBalance(currency, newAmount);
    
    // Record in Capital Ledger with specific type
    await createLedgerEntry({
      userId: user.id,
      entryType,
      currency,
      amount,
      description: description || entryType
    });
  };

  return (
    <PortfolioContext.Provider value={{
      transactions,
      valuations,
      settings,
      performanceMetrics,
      riskMetrics,
      cashBalances,
      sampleDataMode,
      loading,
      computedData, // NEW: Single Source of Truth
      setSampleDataMode,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addValuation,
      updateValuation,
      deleteValuation,
      updateSettings,
      updateCashBalance,
      addCash,
      addCashWithType,
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
