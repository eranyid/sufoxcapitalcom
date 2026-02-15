import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calculator, TrendingUp, TrendingDown, DollarSign, Percent,
  BarChart3, Shield, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ReferenceLine, Area, AreaChart
} from 'recharts';

// ---------- IRR helper (Newton-Raphson) ----------
function computeIRR(cashFlows: number[], maxIter = 100, tol = 1e-7): number | null {
  let rate = 0.15;
  for (let i = 0; i < maxIter; i++) {
    let npv = 0, dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      const d = Math.pow(1 + rate, t);
      npv += cashFlows[t] / d;
      dnpv -= t * cashFlows[t] / (d * (1 + rate));
    }
    if (Math.abs(dnpv) < 1e-12) return null;
    const next = rate - npv / dnpv;
    if (Math.abs(next - rate) < tol) return next;
    rate = next;
  }
  return rate;
}

function pf(v: string, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

const defaultInputs = {
  purchasePrice: '500',
  ebitda: '80',
  seniorDebt: '250',
  mezzDebt: '75',
  pikDebt: '25',
  seniorRate: '5.5',
  mezzRate: '9.0',
  pikRate: '12.0',
  amortYears: '7',
  exitMultiple: '8.0',
  holdingPeriod: '5',
  ebitdaGrowth: '5.0',
  revenueGrowth: '6.0',
};

export function LBOCalculator() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [isExpanded, setIsExpanded] = useState(false);

  const update = (key: string, val: string) =>
    setInputs((prev) => ({ ...prev, [key]: val }));

  const model = useMemo(() => {
    const pp = pf(inputs.purchasePrice);
    const ebitda0 = pf(inputs.ebitda);
    const senior = pf(inputs.seniorDebt);
    const mezz = pf(inputs.mezzDebt);
    const pik0 = pf(inputs.pikDebt);
    const sRate = pf(inputs.seniorRate) / 100;
    const mRate = pf(inputs.mezzRate) / 100;
    const pRate = pf(inputs.pikRate) / 100;
    const amortYrs = pf(inputs.amortYears, 7);
    const exitMult = pf(inputs.exitMultiple);
    const hp = Math.max(1, Math.round(pf(inputs.holdingPeriod)));
    const growth = pf(inputs.ebitdaGrowth) / 100;

    const totalDebt = senior + mezz + pik0;
    const equity = pp - totalDebt;
    const entryMultiple = ebitda0 > 0 ? pp / ebitda0 : 0;
    const leverageRatio = ebitda0 > 0 ? totalDebt / ebitda0 : 0;

    // Build year-by-year model
    const annualAmort = amortYrs > 0 ? senior / amortYrs : 0;
    const schedule: {
      year: number; ebitda: number; seniorBal: number; mezzBal: number; pikBal: number;
      interest: number; totalDebt: number; leverage: number; dscr: number; fcf: number;
    }[] = [];

    let senBal = senior;
    let mezzBal = mezz;
    let pikBal = pik0;

    for (let y = 0; y <= hp; y++) {
      const ebitdaY = ebitda0 * Math.pow(1 + growth, y);
      const intSenior = senBal * sRate;
      const intMezz = mezzBal * mRate;
      const intPik = pikBal * pRate;
      const totalInt = intSenior + intMezz + intPik;
      const amort = y > 0 ? Math.min(annualAmort, senBal) : 0;
      const totalDebtY = senBal + mezzBal + pikBal;
      const leverageY = ebitdaY > 0 ? totalDebtY / ebitdaY : 0;
      const debtService = totalInt + amort;
      const dscr = debtService > 0 ? ebitdaY / debtService : 0;
      const fcf = ebitdaY - totalInt - amort;

      schedule.push({
        year: y, ebitda: ebitdaY, seniorBal: senBal, mezzBal, pikBal,
        interest: totalInt, totalDebt: totalDebtY, leverage: leverageY, dscr, fcf
      });

      // Update balances for next year
      if (y < hp) {
        senBal = Math.max(0, senBal - amort);
        pikBal = pikBal * (1 + pRate); // PIK compounds
      }
    }

    // Exit value
    const exitEbitda = ebitda0 * Math.pow(1 + growth, hp);
    const ev = exitEbitda * exitMult;
    const finalDebt = schedule[hp]?.totalDebt || 0;
    const equityValue = ev - finalDebt;

    // IRR calculation
    const cashFlows = [-equity];
    for (let y = 1; y < hp; y++) cashFlows.push(0); // assume no interim distributions
    cashFlows.push(equityValue);
    const irr = equity > 0 ? computeIRR(cashFlows) : null;
    const moic = equity > 0 ? equityValue / equity : 0;

    // Sensitivity grid
    const exitMults = [6, 7, 8, 9, 10];
    const growths = [0, 3, 5, 7, 10];
    const sensGrid = exitMults.map(em => {
      return growths.map(g => {
        const gRate = g / 100;
        const exitEb = ebitda0 * Math.pow(1 + gRate, hp);
        const evS = exitEb * em;
        // Simplified: use same final debt
        const eqVal = evS - finalDebt;
        const cf = [-equity];
        for (let y = 1; y < hp; y++) cf.push(0);
        cf.push(eqVal);
        const irrS = equity > 0 ? computeIRR(cf) : null;
        return irrS !== null ? (irrS * 100) : null;
      });
    });

    // Chart data for debt paydown
    const debtChart = schedule.map(s => ({
      year: `Y${s.year}`,
      Senior: Math.round(s.seniorBal),
      Mezzanine: Math.round(s.mezzBal),
      PIK: Math.round(s.pikBal),
    }));

    // Leverage chart
    const leverageChart = schedule.map(s => ({
      year: `Y${s.year}`,
      Leverage: parseFloat(s.leverage.toFixed(2)),
      DSCR: parseFloat(s.dscr.toFixed(2)),
    }));

    return {
      totalDebt, equity, entryMultiple, leverageRatio,
      irr, moic, equityValue, exitEbitda, ev, finalDebt,
      sensGrid, exitMults, growths,
      debtChart, leverageChart, schedule
    };
  }, [inputs]);

  const fmtIrr = (v: number | null) => v !== null ? `${(v * 100).toFixed(1)}%` : '—';
  const irrColor = (v: number | null) => {
    if (v === null) return 'bg-muted/30 text-muted-foreground';
    if (v * 100 >= 25) return 'bg-success/15 text-success';
    if (v * 100 >= 20) return 'bg-emerald-500/10 text-emerald-400';
    if (v * 100 >= 15) return 'bg-primary/10 text-primary';
    if (v * 100 >= 10) return 'bg-amber-500/10 text-amber-400';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-sm">
              <Calculator size={14} className="text-primary" />
            </div>
            <div>
              <span>LBO Feasibility Calculator</span>
              <p className="text-[9px] text-muted-foreground font-normal mt-0.5">Evaluate leveraged acquisition viability</p>
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
          {/* Input Grid */}
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <DollarSign size={9} /> Transaction
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InputField label="Purchase Price ($M)" value={inputs.purchasePrice} onChange={(v) => update('purchasePrice', v)} />
                <InputField label="EBITDA ($M)" value={inputs.ebitda} onChange={(v) => update('ebitda', v)} />
                <div className="space-y-1">
                  <p className="text-[9px] text-muted-foreground font-mono">Entry Multiple</p>
                  <div className="h-9 bg-muted/30 border border-border rounded-sm flex items-center px-3 text-xs font-mono text-primary">
                    {model.entryMultiple > 0 ? `${model.entryMultiple.toFixed(1)}x` : '—'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Layers size={9} /> Debt Structure
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <InputField label="Senior Debt ($M)" value={inputs.seniorDebt} onChange={(v) => update('seniorDebt', v)} />
                <InputField label="Mezz Debt ($M)" value={inputs.mezzDebt} onChange={(v) => update('mezzDebt', v)} />
                <InputField label="PIK Debt ($M)" value={inputs.pikDebt} onChange={(v) => update('pikDebt', v)} />
                <InputField label="Senior Rate (%)" value={inputs.seniorRate} onChange={(v) => update('seniorRate', v)} />
                <InputField label="Mezz Rate (%)" value={inputs.mezzRate} onChange={(v) => update('mezzRate', v)} />
                <InputField label="PIK Rate (%)" value={inputs.pikRate} onChange={(v) => update('pikRate', v)} />
              </div>
            </div>

            <div>
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <TrendingUp size={9} /> Exit Assumptions
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InputField label="Exit Multiple (x)" value={inputs.exitMultiple} onChange={(v) => update('exitMultiple', v)} />
                <InputField label="Holding Period (yrs)" value={inputs.holdingPeriod} onChange={(v) => update('holdingPeriod', v)} />
                <InputField label="EBITDA Growth (%)" value={inputs.ebitdaGrowth} onChange={(v) => update('ebitdaGrowth', v)} />
                <InputField label="Amortization (yrs)" value={inputs.amortYears} onChange={(v) => update('amortYears', v)} />
              </div>
            </div>
          </div>

          {/* Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <SummaryTile label="Total Debt" value={`$${model.totalDebt.toFixed(0)}M`} />
            <SummaryTile label="Equity Check" value={`$${model.equity.toFixed(0)}M`} variant={model.equity > 0 ? 'neutral' : 'danger'} />
            <SummaryTile label="Leverage" value={`${model.leverageRatio.toFixed(1)}x`} />
            <SummaryTile label="Equity IRR" value={fmtIrr(model.irr)} variant={model.irr && model.irr > 0.15 ? 'success' : 'neutral'} />
            <SummaryTile label="MOIC" value={`${model.moic.toFixed(2)}x`} />
          </div>

          {/* Debt Paydown Chart */}
          <Card variant="panel">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] flex items-center gap-1.5">
                <TrendingDown size={11} className="text-primary" /> Debt Paydown Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={model.debtChart} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 4, fontSize: 11 }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="Senior" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="Mezzanine" stackId="a" fill="hsl(35, 92%, 55%)" />
                    <Bar dataKey="PIK" stackId="a" fill="hsl(0, 72%, 55%)" radius={[2, 2, 0, 0]} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sensitivity Grid */}
          <Card variant="panel">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] flex items-center gap-1.5">
                <Shield size={11} className="text-primary" /> Sensitivity Analysis — Equity IRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] font-mono">
                  <thead>
                    <tr>
                      <th className="text-left p-1.5 text-muted-foreground border-b border-border/30">Exit ↓ / Growth →</th>
                      {model.growths.map((g) => (
                        <th key={g} className="text-center p-1.5 text-muted-foreground border-b border-border/30">{g}%</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {model.exitMults.map((em, ri) => (
                      <tr key={em}>
                        <td className="p-1.5 text-muted-foreground border-b border-border/20">{em.toFixed(1)}x</td>
                        {model.sensGrid[ri].map((irrVal, ci) => (
                          <td key={ci} className="text-center p-1.5 border-b border-border/20">
                            <span className={cn("px-1.5 py-0.5 rounded-sm text-[9px]", irrColor(irrVal !== null ? irrVal / 100 : null))}>
                              {irrVal !== null ? `${irrVal.toFixed(1)}%` : '—'}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-muted-foreground font-mono mt-2 text-right">
                Green ≥25% · Teal ≥20% · Blue ≥15% · Amber ≥10% · Red &lt;10%
              </p>
            </CardContent>
          </Card>

          {/* Leverage & DSCR Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card variant="panel">
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px]">Leverage Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={model.leverageChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 10 }} />
                      <Area type="monotone" dataKey="Leverage" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} />
                      <ReferenceLine y={6} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: '6x', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card variant="panel">
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px]">DSCR Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={model.leverageChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 10 }} />
                      <Line type="monotone" dataKey="DSCR" stroke="hsl(35, 92%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                      <ReferenceLine y={1.25} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: 'Min', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
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

function SummaryTile({ label, value, note, variant = 'neutral' }: { label: string; value: string; note?: string; variant?: 'neutral' | 'danger' | 'success' }) {
  return (
    <div className="kpi-card">
      <p className="terminal-label text-[9px]">{label}</p>
      <p className={cn(
        "font-mono tabular-nums text-base mt-0.5",
        variant === 'danger' ? "text-destructive" : variant === 'success' ? "text-success" : "text-foreground"
      )}>
        {value}
      </p>
      {note && <p className="text-[8px] text-muted-foreground font-mono mt-0.5">{note}</p>}
    </div>
  );
}
