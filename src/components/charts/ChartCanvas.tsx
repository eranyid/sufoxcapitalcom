import React, { useRef, useCallback } from 'react';
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
  Treemap,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Download, Image, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ChartBuilderState,
  ChartType,
} from '@/types/chartBuilder';
import {
  ChartResult,
  ChartDataPoint,
  CorrelationMatrixData,
  AllocationData,
  ContributionData,
} from '@/lib/chartCalculations';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ChartCanvasProps {
  result: ChartResult | null;
  state: ChartBuilderState;
  isCalculating: boolean;
}

// Color palette
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-gold))',
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

function getCorrelationColor(value: number): string {
  if (value >= 0.7) return 'bg-emerald-500';
  if (value >= 0.3) return 'bg-emerald-400/70';
  if (value >= -0.3) return 'bg-muted';
  if (value >= -0.7) return 'bg-red-400/70';
  return 'bg-red-500';
}

export function ChartCanvas({ result, state, isCalculating }: ChartCanvasProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Export as PNG
  const handleExportPNG = useCallback(async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
      });
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart-${state.metric}-${new Date().toISOString().split('T')[0]}.png`;
      a.click();
      
      toast.success('Chart exported as PNG');
    } catch (error) {
      toast.error('Failed to export chart');
    }
  }, [state.metric]);
  
  // Export as PDF
  const handleExportPDF = useCallback(async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`chart-${state.metric}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success('Chart exported as PDF');
    } catch (error) {
      toast.error('Failed to export chart');
    }
  }, [state.metric]);
  
  // Empty state
  if (!result && !isCalculating) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card/30 rounded-lg border border-border/50">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">Select Assets to Generate Chart</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Choose a metric and select assets from the builder panel to visualize your data
          </p>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isCalculating) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card/30 rounded-lg border border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Calculating...</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (result && !result.success) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card/30 rounded-lg border border-border/50">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-medium mb-2">Calculation Error</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{result.error}</p>
        </div>
      </div>
    );
  }
  
  // No data
  const isEmptyData = (data: any): boolean => {
    if (!data) return true;
    if (Array.isArray(data)) return data.length === 0;
    // For correlation matrix
    if (data.tickers && Array.isArray(data.tickers)) return data.tickers.length === 0;
    return false;
  };
  
  if (result && result.success && isEmptyData(result.data)) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card/30 rounded-lg border border-border/50">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Data Available</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Not enough data points for this analysis. Try selecting a longer date range or different assets.
          </p>
        </div>
      </div>
    );
  }
  
  // Render chart based on data type
  const renderChart = () => {
    if (!result) return null;
    
    switch (result.dataType) {
      case 'timeseries':
        return renderTimeSeriesChart(result.data as ChartDataPoint[], state.chartType);
      case 'matrix':
        return renderCorrelationMatrix(result.data as CorrelationMatrixData);
      case 'allocation':
        return renderAllocationChart(result.data as AllocationData[], state.chartType);
      case 'contribution':
        return renderContributionChart(result.data as ContributionData[], state.chartType);
      default:
        return null;
    }
  };
  
  // Time series chart
  const renderTimeSeriesChart = (data: ChartDataPoint[], chartType: ChartType) => {
    if (data.length === 0) return null;
    
    // Get all keys except date/month
    const keys = Object.keys(data[0]).filter(k => k !== 'date' && k !== 'month');
    
    const formatValue = (value: number) => {
      if (state.metric === 'drawdown') return `${value.toFixed(2)}%`;
      if (state.metric === 'rolling_volatility') return `${value.toFixed(1)}%`;
      if (state.metric === 'rolling_correlation') return value.toFixed(3);
      if (state.metric === 'beta_vs_benchmark') return value.toFixed(2);
      if (state.showPercentage || state.metric.includes('return')) return `${value.toFixed(2)}%`;
      if (state.normalize) return value.toFixed(1);
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };
    
    const commonProps = {
      data,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };
    
    const commonAxisProps = {
      tick: { fill: 'hsl(var(--muted-foreground))', fontSize: 10 },
      axisLine: { stroke: 'hsl(var(--border))' },
      tickLine: { stroke: 'hsl(var(--border))' },
    };
    
    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart {...commonProps}>
            <defs>
              {keys.map((key, i) => (
                <linearGradient key={key} id={`gradient-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              {...commonAxisProps}
              tickFormatter={(v) => v?.slice(5) || v}
            />
            <YAxis 
              {...commonAxisProps}
              tickFormatter={(v) => formatValue(v)}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [formatValue(value)]}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {keys.map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={`url(#gradient-${i})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }
    
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="month" 
              {...commonAxisProps}
              tickFormatter={(v) => v?.slice(5) || v}
            />
            <YAxis 
              {...commonAxisProps}
              tickFormatter={(v) => formatValue(v)}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => [formatValue(value)]}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {keys.map((key, i) => (
              <Bar
                key={key}
                dataKey={key}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    // Default: Line chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="month" 
            {...commonAxisProps}
            tickFormatter={(v) => v?.slice(5) || v}
          />
          <YAxis 
            {...commonAxisProps}
            tickFormatter={(v) => formatValue(v)}
            width={60}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [formatValue(value)]}
          />
          <Legend wrapperStyle={{ fontSize: '11px' }} />
          {keys.map((key, i) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS[i % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };
  
  // Correlation matrix heatmap
  const renderCorrelationMatrix = (data: CorrelationMatrixData) => {
    const { tickers, matrix } = data;
    
    if (tickers.length === 0) return null;
    
    return (
      <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
        <div className="inline-block">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-16" />
                {tickers.map(t => (
                  <th 
                    key={t} 
                    className="w-16 h-10 text-[10px] font-mono font-medium text-muted-foreground"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((rowTicker, i) => (
                <tr key={rowTicker}>
                  <td className="w-16 h-10 text-[10px] font-mono font-medium text-muted-foreground text-right pr-2">
                    {rowTicker}
                  </td>
                  {matrix[i].map((val, j) => (
                    <td 
                      key={j}
                      className={cn(
                        "w-16 h-10 text-center text-[10px] font-mono border border-border/30",
                        getCorrelationColor(val),
                        val >= 0.3 || val <= -0.3 ? 'text-white' : 'text-foreground'
                      )}
                      title={`${rowTicker} vs ${tickers[j]}: ${val.toFixed(3)}`}
                    >
                      {val.toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-4 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Negative</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-muted rounded" />
              <span>Neutral</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-emerald-500 rounded" />
              <span>Positive</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Allocation chart (Pie or Treemap)
  const renderAllocationChart = (data: AllocationData[], chartType: ChartType) => {
    if (data.length === 0) return null;
    
    if (chartType === 'treemap') {
      const treemapData = data.map((d, i) => ({
        name: d.ticker,
        size: d.value,
        fill: PIE_COLORS[i % PIE_COLORS.length],
      }));
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="hsl(var(--background))"
            fill="hsl(var(--primary))"
          >
            {treemapData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Treemap>
        </ResponsiveContainer>
      );
    }
    
    // Pie chart
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            nameKey="ticker"
            label={({ ticker, percentage }) => `${ticker} ${percentage.toFixed(1)}%`}
            labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px',
            }}
            formatter={(value: number, name: string, props: any) => [
              `$${value.toLocaleString()} (${props.payload.percentage.toFixed(1)}%)`,
              props.payload.name,
            ]}
          />
          <Legend 
            wrapperStyle={{ fontSize: '11px' }}
            formatter={(value, entry: any) => entry.payload.name}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };
  
  // Contribution chart
  const renderContributionChart = (data: ContributionData[], chartType: ChartType) => {
    if (data.length === 0) return null;
    
    const chartData = data.map((d, i) => ({
      name: d.ticker,
      contribution: d.contribution,
      weight: d.weight,
      plPercent: d.plPercent,
      fill: d.contribution >= 0 ? '#22c55e' : '#ef4444',
    }));
    
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            type="number"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            tickFormatter={(v) => `$${v.toLocaleString()}`}
          />
          <YAxis 
            type="category"
            dataKey="name"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px',
              fontSize: '11px',
            }}
            formatter={(value: number, name: string, props: any) => [
              `$${value.toLocaleString()}`,
              'Contribution',
            ]}
          />
          <Bar dataKey="contribution" fill="hsl(var(--primary))">
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };
  
  return (
    <div className="flex-1 flex flex-col bg-card/30 rounded-lg border border-border/50 overflow-hidden">
      {/* Header with export buttons */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="text-sm font-medium">
          {result?.metadata?.metric && (
            <span className="capitalize">{result.metadata.metric.replace(/_/g, ' ')}</span>
          )}
          {result?.metadata?.dateRange && (
            <span className="text-muted-foreground ml-2 text-xs">
              {result.metadata.dateRange.start} → {result.metadata.dateRange.end}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleExportPNG}
          >
            <Image className="h-3.5 w-3.5 mr-1" />
            PNG
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleExportPDF}
          >
            <FileText className="h-3.5 w-3.5 mr-1" />
            PDF
          </Button>
        </div>
      </div>
      
      {/* Warnings banner */}
      {result?.warnings && result.warnings.length > 0 && (
        <div className="mx-4 mb-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              {result.warnings.map((warning, i) => (
                <p key={i}>{warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Chart area */}
      <div ref={chartRef} className="flex-1 p-4 min-h-[400px]">
        {renderChart()}
      </div>
    </div>
  );
}
