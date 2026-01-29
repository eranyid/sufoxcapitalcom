import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  AlternativesAllocation, 
  AlternativeConfig, 
  ALTERNATIVE_LABELS, 
  ALTERNATIVE_STRATEGIES,
  AlternativeStrategy 
} from '@/types/construction';
import { 
  Building2, 
  TrendingUp, 
  Factory, 
  Landmark, 
  Banknote, 
  LineChart,
  Check,
  AlertCircle,
  Globe,
  Info,
  Lock,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AlternativesStepProps {
  alternatives: AlternativesAllocation;
  configs: AlternativeConfig[];
  onUpdateAlternatives: (alternatives: AlternativesAllocation) => void;
  onUpdateConfigs: (configs: AlternativeConfig[]) => void;
}

const ALTERNATIVE_ICONS: Record<keyof AlternativesAllocation, typeof Building2> = {
  privateEquity: TrendingUp,
  ventureCapital: LineChart,
  realEstate: Building2,
  infrastructure: Factory,
  privateCredit: Banknote,
  hedgeFunds: Landmark,
};

const ALTERNATIVE_COLORS: Record<keyof AlternativesAllocation, { border: string; bg: string; text: string }> = {
  privateEquity: { border: 'border-l-violet-500', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  ventureCapital: { border: 'border-l-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  realEstate: { border: 'border-l-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  infrastructure: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  privateCredit: { border: 'border-l-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  hedgeFunds: { border: 'border-l-rose-500', bg: 'bg-rose-500/10', text: 'text-rose-400' },
};

const GEOGRAPHY_OPTIONS = [
  { value: 'global', label: 'Global' },
  { value: 'us', label: 'United States' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia Pacific' },
  { value: 'israel', label: 'Israel' },
];

const ALTERNATIVE_DESCRIPTIONS: Record<keyof AlternativesAllocation, string> = {
  privateEquity: 'Buyout, growth equity, and distressed strategies for equity ownership in private companies',
  ventureCapital: 'Early to late-stage investments in high-growth startups and emerging companies',
  realEstate: 'Core, value-add, and opportunistic real estate across office, industrial, multifamily',
  infrastructure: 'Transport, digital infrastructure, energy transition, and essential services',
  privateCredit: 'Direct lending, mezzanine financing, and specialty finance solutions',
  hedgeFunds: 'Equity long/short, relative value, macro, and multi-strategy approaches',
};

export function AlternativesStep({ 
  alternatives, 
  configs, 
  onUpdateAlternatives, 
  onUpdateConfigs 
}: AlternativesStepProps) {
  const total = Object.values(alternatives).reduce((sum, val) => sum + val, 0);
  const isValid = Math.abs(total - 100) < 0.01;

  const updateWeight = (key: keyof AlternativesAllocation, value: number) => {
    onUpdateAlternatives({ ...alternatives, [key]: value });
    
    // Update matching config
    const updatedConfigs = configs.map(c => 
      c.key === key ? { ...c, targetWeight: value } : c
    );
    onUpdateConfigs(updatedConfigs);
  };

  const updateConfig = (key: keyof AlternativesAllocation, updates: Partial<AlternativeConfig>) => {
    const updatedConfigs = configs.map(c => 
      c.key === key ? { ...c, ...updates } : c
    );
    onUpdateConfigs(updatedConfigs);
  };

  const getConfigForKey = (key: keyof AlternativesAllocation): AlternativeConfig | undefined => {
    return configs.find(c => c.key === key);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 blur-md animate-pulse" />
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
              <Landmark size={18} className="text-primary" />
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium flex items-center gap-2">
              Alternative Investments
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary font-mono">
                ILLIQUID
              </Badge>
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">
              ALLOCATE WITHIN ALTERNATIVES SLEEVE (FROM ASSET CLASS STEP)
            </p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info size={14} className="text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-xs">
                Based on J.P. Morgan Guide to Alternatives. These allocations represent the breakdown 
                within your alternatives sleeve. Total should equal 100% of your alternatives allocation.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Summary Bar */}
      <div className="relative h-4 bg-muted/30 rounded-full overflow-hidden flex">
        {(Object.keys(alternatives) as Array<keyof AlternativesAllocation>).map((key) => {
          const weight = alternatives[key];
          const colors = ALTERNATIVE_COLORS[key];
          if (weight <= 0) return null;
          return (
            <TooltipProvider key={key}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn("h-full transition-all duration-500 cursor-pointer hover:opacity-80", colors.bg)}
                    style={{ width: `${weight}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-mono">{ALTERNATIVE_LABELS[key]}: {weight}%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Alternatives Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(Object.keys(alternatives) as Array<keyof AlternativesAllocation>).map((key) => {
          const Icon = ALTERNATIVE_ICONS[key];
          const colors = ALTERNATIVE_COLORS[key];
          const config = getConfigForKey(key);
          const strategies = ALTERNATIVE_STRATEGIES[key];
          
          return (
            <Card 
              key={key} 
              className={cn(
                "relative overflow-hidden bg-card/80 backdrop-blur-sm border-l-4 transition-all duration-300 hover:shadow-lg group",
                colors.border
              )}
            >
              {/* Top glow line */}
              <div className={cn("absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-30", colors.text)} />
              
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                      <Icon size={16} className={colors.text} />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">{ALTERNATIVE_LABELS[key]}</h4>
                      <p className="text-[9px] text-muted-foreground line-clamp-2">
                        {ALTERNATIVE_DESCRIPTIONS[key]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Weight */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      Allocation
                    </Label>
                    <span className={cn("text-lg font-mono font-bold", colors.text)}>
                      {alternatives[key]}%
                    </span>
                  </div>
                  <Input
                    type="number"
                    value={alternatives[key]}
                    onChange={(e) => updateWeight(key, Number(e.target.value))}
                    className="h-8 text-sm font-mono bg-muted/30 border-border/50"
                    min={0}
                    max={100}
                  />
                  <Progress value={alternatives[key]} className="h-1" />
                </div>

                {/* Strategy */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp size={10} />
                    Strategy
                  </Label>
                  <Select
                    value={config?.strategy || strategies[0].value}
                    onValueChange={(val) => updateConfig(key, { strategy: val as AlternativeStrategy })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Geography */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Globe size={10} />
                    Geography
                  </Label>
                  <Select
                    value={config?.geography || 'global'}
                    onValueChange={(val) => updateConfig(key, { geography: val as AlternativeConfig['geography'] })}
                  >
                    <SelectTrigger className="h-8 text-xs bg-muted/30 border-border/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GEOGRAPHY_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value} className="text-xs">
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lockup Period (for PE/VC) */}
                {(key === 'privateEquity' || key === 'ventureCapital' || key === 'infrastructure') && (
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                        <Lock size={8} />
                        Lockup (yrs)
                      </Label>
                      <Input
                        type="number"
                        value={config?.lockupYears || ''}
                        onChange={(e) => updateConfig(key, { lockupYears: e.target.value ? Number(e.target.value) : undefined })}
                        className="h-7 text-xs font-mono bg-muted/30 border-border/50"
                        placeholder="7-10"
                        min={1}
                        max={15}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                        <Calendar size={8} />
                        Vintage
                      </Label>
                      <Input
                        type="text"
                        value={config?.vintage || ''}
                        onChange={(e) => updateConfig(key, { vintage: e.target.value })}
                        className="h-7 text-xs font-mono bg-muted/30 border-border/50"
                        placeholder="2024"
                      />
                    </div>
                  </div>
                )}
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
            <span className="text-sm font-medium">Total Alternatives Allocation</span>
            <p className="text-[10px] font-mono text-muted-foreground">
              {isValid ? "WITHIN-SLEEVE BALANCED" : "MUST EQUAL 100%"}
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

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
        <Info size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-[11px] text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">Risk/Return Profile:</strong> Alternatives typically offer higher 
            returns (10-15% IRR) with lower correlation to public markets but require longer lock-up periods.
          </p>
          <p>
            <strong className="text-foreground">Manager Selection:</strong> Private markets show significant 
            dispersion between top and bottom quartile managers (up to 25% difference in returns).
          </p>
        </div>
      </div>
    </div>
  );
}
