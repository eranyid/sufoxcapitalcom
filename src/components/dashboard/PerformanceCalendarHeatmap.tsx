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
    <Card variant="panel" size="md">
      <CardHeader className="pb-2">
        <CardTitle>Monthly Returns Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left font-mono text-muted-foreground p-1 w-12">Year</th>
                  {MONTHS.map(month => (
                    <th key={month} className="text-center font-mono text-muted-foreground p-1 w-10">
                      {month}
                    </th>
                  ))}
                  <th className="text-right font-mono text-muted-foreground p-1 w-14">YTD</th>
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
                    <tr key={year}>
                      <td className="font-mono text-primary p-1">{year}</td>
                      {MONTHS.map((monthName, idx) => {
                        const monthKey = `${year}-${String(idx + 1).padStart(2, '0')}`;
                        const ret = dataByYearMonth.get(monthKey);
                        
                        return (
                          <td key={monthKey} className="p-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    'w-full h-6 flex items-center justify-center font-mono text-[10px] cursor-default transition-colors',
                                    getReturnColor(ret),
                                    ret !== undefined && 'hover:ring-1 hover:ring-primary'
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
                      <td className="p-0.5">
                        <div
                          className={cn(
                            'w-full h-6 flex items-center justify-center font-mono text-[10px] font-medium',
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
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-destructive" />
              <span className="text-[10px] text-muted-foreground font-mono">&lt;-5%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-destructive/60" />
              <span className="text-[10px] text-muted-foreground font-mono">-2% to -5%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-muted/30" />
              <span className="text-[10px] text-muted-foreground font-mono">~0%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-success/60" />
              <span className="text-[10px] text-muted-foreground font-mono">+2% to +5%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-success" />
              <span className="text-[10px] text-muted-foreground font-mono">&gt;+5%</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
