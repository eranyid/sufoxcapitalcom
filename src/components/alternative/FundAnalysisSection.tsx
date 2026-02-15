import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/dashboard/KPICard';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Info, Building2, Globe, Target, Users, DollarSign, TrendingUp,
  ShieldCheck, Eye, Handshake, BarChart3, Clock, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const fundTypes = [
  { label: 'Private Equity', route: 'private-equity' },
  { label: 'Venture Capital', route: 'venture-capital' },
  { label: 'Private Credit', route: 'private-credit' },
  { label: 'Real Estate', route: 'real-estate' },
  { label: 'Infrastructure', route: 'real-assets' },
  { label: 'Secondaries & Co-investments', route: '' },
];

const performanceMetrics = [
  { label: 'Net IRR', value: '—', tooltip: 'Internal Rate of Return net of fees and carry. The most common measure of PE/VC fund performance.' },
  { label: 'Gross IRR', value: '—', tooltip: 'Internal Rate of Return before fees and carry deductions.' },
  { label: 'TVPI', value: '—', tooltip: 'Total Value to Paid-In Capital. Sum of distributions and residual value divided by paid-in capital.' },
  { label: 'DPI', value: '—', tooltip: 'Distributions to Paid-In Capital. Realized cash returned to LPs relative to invested capital.' },
  { label: 'RVPI', value: '—', tooltip: 'Residual Value to Paid-In Capital. Remaining NAV relative to invested capital.' },
  { label: 'MOIC', value: '—', tooltip: 'Multiple on Invested Capital. Total value created per dollar invested.' },
  { label: 'PME', value: '—', tooltip: 'Public Market Equivalent. Compares fund returns to a public benchmark index.' },
];

const cashFlowEvents = [
  { type: 'Capital Call', date: 'Pending', status: 'placeholder' },
  { type: 'Distribution', date: 'Pending', status: 'placeholder' },
  { type: 'NAV Update', date: 'Pending', status: 'placeholder' },
  { type: 'Capital Call', date: 'Pending', status: 'placeholder' },
];

const ddSections = [
  {
    title: 'Track Record',
    icon: BarChart3,
    items: ['Historical fund performance dispersion', 'Quartile ranking', 'Persistence analysis'],
  },
  {
    title: 'Strategy & Edge',
    icon: Target,
    items: ['Sourcing advantage', 'Operational value creation', 'Sector specialization'],
  },
  {
    title: 'Risk Assessment',
    icon: ShieldCheck,
    items: ['Leverage usage', 'Concentration risk', 'Exit dependency', 'Valuation methodology'],
  },
  {
    title: 'Operational Due Diligence',
    icon: Eye,
    items: ['Governance & controls', 'Reporting transparency', 'Conflicts of interest', 'Key person risk'],
  },
  {
    title: 'Alignment of Interests',
    icon: Handshake,
    items: ['GP commitment', 'Fee structure', 'Carry hurdles & waterfalls'],
  },
];

export function FundAnalysisSection() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Fund Type Selector */}
      <div>
        <p className="terminal-label text-[9px] mb-2">FUND TYPE — Click to open dedicated workspace</p>
        <div className="flex flex-wrap gap-1.5">
          {fundTypes.map((ft, i) => (
            <Badge
              key={ft.label}
              variant={i === 0 ? 'default' : 'outline'}
              className={cn(
                "text-[10px] cursor-pointer transition-all",
                i === 0 ? "bg-primary/20 text-primary border-primary/30" : "hover:bg-muted/50"
              )}
              onClick={() => ft.route && navigate(`/alternative/${ft.route}`)}
            >
              {ft.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Fund Profile Panel */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-xs">
            <Building2 size={14} className="text-primary" />
            Fund Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Strategy', value: '—', icon: Target },
              { label: 'Vintage Year', value: '—', icon: Clock },
              { label: 'Geography', value: '—', icon: Globe },
              { label: 'Sector Focus', value: '—', icon: BarChart3 },
              { label: 'Fund Size', value: '—', icon: DollarSign },
              { label: 'GP Commitment', value: '—', icon: Handshake },
              { label: 'LP Base', value: '—', icon: Users },
              { label: 'Status', value: '—', icon: CheckCircle2 },
            ].map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.label} className="space-y-1">
                  <p className="text-[9px] text-muted-foreground font-mono flex items-center gap-1">
                    <Icon size={10} className="text-muted-foreground/60" />
                    {field.label}
                  </p>
                  <Skeleton className="h-5 w-full rounded-sm" />
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" className="text-[10px] h-7 gap-1">
              <Info size={10} /> Load Fund Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div>
        <p className="terminal-label text-[9px] mb-2">PERFORMANCE METRICS</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {performanceMetrics.map((m) => (
            <KPICard
              key={m.label}
              title={m.label}
              value={m.value}
              subtitle="Pending data"
              trend="neutral"
              tooltip={m.tooltip}
            />
          ))}
        </div>
      </div>

      {/* Cash Flow Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            Cash Flow Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-4 border-l border-border/50 space-y-4">
            {cashFlowEvents.map((evt, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-muted border-2 border-border" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium">{evt.type}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{evt.date}</p>
                  </div>
                  <Badge variant="outline" className="text-[8px]">Placeholder</Badge>
                </div>
              </div>
            ))}
          </div>
          {/* Chart placeholder */}
          <div className="mt-4 h-32 bg-muted/20 border border-dashed border-border/50 rounded-sm flex items-center justify-center">
            <p className="text-[10px] text-muted-foreground font-mono">Cash Flow Chart — Connect fund data</p>
          </div>
        </CardContent>
      </Card>

      {/* Manager Evaluation (Due Diligence) */}
      <div>
        <p className="terminal-label text-[9px] mb-2">MANAGER EVALUATION — DUE DILIGENCE</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ddSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-sm">
                      <Icon size={12} className="text-primary" />
                    </div>
                    <h4 className="text-[11px] font-semibold">{section.title}</h4>
                  </div>
                  <ul className="space-y-1.5">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Skeleton className="h-16 w-full rounded-sm" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
