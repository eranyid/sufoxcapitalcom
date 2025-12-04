import { ALL_FACTORS } from '@/data/factors';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FactorCorrelationHeatmapProps {
  correlationMatrix: number[][];
}

export function FactorCorrelationHeatmap({ correlationMatrix }: FactorCorrelationHeatmapProps) {
  const factors = ALL_FACTORS;
  
  if (correlationMatrix.length === 0) {
    return (
      <div className="bloomberg-panel p-4 text-center text-muted-foreground text-xs">
        Insufficient data for correlation matrix
      </div>
    );
  }

  const getCorrelationColor = (value: number): string => {
    // Blue (negative) to white (neutral) to red (positive)
    if (value >= 0.7) return 'bg-destructive/90';
    if (value >= 0.5) return 'bg-destructive/60';
    if (value >= 0.3) return 'bg-destructive/40';
    if (value >= 0.1) return 'bg-destructive/20';
    if (value > -0.1) return 'bg-muted/40';
    if (value > -0.3) return 'bg-info/20';
    if (value > -0.5) return 'bg-info/40';
    if (value > -0.7) return 'bg-info/60';
    return 'bg-info/90';
  };

  const getTextColor = (value: number): string => {
    if (Math.abs(value) >= 0.5) return 'text-white';
    return 'text-foreground';
  };

  // Show abbreviated labels
  const getShortLabel = (label: string): string => {
    if (label.length > 6) {
      return label.substring(0, 5) + '.';
    }
    return label;
  };

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header">
        <span className="bloomberg-header-title">Factor Correlation Matrix</span>
      </div>
      <div className="p-3 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="p-1 text-[8px] text-muted-foreground font-medium"></th>
              {factors.map((f, i) => (
                <th 
                  key={f.key} 
                  className="p-1 text-[8px] text-muted-foreground font-medium text-center"
                  style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '60px' }}
                >
                  {getShortLabel(f.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factors.map((rowFactor, i) => (
              <tr key={rowFactor.key}>
                <td className="p-1 text-[8px] text-muted-foreground font-medium whitespace-nowrap pr-2">
                  {getShortLabel(rowFactor.label)}
                </td>
                {factors.map((colFactor, j) => {
                  const value = correlationMatrix[i]?.[j] ?? 0;
                  return (
                    <td key={colFactor.key} className="p-0.5">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`w-7 h-7 flex items-center justify-center font-mono text-[8px] ${getCorrelationColor(value)} ${getTextColor(value)} cursor-default`}
                            >
                              {i === j ? '1.00' : value.toFixed(2)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-[10px]">
                              <div className="font-semibold">{rowFactor.label} × {colFactor.label}</div>
                              <div className="font-mono">ρ = {value.toFixed(3)}</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Color scale legend */}
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border">
          <span className="text-[9px] text-muted-foreground">-1.0</span>
          <div className="flex">
            <div className="w-4 h-3 bg-info/90" />
            <div className="w-4 h-3 bg-info/60" />
            <div className="w-4 h-3 bg-info/40" />
            <div className="w-4 h-3 bg-info/20" />
            <div className="w-4 h-3 bg-muted/40" />
            <div className="w-4 h-3 bg-destructive/20" />
            <div className="w-4 h-3 bg-destructive/40" />
            <div className="w-4 h-3 bg-destructive/60" />
            <div className="w-4 h-3 bg-destructive/90" />
          </div>
          <span className="text-[9px] text-muted-foreground">+1.0</span>
        </div>
      </div>
    </div>
  );
}
