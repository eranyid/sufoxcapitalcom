import { useMemo } from 'react';
import type { ReportSection, ReportBranding } from '@/types/reports';
import type { Holding, PortfolioMetrics } from '@/types/investment';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface Props {
  section: ReportSection;
  holdings: Holding[];
  metrics: PortfolioMetrics | null;
  kpis: { label: string; value: string | number; change?: number }[];
  totalValue: number;
  branding: ReportBranding;
}

const COLORS = ['#FFC107', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#00BCD4', '#E91E63', '#795548'];

export function ReportSectionPreview({ section, holdings, metrics, kpis, totalValue, branding }: Props) {
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
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Value</p>
            <p className="text-lg font-semibold">{formatCurrency(totalValue)}</p>
          </div>
          {kpis.slice(0, 3).map((kpi, i) => (
            <div key={i} className="p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-semibold">{kpi.value}</p>
            </div>
          ))}
        </div>
      );

    case 'performance_summary':
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">YTD Return</p>
            <p className="text-lg font-semibold text-positive">
              {metrics ? formatPercent(metrics.ytdReturn) : '—'}
            </p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
            <p className="text-lg font-semibold">{metrics?.sharpe.toFixed(2) || '—'}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Max Drawdown</p>
            <p className="text-lg font-semibold text-negative">
              {metrics ? formatPercent(metrics.maxDrawdown) : '—'}
            </p>
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
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
                  style={{ backgroundColor: COLORS[i % COLORS.length] }} 
                />
                <span className="truncate">{item.name}</span>
                <span className="text-muted-foreground ml-auto">{item.percent.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'holdings_table':
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 font-medium text-muted-foreground">Asset</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Value</th>
                <th className="text-right py-2 font-medium text-muted-foreground">Weight</th>
              </tr>
            </thead>
            <tbody>
              {holdings.slice(0, 8).map(h => (
                <tr key={h.ticker} className="border-b border-border/50">
                  <td className="py-1.5">
                    <span className="font-medium">{h.ticker}</span>
                    <span className="text-muted-foreground ml-1">{h.assetName}</span>
                  </td>
                  <td className="text-right py-1.5 font-mono">{formatCurrency(h.currentValue)}</td>
                  <td className="text-right py-1.5 font-mono">
                    {totalValue > 0 ? ((h.currentValue / totalValue) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {holdings.length > 8 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              +{holdings.length - 8} more holdings
            </p>
          )}
        </div>
      );

    case 'risk_metrics':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Volatility</p>
            <p className="text-lg font-semibold">{metrics ? formatPercent(metrics.volatility) : '—'}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Beta</p>
            <p className="text-lg font-semibold">{metrics?.beta.toFixed(2) || '—'}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">VaR (95%)</p>
            <p className="text-lg font-semibold text-negative">{metrics ? formatPercent(metrics.var95) : '—'}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">Sortino</p>
            <p className="text-lg font-semibold">{metrics?.sortino?.toFixed(2) || '—'}</p>
          </div>
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

    case 'currency_exposure':
    case 'architecture':
    case 'risk_return_scatter':
    case 'drawdown_chart':
    case 'factor_exposure':
    case 'scenarios_snapshot':
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
