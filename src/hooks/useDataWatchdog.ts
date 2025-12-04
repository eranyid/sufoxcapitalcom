import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { validatePortfolioData, DataValidationResult, runLightweightMonteCarlo } from '@/lib/dataValidation';
import { useToast } from '@/hooks/use-toast';

type WatchdogState = {
  lastRunMorning?: string; // "YYYY-MM-DD"
  lastRunEvening?: string; // "YYYY-MM-DD"
};

const MORNING_HOUR = 7;
const EVENING_HOUR = 19;
const MC_SIMULATIONS = 1000;
const MC_HORIZON_YEARS = 5;

export function useDataWatchdog() {
  const { transactions, valuations, settings, cashBalances, performanceMetrics, riskMetrics, loading } = usePortfolio();
  const { toast } = useToast();
  
  const [validationResult, setValidationResult] = useState<DataValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const watchdogState = useRef<WatchdogState>({});
  const hasRunInitial = useRef(false);

  // Calculate current portfolio value for MC simulation
  const currentPortfolioValue = useMemo(() => {
    const positions: Record<string, number> = {};
    transactions.forEach(tx => {
      if (!positions[tx.ticker]) positions[tx.ticker] = 0;
      positions[tx.ticker] += tx.transactionType === 'buy' ? tx.quantity : -tx.quantity;
    });

    const latestPrices: Record<string, number> = {};
    valuations.forEach(v => {
      if (!latestPrices[v.ticker]) latestPrices[v.ticker] = v.pricePerUnit;
    });

    let total = 0;
    Object.entries(positions).forEach(([ticker, qty]) => {
      if (qty > 0 && latestPrices[ticker]) {
        total += qty * latestPrices[ticker];
      }
    });
    return total;
  }, [transactions, valuations]);

  // Extract monthly returns from performance metrics
  const monthlyReturns = useMemo(() => {
    return performanceMetrics?.monthlyReturns.map(r => r.return) || [];
  }, [performanceMetrics]);

  const runValidation = useCallback((isScheduled = false) => {
    if (loading) return;
    
    setIsValidating(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      // Run lightweight Monte Carlo if we have enough data
      const monteCarloInput = runLightweightMonteCarlo(
        monthlyReturns,
        currentPortfolioValue,
        MC_SIMULATIONS,
        MC_HORIZON_YEARS
      );

      const result = validatePortfolioData({
        transactions,
        valuations,
        settings,
        cashBalances,
        performanceMetrics,
        riskMetrics,
        monteCarloInput
      });
      
      setValidationResult(result);
      setIsValidating(false);

      // Show toast notification for scheduled runs with errors
      if (isScheduled) {
        const errorCount = result.issues.filter(i => i.severity === 'error').length;
        const warningCount = result.issues.filter(i => i.severity === 'warning').length;

        if (errorCount > 0) {
          toast({
            variant: "destructive",
            title: "Data Watchdog found issues",
            description: `${errorCount} error(s) detected in your portfolio. Click to review.`,
          });
        } else if (warningCount > 0) {
          toast({
            title: "Data Watchdog warnings",
            description: `${warningCount} warning(s) detected. Click to review.`,
          });
        }
      }
    }, 100);
  }, [transactions, valuations, settings, cashBalances, performanceMetrics, riskMetrics, loading, toast, monthlyReturns, currentPortfolioValue]);

  // Run validation on initial load
  useEffect(() => {
    if (!loading && !hasRunInitial.current && transactions.length > 0) {
      hasRunInitial.current = true;
      runValidation(false);
    }
  }, [loading, transactions.length, runValidation]);

  // Scheduler: check every minute for 07:00 and 19:00
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check morning slot (07:00)
      if (currentHour === MORNING_HOUR && currentMinute === 0) {
        if (watchdogState.current.lastRunMorning !== today) {
          watchdogState.current.lastRunMorning = today;
          runValidation(true);
        }
      }

      // Check evening slot (19:00)
      if (currentHour === EVENING_HOUR && currentMinute === 0) {
        if (watchdogState.current.lastRunEvening !== today) {
          watchdogState.current.lastRunEvening = today;
          runValidation(true);
        }
      }
    };

    // Check immediately
    checkSchedule();

    // Set up interval to check every minute
    const interval = setInterval(checkSchedule, 60000);

    return () => clearInterval(interval);
  }, [runValidation]);

  // Compute status
  const status: 'ok' | 'warning' | 'error' = validationResult
    ? validationResult.issues.some(i => i.severity === 'error')
      ? 'error'
      : validationResult.issues.some(i => i.severity === 'warning')
        ? 'warning'
        : 'ok'
    : 'ok';

  const errorCount = validationResult?.issues.filter(i => i.severity === 'error').length || 0;
  const warningCount = validationResult?.issues.filter(i => i.severity === 'warning').length || 0;
  const infoCount = validationResult?.issues.filter(i => i.severity === 'info').length || 0;

  return {
    validationResult,
    isValidating,
    runValidation: () => runValidation(false),
    status,
    errorCount,
    warningCount,
    infoCount
  };
}
