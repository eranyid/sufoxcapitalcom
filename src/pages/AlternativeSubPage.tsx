import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { KPICard } from '@/components/dashboard/KPICard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus } from 'lucide-react';

const META: Record<string, { title: string; intro: string }> = {
  'private-equity': { title: 'Private Equity', intro: 'Buyouts, growth equity, and secondaries portfolio.' },
  'venture-capital': { title: 'Venture Capital', intro: 'Early-stage to late-stage venture investments.' },
  'private-credit': { title: 'Private Credit', intro: 'Direct lending, mezzanine, and distressed debt.' },
  'real-estate': { title: 'Real Estate', intro: 'Core, value-add, and opportunistic real estate.' },
  'real-assets': { title: 'Real Assets / Infrastructure', intro: 'Infra, energy, and commodities-linked assets.' },
  'hedge-funds-alts': { title: 'Hedge Funds / Alternatives', intro: 'HFs, liquid alts, and multi-strategy.' },
};

export default function AlternativeSubPage() {
  const { assetClass } = useParams<{ assetClass: string }>();
  const navigate = useNavigate();
  const meta = META[assetClass || ''] || { title: 'Unknown', intro: '' };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/alternative')} className="gap-1.5 text-xs">
          <ArrowLeft size={14} /> Alt Hub
        </Button>
        <div>
          <h1 className="text-lg font-bold">{meta.title}</h1>
          <p className="text-[10px] text-muted-foreground font-mono">{meta.intro}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="portfolio" className="text-xs">Portfolio</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard title="NAV" value="—" trend="neutral" />
            <KPICard title="IRR" value="—" trend="neutral" />
            <KPICard title="TVPI" value="—" trend="neutral" />
            <KPICard title="DPI" value="—" trend="neutral" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Performance Chart</CardTitle></CardHeader>
              <CardContent className="h-48 flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-sm" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Cash Flow Timeline</CardTitle></CardHeader>
              <CardContent className="h-48 flex items-center justify-center">
                <Skeleton className="w-full h-full rounded-sm" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Portfolio */}
        <TabsContent value="portfolio" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">No items yet. Add your first investment.</p>
            <Button size="sm" className="gap-1.5 text-xs">
              <Plus size={13} /> Add Item
            </Button>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-full h-10 rounded-sm" />
                ))}
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-4 font-mono">Portfolio table placeholder</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Return Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {['IRR', 'MOIC', 'DPI', 'TVPI', 'RVPI'].map((m) => (
                  <div key={m} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground font-mono">{m}</span>
                    <Badge variant="secondary" className="text-[9px]">—</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Risk Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {['Max Drawdown', 'Volatility', 'Sharpe Ratio', 'J-Curve Depth'].map((m) => (
                  <div key={m} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                    <span className="text-muted-foreground font-mono">{m}</span>
                    <Badge variant="secondary" className="text-[9px]">—</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Future hooks */}
          <Card className="opacity-50">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Coming Soon</p>
              <div className="text-[10px] text-muted-foreground space-y-1">
                <p>• Funds & Commitments Engine (IRR, DPI, TVPI, RVPI, MOIC)</p>
                <p>• Cashflow Ledger (capital calls, distributions, fees)</p>
                <p>• Vintage Year Analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
