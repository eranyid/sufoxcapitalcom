import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Save, CheckCircle2, Target, Clock, Shield, Layers, 
  FileText, Zap, Database
} from 'lucide-react';
import { Position, ASSET_TYPE_LABELS } from '@/types/allocationBuilder';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AllocationObjectives } from '@/pages/AllocationBuilder';

interface PipelineSaveStepProps {
  objectives: AllocationObjectives;
  positions: Position[];
  totalAllocation: number;
}

const OBJECTIVE_LABELS = {
  growth: 'Growth',
  balanced: 'Balanced',
  income: 'Income',
  preservation: 'Preservation',
};

const RISK_LABELS = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
};

const HORIZON_LABELS = {
  short: '1-3 Years',
  medium: '3-7 Years',
  long: '7+ Years',
};

export function PipelineSaveStep({ objectives, positions, totalAllocation }: PipelineSaveStepProps) {
  const [setAsActive, setSetAsActive] = useState(true);
  const [syncToPolicy, setSyncToPolicy] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Asset class breakdown
  const assetClasses = positions.reduce((acc, p) => {
    acc[p.assetType] = (acc[p.assetType] || 0) + p.allocation;
    return acc;
  }, {} as Record<string, number>);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save - in real implementation, this would save to Supabase
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast.success('Target allocation saved successfully!');
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="text-primary" size={20} />
            Ready to Save
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Allocation Name */}
          <div className="p-4 bg-card rounded-xl border border-border/50">
            <h3 className="text-xl font-bold">{objectives.name}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="gap-1">
                <Target size={12} />
                {OBJECTIVE_LABELS[objectives.objective]}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Shield size={12} />
                {RISK_LABELS[objectives.riskLevel]}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock size={12} />
                {HORIZON_LABELS[objectives.horizon]}
              </Badge>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-card rounded-lg border border-border/50 text-center">
              <p className="text-2xl font-mono font-bold text-emerald-400">{totalAllocation.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">Total Allocated</p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border/50 text-center">
              <p className="text-2xl font-mono font-bold">{positions.length}</p>
              <p className="text-xs text-muted-foreground">Positions</p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border/50 text-center">
              <p className="text-2xl font-mono font-bold">{Object.keys(assetClasses).length}</p>
              <p className="text-xs text-muted-foreground">Asset Classes</p>
            </div>
            <div className="p-3 bg-card rounded-lg border border-border/50 text-center">
              <p className="text-2xl font-mono font-bold">
                {new Set(positions.map(p => p.region)).size}
              </p>
              <p className="text-xs text-muted-foreground">Regions</p>
            </div>
          </div>

          {/* Asset Class Breakdown */}
          <div className="p-4 bg-card rounded-xl border border-border/50">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Layers size={14} />
              Asset Class Breakdown
            </h4>
            <div className="space-y-2">
              {Object.entries(assetClasses)
                .sort(([, a], [, b]) => b - a)
                .map(([assetType, weight]) => (
                  <div key={assetType} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{ASSET_TYPE_LABELS[assetType as keyof typeof ASSET_TYPE_LABELS]}</span>
                        <span className="text-sm font-mono">{weight.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${weight}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Save Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <Zap size={18} className="text-primary" />
              <div>
                <p className="text-sm font-medium">Set as Active Target</p>
                <p className="text-xs text-muted-foreground">Use this allocation for drift analysis</p>
              </div>
            </div>
            <Switch checked={setAsActive} onCheckedChange={setSetAsActive} />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Sync to Investment Policy</p>
                <p className="text-xs text-muted-foreground">Update policy ranges based on this allocation</p>
              </div>
            </div>
            <Switch checked={syncToPolicy} onCheckedChange={setSyncToPolicy} />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center pt-4">
        <Button 
          size="lg" 
          className="gap-2 px-8 bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Database size={18} className="animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Target Allocation
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
