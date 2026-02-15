import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/dashboard/KPICard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Upload, Settings, AlertTriangle, Clock, FileWarning, TrendingUp,
  Building2, Rocket, CreditCard, Home, Landmark, BarChart3,
  ArrowRight, Wrench, Calculator, DollarSign, FolderKanban
} from 'lucide-react';
import { cn } from '@/lib/utils';

const assetClasses = [
  {
    key: 'private-equity',
    title: 'Private Equity',
    abbr: 'PE',
    tagline: 'Buyouts, growth equity, secondaries',
    icon: Building2,
    links: ['LBO Lab (soon)', 'Funds (soon)'],
  },
  {
    key: 'venture-capital',
    title: 'Venture Capital',
    abbr: 'VC',
    tagline: 'Early-stage to late-stage venture',
    icon: Rocket,
    links: ['Portfolio (soon)', 'Rounds (soon)'],
  },
  {
    key: 'private-credit',
    title: 'Private Credit',
    abbr: 'PC',
    tagline: 'Direct lending, mezzanine, distressed',
    icon: CreditCard,
    links: ['Debt Calculator (soon)', 'Covenants (soon)'],
  },
  {
    key: 'real-estate',
    title: 'Real Estate',
    abbr: 'RE',
    tagline: 'Core, value-add, opportunistic',
    icon: Home,
    links: ['Projects (soon)', 'Valuations (soon)'],
  },
  {
    key: 'real-assets',
    title: 'Real Assets / Infra',
    abbr: 'RA',
    tagline: 'Infra, energy, commodities-linked',
    icon: Landmark,
    links: ['Assets (soon)', 'Cashflows (soon)'],
  },
  {
    key: 'hedge-funds-alts',
    title: 'Hedge Funds / Alts',
    abbr: 'HF',
    tagline: 'HFs, liquid alts, multi-strat',
    icon: BarChart3,
    links: ['Exposure (soon)', 'Risk (soon)'],
  },
];

const toolboxItems = [
  { title: 'LBO Calculator', desc: 'Excel-like leveraged buyout modeling', icon: Calculator },
  { title: 'Private Debt Calculator', desc: 'Debt structuring & covenant analysis', icon: DollarSign },
  { title: 'Funds Management', desc: 'Commitments, cash flows, NAV, DPI/TVPI/IRR', icon: FolderKanban },
];

const alerts = [
  { text: 'Missing quarterly NAV update', icon: FileWarning, color: 'text-warning' },
  { text: 'Capital call due in 7 days', icon: Clock, color: 'text-info' },
  { text: 'Document missing: LPA', icon: AlertTriangle, color: 'text-destructive' },
  { text: 'Unfunded exposure > threshold', icon: TrendingUp, color: 'text-warning' },
];

export default function AlternativeHub() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Alternative Investments</h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">Family Office-grade toolkit for private markets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5">
            <Plus size={14} /> New Investment
          </Button>
          <Button size="sm" variant="secondary" className="gap-1.5">
            <Upload size={14} /> Import
          </Button>
          <Button size="sm" variant="ghost" className="gap-1.5">
            <Settings size={14} /> Settings
          </Button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-border scrollbar-thin">
        <button
          onClick={() => navigate('/alternative')}
          className={cn(
            "px-3 py-1.5 text-[11px] font-medium rounded-sm transition-colors whitespace-nowrap",
            location.pathname === '/alternative'
              ? "bg-primary/15 text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Hub
        </button>
        {assetClasses.map((ac) => (
          <button
            key={ac.key}
            onClick={() => navigate(`/alternative/${ac.key}`)}
            className={cn(
              "px-3 py-1.5 text-[11px] font-medium rounded-sm transition-colors whitespace-nowrap",
              location.pathname === `/alternative/${ac.key}`
                ? "bg-primary/15 text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {ac.abbr}
          </button>
        ))}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Total NAV" value="—" subtitle="Pending data" trend="neutral" />
        <KPICard title="Paid-In (PIC)" value="—" subtitle="Pending data" trend="neutral" />
        <KPICard title="Distributions" value="—" subtitle="Pending data" trend="neutral" />
        <KPICard title="TVPI" value="—" subtitle="Pending data" trend="neutral" />
        <KPICard title="DPI" value="—" subtitle="Pending data" trend="neutral" />
        <KPICard title="Unfunded" value="—" subtitle="Pending data" trend="neutral" />
      </div>

      {/* Main content: Grid + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Asset Class Cards */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {assetClasses.map((ac) => {
              const Icon = ac.icon;
              return (
                <Card
                  key={ac.key}
                  className="group cursor-pointer hover:border-primary/40 transition-all duration-200 hover:shadow-[0_0_20px_-8px_hsl(var(--primary)/0.3)]"
                  onClick={() => navigate(`/alternative/${ac.key}`)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-primary/10 border border-primary/20 rounded-sm">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono">{ac.abbr}</Badge>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{ac.title}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{ac.tagline}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ac.links.map((link) => (
                        <span key={link} className="text-[9px] px-1.5 py-0.5 bg-muted/50 rounded text-muted-foreground font-mono">
                          {link}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-end">
                      <span className="text-[10px] text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight size={10} />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Toolbox */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Wrench size={12} /> Toolbox — Coming Soon
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {toolboxItems.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card key={tool.title} className="opacity-60">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-muted-foreground" />
                        <span className="text-xs font-semibold">{tool.title}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{tool.desc}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className="text-[8px]">Coming soon</Badge>
                        <Button size="sm" variant="ghost" disabled className="text-[10px] h-6 px-2">
                          Open
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alerts sidebar */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions & Alerts</h2>
          <Card>
            <CardContent className="p-3 space-y-2">
              {alerts.map((alert, i) => {
                const Icon = alert.icon;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2 rounded-sm hover:bg-muted/30 transition-colors cursor-pointer"
                  >
                    <Icon size={13} className={cn("mt-0.5 shrink-0", alert.color)} />
                    <span className="text-[11px] text-foreground/80">{alert.text}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Future hooks */}
          <Card className="opacity-50">
            <CardContent className="p-3 space-y-2">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">Future Modules</p>
              <div className="space-y-1.5 text-[10px] text-muted-foreground">
                <p>• Funds & Commitments Engine</p>
                <p>• Cashflow Ledger</p>
                <p>• Excel-like Calculators</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
