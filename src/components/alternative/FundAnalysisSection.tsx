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
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

const performanceMetrics = [
  { label: 'Net IRR', value: '—', tooltip: 'Internal Rate of Return net of fees and carry.' },
  { label: 'Gross IRR', value: '—', tooltip: 'Internal Rate of Return before fees and carry.' },
  { label: 'TVPI', value: '—', tooltip: 'Total Value to Paid-In Capital.' },
  { label: 'DPI', value: '—', tooltip: 'Distributions to Paid-In Capital.' },
  { label: 'RVPI', value: '—', tooltip: 'Residual Value to Paid-In Capital.' },
  { label: 'MOIC', value: '—', tooltip: 'Multiple on Invested Capital.' },
  { label: 'PME', value: '—', tooltip: 'Public Market Equivalent vs benchmark.' },
];

// Sample J-Curve data
const jCurveData = Array.from({ length: 11 }, (_, y) => {
  // Typical J-curve: negative first 3 years, then recovery
  const nav = y <= 1 ? -5 * (y + 1) : y <= 3 ? -10 + (y - 1) * 6 : -10 + (y - 1) * 6 + (y - 3) * 4;
  return { year: `Y${y}`, NAV: Math.round(nav), Cumulative: Math.round(nav * 0.8) };
});

const cashFlowEvents = [
  { type: 'Capital Call #1', date: 'Q1 2024', amount: '$15M', status: 'completed' },
  { type: 'Capital Call #2', date: 'Q3 2024', amount: '$10M', status: 'completed' },
  { type: 'NAV Update', date: 'Q4 2024', amount: '$28M', status: 'completed' },
  { type: 'Distribution', date: 'Q1 2025', amount: '$3M', status: 'pending' },
  { type: 'Capital Call #3', date: 'Q2 2025', amount: '$8M', status: 'upcoming' },
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
    title: 'Operational DD',
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
  return (
    <div className="space-y-6">
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
              { label: 'Strategy', icon: Target },
              { label: 'Vintage Year', icon: Clock },
              { label: 'Geography', icon: Globe },
              { label: 'Sector Focus', icon: BarChart3 },
              { label: 'Fund Size', icon: DollarSign },
              { label: 'GP Commitment', icon: Handshake },
              { label: 'LP Base', icon: Users },
              { label: 'Status', icon: CheckCircle2 },
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

      {/* J-Curve Visualization */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-2">
            <TrendingUp size={14} className="text-primary" />
            J-Curve Projection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={jCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                <RTooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 10 }}
                />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="NAV"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[8px] text-muted-foreground font-mono mt-2 text-center">
            Illustrative J-curve pattern — actual data will populate from fund records
          </p>
        </CardContent>
      </Card>

      {/* Cash Flow Timeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-2">
            <DollarSign size={14} className="text-primary" />
            Cash Flow Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-4 border-l-2 border-border/50 space-y-4">
            {cashFlowEvents.map((evt, i) => (
              <div key={i} className="relative">
                <div className={cn(
                  "absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2",
                  evt.status === 'completed' ? "bg-success border-success/50" :
                  evt.status === 'pending' ? "bg-primary border-primary/50" :
                  "bg-muted border-border"
                )} />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium">{evt.type}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{evt.date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-foreground">{evt.amount}</span>
                    <Badge variant="outline" className={cn(
                      "text-[8px]",
                      evt.status === 'completed' && "border-success/30 text-success",
                      evt.status === 'pending' && "border-primary/30 text-primary",
                      evt.status === 'upcoming' && "border-muted-foreground/30 text-muted-foreground",
                    )}>
                      {evt.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
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
