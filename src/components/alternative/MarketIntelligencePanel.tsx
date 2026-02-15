import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Info, TrendingUp, Banknote, BarChart3, Activity, ArrowUpDown } from 'lucide-react';

const indicators = [
  { title: 'Dry Powder Levels', icon: Banknote, desc: 'Undeployed capital across PE/VC/Credit funds' },
  { title: 'Fundraising Trends', icon: TrendingUp, desc: 'New fund closings & LP appetite by strategy' },
  { title: 'Valuation Environment', icon: BarChart3, desc: 'Entry multiples by asset class & vintage' },
  { title: 'Credit Spread Environment', icon: ArrowUpDown, desc: 'Private credit spreads vs. leveraged loans & HY' },
  { title: 'Exit Market Conditions', icon: Activity, desc: 'IPO, M&A, and secondary activity levels' },
];

export function MarketIntelligencePanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="terminal-label text-[9px]">MARKET INTELLIGENCE</p>
        <Badge variant="outline" className="text-[8px]">Optional</Badge>
      </div>

      {indicators.map((ind) => {
        const Icon = ind.icon;
        return (
          <Card key={ind.title} className="opacity-70 hover:opacity-100 transition-opacity">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon size={11} className="text-muted-foreground" />
                <span className="text-[10px] font-semibold">{ind.title}</span>
              </div>
              <p className="text-[9px] text-muted-foreground mb-2">{ind.desc}</p>
              <Skeleton className="h-8 w-full rounded-sm" />
            </CardContent>
          </Card>
        );
      })}

      <div className="p-3 bg-muted/10 border border-border/30 rounded-sm">
        <div className="flex items-start gap-2">
          <Info size={11} className="text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            Private markets AUM and dry powder have expanded significantly, increasing competition and valuation pressure across strategies.
          </p>
        </div>
      </div>
    </div>
  );
}
