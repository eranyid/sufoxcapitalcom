import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BucketConfig } from '@/types/construction';
import { Briefcase, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BucketsStepProps {
  buckets: BucketConfig[];
  onUpdate: (buckets: BucketConfig[]) => void;
}

const IMPLEMENTATION_OPTIONS = [
  { value: 'etfs', label: 'ETFs' },
  { value: 'stocks', label: 'Single Stocks' },
  { value: 'mutual_funds', label: 'Mutual Funds' },
  { value: 'options_overlay', label: 'Options Overlay' },
  { value: 'hedging', label: 'Hedging Sleeve' },
] as const;

const BENCHMARK_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'S&P 500', label: 'S&P 500' },
  { value: 'TA-125', label: 'TA-125' },
  { value: '60/40', label: '60/40 Portfolio' },
  { value: 'Custom', label: 'Custom' },
];

const BUCKET_COLORS = [
  'hsl(var(--primary))',
  'hsl(210, 80%, 55%)',
  'hsl(45, 100%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(0, 60%, 50%)',
];

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Briefcase size={16} className="text-primary" />
            Implementation Buckets
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Define how each allocation segment will be implemented
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addBucket} className="gap-2">
          <Plus size={14} />
          Add Bucket
        </Button>
      </div>

      {/* Buckets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {buckets.map((bucket, index) => (
          <Card 
            key={bucket.key} 
            className="bg-card border-border relative"
            style={{ borderLeftColor: BUCKET_COLORS[index % BUCKET_COLORS.length], borderLeftWidth: 3 }}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Input
                  value={bucket.label}
                  onChange={(e) => updateBucket(index, { label: e.target.value })}
                  className="h-7 text-sm font-medium bg-transparent border-none p-0 focus-visible:ring-0"
                />
                {buckets.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeBucket(index)}
                  >
                    <Trash2 size={12} />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Target Weight */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Target %</Label>
                <Input
                  type="number"
                  value={bucket.targetWeight}
                  onChange={(e) => updateBucket(index, { targetWeight: Number(e.target.value) })}
                  className="h-8 text-sm"
                  min={0}
                  max={100}
                />
              </div>

              {/* Implementation */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Implementation</Label>
                <Select
                  value={bucket.implementation}
                  onValueChange={(val) => updateBucket(index, { implementation: val as BucketConfig['implementation'] })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPLEMENTATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Benchmark */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Benchmark (optional)</Label>
              <Select
                  value={bucket.benchmark || 'none'}
                  onValueChange={(val) => updateBucket(index, { benchmark: val === 'none' ? undefined : val })}
                >
                  <SelectTrigger className="h-8 text-xs">
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
        ))}
      </div>

      {/* Total */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-md",
        isValid ? "bg-primary/10" : "bg-destructive/10"
      )}>
        <span className="text-sm font-medium flex items-center gap-2">
          {isValid ? <Check size={14} className="text-primary" /> : <AlertCircle size={14} className="text-destructive" />}
          Total Bucket Allocation
        </span>
        <span className={cn(
          "text-lg font-mono font-bold",
          isValid ? "text-primary" : "text-destructive"
        )}>
          {total}%
        </span>
      </div>
    </div>
  );
}
