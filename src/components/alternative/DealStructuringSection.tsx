import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calculator, CreditCard, Scale, ArrowRight,
  DollarSign, Percent, TrendingUp, Shield, BarChart3, Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

const calculators = [
  {
    key: 'lbo',
    title: 'LBO Feasibility Calculator',
    subtitle: 'Evaluate leveraged acquisition viability',
    icon: Calculator,
    inputs: [
      'Purchase price', 'EBITDA', 'Debt structure (Senior / Mezz / PIK)',
      'Interest rates', 'Amortization schedule', 'Exit multiple', 'Holding period',
    ],
    outputs: [
      'IRR to equity', 'Debt paydown schedule', 'Leverage ratios over time',
      'DSCR', 'Sensitivity grid (exit multiple & EBITDA growth)',
    ],
  },
  {
    key: 'credit',
    title: 'Private Credit / Direct Lending',
    subtitle: 'Assess loan structure & risk',
    icon: CreditCard,
    inputs: [
      'Loan amount', 'LTV', 'Interest margin', 'Covenant thresholds',
      'Amortization vs bullet', 'Collateral value', 'Default recovery rate',
    ],
    outputs: [
      'Expected yield', 'Downside recovery analysis',
      'Covenant breach scenarios', 'Risk-adjusted return',
    ],
  },
  {
    key: 'conventionality',
    title: 'Deal Conventionality Analyzer',
    subtitle: 'Determine if deal structure fits market norms',
    icon: Scale,
    inputs: [
      'Leverage vs industry standards', 'Pricing vs market spreads',
      'Covenant strength', 'Equity cushion', 'Structural protections',
    ],
    outputs: [
      'Conservative / Market Standard / Aggressive classification',
      'Benchmark comparison', 'Risk flag summary',
    ],
  },
];

export function DealStructuringSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="terminal-label text-[9px]">DEAL STRUCTURING & FINANCIAL CALCULATORS</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Excel-like financial modeling environment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {calculators.map((calc) => {
          const Icon = calc.icon;
          return (
            <Card key={calc.key} className="hover:border-primary/30 transition-all group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-sm">
                      <Icon size={14} className="text-primary" />
                    </div>
                    <div>
                      <span>{calc.title}</span>
                      <p className="text-[9px] text-muted-foreground font-normal mt-0.5">{calc.subtitle}</p>
                    </div>
                  </CardTitle>
                  <Badge variant="secondary" className="text-[8px]">Coming Soon</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inputs */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <Layers size={9} /> Inputs
                    </p>
                    <div className="space-y-1.5">
                      {calc.inputs.map((input) => (
                        <div key={input} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />
                          <span className="text-[10px] text-foreground/70">{input}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Outputs */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <BarChart3 size={9} /> Outputs
                    </p>
                    <div className="space-y-1.5">
                      {calc.outputs.map((output) => (
                        <div key={output} className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-success/40 shrink-0" />
                          <span className="text-[10px] text-foreground/70">{output}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* Calculator placeholder area */}
                <div className="h-40 bg-muted/10 border border-dashed border-border/40 rounded-sm flex flex-col items-center justify-center gap-2">
                  <Icon size={24} className="text-muted-foreground/30" />
                  <p className="text-[10px] text-muted-foreground font-mono">Calculator workspace — Coming soon</p>
                  <Button size="sm" variant="outline" disabled className="text-[10px] h-7 gap-1">
                    Launch <ArrowRight size={10} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
