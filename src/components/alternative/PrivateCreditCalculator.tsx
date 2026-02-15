import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, Percent, Shield, AlertTriangle, BarChart3, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

const defaultInputs = {
  loanAmount: '100',
  ltv: '65',
  interestMargin: '5.50',
  covenantDscr: '1.25',
  covenantLtv: '75',
  amortYears: '0',
  collateralValue: '155',
  recoveryRate: '60',
};

const covenantScenarios = [
  { scenario: 'Base Case', dscr: '1.45x', ltv: '62%', status: 'pass' },
  { scenario: '-10% Revenue', dscr: '1.18x', ltv: '68%', status: 'warning' },
  { scenario: '-20% Revenue', dscr: '0.95x', ltv: '77%', status: 'breach' },
  { scenario: 'Collateral -15%', dscr: '1.45x', ltv: '73%', status: 'warning' },
];

export function PrivateCreditCalculator() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [isExpanded, setIsExpanded] = useState(false);

  const update = (key: string, val: string) =>
    setInputs((prev) => ({ ...prev, [key]: val }));

  const equityCushion = inputs.collateralValue && inputs.loanAmount
    ? (((parseFloat(inputs.collateralValue) - parseFloat(inputs.loanAmount)) / parseFloat(inputs.collateralValue)) * 100).toFixed(1)
    : '—';

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-sm">
              <CreditCard size={14} className="text-primary" />
            </div>
            <div>
              <span>Private Credit / Direct Lending</span>
              <p className="text-[9px] text-muted-foreground font-normal mt-0.5">Assess loan structure & risk</p>
            </div>
          </CardTitle>
          <Button
            size="sm"
            variant={isExpanded ? 'default' : 'outline'}
            className="text-[10px] h-7 gap-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Open Calculator'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-5">
          {/* Loan Structure */}
          <div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <CreditCard size={9} /> Loan Structure
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InputField label="Loan Amount ($M)" value={inputs.loanAmount} onChange={(v) => update('loanAmount', v)} />
              <InputField label="LTV (%)" value={inputs.ltv} onChange={(v) => update('ltv', v)} />
              <InputField label="Interest Margin (%)" value={inputs.interestMargin} onChange={(v) => update('interestMargin', v)} />
              <InputField label="Amortization (yrs, 0=bullet)" value={inputs.amortYears} onChange={(v) => update('amortYears', v)} />
            </div>
          </div>

          {/* Covenants & Collateral */}
          <div>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Shield size={9} /> Covenants & Collateral
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InputField label="DSCR Covenant" value={inputs.covenantDscr} onChange={(v) => update('covenantDscr', v)} />
              <InputField label="LTV Covenant (%)" value={inputs.covenantLtv} onChange={(v) => update('covenantLtv', v)} />
              <InputField label="Collateral Value ($M)" value={inputs.collateralValue} onChange={(v) => update('collateralValue', v)} />
              <InputField label="Recovery Rate (%)" value={inputs.recoveryRate} onChange={(v) => update('recoveryRate', v)} />
            </div>
          </div>

          {/* Quick Outputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryTile label="Expected Yield" value={`${inputs.interestMargin}%`} />
            <SummaryTile label="Equity Cushion" value={`${equityCushion}%`} />
            <SummaryTile label="Risk-Adj. Return" value="—" note="Run model" />
            <SummaryTile label="Recovery Analysis" value="—" note="Run model" />
          </div>

          {/* Covenant Breach Scenarios */}
          <Card variant="panel" className="border-dashed">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] flex items-center gap-1.5">
                <AlertTriangle size={11} className="text-primary" /> Covenant Breach Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left p-1.5 text-muted-foreground">Scenario</th>
                      <th className="text-center p-1.5 text-muted-foreground">DSCR</th>
                      <th className="text-center p-1.5 text-muted-foreground">LTV</th>
                      <th className="text-center p-1.5 text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {covenantScenarios.map((s) => (
                      <tr key={s.scenario} className="border-b border-border/20">
                        <td className="p-1.5 text-foreground/80">{s.scenario}</td>
                        <td className="text-center p-1.5">{s.dscr}</td>
                        <td className="text-center p-1.5">{s.ltv}</td>
                        <td className="text-center p-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px]",
                              s.status === 'pass' && "border-success/30 text-success",
                              s.status === 'warning' && "border-warning/30 text-warning",
                              s.status === 'breach' && "border-destructive/30 text-destructive",
                            )}
                          >
                            {s.status === 'pass' ? '✓ Pass' : s.status === 'warning' ? '⚠ At Risk' : '✗ Breach'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Downside Recovery / Yield Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card variant="panel" className="border-dashed">
              <CardContent className="p-4">
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Downside Recovery Analysis</p>
                <Skeleton className="h-28 w-full rounded-sm" />
              </CardContent>
            </Card>
            <Card variant="panel" className="border-dashed">
              <CardContent className="p-4">
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Yield vs. Risk Profile</p>
                <Skeleton className="h-28 w-full rounded-sm" />
              </CardContent>
            </Card>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function InputField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] text-muted-foreground font-mono">{label}</p>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 text-xs font-mono bg-muted/20 border-border/50"
      />
    </div>
  );
}

function SummaryTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="kpi-card">
      <p className="terminal-label text-[9px]">{label}</p>
      <p className="font-mono tabular-nums text-base mt-0.5 text-foreground">{value}</p>
      {note && <p className="text-[8px] text-muted-foreground font-mono mt-0.5">{note}</p>}
    </div>
  );
}
