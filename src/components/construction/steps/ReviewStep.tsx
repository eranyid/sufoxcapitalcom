import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WizardData, OBJECTIVE_LABELS, RISK_LABELS, LIQUIDITY_LABELS } from '@/types/construction';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { Check, AlertCircle, Target, Globe, Layers, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewStepProps {
  data: WizardData;
  isSaved: boolean;
}

const GEOGRAPHY_COLORS = {
  israel: 'hsl(var(--primary))',
  usa: 'hsl(210, 100%, 50%)',
  europe: 'hsl(45, 100%, 50%)',
  other: 'hsl(280, 60%, 50%)',
};

const ASSET_COLORS = {
  equities: 'hsl(var(--primary))',
  bonds: 'hsl(210, 80%, 55%)',
  funds: 'hsl(45, 100%, 50%)',
  options: 'hsl(280, 60%, 50%)',
  alternatives: 'hsl(160, 60%, 45%)',
  cash: 'hsl(0, 0%, 60%)',
};

export function ReviewStep({ data, isSaved }: ReviewStepProps) {
  // Health checks
  const geoTotal = Object.values(data.geography).reduce((a, b) => a + b, 0);
  const assetTotal = Object.values(data.assetClasses).reduce((a, b) => a + b, 0);
  const bucketTotal = data.buckets.reduce((a, b) => a + b.targetWeight, 0);
  
  const meetsEquityMin = data.assetClasses.equities >= data.constraints.minEquities;
  const meetsCashMin = data.assetClasses.cash >= data.constraints.minCash;
  const meetsHedgeMin = data.assetClasses.options >= data.constraints.minHedge;
  const hasNoNegatives = Object.values(data.assetClasses).every(v => v >= 0) &&
    Object.values(data.geography).every(v => v >= 0) &&
    data.buckets.every(b => b.targetWeight >= 0);

  const allChecks = [
    { label: 'Geography sums to 100%', pass: Math.abs(geoTotal - 100) < 0.01 },
    { label: 'Asset classes sum to 100%', pass: Math.abs(assetTotal - 100) < 0.01 },
    { label: 'Buckets sum to 100%', pass: Math.abs(bucketTotal - 100) < 0.01 },
    { label: `Min equities (${data.constraints.minEquities}%)`, pass: meetsEquityMin },
    { label: `Min cash (${data.constraints.minCash}%)`, pass: meetsCashMin },
    { label: `Min hedge (${data.constraints.minHedge}%)`, pass: meetsHedgeMin },
    { label: 'No negative values', pass: hasNoNegatives },
  ];

  const passCount = allChecks.filter(c => c.pass).length;
  const allPass = passCount === allChecks.length;

  const geoData = Object.entries(data.geography).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    fill: GEOGRAPHY_COLORS[key as keyof typeof GEOGRAPHY_COLORS],
  }));

  const assetData = Object.entries(data.assetClasses)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      fill: ASSET_COLORS[key as keyof typeof ASSET_COLORS],
    }));

  const bucketData = data.buckets.map((b, i) => ({
    name: b.label,
    value: b.targetWeight,
    fill: `hsl(${(i * 60) % 360}, 70%, 50%)`,
  }));

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {isSaved && (
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Check className="text-primary" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-primary">Target Allocation Saved</h3>
            <p className="text-xs text-muted-foreground">
              Your target is now active and will be used for drift analysis
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target size={12} />
              Objective
            </div>
            <p className="text-sm font-medium">{OBJECTIVE_LABELS[data.objective]}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              Risk Level
            </div>
            <Badge variant="outline">{RISK_LABELS[data.riskLevel]}</Badge>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              Liquidity
            </div>
            <p className="text-sm font-medium">{LIQUIDITY_LABELS[data.constraints.liquidityRequirement]}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              Horizon
            </div>
            <p className="text-sm font-medium">Long-term</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Geography */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2">
              <Globe size={12} className="text-primary" />
              Geography
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={geoData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                    {geoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Asset Classes */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2">
              <Layers size={12} className="text-primary" />
              Asset Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assetData} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Buckets */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium flex items-center gap-2">
              <Briefcase size={12} className="text-primary" />
              Buckets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bucketData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Checks */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {allPass ? (
              <Check size={16} className="text-primary" />
            ) : (
              <AlertCircle size={16} className="text-amber-500" />
            )}
            Health Checks ({passCount}/{allChecks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {allChecks.map((check, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md text-xs",
                  check.pass ? "bg-primary/10" : "bg-amber-500/10"
                )}
              >
                {check.pass ? (
                  <Check size={12} className="text-primary shrink-0" />
                ) : (
                  <AlertCircle size={12} className="text-amber-500 shrink-0" />
                )}
                <span className={cn(
                  check.pass ? "text-foreground" : "text-amber-500"
                )}>
                  {check.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
