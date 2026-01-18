import React from 'react';
import { 
  Table as TableIcon, 
  LineChart as LineChartIcon,
  Grid3X3,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineResult, OutputConfig } from '@/types/analyticsLab';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

interface LabResultPanelProps {
  result: PipelineResult | null;
  isRunning: boolean;
}

export function LabResultPanel({ result, isRunning }: LabResultPanelProps) {
  const handleExport = () => {
    if (!result?.data) return;
    
    const jsonStr = JSON.stringify(result.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-result-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTable = () => {
    if (!result?.data) return null;
    
    // Handle different data structures
    if (result.data.correlation !== undefined) {
      // Correlation pair result
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Metric</TableHead>
              <TableHead className="text-xs text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-xs font-medium">Asset 1</TableCell>
              <TableCell className="text-xs text-right font-mono">{result.data.asset1}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-xs font-medium">Asset 2</TableCell>
              <TableCell className="text-xs text-right font-mono">{result.data.asset2}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-xs font-medium">Correlation</TableCell>
              <TableCell className={cn(
                "text-xs text-right font-mono font-semibold",
                result.data.correlation > 0.5 ? "text-green-500" : 
                result.data.correlation < -0.5 ? "text-red-500" : "text-muted-foreground"
              )}>
                {result.data.correlation.toFixed(4)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="text-xs font-medium">Data Points</TableCell>
              <TableCell className="text-xs text-right font-mono">{result.data.dataPoints}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
    }
    
    // Price at month end or generic object
    const entries = Object.entries(result.data);
    if (entries.length === 0) return <p className="text-xs text-muted-foreground">No data</p>;
    
    // Check if it's price data
    const firstValue = entries[0][1] as any;
    if (firstValue?.price !== undefined) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Asset</TableHead>
              <TableHead className="text-xs text-right">Price</TableHead>
              <TableHead className="text-xs text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([asset, data]: [string, any]) => (
              <TableRow key={asset}>
                <TableCell className="text-xs font-medium">{asset}</TableCell>
                <TableCell className="text-xs text-right font-mono">
                  ${data.price.toFixed(2)}
                </TableCell>
                <TableCell className="text-xs text-right text-muted-foreground">
                  {data.date}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    
    // Return data
    if (firstValue?.return !== undefined) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Asset</TableHead>
              <TableHead className="text-xs text-right">Return</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([asset, data]: [string, any]) => (
              <TableRow key={asset}>
                <TableCell className="text-xs font-medium">{asset}</TableCell>
                <TableCell className={cn(
                  "text-xs text-right font-mono",
                  data.return > 0 ? "text-green-500" : "text-red-500"
                )}>
                  {(data.return * 100).toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    
    // Portfolio/Holdings data (currentPrice, marketValue, etc.)
    if (firstValue?.currentPrice !== undefined || firstValue?.marketValue !== undefined) {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Ticker</TableHead>
              <TableHead className="text-xs text-right">Price</TableHead>
              <TableHead className="text-xs text-right">Qty</TableHead>
              <TableHead className="text-xs text-right">Market Value</TableHead>
              <TableHead className="text-xs text-right">Total Return</TableHead>
              <TableHead className="text-xs text-right">Return %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([ticker, data]: [string, any]) => {
              const hasPosition = data.quantity > 0 || data.marketValue > 0;
              return (
                <TableRow key={ticker} className={!hasPosition ? "opacity-50" : ""}>
                  <TableCell className="text-xs font-medium">{ticker}</TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    ${(data.currentPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {(data.quantity || 0).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    ${(data.marketValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className={cn(
                    "text-xs text-right font-mono",
                    (data.totalReturn || 0) > 0 ? "text-green-500" : (data.totalReturn || 0) < 0 ? "text-red-500" : ""
                  )}>
                    ${(data.totalReturn || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className={cn(
                    "text-xs text-right font-mono",
                    (data.returnPct || 0) > 0 ? "text-green-500" : (data.returnPct || 0) < 0 ? "text-red-500" : ""
                  )}>
                    {((data.returnPct || 0) * 100).toFixed(2)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    }
    
    // Generic object with nested properties - render as a structured table
    if (typeof firstValue === 'object' && firstValue !== null) {
      // Get all unique keys from all entries
      const allKeys = new Set<string>();
      entries.forEach(([_, data]) => {
        if (typeof data === 'object' && data !== null) {
          Object.keys(data).forEach(key => allKeys.add(key));
        }
      });
      const columns = Array.from(allKeys);
      
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Key</TableHead>
              {columns.map(col => (
                <TableHead key={col} className="text-xs text-right capitalize">
                  {col.replace(/([A-Z])/g, ' $1').trim()}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(([key, data]: [string, any]) => (
              <TableRow key={key}>
                <TableCell className="text-xs font-medium">{key}</TableCell>
                {columns.map(col => {
                  const value = data?.[col];
                  const displayValue = formatCellValue(value);
                  const isNumeric = typeof value === 'number';
                  const isPositive = isNumeric && value > 0;
                  const isNegative = isNumeric && value < 0;
                  
                  return (
                    <TableCell 
                      key={col} 
                      className={cn(
                        "text-xs text-right font-mono",
                        isPositive && "text-green-500",
                        isNegative && "text-red-500"
                      )}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      );
    }
    
    // Simple key-value pairs
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Key</TableHead>
            <TableHead className="text-xs text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(([key, value]) => (
            <TableRow key={key}>
              <TableCell className="text-xs font-medium">{key}</TableCell>
              <TableCell className="text-xs text-right font-mono">
                {formatCellValue(value)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };
  
  // Helper function to format cell values
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      if (Number.isInteger(value)) return value.toLocaleString();
      return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderLineChart = () => {
    if (!result?.chartData || !Array.isArray(result.chartData)) return null;
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={result.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => format(new Date(value), 'MMM d')}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              domain={[-1, 1]}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
              formatter={(value: number) => [value.toFixed(4), 'Correlation']}
            />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderHeatmap = () => {
    if (!result?.chartData?.matrix || !result?.chartData?.labels) return null;
    
    const { labels, matrix } = result.chartData;
    
    return (
      <div className="overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-1.5"></th>
              {labels.map((label: string) => (
                <th key={label} className="p-1.5 text-muted-foreground font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row: number[], i: number) => (
              <tr key={labels[i]}>
                <td className="p-1.5 font-medium text-muted-foreground">{labels[i]}</td>
                {row.map((value: number, j: number) => {
                  const intensity = Math.abs(value);
                  const isPositive = value >= 0;
                  return (
                    <td 
                      key={j} 
                      className="p-1.5 text-center font-mono"
                      style={{
                        backgroundColor: i === j 
                          ? 'hsl(var(--muted))' 
                          : isPositive 
                            ? `rgba(74, 222, 128, ${intensity * 0.5})`
                            : `rgba(248, 113, 113, ${intensity * 0.5})`,
                      }}
                    >
                      {value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;
    
    switch (result.outputType) {
      case 'line_chart':
        return renderLineChart();
      case 'heatmap':
        return renderHeatmap();
      case 'table':
      default:
        return renderTable();
    }
  };

  return (
    <div className="border-t border-[hsl(var(--lab-accent)/0.3)] bg-gradient-to-b from-[hsl(var(--lab-accent)/0.08)] to-card/50">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[hsl(var(--lab-accent)/0.2)] flex items-center justify-between bg-[hsl(var(--lab-accent)/0.05)]">
        <div className="flex items-center gap-2">
          {isRunning ? (
            <Clock className="h-4 w-4 text-[hsl(var(--lab-accent))] animate-pulse" />
          ) : result?.success ? (
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--lab-accent))]" />
          ) : result ? (
            <XCircle className="h-4 w-4 text-red-500" />
          ) : (
            <TableIcon className="h-4 w-4 text-[hsl(var(--lab-accent)/0.6)]" />
          )}
          <span className={cn(
            "text-xs font-medium",
            result?.success ? "text-[hsl(var(--lab-accent))]" : ""
          )}>
            {isRunning 
              ? 'Running...' 
              : result?.success 
                ? `Result • ${format(new Date(result.executedAt), 'HH:mm:ss')}`
                : result 
                  ? 'Error'
                  : 'No result yet'
            }
          </span>
        </div>
        
        {result?.success && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleExport}
            className="h-7 text-xs text-[hsl(var(--lab-accent))] hover:text-[hsl(var(--lab-accent))] hover:bg-[hsl(var(--lab-accent)/0.1)]"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export
          </Button>
        )}
      </div>
      
      {/* Result Content */}
      <ScrollArea className="max-h-80">
        <div className="p-4">
          {isRunning ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-[hsl(var(--lab-accent))] border-t-transparent rounded-full" />
            </div>
          ) : result?.error ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <p className="text-xs text-destructive">{result.error}</p>
            </div>
          ) : result ? (
            <div className="[&_th]:text-[hsl(var(--lab-accent))] [&_th]:border-[hsl(var(--lab-accent)/0.2)]">
              {renderResult()}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">
                Click "Run" to execute the pipeline
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
