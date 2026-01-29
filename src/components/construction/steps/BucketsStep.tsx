import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BucketConfig } from '@/types/construction';
import { Briefcase, Plus, Trash2, Check, AlertCircle, TrendingUp, BarChart3, Shield, Coins, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BucketsStepProps {
  buckets: BucketConfig[];
  onUpdate: (buckets: BucketConfig[]) => void;
}

const IMPLEMENTATION_OPTIONS = [
  { value: 'etfs', label: 'ETFs', icon: PieChart },
  { value: 'stocks', label: 'Single Stocks', icon: TrendingUp },
  { value: 'mutual_funds', label: 'Mutual Funds', icon: BarChart3 },
  { value: 'options_overlay', label: 'Options Overlay', icon: Shield },
  { value: 'hedging', label: 'Hedging Sleeve', icon: Shield },
] as const;

const BENCHMARK_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'S&P 500', label: 'S&P 500' },
  { value: 'TA-125', label: 'TA-125' },
  { value: '60/40', label: '60/40 Portfolio' },
  { value: 'Custom', label: 'Custom' },
];

const BUCKET_COLORS = [
  { border: 'border-l-primary', bg: 'bg-primary/10', text: 'text-primary', glow: 'shadow-primary/20' },
  { border: 'border-l-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-blue-500/20' },
  { border: 'border-l-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'shadow-amber-500/20' },
  { border: 'border-l-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'shadow-purple-500/20' },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/20' },
  { border: 'border-l-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400', glow: 'shadow-rose-500/20' },
];

const BUCKET_ICONS = [Briefcase, TrendingUp, BarChart3, Shield, Coins, PieChart];

export function BucketsStep({ buckets, onUpdate }: BucketsStepProps) {
  const total = buckets.reduce((sum, b) => sum + b.targetWeight, 0);
  const isValid = Math.abs(total - 100) < 0.01;

  const updateBucket = (index: number, updates: Partial<BucketConfig>) => {
    const newBuckets = [...buckets];
    newBuckets[index] = { ...newBuckets[index], ...updates };
    onUpdate(newBuckets);
  };

  const addBucket = () => {
    const newKey = `bucket_${Date.now()}`;
    onUpdate([
      ...buckets,
      {
        key: newKey,
        label: 'New Bucket',
        targetWeight: 0,
        implementation: 'stocks',
      },
    ]);
  };

  const removeBucket = (index: number) => {
    if (buckets.length <= 1) return;
    onUpdate(buckets.filter((_, i) => i !== index));
  };

  const getImplementationIcon = (impl: string) => {
    const option = IMPLEMENTATION_OPTIONS.find(o => o.value === impl);
    return option?.icon || Briefcase;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-md animate-pulse" />
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
              <Briefcase size={18} className="text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2">
              Implementation Buckets
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                {buckets.length} ACTIVE
              </span>
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">
              DEFINE ALLOCATION SEGMENTS & IMPLEMENTATION STRATEGY
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addBucket} 
          className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/10 transition-all group"
        >
          <Plus size={14} className="group-hover:rotate-90 transition-transform" />
          <span className="font-mono text-xs">ADD BUCKET</span>
        </Button>
      </div>

      {/* Visual Allocation Bar */}
      <div className="relative">
        <div className="h-3 bg-muted/30 rounded-full overflow-hidden flex">
          {buckets.map((bucket, index) => {
            const colors = BUCKET_COLORS[index % BUCKET_COLORS.length];
            return (
              <div
                key={bucket.key}
                className={cn("h-full transition-all duration-500", colors.bg)}
                style={{ width: `${bucket.targetWeight}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          {buckets.map((bucket, index) => (
            <span key={bucket.key} className="text-[9px] font-mono text-muted-foreground">
              {bucket.targetWeight > 0 && `${bucket.targetWeight}%`}
            </span>
          ))}
        </div>
      </div>

      {/* Buckets Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {buckets.map((bucket, index) => {
          const colors = BUCKET_COLORS[index % BUCKET_COLORS.length];
          const BucketIcon = BUCKET_ICONS[index % BUCKET_ICONS.length];
          const ImplIcon = getImplementationIcon(bucket.implementation);
          
          return (
            <Card 
              key={bucket.key} 
              className={cn(
                "relative overflow-hidden bg-card/80 backdrop-blur-sm border-l-4 transition-all duration-300 hover:shadow-lg group",
                colors.border,
                colors.glow
              )}
            >
              {/* Top glow line */}
              <div className={cn("absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30", colors.text)} />
              
              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                <div className={cn("absolute -top-8 -right-8 w-16 h-16 rotate-45 opacity-10", colors.bg)} />
              </div>

              <CardContent className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                      <BucketIcon size={16} className={colors.text} />
                    </div>
                    <Input
                      value={bucket.label}
                      onChange={(e) => updateBucket(index, { label: e.target.value })}
                      className="h-8 text-sm font-medium bg-transparent border-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 truncate"
                      placeholder="Bucket Name"
                    />
                  </div>
                  {buckets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeBucket(index)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  )}
                </div>

                {/* Target Weight with visual */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      Target Weight
                    </Label>
                    <span className={cn("text-lg font-mono font-bold", colors.text)}>
                      {bucket.targetWeight}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={bucket.targetWeight}
                      onChange={(e) => updateBucket(index, { targetWeight: Number(e.target.value) })}
                      className="h-9 text-sm font-mono bg-muted/30 border-border/50 focus:border-primary/50"
                      min={0}
                      max={100}
                    />
                  </div>
                  <Progress 
                    value={bucket.targetWeight} 
                    className="h-1.5"
                  />
                </div>

                {/* Implementation */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <ImplIcon size={10} />
                    Implementation
                  </Label>
                  <Select
                    value={bucket.implementation}
                    onValueChange={(val) => updateBucket(index, { implementation: val as BucketConfig['implementation'] })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/50 focus:border-primary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPLEMENTATION_OPTIONS.map((opt) => {
                        const OptIcon = opt.icon;
                        return (
                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                            <span className="flex items-center gap-2">
                              <OptIcon size={12} className="text-muted-foreground" />
                              {opt.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Benchmark */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 size={10} />
                    Benchmark
                  </Label>
                  <Select
                    value={bucket.benchmark || 'none'}
                    onValueChange={(val) => updateBucket(index, { benchmark: val === 'none' ? undefined : val })}
                  >
                    <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/50 focus:border-primary/50">
                      <SelectValue placeholder="Select benchmark" />
                    </SelectTrigger>
                    <SelectContent>
                      {BENCHMARK_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Total Allocation Footer */}
      <div className={cn(
        "relative overflow-hidden flex items-center justify-between p-4 rounded-lg border transition-all duration-300",
        isValid 
          ? "bg-primary/5 border-primary/30" 
          : "bg-destructive/5 border-destructive/30"
      )}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(90deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 20px)`
          }} />
        </div>
        
        <div className="relative flex items-center gap-3">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isValid ? "bg-primary/20" : "bg-destructive/20"
          )}>
            {isValid ? (
              <Check size={16} className="text-primary" />
            ) : (
              <AlertCircle size={16} className="text-destructive" />
            )}
          </div>
          <div>
            <span className="text-sm font-medium">Total Bucket Allocation</span>
            <p className="text-[10px] font-mono text-muted-foreground">
              {isValid ? "ALLOCATION BALANCED" : "MUST EQUAL 100%"}
            </p>
          </div>
        </div>
        
        <div className="relative flex items-center gap-3">
          <div className={cn(
            "text-2xl font-mono font-bold tracking-tight",
            isValid ? "text-primary" : "text-destructive"
          )}>
            {total.toFixed(0)}%
          </div>
          {!isValid && (
            <div className={cn(
              "text-xs font-mono px-2 py-1 rounded",
              total > 100 ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-400"
            )}>
              {total > 100 ? `+${(total - 100).toFixed(0)}%` : `-${(100 - total).toFixed(0)}%`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
