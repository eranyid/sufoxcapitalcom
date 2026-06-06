import { useMemo } from 'react';
import type { ReportSection } from '@/types/reports';
import type { ReportBranding } from '@/types/reportBuilder';
import type { PortfolioHolding } from '@/lib/portfolioEngine';
import type { PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/formatters';

// Default branding values for fallback
const FALLBACK_BRANDING = {
  primaryColor: '#FFC107',
  secondaryColor: '#1A1A1A',
  accentColor: '#4A90D9',
  textColor: '#0A0A0A',
  mutedTextColor: '#6B7280',
  chartPrimaryColor: '#FFC107',
  chartSecondaryColor: '#4CAF50',
  chartPositiveColor: '#22C55E',
  chartNegativeColor: '#EF4444',
  tableHeaderBgColor: '#F3F4F6',
  tableHeaderTextColor: '#374151',
  tableRowAltBgColor: '#F9FAFB',
  tableBorderColor: '#E5E7EB',
};

interface Props {
  section: ReportSection;
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
  branding: ReportBranding;
}

// Generate chart colors array from branding
const getChartColors = (branding: ReportBranding): string[] => {
  const primary = branding.chartPrimaryColor || FALLBACK_BRANDING.chartPrimaryColor;
  const secondary = branding.chartSecondaryColor || FALLBACK_BRANDING.chartSecondaryColor;
  return [
    primary,
    secondary,
    branding.accentColor || FALLBACK_BRANDING.accentColor,
    '#9C27B0',
    '#FF5722',
    '#00BCD4',
    '#E91E63',
    '#795548'
  ];
};

export function ReportSectionPreview({ section, holdings, performanceMetrics, riskMetrics, totalValue, branding }: Props) {
  const chartColors = useMemo(() => getChartColors(branding), [branding]);
  const allocationData = useMemo(() => {
    const byType: Record<string, number> = {};
    holdings.forEach(h => {
      byType[h.assetType] = (byType[h.assetType] || 0) + h.currentValue;
    });
    return Object.entries(byType).map(([name, value]) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));
  }, [holdings, totalValue]);

  const currencyData = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    holdings.forEach(h => {
      byCurrency[h.currency] = (byCurrency[h.currency] || 0) + h.currentValue;
    });
    return Object.entries(byCurrency).map(([name, value]) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));
  }, [holdings, totalValue]);

  const geographyData = useMemo(() => {
    const byGeo: Record<string, number> = {};
    holdings.forEach(h => {
      byGeo[h.geography] = (byGeo[h.geography] || 0) + h.currentValue;
    });
    return Object.entries(byGeo).map(([name, value]) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));
  }, [holdings, totalValue]);

  const topMovers = useMemo(() => {
    const sorted = [...holdings]
      .filter(h => h.unrealizedPL !== undefined)
      .sort((a, b) => (b.unrealizedPL || 0) - (a.unrealizedPL || 0));
    return {
      top: sorted.slice(0, 3),
      bottom: sorted.slice(-3).reverse(),
    };
  }, [holdings]);

  const contributionData = useMemo(() => {
    return holdings
      .filter(h => h.unrealizedPL !== undefined)
      .sort((a, b) => Math.abs(b.unrealizedPL || 0) - Math.abs(a.unrealizedPL || 0))
      .slice(0, 6)
      .map(h => ({
        name: h.ticker,
        value: h.unrealizedPL || 0,
      }));
  }, [holdings]);

  switch (section.type) {
    case 'logo_header':
      return (
        <div className="text-center py-4">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
          ) : (
            <div className="h-12 w-12 mx-auto mb-2 rounded bg-primary/20 flex items-center justify-center text-primary font-bold">
              LOGO
            </div>
          )}
          <h2 className="text-lg font-semibold">{branding.headerTitle || 'Portfolio Report'}</h2>
          {branding.headerSubtitle && (
            <p className="text-sm text-muted-foreground">{branding.headerSubtitle}</p>
          )}
        </div>
      );

    case 'portfolio_overview':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>Total Value</p>
            <p className="text-lg font-semibold" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{formatCurrency(totalValue)}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>IRR</p>
            <p className="text-lg font-semibold" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{performanceMetrics ? formatPercent(performanceMetrics.irr) : '—'}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>Total Return</p>
            <p className="text-lg font-semibold" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—'}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>Sharpe Ratio</p>
            <p className="text-lg font-semibold" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{performanceMetrics?.sharpeRatio.toFixed(2) || '—'}</p>
          </div>
        </div>
      );

    case 'performance_summary':
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>Total Return</p>
            <p className="text-lg font-semibold" style={{ color: branding.chartPositiveColor || FALLBACK_BRANDING.chartPositiveColor }}>
              {performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—'}
            </p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>Sharpe Ratio</p>
            <p className="text-lg font-semibold" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{performanceMetrics?.sharpeRatio.toFixed(2) || '—'}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>Max Drawdown</p>
            <p className="text-lg font-semibold" style={{ color: branding.chartNegativeColor || FALLBACK_BRANDING.chartNegativeColor }}>
              {performanceMetrics ? formatPercent(-performanceMetrics.maxDrawdown) : '—'}
            </p>
          </div>
        </div>
      );

    case 'performance_calendar':
      return (
        <div className="p-4 bg-muted/20 rounded-lg">
          <div className="grid grid-cols-12 gap-1 text-[10px] text-center">
            {['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'].map((m, i) => (
              <div key={i} className="text-muted-foreground">{m}</div>
            ))}
            {Array(12).fill(0).map((_, i) => {
              const val = Math.random() * 10 - 5;
              return (
                <div 
                  key={i} 
                  className={`rounded py-1 text-[9px] ${val > 0 ? 'bg-positive/20 text-positive' : 'bg-negative/20 text-negative'}`}
                >
                  {val.toFixed(1)}%
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">2024 Monthly Returns</p>
        </div>
      );

    case 'contribution_chart':
      return (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contributionData} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => formatPercent(v)} fontSize={9} />
              <YAxis type="category" dataKey="name" fontSize={9} width={40} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  fontSize: 10, 
                  background: branding.backgroundColor || '#FFFFFF', 
                  border: `1px solid ${branding.tableBorderColor || FALLBACK_BRANDING.tableBorderColor}` 
                }}
              />
              <Bar 
                dataKey="value" 
                fill={branding.chartPrimaryColor || FALLBACK_BRANDING.chartPrimaryColor}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case 'top_movers':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium flex items-center gap-1 mb-2" style={{ color: branding.chartPositiveColor || FALLBACK_BRANDING.chartPositiveColor }}>
              <TrendingUp size={12} /> Top Performers
            </h4>
            <div className="space-y-1">
              {topMovers.top.map((h, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="font-medium" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{h.ticker}</span>
                  <span style={{ color: branding.chartPositiveColor || FALLBACK_BRANDING.chartPositiveColor }}>{formatCurrency(h.unrealizedPL || 0)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium flex items-center gap-1 mb-2" style={{ color: branding.chartNegativeColor || FALLBACK_BRANDING.chartNegativeColor }}>
              <TrendingDown size={12} /> Underperformers
            </h4>
            <div className="space-y-1">
              {topMovers.bottom.map((h, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span className="font-medium" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{h.ticker}</span>
                  <span style={{ color: branding.chartNegativeColor || FALLBACK_BRANDING.chartNegativeColor }}>{formatCurrency(h.unrealizedPL || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'asset_allocation':
      return (
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={50}
                  dataKey="value"
                >
                  {allocationData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
            {allocationData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: chartColors[i % chartColors.length] }} 
                />
                <span className="truncate" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{item.name}</span>
                <span className="ml-auto" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>{item.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'currency_exposure':
      return (
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={40}
                  dataKey="value"
                >
                  {currencyData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
            {currencyData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: chartColors[i % chartColors.length] }} 
                />
                <span className="font-medium" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{item.name}</span>
                <span className="ml-auto" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>{item.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'geographic_allocation':
      return (
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-28 h-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={geographyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={40}
                  dataKey="value"
                >
                  {geographyData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
            {geographyData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: chartColors[i % chartColors.length] }} 
                />
                <span className="truncate" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{item.name}</span>
                <span className="ml-auto" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>{item.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'holdings_table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderColor: branding.tableBorderColor || FALLBACK_BRANDING.tableBorderColor }}>
            <thead>
              <tr style={{ 
                backgroundColor: branding.tableHeaderBgColor || FALLBACK_BRANDING.tableHeaderBgColor,
                borderBottom: `1px solid ${branding.tableBorderColor || FALLBACK_BRANDING.tableBorderColor}`
              }}>
                <th className="text-left py-2 font-medium" style={{ color: branding.tableHeaderTextColor || FALLBACK_BRANDING.tableHeaderTextColor }}>Asset</th>
                <th className="text-right py-2 font-medium" style={{ color: branding.tableHeaderTextColor || FALLBACK_BRANDING.tableHeaderTextColor }}>Value</th>
                <th className="text-right py-2 font-medium" style={{ color: branding.tableHeaderTextColor || FALLBACK_BRANDING.tableHeaderTextColor }}>Weight</th>
              </tr>
            </thead>
            <tbody>
              {holdings.slice(0, 8).map((h, index) => (
                <tr 
                  key={h.ticker} 
                  style={{ 
                    backgroundColor: index % 2 === 1 ? (branding.tableRowAltBgColor || FALLBACK_BRANDING.tableRowAltBgColor) : 'transparent',
                    borderBottom: `1px solid ${branding.tableBorderColor || FALLBACK_BRANDING.tableBorderColor}50`
                  }}
                >
                  <td className="py-1.5">
                    <span className="font-medium" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{h.ticker}</span>
                    <span className="ml-1" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>{h.name}</span>
                  </td>
                  <td className="text-right py-1.5 font-mono" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{formatCurrency(h.currentValue)}</td>
                  <td className="text-right py-1.5 font-mono" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>
                    {h.weight.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {holdings.length > 8 && (
            <p className="text-xs text-center mt-2" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>
              +{holdings.length - 8} more holdings
            </p>
          )}
        </div>
      );

    case 'risk_metrics':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>Volatility</p>
            <p className="text-lg font-semibold" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{riskMetrics ? formatPercent(riskMetrics.volatility) : '—'}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>Beta</p>
            <p className="text-lg font-semibold" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{riskMetrics?.beta.toFixed(2) || '—'}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>VaR (95%)</p>
            <p className="text-lg font-semibold" style={{ color: branding.chartNegativeColor || FALLBACK_BRANDING.chartNegativeColor }}>{riskMetrics ? formatPercent(-riskMetrics.var95) : '—'}</p>
          </div>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
            <p className="text-xs" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>Sortino</p>
            <p className="text-lg font-semibold" style={{ color: branding.textColor || FALLBACK_BRANDING.textColor }}>{riskMetrics?.sortinoRatio?.toFixed(2) || '—'}</p>
          </div>
        </div>
      );

    case 'scenarios_snapshot':
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { name: '2008 Crisis', impact: -28.5 },
            { name: 'COVID Crash', impact: -18.2 },
            { name: 'Rates +200bp', impact: -8.4 },
            { name: 'Tech Bust', impact: -22.1 },
            { name: 'Stagflation', impact: -15.8 },
            { name: 'EM Crisis', impact: -12.3 },
          ].map((s, i) => (
            <div key={i} className="p-2 rounded text-center" style={{ backgroundColor: `${branding.accentColor || FALLBACK_BRANDING.accentColor}15` }}>
              <p className="text-[10px] truncate" style={{ color: branding.mutedTextColor || FALLBACK_BRANDING.mutedTextColor }}>{s.name}</p>
              <p className="text-sm font-semibold" style={{ color: branding.chartNegativeColor || FALLBACK_BRANDING.chartNegativeColor }}>{formatPercent(s.impact)}</p>
            </div>
          ))}
        </div>
      );

    case 'custom_text':
      return (
        <div className="p-4 bg-muted/20 rounded-lg min-h-[80px]">
          <p className="text-sm text-muted-foreground italic">
            Custom commentary section - content will be editable in full version
          </p>
        </div>
      );

    case 'architecture':
    case 'risk_return_scatter':
    case 'drawdown_chart':
    case 'factor_exposure':
    case 'transactions_summary':
      return (
        <div className="p-6 bg-muted/20 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            {section.title} preview
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Full content rendered in PDF export
          </p>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">Unknown section type</p>
        </div>
      );
  }
}