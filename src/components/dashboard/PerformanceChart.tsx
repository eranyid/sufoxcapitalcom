import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CalendarIcon } from 'lucide-react';
import { format, parse, isAfter, isBefore, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PerformanceChartProps {
  data: { month: string; return: number }[];
  title?: string;
  dataKey?: string;
  color?: string;
  showCumulative?: boolean;
  cumulativeData?: { month: string; return: number }[];
}

type RangePreset = 'all' | 'ytd' | '1y' | '2y' | '3y' | 'custom';

export function PerformanceChart({ 
  data, 
  title = "Performance", 
  dataKey = "return",
  color = "hsl(var(--chart-blue))",
  showCumulative = false,
  cumulativeData
}: PerformanceChartProps) {
  const [rangePreset, setRangePreset] = useState<RangePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Parse month string to Date
  const parseMonth = (monthStr: string): Date | null => {
    try {
      // Expected format: YYYY-MM
      const date = parse(monthStr, 'yyyy-MM', new Date());
      return isValid(date) ? date : null;
    } catch {
      return null;
    }
  };

  // Filter data based on selected range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    switch (rangePreset) {
      case 'all':
        return data;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case '1y':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1);
        break;
      case '2y':
        startDate = new Date(now.getFullYear() - 2, now.getMonth(), 1);
        break;
      case '3y':
        startDate = new Date(now.getFullYear() - 3, now.getMonth(), 1);
        break;
      case 'custom':
        startDate = customStartDate || null;
        endDate = customEndDate || null;
        break;
    }

    return data.filter(item => {
      const itemDate = parseMonth(item.month);
      if (!itemDate) return false;
      
      if (startDate && isBefore(itemDate, startDate)) return false;
      if (endDate && isAfter(itemDate, endDate)) return false;
      
      return true;
    });
  }, [data, rangePreset, customStartDate, customEndDate]);

  // Filter cumulative data to match
  const filteredCumulativeData = useMemo(() => {
    if (!cumulativeData || !showCumulative) return undefined;
    
    const filteredMonths = new Set(filteredData.map(d => d.month));
    return cumulativeData.filter(d => filteredMonths.has(d.month));
  }, [cumulativeData, showCumulative, filteredData]);

  const chartData = showCumulative && filteredCumulativeData 
    ? filteredData.map((d, i) => ({
        ...d,
        cumulative: filteredCumulativeData[i]?.return || 0
      }))
    : filteredData;

  return (
    <div className="bloomberg-panel">
      <div className="bloomberg-header flex items-center justify-between">
        <span className="bloomberg-header-title">{title}</span>
        
        {/* Range selector */}
        <div className="flex items-center gap-2">
          <Select value={rangePreset} onValueChange={(v) => setRangePreset(v as RangePreset)}>
            <SelectTrigger className="h-6 w-[90px] text-[10px] bg-muted/30 border-border/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Time</SelectItem>
              <SelectItem value="ytd" className="text-xs">YTD</SelectItem>
              <SelectItem value="1y" className="text-xs">1 Year</SelectItem>
              <SelectItem value="2y" className="text-xs">2 Years</SelectItem>
              <SelectItem value="3y" className="text-xs">3 Years</SelectItem>
              <SelectItem value="custom" className="text-xs">Custom</SelectItem>
            </SelectContent>
          </Select>

          {rangePreset === 'custom' && (
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-6 px-2 text-[10px] bg-muted/30 border-border/50",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {customStartDate ? format(customStartDate, "MMM yy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-[10px] text-muted-foreground">–</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-6 px-2 text-[10px] bg-muted/30 border-border/50",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {customEndDate ? format(customEndDate, "MMM yy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        <div className="h-[240px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 15, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="1 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => v.slice(5)}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  width={35}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono'
                  }}
                  labelStyle={{ color: 'hsl(var(--primary))' }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => <span className="text-muted-foreground">{value}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke="hsl(var(--chart-blue))"
                  strokeWidth={1.5}
                  dot={false}
                  name="Monthly"
                />
                {showCumulative && (
                  <Line 
                    type="monotone" 
                    dataKey="cumulative" 
                    stroke="hsl(var(--chart-gold))"
                    strokeWidth={1.5}
                    dot={false}
                    name="Cumulative"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              No data for selected range
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
