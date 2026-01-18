import React from 'react';
import { 
  Table as TableIcon, 
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineResult } from '@/types/analyticsLab';
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
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface LabResultPanelProps {
  result: PipelineResult | null;
  isRunning: boolean;
}

// Color palette for charts
const CHART_COLORS = [
  'hsl(var(--lab-accent))',
  'hsl(var(--primary))',
  'hsl(142, 71%, 45%)',
  'hsl(262, 83%, 58%)',
  'hsl(340, 82%, 52%)',
  'hsl(43, 96%, 56%)',
  'hsl(199, 89%, 48%)',
  'hsl(280, 65%, 60%)',
];

const PIE_COLORS = [
  '#f97316', '#22c55e', '#3b82f6', '#a855f7', 
  '#ec4899', '#eab308', '#06b6d4', '#6366f1',
];

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

  // Prepare data for different chart types
  const prepareChartData = () => {
    if (!result?.data) return [];
    
    // If chartData is already provided
    if (result.chartData && Array.isArray(result.chartData)) {
      return result.chartData;
    }
    
    // Convert object data to array format
    const entries = Object.entries(result.data);
    return entries.map(([key, value]: [string, any]) => {
      if (typeof value === 'object' && value !== null) {
        return { name: key, ...value };
      }
      return { name: key, value: typeof value === 'number' ? value : 0 };
    });
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
    
    // Generic table rendering
    const entries = Object.entries(result.data);
    if (entries.length === 0) return <p className="text-xs text-muted-foreground">No data</p>;
    
    const firstValue = entries[0][1] as any;
    
    // Check if it's nested object data
    if (typeof firstValue === 'object' && firstValue !== null) {
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
                      {formatCellValue(value)}
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

  const renderLineChart = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    // Determine value keys (exclude 'name' and 'date')
    const valueKeys = data[0] ? Object.keys(data[0]).filter(k => k !== 'name' && k !== 'date') : ['value'];
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={data[0]?.date ? 'date' : 'name'}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => data[0]?.date ? format(new Date(value), 'MMM d') : value}
            />
            <YAxis 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => typeof value === 'number' ? value.toFixed(2) : value}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
            {valueKeys.map((key, i) => (
              <Line 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderAreaChart = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    const valueKeys = data[0] ? Object.keys(data[0]).filter(k => k !== 'name' && k !== 'date') : ['value'];
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey={data[0]?.date ? 'date' : 'name'}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
            {valueKeys.map((key, i) => (
              <Area 
                key={key}
                type="monotone" 
                dataKey={key} 
                stroke={CHART_COLORS[i % CHART_COLORS.length]} 
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBarChart = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    const valueKeys = data[0] ? Object.keys(data[0]).filter(k => k !== 'name' && k !== 'date') : ['value'];
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
            {valueKeys.map((key, i) => (
              <Bar 
                key={key}
                dataKey={key} 
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderStackedBar = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    const valueKeys = data[0] ? Object.keys(data[0]).filter(k => k !== 'name' && k !== 'date') : ['value'];
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
            {valueKeys.map((key, i) => (
              <Bar 
                key={key}
                dataKey={key} 
                stackId="a"
                fill={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPieChart = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    // Get numeric value
    const valueKey = Object.keys(data[0] || {}).find(k => k !== 'name' && typeof data[0][k] === 'number') || 'value';
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderDonutChart = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    const valueKey = Object.keys(data[0] || {}).find(k => k !== 'name' && typeof data[0][k] === 'number') || 'value';
    const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
    
    return (
      <div className="h-64 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey={valueKey}
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{total.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
        </div>
      </div>
    );
  };

  const renderTreemap = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    const valueKey = Object.keys(data[0] || {}).find(k => k !== 'name' && typeof data[0][k] === 'number') || 'value';
    const treemapData = data.map((item, i) => ({
      ...item,
      fill: PIE_COLORS[i % PIE_COLORS.length],
    }));
    
    const CustomTreemapContent = (props: any) => {
      const { x, y, width, height, name, value, fill } = props;
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            style={{
              fill,
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
              opacity: 0.9,
            }}
          />
          {width > 50 && height > 30 && (
            <>
              <text
                x={x + width / 2}
                y={y + height / 2 - 6}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight="bold"
              >
                {name}
              </text>
              <text
                x={x + width / 2}
                y={y + height / 2 + 10}
                textAnchor="middle"
                fill="white"
                fontSize={10}
                opacity={0.8}
              >
                {typeof value === 'number' ? value.toFixed(2) : value}
              </text>
            </>
          )}
        </g>
      );
    };
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey={valueKey}
            aspectRatio={4 / 3}
            stroke="hsl(var(--border))"
            content={<CustomTreemapContent />}
          />
        </ResponsiveContainer>
      </div>
    );
  };

  const renderRadarChart = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    const valueKey = Object.keys(data[0] || {}).find(k => k !== 'name' && typeof data[0][k] === 'number') || 'value';
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <PolarRadiusAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
            <Radar
              dataKey={valueKey}
              stroke="hsl(var(--lab-accent))"
              fill="hsl(var(--lab-accent))"
              fillOpacity={0.3}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
          </RadarChart>
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

  const renderScatter = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="x" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis type="number" dataKey="y" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Scatter data={data} fill="hsl(var(--lab-accent))" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderHistogram = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--lab-accent))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderWaterfall = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    // Add running total for waterfall effect
    let runningTotal = 0;
    const waterfallData = data.map((item, i) => {
      const value = item.value || 0;
      const start = runningTotal;
      runningTotal += value;
      return {
        ...item,
        start,
        end: runningTotal,
        value,
        fill: value >= 0 ? '#22c55e' : '#ef4444',
      };
    });
    
    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={waterfallData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="start" stackId="a" fill="transparent" />
            <Bar dataKey="value" stackId="a" radius={[2, 2, 0, 0]}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderGauge = () => {
    const data = prepareChartData();
    if (!data.length) return null;
    
    const value = data[0]?.value || 0;
    const percentage = Math.min(Math.max(value, 0), 100);
    
    return (
      <div className="h-48 flex flex-col items-center justify-center">
        <div className="relative w-40 h-20 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 50">
            {/* Background arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Value arc */}
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="hsl(var(--lab-accent))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${percentage * 1.26} 126`}
            />
          </svg>
        </div>
        <div className="text-center mt-2">
          <div className="text-2xl font-bold text-foreground">{value.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">{data[0]?.name || 'Value'}</div>
        </div>
      </div>
    );
  };

  const renderSparklineGrid = () => {
    const entries = Object.entries(result?.data || {});
    if (!entries.length) return null;
    
    return (
      <div className="grid grid-cols-2 gap-3">
        {entries.slice(0, 8).map(([key, value]: [string, any]) => {
          const chartData = Array.isArray(value?.history) 
            ? value.history 
            : [{ value: typeof value === 'number' ? value : 0 }];
          const currentValue = typeof value === 'number' ? value : value?.value || 0;
          const isPositive = currentValue >= 0;
          
          return (
            <div key={key} className="p-2 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{key}</span>
                <span className={cn(
                  "text-xs font-mono font-semibold",
                  isPositive ? "text-green-500" : "text-red-500"
                )}>
                  {isPositive ? <TrendingUp className="h-3 w-3 inline mr-0.5" /> : <TrendingDown className="h-3 w-3 inline mr-0.5" />}
                  {formatCellValue(currentValue)}
                </span>
              </div>
              <div className="h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke={isPositive ? '#22c55e' : '#ef4444'} 
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderKpiCards = () => {
    const entries = Object.entries(result?.data || {});
    if (!entries.length) return null;
    
    return (
      <div className="grid grid-cols-2 gap-3">
        {entries.slice(0, 6).map(([key, value]: [string, any]) => {
          const displayValue = typeof value === 'object' ? value?.value : value;
          const isPositive = typeof displayValue === 'number' && displayValue >= 0;
          const change = typeof value === 'object' ? value?.change : null;
          
          return (
            <div 
              key={key} 
              className="p-3 bg-gradient-to-br from-muted/50 to-muted/20 rounded-xl border border-border/50"
            >
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className={cn(
                "text-xl font-bold",
                typeof displayValue === 'number' && (isPositive ? "text-green-500" : "text-red-500")
              )}>
                {formatCellValue(displayValue)}
              </div>
              {change !== null && (
                <div className={cn(
                  "text-xs flex items-center gap-1 mt-1",
                  change >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(change).toFixed(2)}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSummaryCard = () => {
    if (!result?.data) return null;
    
    const entries = Object.entries(result.data).slice(0, 8);
    
    return (
      <div className="p-4 bg-gradient-to-br from-[hsl(var(--lab-accent)/0.1)] to-card rounded-xl border border-[hsl(var(--lab-accent)/0.3)]">
        <div className="grid grid-cols-2 gap-3">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
              <span className="text-xs text-muted-foreground">{key}</span>
              <span className="text-xs font-mono font-semibold text-foreground">
                {formatCellValue(value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    if (!result) return null;
    
    switch (result.outputType) {
      case 'line_chart':
        return renderLineChart();
      case 'area_chart':
        return renderAreaChart();
      case 'bar_chart':
        return renderBarChart();
      case 'stacked_bar':
        return renderStackedBar();
      case 'pie_chart':
        return renderPieChart();
      case 'donut_chart':
        return renderDonutChart();
      case 'treemap':
        return renderTreemap();
      case 'radar_chart':
        return renderRadarChart();
      case 'heatmap':
        return renderHeatmap();
      case 'scatter':
        return renderScatter();
      case 'histogram':
        return renderHistogram();
      case 'waterfall':
        return renderWaterfall();
      case 'gauge':
        return renderGauge();
      case 'sparkline_grid':
        return renderSparklineGrid();
      case 'kpi_cards':
        return renderKpiCards();
      case 'summary_card':
        return renderSummaryCard();
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