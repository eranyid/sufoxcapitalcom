import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, Shield, AlertTriangle, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine, Legend
} from 'recharts';

function pf(v: string, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

const defaultInputs = {
  loanAmount: '100',
  ltv: '65',
  interestMargin: '5.50',
  baseRate: '4.50',
  covenantDscr: '1.25',
  covenantLtv: '75',
  amortYears: '0',
  maturityYears: '5',
  collateralValue: '155',
  recoveryRate: '60',
  defaultProb: '3.0',
};

export function PrivateCreditCalculator() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [isExpanded, setIsExpanded] = useState(false);

  const update = (key: string, val: string) =>
    setInputs((prev) => ({ ...prev, [key]: val }));

  const model = useMemo(() => {
    const loan = pf(inputs.loanAmount);
    const ltv = pf(inputs.ltv) / 100;
    const margin = pf(inputs.interestMargin) / 100;
    const baseRate = pf(inputs.baseRate) / 100;
    const covDscr = pf(inputs.covenantDscr);
    const covLtv = pf(inputs.covenantLtv) / 100;
    const collateral = pf(inputs.collateralValue);
    const recovery = pf(inputs.recoveryRate) / 100;
    const defProb = pf(inputs.defaultProb) / 100;
    const maturity = Math.max(1, Math.round(pf(inputs.maturityYears)));
    const amortYrs = pf(inputs.amortYears);
    const isBullet = amortYrs === 0;

    const allInYield = margin + baseRate;
    const equityCushion = collateral > 0 ? ((collateral - loan) / collateral) * 100 : 0;
    const expectedLoss = defProb * (1 - recovery) * loan;
    const riskAdjReturn = allInYield - (defProb * (1 - recovery));

    // Covenant breach scenarios
    const scenarios = [
      { scenario: 'Base Case', revShock: 0, collShock: 0 },
      { scenario: '-10% Revenue', revShock: -0.10, collShock: 0 },
      { scenario: '-20% Revenue', revShock: -0.20, collShock: 0 },
      { scenario: '-30% Revenue', revShock: -0.30, collShock: 0 },
      { scenario: 'Collateral -15%', revShock: 0, collShock: -0.15 },
      { scenario: 'Stress: Rev -20%, Coll -15%', revShock: -0.20, collShock: -0.15 },
    ];

    // Assume base DSCR ~ 1.5 * (1 + revShock)
    const baseDscr = 1.50;
    const covenantResults = scenarios.map(s => {
      const adjDscr = baseDscr * (1 + s.revShock);
      const adjCollateral = collateral * (1 + s.collShock);
      const adjLtv = adjCollateral > 0 ? (loan / adjCollateral) * 100 : 100;
      const dscrPass = adjDscr >= covDscr;
      const ltvPass = adjLtv / 100 <= covLtv;
      const status = dscrPass && ltvPass ? 'pass' : (!dscrPass && !ltvPass) ? 'breach' : 'warning';
      return { ...s, dscr: adjDscr.toFixed(2), ltv: `${adjLtv.toFixed(1)}%`, status };
    });

    // Recovery waterfall chart
    const lossGivenDefault = loan * (1 - recovery);
    const recoveryWaterfall = [
      { name: 'Loan Amount', value: Math.round(loan), fill: 'hsl(var(--primary))' },
      { name: 'Recovery Value', value: Math.round(loan * recovery), fill: 'hsl(142, 71%, 45%)' },
      { name: 'Loss Given Default', value: Math.round(lossGivenDefault), fill: 'hsl(0, 72%, 55%)' },
    ];

    // Yield profile over maturity
    const yieldProfile = Array.from({ length: maturity + 1 }, (_, y) => {
      const cumInterest = allInYield * y * loan;
      const cumExpLoss = defProb * (1 - recovery) * loan * y;
      return {
        year: `Y${y}`,
        'Gross Yield': parseFloat((allInYield * 100).toFixed(2)),
        'Risk-Adj Yield': parseFloat((riskAdjReturn * 100).toFixed(2)),
        'Cumulative Income': Math.round(cumInterest),
      };
    });

    return {
      allInYield, equityCushion, expectedLoss, riskAdjReturn,
      covenantResults, recoveryWaterfall, yieldProfile, loan
    };
  }, [inputs]);

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
              <InputField label="Base Rate (%)" value={inputs.baseRate} onChange={(v) => update('baseRate', v)} />
              <InputField label="Maturity (yrs)" value={inputs.maturityYears} onChange={(v) => update('maturityYears', v)} />
              <InputField label="Amort (yrs, 0=bullet)" value={inputs.amortYears} onChange={(v) => update('amortYears', v)} />
              <InputField label="Default Probability (%)" value={inputs.defaultProb} onChange={(v) => update('defaultProb', v)} />
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
            <SummaryTile label="All-In Yield" value={`${(model.allInYield * 100).toFixed(2)}%`} variant="success" />
            <SummaryTile label="Equity Cushion" value={`${model.equityCushion.toFixed(1)}%`} />
            <SummaryTile label="Risk-Adj. Return" value={`${(model.riskAdjReturn * 100).toFixed(2)}%`} />
            <SummaryTile label="Expected Loss" value={`$${model.expectedLoss.toFixed(1)}M`} variant={model.expectedLoss > model.loan * 0.05 ? 'danger' : 'neutral'} />
          </div>

          {/* Covenant Breach Scenarios */}
          <Card variant="panel">
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
                    {model.covenantResults.map((s) => (
                      <tr key={s.scenario} className="border-b border-border/20">
                        <td className="p-1.5 text-foreground/80">{s.scenario}</td>
                        <td className="text-center p-1.5">{s.dscr}x</td>
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

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card variant="panel">
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px]">Recovery Waterfall</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={model.recoveryWaterfall}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 10 }} />
                      <Bar dataKey="value" fill="hsl(var(--primary))">
                        {model.recoveryWaterfall.map((entry, i) => (
                          <rect key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card variant="panel">
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px]">Yield Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={model.yieldProfile}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 10 }} />
                      <Line type="monotone" dataKey="Gross Yield" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Risk-Adj Yield" stroke="hsl(35, 92%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
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

function SummaryTile({ label, value, variant = 'neutral' }: { label: string; value: string; variant?: 'neutral' | 'danger' | 'success' }) {
  return (
    <div className="kpi-card">
      <p className="terminal-label text-[9px]">{label}</p>
      <p className={cn(
        "font-mono tabular-nums text-base mt-0.5",
        variant === 'danger' ? "text-destructive" : variant === 'success' ? "text-success" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  );
}
