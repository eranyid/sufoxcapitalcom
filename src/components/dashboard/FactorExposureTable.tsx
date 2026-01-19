import { FactorExposure } from '@/lib/factorModel';
import { getFactorByKey } from '@/data/factors';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, BarChart2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface FactorExposureTableProps {
  exposures: FactorExposure[];
}

export function FactorExposureTable({ exposures }: FactorExposureTableProps) {
  const getBetaColor = (beta: number): string => {
    if (Math.abs(beta) < 0.1) return 'text-muted-foreground';
    if (beta > 0.5) return 'text-success';
    if (beta < -0.5) return 'text-destructive';
    if (beta > 0) return 'text-success/70';
    return 'text-destructive/70';
  };

  const getSignificance = (pValue: number): string => {
    if (pValue < 0.01) return '***';
    if (pValue < 0.05) return '**';
    if (pValue < 0.1) return '*';
    return '';
  };

  const styleFactors = exposures.filter(e => e.factorType === 'style');
  const macroFactors = exposures.filter(e => e.factorType === 'macro');

  const renderTable = (factors: FactorExposure[], title: string) => (
    <div className="mb-4">
      <h4 className="text-primary text-[10px] uppercase tracking-wider font-semibold mb-2 px-2">
        {title}
      </h4>
      <table className="data-table">
        <thead>
          <tr>
            <th>Factor</th>
            <th className="text-right">Beta (β)</th>
            <th className="text-right">t-Stat</th>
            <th className="text-right">R²</th>
            <th className="text-center">Sig</th>
          </tr>
        </thead>
        <tbody>
          {factors.map((exp) => {
            const factor = getFactorByKey(exp.factor);
            return (
              <tr key={exp.factor}>
                <td className="flex items-center gap-1">
                  <span>{exp.factorLabel}</span>
                  {factor && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px]">
                          <p className="text-[10px]">{factor.description}</p>
                          <p className="text-[9px] text-muted-foreground mt-1">
                            Source: {factor.source}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </td>
                <td className={`text-right font-mono ${getBetaColor(exp.beta)}`}>
                  {exp.beta >= 0 ? '+' : ''}{exp.beta.toFixed(3)}
                </td>
                <td className="text-right font-mono text-muted-foreground">
                  {exp.tStat.toFixed(2)}
                </td>
                <td className="text-right font-mono">
                  {(exp.r2 * 100).toFixed(1)}%
                </td>
                <td className="text-center text-primary font-bold">
                  {getSignificance(exp.pValue)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const hasNoData = styleFactors.length === 0 && macroFactors.length === 0;

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">Factor Exposures</span>
        {!hasNoData && (
          <span className="text-[9px] text-muted-foreground ml-auto">
            *** p&lt;0.01 | ** p&lt;0.05 | * p&lt;0.10
          </span>
        )}
      </div>
      <div className="p-3">
        {hasNoData ? (
          <EmptyState 
            icon={BarChart2}
            title="No Factor Data"
            description="Factor exposures require sufficient historical data to calculate"
          />
        ) : (
          <>
            {styleFactors.length > 0 && renderTable(styleFactors, 'Style Factors')}
            {macroFactors.length > 0 && renderTable(macroFactors, 'Macro Factors')}
            
            <div className="mt-3 pt-3 border-t border-border text-[9px] text-muted-foreground">
              <p>
                <strong>β (Beta):</strong> Sensitivity of portfolio returns to factor returns. 
                β = 1.0 means 1:1 exposure; β = 0.5 means half the factor's impact.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}