import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts';

const sampleVintages = [
  { year: 2018, committed: 45, deployed: 42, nav: 68, dpi: 0.8, tvpi: 1.52 },
  { year: 2019, committed: 60, deployed: 55, nav: 82, dpi: 0.5, tvpi: 1.37 },
  { year: 2020, committed: 80, deployed: 70, nav: 105, dpi: 0.3, tvpi: 1.31 },
  { year: 2021, committed: 120, deployed: 95, nav: 118, dpi: 0.1, tvpi: 1.14 },
  { year: 2022, committed: 95, deployed: 65, nav: 72, dpi: 0.0, tvpi: 1.05 },
  { year: 2023, committed: 110, deployed: 40, nav: 38, dpi: 0.0, tvpi: 0.95 },
  { year: 2024, committed: 75, deployed: 15, nav: 14, dpi: 0.0, tvpi: 0.93 },
];

export function VintageYearChart() {
  const totals = useMemo(() => ({
    committed: sampleVintages.reduce((s, v) => s + v.committed, 0),
    deployed: sampleVintages.reduce((s, v) => s + v.deployed, 0),
    nav: sampleVintages.reduce((s, v) => s + v.nav, 0),
  }), []);

  const pctDeployed = totals.committed > 0 ? ((totals.deployed / totals.committed) * 100).toFixed(0) : '—';

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs flex items-center gap-2">
            <Calendar size={14} className="text-primary" /> Vintage Year Distribution
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[8px] font-mono">{sampleVintages.length} vintages</Badge>
            <Badge variant="secondary" className="text-[8px] font-mono">{pctDeployed}% deployed</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stacked Commitment vs NAV chart */}
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sampleVintages} barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} unit="$M" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 4,
                  fontSize: 11,
                }}
                formatter={(value: number, name: string) => [`$${value}M`, name]}
              />
              <Bar dataKey="committed" name="Committed" fill="hsl(var(--muted-foreground))" opacity={0.3} radius={[0, 0, 0, 0]} />
              <Bar dataKey="deployed" name="Deployed" fill="hsl(var(--primary))" opacity={0.7} />
              <Bar dataKey="nav" name="NAV" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vintage Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-border/30">
                {['Vintage', 'Committed', 'Deployed', 'NAV', 'DPI', 'TVPI'].map(h => (
                  <th key={h} className="text-left p-1.5 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sampleVintages.map(v => (
                <tr key={v.year} className="border-b border-border/20 hover:bg-muted/10">
                  <td className="p-1.5 text-foreground font-semibold">{v.year}</td>
                  <td className="p-1.5">${v.committed}M</td>
                  <td className="p-1.5">${v.deployed}M</td>
                  <td className="p-1.5">${v.nav}M</td>
                  <td className="p-1.5">{v.dpi.toFixed(1)}x</td>
                  <td className="p-1.5">
                    <span className={v.tvpi >= 1.2 ? 'text-success' : v.tvpi >= 1.0 ? 'text-foreground' : 'text-destructive'}>
                      {v.tvpi.toFixed(2)}x
                    </span>
                  </td>
                </tr>
              ))}
              {/* Totals */}
              <tr className="border-t-2 border-border/50 font-semibold">
                <td className="p-1.5 text-primary">Total</td>
                <td className="p-1.5">${totals.committed}M</td>
                <td className="p-1.5">${totals.deployed}M</td>
                <td className="p-1.5">${totals.nav}M</td>
                <td className="p-1.5 text-muted-foreground">—</td>
                <td className="p-1.5 text-muted-foreground">—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[8px] text-muted-foreground font-mono text-center">
          Sample data — actual vintage performance will populate from fund records
        </p>
      </CardContent>
    </Card>
  );
}
