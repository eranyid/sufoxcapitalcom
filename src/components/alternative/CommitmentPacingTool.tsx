import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend, BarChart, Bar,
} from 'recharts';

function pf(v: string, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

const defaultInputs = {
  totalTarget: '500',
  currentCommitted: '350',
  currentDeployed: '200',
  annualPacing: '80',
  avgDrawdownRate: '25',
  avgDistributionRate: '15',
  forecastYears: '5',
};

export function CommitmentPacingTool() {
  const [inputs, setInputs] = useState(defaultInputs);
  const [isExpanded, setIsExpanded] = useState(false);

  const update = (key: string, val: string) =>
    setInputs(prev => ({ ...prev, [key]: val }));

  const model = useMemo(() => {
    const target = pf(inputs.totalTarget);
    const committed = pf(inputs.currentCommitted);
    const deployed = pf(inputs.currentDeployed);
    const pacing = pf(inputs.annualPacing);
    const drawRate = pf(inputs.avgDrawdownRate) / 100;
    const distRate = pf(inputs.avgDistributionRate) / 100;
    const years = Math.max(1, Math.round(pf(inputs.forecastYears)));

    const unfunded = committed - deployed;
    const remaining = target - committed;
    const yearsToTarget = pacing > 0 ? remaining / pacing : 0;

    // Build forecast
    const forecast: {
      year: string; commitments: number; drawdowns: number; distributions: number;
      netCashFlow: number; unfundedBal: number; navEstimate: number;
    }[] = [];

    let cumCommitted = committed;
    let cumDeployed = deployed;
    let cumDistributed = 0;
    let navEst = deployed * 1.1; // assume starting NAV = 1.1x deployed

    for (let y = 0; y <= years; y++) {
      const newCommit = y === 0 ? 0 : Math.min(pacing, Math.max(0, target - cumCommitted));
      const drawdown = (cumCommitted - cumDeployed) * drawRate;
      const dist = navEst * distRate;

      if (y > 0) {
        cumCommitted += newCommit;
        cumDeployed += drawdown;
        cumDistributed += dist;
        navEst = navEst + drawdown * 1.15 - dist; // simplified growth model
      }

      forecast.push({
        year: `Y${y}`,
        commitments: Math.round(cumCommitted),
        drawdowns: Math.round(y === 0 ? 0 : drawdown),
        distributions: Math.round(y === 0 ? 0 : dist),
        netCashFlow: Math.round(y === 0 ? 0 : dist - drawdown),
        unfundedBal: Math.round(cumCommitted - cumDeployed),
        navEstimate: Math.round(navEst),
      });
    }

    // Cash flow chart data
    const cashFlowChart = forecast.slice(1).map(f => ({
      year: f.year,
      Drawdowns: -f.drawdowns,
      Distributions: f.distributions,
      'Net Cash Flow': f.netCashFlow,
    }));

    // Commitment ramp chart
    const rampChart = forecast.map(f => ({
      year: f.year,
      Committed: f.commitments,
      Target: target,
      NAV: f.navEstimate,
      Unfunded: f.unfundedBal,
    }));

    return {
      unfunded, remaining, yearsToTarget, forecast, cashFlowChart, rampChart, target,
    };
  }, [inputs]);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-sm">
              <Clock size={14} className="text-primary" />
            </div>
            <div>
              <span>Commitment Pacing Model</span>
              <p className="text-[9px] text-muted-foreground font-normal mt-0.5">Forecast capital calls, distributions & unfunded obligations</p>
            </div>
          </CardTitle>
          <Button
            size="sm"
            variant={isExpanded ? 'default' : 'outline'}
            className="text-[10px] h-7 gap-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Open Model'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-5">
          {/* Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InputField label="Target Allocation ($M)" value={inputs.totalTarget} onChange={v => update('totalTarget', v)} />
            <InputField label="Current Committed ($M)" value={inputs.currentCommitted} onChange={v => update('currentCommitted', v)} />
            <InputField label="Current Deployed ($M)" value={inputs.currentDeployed} onChange={v => update('currentDeployed', v)} />
            <InputField label="Annual Pacing ($M)" value={inputs.annualPacing} onChange={v => update('annualPacing', v)} />
            <InputField label="Avg Drawdown Rate (%)" value={inputs.avgDrawdownRate} onChange={v => update('avgDrawdownRate', v)} />
            <InputField label="Avg Distribution Rate (%)" value={inputs.avgDistributionRate} onChange={v => update('avgDistributionRate', v)} />
            <InputField label="Forecast Period (yrs)" value={inputs.forecastYears} onChange={v => update('forecastYears', v)} />
          </div>

          {/* Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryTile label="Unfunded" value={`$${model.unfunded}M`} icon={AlertTriangle} />
            <SummaryTile label="Remaining to Target" value={`$${model.remaining}M`} icon={DollarSign} />
            <SummaryTile
              label="Years to Target"
              value={model.yearsToTarget > 0 ? `${model.yearsToTarget.toFixed(1)} yrs` : 'Reached'}
              icon={Clock}
              variant={model.yearsToTarget <= 0 ? 'success' : 'neutral'}
            />
            <SummaryTile
              label="Pacing Status"
              value={model.remaining <= 0 ? 'On Target' : model.yearsToTarget > 5 ? 'Behind' : 'On Track'}
              icon={TrendingUp}
              variant={model.remaining <= 0 ? 'success' : model.yearsToTarget > 5 ? 'danger' : 'neutral'}
            />
          </div>

          {/* Commitment Ramp Chart */}
          <Card variant="panel">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] flex items-center gap-1.5">
                <TrendingUp size={11} className="text-primary" /> Commitment Ramp & NAV
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={model.rampChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} unit="$M" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 10 }}
                      formatter={(val: number) => [`$${val}M`]}
                    />
                    <ReferenceLine y={model.target} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label={{ value: 'Target', fontSize: 9, fill: 'hsl(var(--destructive))' }} />
                    <Area type="monotone" dataKey="Committed" stroke="hsl(var(--muted-foreground))" fill="hsl(var(--muted-foreground))" fillOpacity={0.1} strokeWidth={1.5} />
                    <Area type="monotone" dataKey="NAV" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                    <Area type="monotone" dataKey="Unfunded" stroke="hsl(35, 92%, 55%)" fill="hsl(35, 92%, 55%)" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 2" />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cash Flow Chart */}
          <Card variant="panel">
            <CardHeader className="pb-1">
              <CardTitle className="text-[10px] flex items-center gap-1.5">
                <DollarSign size={11} className="text-primary" /> Projected Cash Flows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={model.cashFlowChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} unit="$M" />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 10 }}
                      formatter={(val: number) => [`$${Math.abs(val)}M`]}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                    <Bar dataKey="Drawdowns" fill="hsl(0, 72%, 55%)" opacity={0.7} />
                    <Bar dataKey="Distributions" fill="hsl(142, 71%, 45%)" opacity={0.7} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="border-b border-border/30">
                  {['Year', 'Committed', 'Drawdown', 'Distribution', 'Net CF', 'Unfunded', 'NAV Est.'].map(h => (
                    <th key={h} className="text-left p-1.5 text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.forecast.map(f => (
                  <tr key={f.year} className="border-b border-border/20 hover:bg-muted/10">
                    <td className="p-1.5 font-semibold text-foreground">{f.year}</td>
                    <td className="p-1.5">${f.commitments}M</td>
                    <td className="p-1.5 text-destructive">${f.drawdowns}M</td>
                    <td className="p-1.5 text-success">${f.distributions}M</td>
                    <td className={cn("p-1.5", f.netCashFlow >= 0 ? "text-success" : "text-destructive")}>
                      ${f.netCashFlow}M
                    </td>
                    <td className="p-1.5">${f.unfundedBal}M</td>
                    <td className="p-1.5">${f.navEstimate}M</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
        onChange={e => onChange(e.target.value)}
        className="h-9 text-xs font-mono bg-muted/20 border-border/50"
      />
    </div>
  );
}

function SummaryTile({ label, value, icon: Icon, variant = 'neutral' }: {
  label: string; value: string; icon: any; variant?: 'neutral' | 'danger' | 'success';
}) {
  return (
    <div className="kpi-card">
      <p className="terminal-label text-[9px] flex items-center gap-1">
        <Icon size={9} className="text-muted-foreground" /> {label}
      </p>
      <p className={cn(
        "font-mono tabular-nums text-base mt-0.5",
        variant === 'danger' ? "text-destructive" : variant === 'success' ? "text-success" : "text-foreground"
      )}>
        {value}
      </p>
    </div>
  );
}
