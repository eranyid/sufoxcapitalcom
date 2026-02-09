import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface FinancialPeriod {
  period: string;
  revenue: number | null;
  cost_of_revenue: number | null;
  gross_profit: number | null;
  operating_expenses: number | null;
  operating_income: number | null;
  net_income: number | null;
  eps: number | null;
  total_assets: number | null;
  current_assets: number | null;
  total_liabilities: number | null;
  current_liabilities: number | null;
  total_equity: number | null;
  cash_and_equivalents: number | null;
  total_debt: number | null;
  operating_cash_flow: number | null;
  capital_expenditures: number | null;
  free_cash_flow: number | null;
  investing_cash_flow: number | null;
  financing_cash_flow: number | null;
}

interface Props {
  annualStatements: FinancialPeriod[];
  quarterlyStatements: FinancialPeriod[];
}

const COLORS = {
  revenue: '#60A5FA',       // blue
  cost_of_revenue: '#FB923C', // orange
  gross_profit: '#4ADE80',  // green
  operating_expenses: '#C084FC', // purple
  operating_income: '#FACC15', // yellow
  net_income: '#F87171',    // red

  total_assets: '#60A5FA',
  current_assets: '#4ADE80',
  cash_and_equivalents: '#22D3EE', // cyan
  total_liabilities: '#FB923C',
  current_liabilities: '#F87171',
  total_debt: '#A78BFA',
  total_equity: '#FACC15',

  operating_cash_flow: '#4ADE80',
  capital_expenditures: '#FB923C',
  free_cash_flow: '#60A5FA',
  investing_cash_flow: '#C084FC',
  financing_cash_flow: '#FACC15',
};

type StatementTab = 'income' | 'balance' | 'cashflow';

const INCOME_FIELDS = [
  { key: 'revenue', label: 'Revenue' },
  { key: 'cost_of_revenue', label: 'Cost of Revenue' },
  { key: 'gross_profit', label: 'Gross Profit' },
  { key: 'operating_expenses', label: 'Operating Expenses' },
  { key: 'operating_income', label: 'Operating Income' },
  { key: 'net_income', label: 'Net Income' },
] as const;

const BALANCE_FIELDS = [
  { key: 'total_assets', label: 'Total Assets' },
  { key: 'current_assets', label: 'Current Assets' },
  { key: 'cash_and_equivalents', label: 'Cash & Equivalents' },
  { key: 'total_liabilities', label: 'Total Liabilities' },
  { key: 'current_liabilities', label: 'Current Liabilities' },
  { key: 'total_debt', label: 'Total Debt' },
  { key: 'total_equity', label: 'Total Equity' },
] as const;

const CASHFLOW_FIELDS = [
  { key: 'operating_cash_flow', label: 'Operating Cash Flow' },
  { key: 'capital_expenditures', label: 'Capital Expenditures' },
  { key: 'free_cash_flow', label: 'Free Cash Flow' },
  { key: 'investing_cash_flow', label: 'Investing Cash Flow' },
  { key: 'financing_cash_flow', label: 'Financing Cash Flow' },
] as const;

function getFields(tab: StatementTab) {
  if (tab === 'income') return INCOME_FIELDS;
  if (tab === 'balance') return BALANCE_FIELDS;
  return CASHFLOW_FIELDS;
}

function fmtB(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toFixed(0);
}

export default function FinancialStatementsChart({ annualStatements, quarterlyStatements }: Props) {
  const [freq, setFreq] = useState<'FY' | 'QTR'>('FY');
  const [tab, setTab] = useState<StatementTab>('income');
  const [chartMode, setChartMode] = useState<'bar' | 'line'>('bar');

  const statements = freq === 'FY' ? annualStatements : quarterlyStatements;
  const fields = getFields(tab);

  const chartData = useMemo(() => {
    return statements.map((s) => {
      const row: Record<string, any> = { period: freq === 'FY' ? `FY ${s.period}` : s.period };
      for (const f of fields) {
        const val = s[f.key as keyof FinancialPeriod] as number | null;
        row[f.key] = val != null ? val : 0;
      }
      return row;
    });
  }, [statements, fields, freq]);

  // Filter out fields that are all zeros
  const activeFields = useMemo(() => {
    return fields.filter(f => chartData.some(d => d[f.key] !== 0));
  }, [chartData, fields]);

  if (!annualStatements.length && !quarterlyStatements.length) return null;

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Financial Statements
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Button
              variant={chartMode === 'bar' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setChartMode('bar')}
              title="Bar Chart"
            >
              <BarChart3 className="h-3 w-3" />
            </Button>
            <Button
              variant={chartMode === 'line' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-[10px]"
              onClick={() => setChartMode('line')}
              title="Line Chart"
            >
              <TrendingUp className="h-3 w-3" />
            </Button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <Button
              variant={freq === 'FY' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2.5 text-[10px] font-bold"
              onClick={() => setFreq('FY')}
            >
              FY
            </Button>
            <Button
              variant={freq === 'QTR' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2.5 text-[10px] font-bold"
              onClick={() => setFreq('QTR')}
            >
              QTR
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={(v) => setTab(v as StatementTab)} className="w-full">
          <TabsList className="mb-3">
            <TabsTrigger value="income" className="text-xs">Income Statement</TabsTrigger>
            <TabsTrigger value="balance" className="text-xs">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cashflow" className="text-xs">Cash Flow</TabsTrigger>
          </TabsList>

          {(['income', 'balance', 'cashflow'] as StatementTab[]).map((t) => (
            <TabsContent key={t} value={t}>
              {chartData.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">
                  No {freq === 'QTR' ? 'quarterly' : 'annual'} data available
                </p>
              ) : chartMode === 'bar' ? (
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => fmtB(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number, name: string) => {
                        const label = activeFields.find(f => f.key === name)?.label || name;
                        return [fmtB(v), label];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={(value) => activeFields.find(f => f.key === value)?.label || value} />
                    {activeFields.map((f) => (
                      <Bar key={f.key} dataKey={f.key} name={f.key} fill={COLORS[f.key as keyof typeof COLORS] || 'hsl(var(--primary))'} radius={[2, 2, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval={0} angle={-30} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => fmtB(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                      formatter={(v: number, name: string) => {
                        const label = activeFields.find(f => f.key === name)?.label || name;
                        return [fmtB(v), label];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={(value) => activeFields.find(f => f.key === value)?.label || value} />
                    {activeFields.map((f) => (
                      <Line
                        key={f.key}
                        type="monotone"
                        dataKey={f.key}
                        name={f.key}
                        stroke={COLORS[f.key as keyof typeof COLORS] || 'hsl(var(--primary))'}
                        strokeWidth={2}
                        dot={{ r: 3, fill: COLORS[f.key as keyof typeof COLORS] || 'hsl(var(--primary))' }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
