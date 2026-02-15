import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Scale, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis
} from 'recharts';

function pf(v: string, fallback = 0) {
  const n = parseFloat(v);
  return isNaN(n) ? fallback : n;
}

interface Criterion {
  criteria: string;
  benchmark: string;
  key: string;
  // Scoring: lower is more conservative for leverage/LTV, higher for cushion/covenants
  score: (val: number) => 'conservative' | 'standard' | 'aggressive';
}

const evaluationCriteria: Criterion[] = [
  {
    criteria: 'Leverage (Debt/EBITDA)',
    benchmark: '4.0–6.0x',
    key: 'leverage',
    score: (v) => v <= 4 ? 'conservative' : v <= 6 ? 'standard' : 'aggressive',
  },
  {
    criteria: 'Pricing (Spread bps)',
    benchmark: '400–600',
    key: 'spread',
    score: (v) => v >= 600 ? 'conservative' : v >= 400 ? 'standard' : 'aggressive',
  },
  {
    criteria: 'Maintenance Covenants',
    benchmark: '2+',
    key: 'covenants',
    score: (v) => v >= 3 ? 'conservative' : v >= 2 ? 'standard' : 'aggressive',
  },
  {
    criteria: 'Equity Cushion (%)',
    benchmark: '>30%',
    key: 'cushion',
    score: (v) => v >= 35 ? 'conservative' : v >= 25 ? 'standard' : 'aggressive',
  },
  {
    criteria: 'DSCR',
    benchmark: '>1.25x',
    key: 'dscr',
    score: (v) => v >= 1.5 ? 'conservative' : v >= 1.25 ? 'standard' : 'aggressive',
  },
];

const defaultValues: Record<string, string> = {
  leverage: '5.0',
  spread: '500',
  covenants: '2',
  cushion: '32',
  dscr: '1.35',
};

export function DealConventionalityAnalyzer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [values, setValues] = useState(defaultValues);

  const update = (key: string, val: string) =>
    setValues(prev => ({ ...prev, [key]: val }));

  const analysis = useMemo(() => {
    const scores = evaluationCriteria.map(c => {
      const val = pf(values[c.key]);
      const rating = c.score(val);
      return { ...c, value: val, rating };
    });

    const ratingCounts = { conservative: 0, standard: 0, aggressive: 0 };
    scores.forEach(s => ratingCounts[s.rating]++);

    let overall: 'conservative' | 'standard' | 'aggressive' = 'standard';
    if (ratingCounts.aggressive >= 2) overall = 'aggressive';
    else if (ratingCounts.conservative >= 3) overall = 'conservative';

    // Radar chart data: normalize 0-100 where 100 = conservative
    const radarData = scores.map(s => ({
      metric: s.criteria.split(' (')[0].split(' ').slice(0, 2).join(' '),
      score: s.rating === 'conservative' ? 90 : s.rating === 'standard' ? 60 : 30,
      fullMark: 100,
    }));

    return { scores, overall, radarData };
  }, [values]);

  const ratingIcon = (r: string) => {
    if (r === 'conservative') return <CheckCircle2 size={11} className="text-success" />;
    if (r === 'standard') return <AlertTriangle size={11} className="text-primary" />;
    return <XCircle size={11} className="text-destructive" />;
  };

  const ratingBadge = (r: string) => (
    <Badge
      variant="outline"
      className={cn(
        "text-[8px]",
        r === 'conservative' && "border-success/30 text-success",
        r === 'standard' && "border-primary/30 text-primary",
        r === 'aggressive' && "border-destructive/30 text-destructive",
      )}
    >
      {r.charAt(0).toUpperCase() + r.slice(1)}
    </Badge>
  );

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xs flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-sm">
              <Scale size={14} className="text-primary" />
            </div>
            <div>
              <span>Deal Conventionality Analyzer</span>
              <p className="text-[9px] text-muted-foreground font-normal mt-0.5">Benchmark deal structure vs. market norms</p>
            </div>
          </CardTitle>
          <Button
            size="sm"
            variant={isExpanded ? 'default' : 'outline'}
            className="text-[10px] h-7 gap-1"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Open Analyzer'}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-5">
          {/* Evaluation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left p-2 text-muted-foreground">Criteria</th>
                  <th className="text-center p-2 text-muted-foreground">Benchmark</th>
                  <th className="text-center p-2 text-muted-foreground">Deal Value</th>
                  <th className="text-center p-2 text-muted-foreground">Assessment</th>
                </tr>
              </thead>
              <tbody>
                {analysis.scores.map((c) => (
                  <tr key={c.key} className="border-b border-border/20">
                    <td className="p-2 text-foreground/80">{c.criteria}</td>
                    <td className="text-center p-2 text-muted-foreground">{c.benchmark}</td>
                    <td className="text-center p-2">
                      <Input
                        type="number"
                        value={values[c.key]}
                        onChange={(e) => update(c.key, e.target.value)}
                        className="h-7 text-[10px] font-mono bg-muted/20 border-border/50 w-20 mx-auto text-center"
                      />
                    </td>
                    <td className="text-center p-2">
                      <div className="flex items-center justify-center gap-1">
                        {ratingIcon(c.rating)}
                        {ratingBadge(c.rating)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-4">
            {/* Overall Rating */}
            <div className={cn(
              "p-4 rounded-sm border",
              analysis.overall === 'conservative' && "border-success/30 bg-success/5",
              analysis.overall === 'standard' && "border-primary/30 bg-primary/5",
              analysis.overall === 'aggressive' && "border-destructive/30 bg-destructive/5",
            )}>
              <div className="flex items-center gap-2 mb-2">
                {ratingIcon(analysis.overall)}
                <span className={cn(
                  "text-sm font-bold uppercase tracking-wide",
                  analysis.overall === 'conservative' && "text-success",
                  analysis.overall === 'standard' && "text-primary",
                  analysis.overall === 'aggressive' && "text-destructive",
                )}>
                  {analysis.overall}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                {analysis.overall === 'conservative' && 'Deal terms are within or below market norms. Lower risk profile with strong structural protections.'}
                {analysis.overall === 'standard' && 'Deal terms align with current market standards. Balanced risk/return profile within acceptable parameters.'}
                {analysis.overall === 'aggressive' && 'Deal terms exceed market norms in multiple areas. Higher risk requiring additional scrutiny, tighter monitoring, and enhanced protections.'}
              </p>
            </div>

            {/* Radar Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={analysis.radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar
                    name="Deal"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
