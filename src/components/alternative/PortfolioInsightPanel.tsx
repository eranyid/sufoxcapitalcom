import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Layers, Lock, TrendingDown, Calendar, Info } from 'lucide-react';

const insights = [
  {
    title: 'Diversification Impact',
    icon: PieChart,
    desc: 'Alternatives historically exhibit low correlation to public equities and fixed income, improving portfolio efficiency.',
  },
  {
    title: 'Correlation to Traditional Portfolio',
    icon: Layers,
    desc: 'Private equity median correlation to S&P 500 is ~0.7; private credit to high yield ~0.5.',
  },
  {
    title: 'Liquidity Profile',
    icon: Lock,
    desc: 'Typical lockups of 7–12 years for PE/VC. Capital calls are drawn over 3–5 years.',
  },
  {
    title: 'J-Curve Impact',
    icon: TrendingDown,
    desc: 'Early-period negative returns due to fees and capital deployment before value creation.',
  },
  {
    title: 'Vintage Year Diversification',
    icon: Calendar,
    desc: 'Spreading commitments across vintages reduces entry-timing risk in private markets.',
  },
];

export function PortfolioInsightPanel() {
  return (
    <div className="space-y-3">
      <p className="terminal-label text-[9px]">PORTFOLIO CONSTRUCTION INSIGHTS</p>

      {insights.map((insight) => {
        const Icon = insight.icon;
        return (
          <Card key={insight.title} className="hover:border-primary/20 transition-colors">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Icon size={12} className="text-primary shrink-0" />
                <h4 className="text-[10px] font-semibold">{insight.title}</h4>
              </div>
              <p className="text-[9px] text-muted-foreground leading-relaxed">{insight.desc}</p>
              <Skeleton className="h-10 w-full rounded-sm" />
            </CardContent>
          </Card>
        );
      })}

      {/* Reference note */}
      <div className="p-3 bg-primary/5 border border-primary/10 rounded-sm">
        <div className="flex items-start gap-2">
          <Info size={11} className="text-primary mt-0.5 shrink-0" />
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Adding alternatives historically improved return/volatility efficiency when integrated into diversified portfolios. Source: J.P. Morgan Guide to Alternatives.
          </p>
        </div>
      </div>
    </div>
  );
}
