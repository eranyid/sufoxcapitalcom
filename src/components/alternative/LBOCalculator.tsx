import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calculator, ArrowRight, TrendingUp, TrendingDown, DollarSign, Percent,
  BarChart3, Shield, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
};

const sensitivityGrid = {
  rows: ['6.0x', '7.0x', '8.0x', '9.0x', '10.0x'],
  cols: ['0%', '3%', '5%', '7%', '10%'],
};

export function LBOCalculator() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [isExpanded, setIsExpanded] = useState(false);

  const update = (key: string, val: string) =>
    setInputs((prev) => ({ ...prev, [key]: val }));

  const entryMultiple = inputs.ebitda !== '0' && inputs.ebitda
    ? (parseFloat(inputs.purchasePrice) / parseFloat(inputs.ebitda)).toFixed(1)
    : '—';

  const totalDebt = (
    parseFloat(inputs.seniorDebt || '0') +
    parseFloat(inputs.mezzDebt || '0') +
    parseFloat(inputs.pikDebt || '0')
  );

  const equityCheck = parseFloat(inputs.purchasePrice || '0') - totalDebt;
  const leverageRatio = inputs.ebitda !== '0' && inputs.ebitda
    ? (totalDebt / parseFloat(inputs.ebitda)).toFixed(1)
    : '—';

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
            {/* Transaction */}
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
                    {entryMultiple}x
                  </div>
                </div>
              </div>
            </div>

            {/* Debt Structure */}
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

            {/* Exit & Growth */}
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

          {/* Quick Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryTile label="Total Debt" value={`$${totalDebt}M`} />
            <SummaryTile label="Equity Check" value={`$${equityCheck.toFixed(0)}M`} variant={equityCheck > 0 ? 'neutral' : 'danger'} />
            <SummaryTile label="Leverage" value={`${leverageRatio}x`} />
            <SummaryTile label="Equity IRR" value="—" note="Run model" />
          </div>

          {/* Debt Paydown Schedule placeholder */}
          <Card variant="panel" className="border-dashed">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] flex items-center gap-1.5">
                <TrendingDown size={11} className="text-primary" /> Debt Paydown Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-36 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <BarChart3 size={20} className="text-muted-foreground/30 mx-auto" />
                  <p className="text-[10px] text-muted-foreground font-mono">Stacked bar chart — Senior / Mezz / PIK over holding period</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sensitivity Grid */}
          <Card variant="panel" className="border-dashed">
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
                      <th className="text-left p-1.5 text-muted-foreground border-b border-border/30">Exit / Growth →</th>
                      {sensitivityGrid.cols.map((c) => (
                        <th key={c} className="text-center p-1.5 text-muted-foreground border-b border-border/30">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sensitivityGrid.rows.map((row, ri) => (
                      <tr key={row}>
                        <td className="p-1.5 text-muted-foreground border-b border-border/20">{row}</td>
                        {sensitivityGrid.cols.map((_, ci) => (
                          <td key={ci} className="text-center p-1.5 border-b border-border/20">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-sm text-[9px]",
                              ri + ci > 5 ? "bg-success/10 text-success" :
                              ri + ci > 3 ? "bg-primary/10 text-primary" :
                              "bg-muted/30 text-muted-foreground"
                            )}>
                              —
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[8px] text-muted-foreground font-mono mt-2 text-right">
                Green = IRR &gt; 20% · Orange = 15–20% · Grey = &lt; 15%
              </p>
            </CardContent>
          </Card>

          {/* DSCR placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card variant="panel" className="border-dashed">
              <CardContent className="p-4">
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Leverage Ratios Over Time</p>
                <Skeleton className="h-28 w-full rounded-sm" />
              </CardContent>
            </Card>
            <Card variant="panel" className="border-dashed">
              <CardContent className="p-4">
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2">DSCR Analysis</p>
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

function SummaryTile({ label, value, note, variant = 'neutral' }: { label: string; value: string; note?: string; variant?: 'neutral' | 'danger' }) {
  return (
    <div className="kpi-card">
      <p className="terminal-label text-[9px]">{label}</p>
      <p className={cn(
        "font-mono tabular-nums text-base mt-0.5",
        variant === 'danger' ? "text-destructive" : "text-foreground"
      )}>
        {value}
      </p>
      {note && <p className="text-[8px] text-muted-foreground font-mono mt-0.5">{note}</p>}
    </div>
  );
}
