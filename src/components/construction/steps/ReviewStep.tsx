import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WizardData, OBJECTIVE_LABELS, RISK_LABELS, LIQUIDITY_LABELS } from '@/types/construction';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip 
} from 'recharts';
import { Check, AlertCircle, Target, Globe, Layers, Briefcase, Shield, Clock, Droplets } from 'lucide-react';
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
        <div className="relative overflow-hidden p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 blur-md animate-pulse" />
              <div className="relative w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Check className="text-primary" size={20} />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-mono font-medium text-primary">TARGET DEPLOYED</h3>
              <p className="text-xs text-muted-foreground">
                Active allocation synchronized with analytics engine
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { icon: Target, label: 'OBJECTIVE', value: OBJECTIVE_LABELS[data.objective] },
          { icon: Shield, label: 'RISK LEVEL', value: RISK_LABELS[data.riskLevel], badge: true },
          { icon: Droplets, label: 'LIQUIDITY', value: LIQUIDITY_LABELS[data.constraints.liquidityRequirement] },
          { icon: Clock, label: 'HORIZON', value: 'Long-term' },
        ].map((item, i) => (
          <Card key={i} className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50 group">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary/50 transition-all" />
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2 font-mono tracking-wider">
                <item.icon size={10} />
                {item.label}
              </div>
              {item.badge ? (
                <Badge variant="outline" className="border-primary/40 text-primary font-mono">
                  {item.value}
                </Badge>
              ) : (
                <p className="text-sm font-medium">{item.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Geography */}
        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-primary/50 via-transparent to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono tracking-wide flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                <Globe size={10} className="text-primary" />
              </div>
              GEOGRAPHY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={geoData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={2} stroke="hsl(var(--background))">
                    {geoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Asset Classes */}
        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono tracking-wide flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                <Layers size={10} className="text-primary" />
              </div>
              ASSET CLASSES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={assetData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" strokeWidth={2} stroke="hsl(var(--background))">
                    {assetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Buckets */}
        <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-transparent to-primary/50" />
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono tracking-wide flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                <Briefcase size={10} className="text-primary" />
              </div>
              BUCKETS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bucketData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Checks */}
      <Card className="relative overflow-hidden bg-card/50 backdrop-blur-sm border-border/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-mono tracking-wide flex items-center gap-3">
            <div className="relative">
              {allPass && <div className="absolute inset-0 bg-primary/40 blur-md animate-pulse" />}
              <div className={cn(
                "relative w-8 h-8 rounded-lg flex items-center justify-center",
                allPass ? "bg-primary/20" : "bg-amber-500/20"
              )}>
                {allPass ? (
                  <Check size={16} className="text-primary" />
                ) : (
                  <AlertCircle size={16} className="text-amber-500" />
                )}
              </div>
            </div>
            SYSTEM DIAGNOSTICS
            <span className={cn(
              "text-xs px-2 py-1 rounded font-mono",
              allPass ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500"
            )}>
              {passCount}/{allChecks.length} PASSED
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            {allChecks.map((check, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-lg border text-xs transition-all",
                  check.pass 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-amber-500/5 border-amber-500/30"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded flex items-center justify-center shrink-0",
                  check.pass ? "bg-primary/20" : "bg-amber-500/20"
                )}>
                  {check.pass ? (
                    <Check size={10} className="text-primary" />
                  ) : (
                    <AlertCircle size={10} className="text-amber-500" />
                  )}
                </div>
                <span className={cn(
                  "font-mono text-[10px]",
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