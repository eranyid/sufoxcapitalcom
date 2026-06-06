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
  ScatterChart,
  Scatter,
  ZAxis,
  FunnelChart,
  Funnel,
  LabelList,
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

// Power BI Color palette - vibrant and professional
const CHART_COLORS = [
  '#F2C811', // Power BI Yellow
  '#01B8AA', // Teal
  '#374649', // Dark Gray
  '#FD625E', // Red/Coral
  '#5F6B6D', // Medium Gray
  '#8AD4EB', // Light Blue
  '#FE9666', // Orange
  '#A66999', // Purple
  '#3599B8', // Blue
  '#DFBFBF', // Light Pink
];

const PIE_COLORS = [
  '#F2C811', // Power BI Yellow
  '#01B8AA', // Teal
  '#FD625E', // Red/Coral
  '#374649', // Dark Gray
  '#8AD4EB', // Light Blue
  '#FE9666', // Orange
  '#A66999', // Purple
  '#3599B8', // Blue
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
      console.error('PNG export error:', error);
      toast.error('Failed to export chart as PNG');
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
      console.error('PDF export error:', error);
      toast.error('Failed to export chart as PDF');
    }
  }, [state.metric]);
  
  // Empty state
  if (!result && !isCalculating) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border border-border/30">
            <AlertCircle className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Select Assets</h3>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            Choose a metric and select assets from the builder panel
          </p>
        </div>
      </div>
    );
  }
  
  // Loading state
  if (isCalculating) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Calculating...</span>
        </div>
      </div>
    );
  }
  
  // Error state
  if (result && !result.success) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4 border border-destructive/30">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <h3 className="text-sm font-medium mb-1">Calculation Error</h3>
          <p className="text-xs text-muted-foreground max-w-xs">{result.error}</p>
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
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4 border border-border/30">
            <AlertCircle className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">No Data Available</h3>
          <p className="text-xs text-muted-foreground/70 max-w-xs">
            Try a longer date range or different assets
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
    
    // Scatter chart
    if (chartType === 'scatter') {
      // For scatter, we need to transform data for each asset
      const scatterData = keys.flatMap((key, keyIdx) => 
        data.map((d, idx) => ({
          x: idx,
          y: d[key] as number,
          month: d.month,
          asset: key,
          fill: CHART_COLORS[keyIdx % CHART_COLORS.length],
        }))
      );
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              type="number"
              dataKey="x"
              {...commonAxisProps}
              tickFormatter={(v) => data[v]?.month?.slice(5) || ''}
            />
            <YAxis 
              type="number"
              dataKey="y"
              {...commonAxisProps}
              tickFormatter={(v) => formatValue(v)}
              width={60}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string, props: any) => [
                formatValue(value),
                props.payload.asset,
              ]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.month || ''}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            {keys.map((key, i) => (
              <Scatter
                key={key}
                name={key}
                data={scatterData.filter(d => d.asset === key)}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
              />
            ))}
          </ScatterChart>
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
  
  // Allocation chart (Pie, Treemap, or Funnel)
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
    
    // Funnel chart
    if (chartType === 'funnel') {
      const funnelData = data
        .sort((a, b) => b.value - a.value)
        .map((d, i) => ({
          name: d.ticker,
          value: d.value,
          percentage: d.percentage,
          fill: PIE_COLORS[i % PIE_COLORS.length],
        }));
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart margin={{ top: 20, right: 80, left: 80, bottom: 20 }}>
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
            <Funnel
              dataKey="value"
              data={funnelData}
              isAnimationActive
            >
              <LabelList 
                position="right" 
                fill="hsl(var(--foreground))" 
                stroke="none" 
                dataKey="name"
                fontSize={11}
              />
              {funnelData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      );
    }
    
    // Pie chart (default)
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
  
  // Contribution chart (Bar, Waterfall, or Funnel)
  const renderContributionChart = (data: ContributionData[], chartType: ChartType) => {
    if (data.length === 0) return null;
    
    const chartData = data.map((d, i) => ({
      name: d.ticker,
      contribution: d.contribution,
      weight: d.weight,
      plPercent: d.plPercent,
      fill: d.contribution >= 0 ? '#01B8AA' : '#FD625E', // Power BI teal/coral
    }));
    
    // Waterfall chart - show cumulative effect
    if (chartType === 'waterfall') {
      let cumulative = 0;
      const waterfallData = chartData.map((d, i) => {
        const start = cumulative;
        cumulative += d.contribution;
        return {
          ...d,
          start,
          end: cumulative,
          isPositive: d.contribution >= 0,
        };
      });
      
      // Add total bar
      waterfallData.push({
        name: 'Total',
        contribution: cumulative,
        weight: 100,
        plPercent: 0,
        fill: cumulative >= 0 ? '#F2C811' : '#FD625E', // Power BI yellow or coral
        start: 0,
        end: cumulative,
        isPositive: cumulative >= 0,
      });
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={waterfallData}
            margin={{ top: 20, right: 30, left: 60, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(v) => `$${v.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Contribution']}
            />
            {/* Invisible bar for stacking */}
            <Bar dataKey="start" stackId="stack" fill="transparent" />
            <Bar dataKey="contribution" stackId="stack" fill="hsl(var(--primary))">
              {waterfallData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    
    // Funnel chart for contribution
    if (chartType === 'funnel') {
      const funnelData = [...chartData]
        .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
        .map((d, i) => ({
          ...d,
          value: Math.abs(d.contribution),
          fill: d.contribution >= 0 ? PIE_COLORS[i % PIE_COLORS.length] : '#FD625E',
        }));
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart margin={{ top: 20, right: 80, left: 80, bottom: 20 }}>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px',
              }}
              formatter={(value: number, name: string, props: any) => [
                `$${props.payload.contribution.toLocaleString()}`,
                props.payload.name,
              ]}
            />
            <Funnel
              dataKey="value"
              data={funnelData}
              isAnimationActive
            >
              <LabelList 
                position="right" 
                fill="hsl(var(--foreground))" 
                stroke="none" 
                dataKey="name"
                fontSize={11}
              />
              {funnelData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      );
    }
    
    // Default: Horizontal bar chart
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
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Contribution']}
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Compact header with metric info and export */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/30">
        <div className="flex items-center gap-2 text-xs">
          {result?.metadata?.metric && (
            <span className="font-medium capitalize text-foreground">
              {result.metadata.metric.replace(/_/g, ' ')}
            </span>
          )}
          {result?.metadata?.dateRange && (
            <span className="text-muted-foreground font-mono text-[10px]">
              {result.metadata.dateRange.start} → {result.metadata.dateRange.end}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={handleExportPNG}
          >
            <Image className="h-3 w-3 mr-1" />
            PNG
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            onClick={handleExportPDF}
          >
            <FileText className="h-3 w-3 mr-1" />
            PDF
          </Button>
        </div>
      </div>
      
      {/* Warnings banner */}
      {result?.warnings && result.warnings.length > 0 && (
        <div className="mb-3 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-300/90 flex items-start gap-2">
          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
          <div>
            {result.warnings.map((warning, i) => (
              <p key={i}>{warning}</p>
            ))}
          </div>
        </div>
      )}
      
      {/* Chart area - takes remaining space */}
      <div ref={chartRef} className="flex-1 min-h-[300px]">
        {renderChart()}
      </div>
    </div>
  );
}
