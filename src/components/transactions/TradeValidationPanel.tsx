/**
 * TRADE VALIDATION PANEL
 * Real-time validation display showing cash impact, FX rates, and errors/warnings
 */

import { useMemo } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, TrendingDown, TrendingUp, Banknote, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CashBalances } from '@/types/investment';
import { validateTradeSync, TradeValidationResult } from '@/lib/transactionValidator';
import { getDefaultFxRate } from '@/lib/fxService';

interface TradeValidationPanelProps {
  userId: string;
  ticker: string;
  transactionType: 'buy' | 'sell';
  quantity: number;
  pricePerUnit: number;
  fees: number;
  assetCurrency: string;
  baseCurrency: string;
  cashBalances: CashBalances;
  existingHoldings: Map<string, number>;
  className?: string;
}

export function TradeValidationPanel({
  userId,
  ticker,
  transactionType,
  quantity,
  pricePerUnit,
  fees,
  assetCurrency,
  baseCurrency,
  cashBalances,
  existingHoldings,
  className
}: TradeValidationPanelProps) {
  // Skip validation if inputs are incomplete
  const hasRequiredInputs = ticker && quantity > 0 && pricePerUnit > 0;

  const validation: TradeValidationResult | null = useMemo(() => {
    if (!hasRequiredInputs) return null;

    return validateTradeSync({
      userId,
      ticker,
      transactionType,
      quantity,
      pricePerUnit,
      fees: fees || 0,
      assetCurrency,
      baseCurrency,
      cashBalances,
      existingHoldings
    });
  }, [userId, ticker, transactionType, quantity, pricePerUnit, fees, assetCurrency, baseCurrency, cashBalances, existingHoldings, hasRequiredInputs]);

  if (!hasRequiredInputs) {
    return null;
  }

  if (!validation) return null;

  const { isValid, errors, warnings, calculatedValues } = validation;
  const isBuy = transactionType === 'buy';

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', ILS: '₪', GBP: '£', CHF: 'CHF ', JPY: '¥'
    };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className={cn(
      "rounded-lg border p-3 space-y-3 text-sm",
      isValid 
        ? "border-success/30 bg-success/5" 
        : "border-destructive/30 bg-destructive/5",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2">
        {isValid ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive" />
        )}
        <span className={cn("font-medium", isValid ? "text-success" : "text-destructive")}>
          {isValid ? "Trade Valid" : "Validation Failed"}
        </span>
      </div>

      {/* Trade Summary */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="text-muted-foreground">Cost (Local)</div>
          <div className="font-mono font-medium">
            {formatCurrency(calculatedValues.costLocal, assetCurrency)}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Cost (Base)</div>
          <div className="font-mono font-medium">
            {formatCurrency(calculatedValues.costBase, baseCurrency)}
          </div>
        </div>
      </div>

      {/* FX Rate */}
      {assetCurrency !== baseCurrency && (
        <div className="flex items-center gap-2 text-xs bg-muted/50 rounded px-2 py-1.5">
          <ArrowRightLeft className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">FX Rate:</span>
          <span className="font-mono">
            1 {assetCurrency} = {calculatedValues.fxRate.toFixed(4)} {baseCurrency}
          </span>
        </div>
      )}

      {/* Cash Impact */}
      <div className={cn(
        "flex items-center justify-between rounded px-2 py-1.5",
        isBuy ? "bg-destructive/10" : "bg-success/10"
      )}>
        <div className="flex items-center gap-2">
          {isBuy ? (
            <TrendingDown className="h-3.5 w-3.5 text-destructive" />
          ) : (
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          )}
          <span className="text-xs text-muted-foreground">Cash Impact:</span>
        </div>
        <span className={cn(
          "font-mono font-medium text-xs",
          isBuy ? "text-destructive" : "text-success"
        )}>
          {isBuy ? "-" : "+"}{formatCurrency(calculatedValues.totalCostWithFees, calculatedValues.cashImpactCurrency)}
        </span>
      </div>

      {/* Available Cash */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Available ({calculatedValues.cashImpactCurrency}):</span>
        </div>
        <span className={cn(
          "font-mono font-medium",
          isBuy && calculatedValues.availableCash < calculatedValues.totalCostWithFees
            ? "text-destructive"
            : "text-foreground"
        )}>
          {formatCurrency(calculatedValues.availableCash, calculatedValues.cashImpactCurrency)}
        </span>
      </div>

      {/* Position Change */}
      <div className="flex items-center justify-between text-xs border-t border-border pt-2">
        <span className="text-muted-foreground">Position After Trade:</span>
        <div className="font-mono">
          <span className="text-muted-foreground">{calculatedValues.currentHolding.toLocaleString()}</span>
          <span className="mx-1">→</span>
          <span className={cn(
            "font-medium",
            calculatedValues.newHolding < 0 ? "text-destructive" : "text-foreground"
          )}>
            {calculatedValues.newHolding.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-destructive">
              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && isValid && (
        <div className="space-y-1">
          {warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-500">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
