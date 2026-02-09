import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface SegmentPeriod {
  period: string;
  segments: Array<{ name: string; value: number }>;
}

interface Props {
  revenueSegments: SegmentPeriod[];
}

const SEGMENT_COLORS = [
  '#60A5FA', // blue
  '#FB923C', // orange
  '#4ADE80', // green
  '#FACC15', // yellow
  '#A78BFA', // purple
  '#F87171', // red
  '#22D3EE', // cyan
  '#F472B6', // pink
  '#34D399', // emerald
  '#FCD34D', // amber
];

function fmtB(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

export default function RevenueSegmentChart({ revenueSegments }: Props) {
  const [mode, setMode] = useState<'all' | 'annual'>('all');

  // Get all unique segment names
  const segmentNames = useMemo(() => {
    const names = new Set<string>();
    for (const p of revenueSegments) {
      for (const s of p.segments) names.add(s.name);
    }
    return Array.from(names);
  }, [revenueSegments]);

  // Filter to annual if needed (periods ending in Q4 or containing annual dates)
  const filteredData = useMemo(() => {
    if (mode === 'all') return revenueSegments;
    // Keep roughly every 4th entry as "annual"
    return revenueSegments.filter((_, i) => i % 4 === 3 || revenueSegments.length <= 8);
  }, [revenueSegments, mode]);

  const chartData = useMemo(() => {
    return filteredData.map((p) => {
      const row: Record<string, any> = {
        period: p.period.length > 7 ? p.period.substring(0, 7) : p.period,
      };
      for (const name of segmentNames) {
        const seg = p.segments.find(s => s.name === name);
        row[name] = seg ? seg.value : 0;
      }
      return row;
    });
  }, [filteredData, segmentNames]);

  if (!revenueSegments.length || segmentNames.length === 0) return null;

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            Revenue by Segment
          </CardTitle>
          {revenueSegments.length > 8 && (
            <div className="flex items-center gap-1.5">
              <Button
                variant={mode === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2.5 text-[10px] font-bold"
                onClick={() => setMode('all')}
              >
                ALL
              </Button>
              <Button
                variant={mode === 'annual' ? 'default' : 'outline'}
                size="sm"
                className="h-6 px-2.5 text-[10px] font-bold"
                onClick={() => setMode('annual')}
              >
                FY
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
              interval={Math.max(0, Math.floor(chartData.length / 12) - 1)}
              angle={-35}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(v) => fmtB(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 11,
              }}
              formatter={(v: number, name: string) => [fmtB(v), name]}
            />
            <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            {segmentNames.map((name, i) => (
              <Bar
                key={name}
                dataKey={name}
                stackId="revenue"
                fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
