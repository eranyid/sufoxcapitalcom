import React, { useMemo } from 'react';
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
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Percent, PieChart as PieIcon, BarChart3, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction, MonthlyValuation, PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { 
  calculatePositions, 
  getLatestValuations,
  calculateAssetMonthlyReturns,
  calculateCumulativeReturns,
} from '@/lib/calculations';

interface PowerBIChartDashboardProps {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  availableAssets: { ticker: string; name: string }[];
}

// Vibrant Power BI color palette
const POWERBI_COLORS = [
  '#118DFF', // Blue
  '#12239E', // Dark Blue  
  '#E66C37', // Orange
  '#6B007B', // Purple
  '#E044A7', // Pink
  '#744EC2', // Violet
  '#D9B300', // Gold
  '#009E49', // Green
  '#00B7C3', // Teal
  '#F2C80F', // Yellow
  '#FE6447', // Coral
  '#4AC6DD', // Light Blue
];

const TREEMAP_COLORS = [
  '#118DFF', '#E66C37', '#6B007B', '#E044A7', 
  '#744EC2', '#D9B300', '#009E49', '#00B7C3',
  '#12239E', '#FE6447', '#F2C80F', '#4AC6DD',
];

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon: React.ReactNode;
  color: string;
}

function KPICard({ title, value, subtitle, trend, icon, color }: KPICardProps) {
  return (
    <div className="bg-white dark:bg-card rounded-lg border border-border/30 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className={cn("p-1.5 rounded", color)}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      {subtitle && (
        <div className="flex items-center gap-1.5 text-[11px]">
          {trend !== undefined && (
            <>
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={cn(trend >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {trend >= 0 ? '+' : ''}{trend.toFixed(2)}%
              </span>
            </>
          )}
          <span className="text-muted-foreground">{subtitle}</span>
        </div>
      )}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-card rounded-lg border border-border/30 shadow-sm hover:shadow-md transition-shadow overflow-hidden",
      className
    )}>
      <div className="px-4 py-3 border-b border-border/20">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

export function PowerBIChartDashboard({ 
  transactions, 
  valuations, 
  performanceMetrics,
  riskMetrics,
  availableAssets 
}: PowerBIChartDashboardProps) {
  
  // Calculate allocation data
  const allocationData = useMemo(() => {
    if (transactions.length === 0 || valuations.length === 0) return [];
    
    const positions = calculatePositions(transactions);
    const latestVals = getLatestValuations(valuations);
    
    const result: { name: string; ticker: string; value: number; percentage: number }[] = [];
    let totalValue = 0;
    
    for (const [ticker, pos] of Object.entries(positions)) {
      if (pos.quantity <= 0) continue;
      
      const val = latestVals[ticker];
      const tx = transactions.find(t => t.ticker === ticker);
      if (!val || !tx) continue;
      
      const value = pos.quantity * val.pricePerUnit * (val.fxRate || 1);
      totalValue += value;
      
      result.push({
        name: tx.assetName,
        ticker,
        value,
        percentage: 0,
      });
    }
    
    result.forEach(r => {
      r.percentage = totalValue > 0 ? (r.value / totalValue) * 100 : 0;
    });
    
    return result.sort((a, b) => b.value - a.value);
  }, [transactions, valuations]);

  // Calculate sector allocation (by asset type)
  const sectorData = useMemo(() => {
    const sectorMap = new Map<string, number>();
    
    transactions.forEach(tx => {
      if (tx.transactionType === 'buy') {
        const type = tx.assetType || 'Other';
        sectorMap.set(type, (sectorMap.get(type) || 0) + 1);
      }
    });
    
    return Array.from(sectorMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
      value,
    }));
  }, [transactions]);

  // Calculate geography distribution
  const geographyData = useMemo(() => {
    const geoMap = new Map<string, number>();
    
    allocationData.forEach(asset => {
      const tx = transactions.find(t => t.ticker === asset.ticker);
      if (tx) {
        const geo = tx.geography || 'Other';
        geoMap.set(geo, (geoMap.get(geo) || 0) + asset.value);
      }
    });
    
    return Array.from(geoMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [allocationData, transactions]);

  // Calculate monthly returns for bar chart
  const monthlyReturnsData = useMemo(() => {
    if (!performanceMetrics?.monthlyReturns) return [];
    
    return performanceMetrics.monthlyReturns.slice(-12).map(r => ({
      month: r.month.slice(5), // MM format
      return: r.return,
      fill: r.return >= 0 ? '#009E49' : '#E66C37',
    }));
  }, [performanceMetrics]);

  // Calculate cumulative performance
  const cumulativeData = useMemo(() => {
    if (!performanceMetrics?.monthlyReturns || performanceMetrics.monthlyReturns.length === 0) return [];
    
    const cumReturns = calculateCumulativeReturns(performanceMetrics.monthlyReturns);
    return cumReturns.slice(-24).map(r => ({
      month: r.month.slice(5),
      value: r.return,
    }));
  }, [performanceMetrics]);

  // Calculate treemap data for holdings
  const treemapData = useMemo(() => {
    return allocationData.slice(0, 12).map((d, i) => ({
      name: d.ticker,
      size: d.value,
      value: d.value,
      fill: TREEMAP_COLORS[i % TREEMAP_COLORS.length],
    }));
  }, [allocationData]);

  // Year-over-year performance
  const yoyData = useMemo(() => {
    if (!performanceMetrics?.monthlyReturns) return [];
    
    const years: Record<string, number[]> = {};
    performanceMetrics.monthlyReturns.forEach(r => {
      const year = r.month.slice(0, 4);
      if (!years[year]) years[year] = [];
      years[year].push(r.return);
    });
    
    return Object.entries(years).map(([year, returns]) => ({
      year,
      return: returns.reduce((a, b) => a + b, 0),
    })).slice(-5);
  }, [performanceMetrics]);

  const totalValue = performanceMetrics?.totalValue || 0;
  const ytdReturn = performanceMetrics?.twr || 0; // Use TWR as YTD proxy
  const volatility = riskMetrics?.volatility || 0;
  const sharpeRatio = riskMetrics?.sharpeRatio || 0;

  if (transactions.length === 0 && valuations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <PieIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-sm font-medium text-muted-foreground mb-1">No Data Available</h3>
          <p className="text-xs text-muted-foreground/70">Add transactions and valuations to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          title="Portfolio Value"
          value={`$${(totalValue / 1000000).toFixed(2)}M`}
          subtitle="Total NAV"
          icon={<DollarSign className="h-4 w-4 text-white" />}
          color="bg-[#118DFF]"
        />
        <KPICard
          title="YTD Return"
          value={`${ytdReturn >= 0 ? '+' : ''}${ytdReturn.toFixed(2)}%`}
          trend={ytdReturn}
          subtitle="vs benchmark"
          icon={<TrendingUp className="h-4 w-4 text-white" />}
          color="bg-[#009E49]"
        />
        <KPICard
          title="Volatility"
          value={`${volatility.toFixed(1)}%`}
          subtitle="Annualized"
          icon={<Activity className="h-4 w-4 text-white" />}
          color="bg-[#E66C37]"
        />
        <KPICard
          title="Sharpe Ratio"
          value={sharpeRatio.toFixed(2)}
          subtitle="Risk-adjusted"
          icon={<Percent className="h-4 w-4 text-white" />}
          color="bg-[#6B007B]"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Cumulative Performance - Area Chart */}
        <ChartCard 
          title="Cumulative Performance" 
          subtitle="Last 24 months"
          className="lg:col-span-2"
        >
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#118DFF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#118DFF" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#666', fontSize: 10 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 10 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#118DFF" 
                  fill="url(#cumGradient)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Allocation Donut Chart */}
        <ChartCard title="Asset Allocation" subtitle="By holding value">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData.slice(0, 8)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="ticker"
                >
                  {allocationData.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={POWERBI_COLORS[i % POWERBI_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `$${value.toLocaleString()} (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.name
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px' }}
                  formatter={(value) => <span className="text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Monthly Returns Bar Chart */}
        <ChartCard title="Monthly Returns" subtitle="Last 12 months">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyReturnsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#666', fontSize: 9 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 10 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {monthlyReturnsData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Holdings Treemap */}
        <ChartCard title="Holdings by Value" subtitle="Treemap visualization" className="lg:col-span-2">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
              >
                {treemapData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Treemap>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Sector Distribution */}
        <ChartCard title="Asset Type Distribution" subtitle="By number of positions">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={sectorData} 
                layout="vertical"
                margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#666', fontSize: 10 }}
                  width={75}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="value" fill="#744EC2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Geography Distribution */}
        <ChartCard title="Geographic Exposure" subtitle="By value">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={geographyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  paddingAngle={1}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#666', strokeWidth: 1 }}
                >
                  {geographyData.map((_, i) => (
                    <Cell key={i} fill={POWERBI_COLORS[(i + 3) % POWERBI_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Year over Year Performance */}
        <ChartCard title="Annual Performance" subtitle="Year-over-year returns">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yoyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" opacity={0.5} />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#666', fontSize: 10 }}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <YAxis 
                  tick={{ fill: '#666', fontSize: 10 }}
                  tickFormatter={(v) => `${v.toFixed(0)}%`}
                  axisLine={{ stroke: '#e0e0e0' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    fontSize: '11px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return']}
                />
                <Bar dataKey="return" radius={[4, 4, 0, 0]}>
                  {yoyData.map((entry, i) => (
                    <Cell key={i} fill={entry.return >= 0 ? '#009E49' : '#E66C37'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
