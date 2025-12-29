import { useMemo } from 'react';
import { ReportBlock, ReportBranding, DEFAULT_BRANDING } from '@/types/reportBuilder';
import { PortfolioHolding } from '@/lib/portfolioEngine';
import { PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, FileImage } from 'lucide-react';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Generate chart colors array from branding
const getChartColors = (branding: ReportBranding): string[] => {
  const primary = branding.chartPrimaryColor || DEFAULT_BRANDING.chartPrimaryColor;
  const secondary = branding.chartSecondaryColor || DEFAULT_BRANDING.chartSecondaryColor;
  // Generate a palette based on primary and secondary with variations
  return [
    primary,
    secondary,
    branding.accentColor || DEFAULT_BRANDING.accentColor,
    '#9C27B0',
    '#FF5722',
    '#00BCD4',
    '#E91E63',
    '#795548'
  ];
};

interface Props {
  block: ReportBlock;
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
  branding: ReportBranding;
}

export function ReportBlockRenderer({ block, holdings, performanceMetrics, riskMetrics, totalValue, branding }: Props) {
  const chartColors = useMemo(() => getChartColors(branding), [branding]);
  const config = block.config;

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
    const max = config.maxItems || 3;
    return {
      top: sorted.slice(0, max),
      bottom: sorted.slice(-max).reverse(),
    };
  }, [holdings, config.maxItems]);

  switch (block.type) {
    case 'logo_header':
      return (
        <div className={`text-${config.logoAlignment || 'center'} py-2`}>
          {config.logoUrl ? (
            <img 
              src={config.logoUrl} 
              alt="Logo" 
              className={`mx-auto object-contain ${
                config.logoSize === 'small' ? 'h-8' : 
                config.logoSize === 'large' ? 'h-16' : 'h-12'
              } ${config.logoAlignment === 'left' ? 'ml-0 mr-auto' : config.logoAlignment === 'right' ? 'ml-auto mr-0' : 'mx-auto'}`}
            />
          ) : (
            <div className="h-12 w-20 mx-auto rounded bg-muted flex items-center justify-center">
              <FileImage size={20} className="text-muted-foreground" />
            </div>
          )}
          {config.title && (
            <h1 className="text-xl font-bold mt-2">{config.title}</h1>
          )}
          {config.subtitle && (
            <p className="text-sm text-muted-foreground">{config.subtitle}</p>
          )}
        </div>
      );

    case 'title':
      return (
        <h1 
          className={`font-${config.fontWeight || 'bold'} text-${config.textAlign || 'center'}`}
          style={{ 
            fontSize: config.fontSize === '2xl' ? '1.5rem' : config.fontSize === 'xl' ? '1.25rem' : '1.125rem',
            color: config.textColor || 'inherit'
          }}
        >
          {config.title || 'Report Title'}
        </h1>
      );

    case 'subtitle':
      return (
        <h2 
          className={`text-${config.textAlign || 'center'} text-muted-foreground`}
          style={{ fontSize: '0.875rem' }}
        >
          {config.subtitle || 'Subtitle text'}
        </h2>
      );

    case 'free_text':
      return (
        <div 
          className={`text-${config.textAlign || 'left'} text-sm`}
          style={{ color: config.textColor || 'inherit' }}
        >
          {config.text || 'Add your commentary here...'}
        </div>
      );

    case 'portfolio_overview':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>Total Value</p>
            <p className="text-sm font-semibold" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{formatCurrency(totalValue)}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>IRR</p>
            <p className="text-sm font-semibold" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{performanceMetrics ? formatPercent(performanceMetrics.irr) : '—'}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>Total Return</p>
            <p className="text-sm font-semibold" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—'}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>Sharpe</p>
            <p className="text-sm font-semibold" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{performanceMetrics?.sharpeRatio.toFixed(2) || '—'}</p>
          </div>
        </div>
      );

    case 'performance_summary':
      return (
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>Total Return</p>
            <p className="text-sm font-semibold" style={{ color: branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor }}>
              {performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—'}
            </p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>Sharpe Ratio</p>
            <p className="text-sm font-semibold" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{performanceMetrics?.sharpeRatio.toFixed(2) || '—'}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>Max Drawdown</p>
            <p className="text-sm font-semibold" style={{ color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor }}>
              {performanceMetrics ? formatPercent(-performanceMetrics.maxDrawdown) : '—'}
            </p>
          </div>
        </div>
      );

    case 'asset_allocation':
    case 'currency_exposure':
    case 'geographic_allocation':
      const chartData = block.type === 'asset_allocation' ? allocationData :
                        block.type === 'currency_exposure' ? currencyData : geographyData;
      return (
        <div className="flex items-center gap-3 h-full">
          {config.showChart !== false && (
            <div className="w-20 h-20 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={15}
                    outerRadius={35}
                    dataKey="value"
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex-1 space-y-1">
            {chartData.slice(0, config.maxItems || 5).map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-[10px]">
                <div 
                  className="w-2 h-2 rounded-sm flex-shrink-0" 
                  style={{ backgroundColor: chartColors[i % chartColors.length] }} 
                />
                <span className="truncate flex-1" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{item.name}</span>
                <span style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>{item.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'top_movers':
      return (
        <div className="grid grid-cols-2 gap-3 h-full">
          <div>
            <h4 className="text-[10px] font-medium flex items-center gap-1 mb-1" style={{ color: branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor }}>
              <TrendingUp size={10} /> Top
            </h4>
            <div className="space-y-0.5">
              {topMovers.top.map((h, i) => (
                <div key={i} className="flex justify-between text-[10px]">
                  <span className="font-medium truncate" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{h.ticker}</span>
                  <span style={{ color: branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor }}>{formatCurrency(h.unrealizedPL || 0)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-medium flex items-center gap-1 mb-1" style={{ color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor }}>
              <TrendingDown size={10} /> Bottom
            </h4>
            <div className="space-y-0.5">
              {topMovers.bottom.map((h, i) => (
                <div key={i} className="flex justify-between text-[10px]">
                  <span className="font-medium truncate" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{h.ticker}</span>
                  <span style={{ color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor }}>{formatCurrency(h.unrealizedPL || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'contribution_chart':
      const contributionData = useMemo(() => {
        return [...holdings]
          .filter(h => h.unrealizedPL !== undefined && h.unrealizedPL !== 0)
          .sort((a, b) => Math.abs(b.unrealizedPL || 0) - Math.abs(a.unrealizedPL || 0))
          .slice(0, config.maxItems || 10)
          .map(h => ({
            ticker: h.ticker,
            value: h.unrealizedPL || 0,
            color: (h.unrealizedPL || 0) >= 0 
              ? (branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor)
              : (branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor)
          }));
      }, [holdings, config.maxItems, branding]);

      return (
        <div className="h-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={contributionData} layout="vertical" margin={{ left: 30, right: 10, top: 5, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 9, fill: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }} tickFormatter={(v) => formatCurrency(v)} />
              <YAxis type="category" dataKey="ticker" tick={{ fontSize: 9, fill: branding.textColor || DEFAULT_BRANDING.textColor }} width={40} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ 
                  backgroundColor: branding.backgroundColor || DEFAULT_BRANDING.backgroundColor,
                  border: `1px solid ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`,
                  fontSize: 10
                }}
              />
              <Bar dataKey="value" radius={[0, 3, 3, 0]}>
                {contributionData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );

    case 'performance_calendar':
      // Generate sample monthly returns for display
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const years = [new Date().getFullYear() - 1, new Date().getFullYear()];
      
      // Generate mock data - in real implementation this would come from actual performance data
      const calendarData = useMemo(() => {
        return years.map(year => ({
          year,
          months: months.map((month, i) => {
            // Use performance metrics if available, otherwise generate sample data
            const monthReturn = performanceMetrics 
              ? (performanceMetrics.totalReturn / 12) * (0.5 + Math.random())
              : (Math.random() * 6 - 2);
            return {
              month,
              return: monthReturn * (i < new Date().getMonth() || year < new Date().getFullYear() ? 1 : 0)
            };
          })
        }));
      }, [performanceMetrics]);

      const getReturnColor = (ret: number) => {
        if (ret === 0) return branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor;
        if (ret > 3) return branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor;
        if (ret > 0) return `${branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor}80`;
        if (ret > -3) return `${branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor}80`;
        return branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor;
      };

      return (
        <div className="space-y-2">
          {calendarData.map(yearData => (
            <div key={yearData.year}>
              <p className="text-[9px] font-medium mb-1" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>
                {yearData.year}
              </p>
              <div className="grid grid-cols-12 gap-1">
                {yearData.months.map((m, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded flex flex-col items-center justify-center text-center"
                    style={{ 
                      backgroundColor: `${getReturnColor(m.return)}25`,
                      border: `1px solid ${getReturnColor(m.return)}50`
                    }}
                  >
                    <span className="text-[7px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>
                      {m.month}
                    </span>
                    <span 
                      className="text-[8px] font-semibold"
                      style={{ color: m.return !== 0 ? getReturnColor(m.return) : branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}
                    >
                      {m.return !== 0 ? `${m.return > 0 ? '+' : ''}${m.return.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

    case 'risk_metrics':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>Volatility</p>
            <p className="text-sm font-semibold" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{riskMetrics ? formatPercent(riskMetrics.volatility) : '—'}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>Beta</p>
            <p className="text-sm font-semibold" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{riskMetrics?.beta.toFixed(2) || '—'}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>VaR 95%</p>
            <p className="text-sm font-semibold" style={{ color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor }}>{riskMetrics ? formatPercent(-riskMetrics.var95) : '—'}</p>
          </div>
          <div className="p-2 rounded-lg" style={{ backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent' }}>
            <p className="text-[10px]" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>Sortino</p>
            <p className="text-sm font-semibold" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{riskMetrics?.sortinoRatio?.toFixed(2) || '—'}</p>
          </div>
        </div>
      );

    case 'scenarios_snapshot':
      const scenarios = [
        { name: '2008 Crisis', impact: -28.5 },
        { name: 'COVID Crash', impact: -18.2 },
        { name: 'Rates +200bp', impact: -8.4 },
        { name: 'Tech Bust', impact: -22.1 },
        { name: 'Stagflation', impact: -15.8 },
        { name: 'EM Crisis', impact: -12.3 },
      ];
      return (
        <div className="grid grid-cols-3 gap-1">
          {scenarios.slice(0, config.maxItems || 6).map((s, i) => (
            <div key={i} className="p-1.5 rounded text-center" style={{ backgroundColor: `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` }}>
              <p className="text-[8px] truncate" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>{s.name}</p>
              <p className="text-xs font-semibold" style={{ color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor }}>{formatPercent(s.impact)}</p>
            </div>
          ))}
        </div>
      );

    case 'holdings_table':
      return (
        <div className="overflow-hidden">
          <table className="w-full text-[9px]" style={{ borderColor: branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor }}>
            <thead>
              <tr style={{ 
                backgroundColor: branding.tableHeaderBgColor || DEFAULT_BRANDING.tableHeaderBgColor,
                borderBottom: `1px solid ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`
              }}>
                <th className="text-left py-1 font-medium" style={{ color: branding.tableHeaderTextColor || DEFAULT_BRANDING.tableHeaderTextColor }}>Asset</th>
                <th className="text-right py-1 font-medium" style={{ color: branding.tableHeaderTextColor || DEFAULT_BRANDING.tableHeaderTextColor }}>Value</th>
                <th className="text-right py-1 font-medium" style={{ color: branding.tableHeaderTextColor || DEFAULT_BRANDING.tableHeaderTextColor }}>Weight</th>
              </tr>
            </thead>
            <tbody>
              {holdings.slice(0, config.maxItems || 10).map((h, index) => (
                <tr 
                  key={h.ticker} 
                  style={{ 
                    backgroundColor: index % 2 === 1 ? (branding.tableRowAltBgColor || DEFAULT_BRANDING.tableRowAltBgColor) : 'transparent',
                    borderBottom: `1px solid ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}50`
                  }}
                >
                  <td className="py-0.5">
                    <span className="font-medium" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{h.ticker}</span>
                  </td>
                  <td className="text-right py-0.5 font-mono" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{formatCurrency(h.currentValue)}</td>
                  <td className="text-right py-0.5 font-mono" style={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}>{h.weight.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {holdings.length > (config.maxItems || 10) && (
            <p className="text-[8px] text-center mt-1" style={{ color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>
              +{holdings.length - (config.maxItems || 10)} more
            </p>
          )}
        </div>
      );

    case 'footer':
      return (
        <div 
          className="flex items-center justify-between text-[10px] pt-2"
          style={{ 
            color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor,
            borderTop: `1px solid ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`
          }}
        >
          <span>{config.footerText || branding.footerText}</span>
          {config.analystName && <span>{config.analystName}</span>}
          {config.showDate && <span>{new Date().toLocaleDateString()}</span>}
        </div>
      );

    case 'page_break':
      return (
        <div className="flex items-center justify-center py-2 border-t border-b border-dashed border-muted-foreground/30">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Page Break</span>
        </div>
      );

    case 'spacer':
      return <div className="h-full bg-muted/10 rounded" />;

    default:
      return (
        <div className="p-4 bg-muted/20 rounded-lg text-center h-full flex items-center justify-center">
          <p className="text-xs text-muted-foreground">{block.type}</p>
        </div>
      );
  }
}