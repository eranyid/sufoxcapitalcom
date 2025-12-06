import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MonthlyReturn {
  month: string;
  return: number;
  value?: number;
}

interface PerformanceCalendarHeatmapProps {
  data: MonthlyReturn[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function PerformanceCalendarHeatmap({ data }: PerformanceCalendarHeatmapProps) {
  // Group data by year and month
  const dataByYearMonth = new Map<string, number>();
  data.forEach(({ month, return: ret }) => {
    dataByYearMonth.set(month, ret);
  });

  // Get all years from data
  const years = [...new Set(data.map(d => d.month.split('-')[0]))].sort().reverse();

  // Get color based on return value
  const getReturnColor = (ret: number | undefined) => {
    if (ret === undefined) return 'bg-muted/30';
    
    const absRet = Math.abs(ret);
    
    if (ret >= 0) {
      // Green shades for positive
      if (absRet >= 10) return 'bg-success';
      if (absRet >= 5) return 'bg-success/80';
      if (absRet >= 2) return 'bg-success/60';
      if (absRet >= 0.5) return 'bg-success/40';
      return 'bg-success/20';
    } else {
      // Red shades for negative
      if (absRet >= 10) return 'bg-destructive';
      if (absRet >= 5) return 'bg-destructive/80';
      if (absRet >= 2) return 'bg-destructive/60';
      if (absRet >= 0.5) return 'bg-destructive/40';
      return 'bg-destructive/20';
    }
  };

  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <Card variant="panel" className="h-auto">
      <CardHeader className="pb-3">
        <CardTitle>Monthly Returns Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <TooltipProvider>
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left font-mono text-muted-foreground text-xs sm:text-sm p-2 min-w-[50px]">Year</th>
                  {MONTHS.map(month => (
                    <th key={month} className="text-center font-mono text-muted-foreground text-[10px] sm:text-xs p-1 sm:p-2 min-w-[45px] sm:min-w-[60px]">
                      {month}
                    </th>
                  ))}
                  <th className="text-right font-mono text-muted-foreground text-xs sm:text-sm p-2 min-w-[60px]">YTD</th>
                </tr>
              </thead>
              <tbody>
                {years.map(year => {
                  // Calculate YTD return for this year
                  const yearReturns = MONTHS.map((_, idx) => {
                    const monthKey = `${year}-${String(idx + 1).padStart(2, '0')}`;
                    return dataByYearMonth.get(monthKey);
                  }).filter((r): r is number => r !== undefined);
                  
                  const ytdReturn = yearReturns.length > 0 
                    ? (yearReturns.reduce((acc, r) => acc * (1 + r / 100), 1) - 1) * 100 
                    : undefined;

                  return (
                    <tr key={year} className="border-b border-border/30 last:border-b-0">
                      <td className="font-mono text-primary text-xs sm:text-sm p-2 font-medium">{year}</td>
                      {MONTHS.map((monthName, idx) => {
                        const monthKey = `${year}-${String(idx + 1).padStart(2, '0')}`;
                        const ret = dataByYearMonth.get(monthKey);
                        
                        return (
                          <td key={monthKey} className="p-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'w-full h-8 sm:h-10 flex items-center justify-center font-mono text-[9px] sm:text-xs cursor-default transition-colors',
                                    getReturnColor(ret),
                                    ret !== undefined && 'hover:ring-1 hover:ring-primary hover:brightness-110'
                                  )}
                                >
                                  {ret !== undefined ? formatPercent(ret) : '—'}
                                </div>
                              </TooltipTrigger>
                              {ret !== undefined && (
                                <TooltipContent className="font-mono text-xs">
                                  <p>{monthName} {year}: {formatPercent(ret)}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </td>
                        );
                      })}
                      <td className="p-1">
                        <div
                          className={cn(
                            'w-full h-8 sm:h-10 flex items-center justify-center font-mono text-[10px] sm:text-sm font-semibold',
                            ytdReturn !== undefined && (ytdReturn >= 0 ? 'text-success' : 'text-destructive')
                          )}
                        >
                          {ytdReturn !== undefined ? formatPercent(ytdReturn) : '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Legend - Compact */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-destructive" />
              <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">&lt;-5%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-destructive/60" />
              <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">-2~-5%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-muted/30" />
              <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">~0%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-success/60" />
              <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">+2~+5%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 sm:w-4 sm:h-4 bg-success" />
              <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">&gt;+5%</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
