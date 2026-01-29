import { useState, useMemo, useCallback } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculateBlackLitterman, getAvailableAssets, AnalystView, BlackLittermanInputs, BlackLittermanResult } from '@/lib/blackLitterman';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Brain, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Info, Target, Scale, RefreshCw, ShieldAlert, ChevronDown, Sparkles, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BloombergPanel } from '@/components/ui/bloomberg-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// ============= View Card Component =============
interface ViewCardProps {
  view: AnalystView;
  onRemove: (id: string) => void;
}

function ViewCard({ view, onRemove }: ViewCardProps) {
  const confidenceLabel = view.confidence >= 80 ? 'High' : view.confidence >= 50 ? 'Medium' : 'Low';
  const confidenceColor = view.confidence >= 80 ? 'text-emerald-400' : view.confidence >= 50 ? 'text-amber-400' : 'text-muted-foreground';
  
  return (
    <div className="group relative flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-all">
      {/* Direction indicator */}
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg",
        view.direction === 'outperform' ? 'bg-emerald-500/10' : 'bg-red-500/10'
      )}>
        {view.direction === 'outperform' ? (
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-400" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-foreground">
            {view.asset}
          </span>
          {view.comparison === 'relative' && view.comparisonAsset && (
            <>
              <span className="text-xs text-muted-foreground">vs</span>
              <span className="font-mono text-sm text-muted-foreground">
                {view.comparisonAsset}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className={cn(
            "font-mono text-xs font-medium",
            view.magnitude >= 0 ? 'text-emerald-400' : 'text-red-400'
          )}>
            {view.magnitude >= 0 ? '+' : ''}{view.magnitude.toFixed(1)}%
          </span>
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              view.confidence >= 80 ? 'bg-emerald-400' : view.confidence >= 50 ? 'bg-amber-400' : 'bg-muted-foreground'
            )} />
            <span className={cn("text-xs", confidenceColor)}>
              {confidenceLabel}
            </span>
          </div>
        </div>
      </div>
      
      {/* Remove button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(view.id)}
        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-opacity"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ============= Add View Dialog =============
interface AddViewDialogProps {
  assets: { ticker: string; name: string }[];
  onAdd: (view: Omit<AnalystView, 'id'>) => void;
}

function AddViewDialog({ assets, onAdd }: AddViewDialogProps) {
  const [open, setOpen] = useState(false);
  const [asset, setAsset] = useState('');
  const [direction, setDirection] = useState<'outperform' | 'underperform'>('outperform');
  const [comparison, setComparison] = useState<'absolute' | 'relative'>('absolute');
  const [comparisonAsset, setComparisonAsset] = useState('');
  const [magnitude, setMagnitude] = useState(5);
  const [confidence, setConfidence] = useState(70);

  const handleSubmit = () => {
    if (!asset) return;
    
    onAdd({
      asset,
      direction,
      comparison,
      comparisonAsset: comparison === 'relative' ? comparisonAsset : undefined,
      magnitude: direction === 'outperform' ? magnitude : -magnitude,
      confidence
    });
    
    // Reset form
    setAsset('');
    setComparisonAsset('');
    setMagnitude(5);
    setConfidence(70);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2">
          <Plus className="h-3.5 w-3.5" />
          Add View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]" aria-describedby="add-view-description">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Brain className="h-4 w-4 text-primary" />
            </div>
            Add Analyst View
          </DialogTitle>
          <DialogDescription id="add-view-description" className="text-xs text-muted-foreground">
            Express your investment thesis by specifying expected returns or relative performance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Asset Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Select Asset</Label>
            <Select value={asset} onValueChange={setAsset}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choose an asset..." />
              </SelectTrigger>
              <SelectContent>
                {assets.map(a => (
                  <SelectItem key={a.ticker} value={a.ticker}>
                    <span className="font-mono font-medium">{a.ticker}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{a.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Direction */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Direction</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={direction === 'outperform' ? 'default' : 'outline'}
                onClick={() => setDirection('outperform')}
                className={cn(
                  "h-10",
                  direction === 'outperform' && "bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Bullish
              </Button>
              <Button
                type="button"
                variant={direction === 'underperform' ? 'destructive' : 'outline'}
                onClick={() => setDirection('underperform')}
                className="h-10"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                Bearish
              </Button>
            </div>
          </div>
          
          {/* Comparison Type */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Comparison Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={comparison === 'absolute' ? 'default' : 'outline'}
                onClick={() => setComparison('absolute')}
                className="h-9"
              >
                Absolute
              </Button>
              <Button
                type="button"
                variant={comparison === 'relative' ? 'default' : 'outline'}
                onClick={() => setComparison('relative')}
                className="h-9"
              >
                Relative
              </Button>
            </div>
          </div>
          
          {/* Comparison Asset (if relative) */}
          {comparison === 'relative' && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Compare To</Label>
              <Select value={comparisonAsset} onValueChange={setComparisonAsset}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select comparison asset..." />
                </SelectTrigger>
                <SelectContent>
                  {assets.filter(a => a.ticker !== asset).map(a => (
                    <SelectItem key={a.ticker} value={a.ticker}>
                      <span className="font-mono">{a.ticker}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Magnitude */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">
                Expected {comparison === 'relative' ? 'Outperformance' : 'Return'}
              </Label>
              <span className={cn(
                "font-mono text-sm font-semibold px-2 py-0.5 rounded",
                direction === 'outperform' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
              )}>
                {direction === 'outperform' ? '+' : '-'}{magnitude}%
              </span>
            </div>
            <Slider
              value={[magnitude]}
              onValueChange={([v]) => setMagnitude(v)}
              min={0.5}
              max={30}
              step={0.5}
              className="py-2"
            />
          </div>
          
          {/* Confidence */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">Confidence Level</Label>
              <span className={cn(
                "font-mono text-sm font-semibold px-2 py-0.5 rounded",
                confidence >= 80 ? 'text-emerald-400 bg-emerald-500/10' : 
                confidence >= 50 ? 'text-amber-400 bg-amber-500/10' : 
                'text-muted-foreground bg-muted'
              )}>
                {confidence}%
              </span>
            </div>
            <Slider
              value={[confidence]}
              onValueChange={([v]) => setConfidence(v)}
              min={10}
              max={95}
              step={5}
              className="py-2"
            />
            <p className="text-[10px] text-muted-foreground">
              Higher confidence = stronger weight on your view vs market equilibrium
            </p>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={!asset || (comparison === 'relative' && !comparisonAsset)}
            className="w-full h-10 mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============= Parameter Card Component =============
interface ParameterCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  children: React.ReactNode;
}

function ParameterCard({ icon, label, value, description, children }: ParameterCardProps) {
  return (
    <div className="p-4 rounded-xl bg-card/50 border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            {icon}
          </div>
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
        </div>
        <span className="font-mono text-sm font-semibold text-foreground">{value}</span>
      </div>
      {children}
      <p className="text-[10px] text-muted-foreground/80">{description}</p>
    </div>
  );
}

// ============= Main Component =============
export function BlackLittermanOptimizer() {
  const { transactions, valuations } = usePortfolio();
  
  // Model parameters
  const [tau, setTau] = useState(0.05);
  const [riskAversion, setRiskAversion] = useState(2.5);
  const [views, setViews] = useState<AnalystView[]>([]);
  const [result, setResult] = useState<BlackLittermanResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Get available assets
  const availableAssets = useMemo(() => 
    getAvailableAssets(transactions, valuations),
    [transactions, valuations]
  );
  
  // Add view handler
  const handleAddView = useCallback((view: Omit<AnalystView, 'id'>) => {
    setViews(prev => [...prev, { ...view, id: crypto.randomUUID() }]);
  }, []);
  
  // Remove view handler
  const handleRemoveView = useCallback((id: string) => {
    setViews(prev => prev.filter(v => v.id !== id));
  }, []);
  
  // Calculate Black-Litterman
  const calculate = useCallback(() => {
    setIsCalculating(true);
    
    setTimeout(() => {
      const inputs: BlackLittermanInputs = { tau, riskAversion, views };
      const blResult = calculateBlackLitterman(transactions, valuations, inputs);
      setResult(blResult);
      setIsCalculating(false);
    }, 50);
  }, [transactions, valuations, tau, riskAversion, views]);
  
  // Chart data for return comparison
  const returnComparisonData = useMemo(() => {
    if (!result) return [];
    return result.viewImpact
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 10)
      .map(item => ({
        asset: item.asset,
        equilibrium: item.equilibrium,
        posterior: item.posterior,
        delta: item.delta
      }));
  }, [result]);
  
  // Donut chart data
  const donutData = useMemo(() => {
    if (!result) return [];
    return result.assets
      .map((asset, i) => ({
        name: asset,
        value: result.optimalWeights[i] * 100
      }))
      .filter(d => d.value >= 1)
      .sort((a, b) => b.value - a.value);
  }, [result]);
  
  const COLORS = [
    'hsl(45, 100%, 50%)',   // Yellow/Gold
    'hsl(173, 80%, 40%)',   // Teal
    'hsl(0, 80%, 60%)',     // Coral/Red
    'hsl(210, 100%, 55%)',  // Blue
    'hsl(120, 60%, 45%)',   // Green
    'hsl(280, 80%, 60%)',   // Purple
    'hsl(30, 100%, 50%)',   // Orange
    'hsl(190, 80%, 50%)',   // Cyan
    'hsl(340, 80%, 55%)',   // Pink
    'hsl(60, 70%, 45%)',    // Lime
  ];
  
  const hasData = transactions.length > 0 && valuations.length > 0;
  
  if (!hasData) {
    return (
      <BloombergPanel title="Black-Litterman Optimizer" titleIcon={<Brain className="h-4 w-4 text-primary" />}>
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Brain className="h-8 w-8 text-primary/60" />
          </div>
          <h3 className="text-sm font-semibold mb-2">No Portfolio Data</h3>
          <p className="text-muted-foreground text-xs max-w-sm mx-auto">
            Add transactions and valuations to use the Black-Litterman optimizer.
          </p>
        </div>
      </BloombergPanel>
    );
  }
  
  return (
    <BloombergPanel 
      title="Black-Litterman Optimizer" 
      titleIcon={<Brain className="h-4 w-4 text-primary" />}
      actions={
        <Button 
          onClick={calculate}
          disabled={isCalculating}
          size="sm"
          className="h-8 gap-2"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isCalculating && 'animate-spin')} />
          {isCalculating ? 'Computing...' : 'Run Model'}
        </Button>
      }
      contentClassName="p-0"
    >
      {/* Info Banner */}
      <div className="flex items-start gap-3 px-5 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-border/30">
        <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5">
          <Info className="h-3.5 w-3.5 text-primary" />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Black-Litterman combines market equilibrium returns with your analyst views to produce a stable, 
          intuitive allocation. Add views to tilt the portfolio towards your investment thesis.
        </p>
      </div>
      
      <div className="p-5">
        {/* Two-column layout: Left for inputs, Right for results */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT SIDE: Parameters + Views (narrower) */}
          <div className="xl:col-span-4 space-y-5">
            
            {/* Model Parameters Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model Parameters</h3>
              </div>
              
              <ParameterCard
                icon={<Scale className="h-3.5 w-3.5 text-primary" />}
                label="Tau (τ)"
                value={tau.toFixed(3)}
                description="Scales uncertainty in equilibrium. Higher = more weight on views."
              >
                <Slider
                  value={[tau]}
                  onValueChange={([v]) => setTau(v)}
                  min={0.01}
                  max={0.1}
                  step={0.005}
                  className="py-1"
                />
              </ParameterCard>
              
              <ParameterCard
                icon={<Target className="h-3.5 w-3.5 text-primary" />}
                label="Risk Aversion (δ)"
                value={riskAversion.toFixed(2)}
                description="Market risk aversion coefficient. Higher = more conservative."
              >
                <Slider
                  value={[riskAversion]}
                  onValueChange={([v]) => setRiskAversion(v)}
                  min={1}
                  max={5}
                  step={0.1}
                  className="py-1"
                />
              </ParameterCard>
            </div>
            
            {/* Analyst Views Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Analyst Views</h3>
                </div>
                <AddViewDialog assets={availableAssets} onAdd={handleAddView} />
              </div>
              
              {views.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border/50 bg-card/30">
                  <div className="w-12 h-12 mx-auto rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <Brain className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">No views added yet</p>
                  <p className="text-[10px] text-muted-foreground/70">
                    Click "Add View" to express your investment thesis
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {views.map(view => (
                    <ViewCard key={view.id} view={view} onRemove={handleRemoveView} />
                  ))}
                  
                  {/* View Summary Badges */}
                  <div className="flex items-center gap-2 pt-2">
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {views.length} {views.length === 1 ? 'View' : 'Views'}
                    </Badge>
                    {views.filter(v => v.direction === 'outperform').length > 0 && (
                      <Badge className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                        {views.filter(v => v.direction === 'outperform').length} Bullish
                      </Badge>
                    )}
                    {views.filter(v => v.direction === 'underperform').length > 0 && (
                      <Badge className="text-[10px] font-mono bg-red-500/10 text-red-400 border-red-500/30">
                        {views.filter(v => v.direction === 'underperform').length} Bearish
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Equilibrium Returns */}
            {result && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Market Equilibrium (Π)</h3>
                </div>
                <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
                  <ScrollArea className="h-[200px]">
                    <div className="p-3 space-y-1">
                      {result.viewImpact
                        .sort((a, b) => b.equilibrium - a.equilibrium)
                        .map((item, idx) => (
                          <div 
                            key={item.asset} 
                            className={cn(
                              "flex justify-between items-center py-2 px-3 rounded-lg",
                              idx % 2 === 0 ? 'bg-muted/20' : ''
                            )}
                          >
                            <span className="font-mono text-xs text-muted-foreground">{item.asset}</span>
                            <span className={cn(
                              "font-mono text-xs font-medium",
                              item.equilibrium >= 0 ? 'text-emerald-400' : 'text-red-400'
                            )}>
                              {item.equilibrium >= 0 ? '+' : ''}{item.equilibrium.toFixed(2)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
          
          {/* RIGHT SIDE: Results & Charts (wider) */}
          <div className="xl:col-span-8 space-y-5">
            
            {/* Validation Errors */}
            {result?.validationErrors && result.validationErrors.length > 0 && (
              <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Model Issues</span>
                </div>
                <ul className="space-y-1.5">
                  {result.validationErrors.map((err, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {result && result.assets.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Return Comparison Chart */}
                <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/30">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Return Comparison</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Equilibrium vs BL Posterior</p>
                  </div>
                  <div className="p-4">
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={returnComparisonData} 
                          layout="vertical"
                          margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                          barGap={2}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" horizontal={true} vertical={false} />
                          <XAxis 
                            type="number" 
                            tick={{ fill: 'hsl(0, 0%, 50%)', fontSize: 10, fontFamily: 'monospace' }}
                            tickFormatter={v => `${v.toFixed(0)}%`}
                            axisLine={{ stroke: 'hsl(0, 0%, 20%)' }}
                          />
                          <YAxis 
                            dataKey="asset" 
                            type="category" 
                            width={55}
                            tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 10, fontFamily: 'monospace' }}
                            axisLine={{ stroke: 'hsl(0, 0%, 20%)' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontFamily: 'monospace'
                            }}
                            formatter={(value: number, name: string) => [
                              `${value.toFixed(2)}%`,
                              name === 'equilibrium' ? 'Equilibrium' : 'BL Posterior'
                            ]}
                          />
                          <Bar dataKey="equilibrium" fill="hsl(0, 0%, 35%)" name="equilibrium" radius={[0, 2, 2, 0]} />
                          <Bar dataKey="posterior" fill="hsl(45, 100%, 50%)" name="posterior" radius={[0, 2, 2, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[hsl(0,0%,35%)]" />
                        <span className="text-[10px] text-muted-foreground">Equilibrium</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm bg-[hsl(45,100%,50%)]" />
                        <span className="text-[10px] text-muted-foreground">BL Posterior</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Optimal Allocation Donut */}
                <div className="rounded-xl border border-border/50 bg-card/30 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border/30">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-primary">Optimal Allocation</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Black-Litterman optimal weights</p>
                  </div>
                  <div className="p-4">
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={95}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            stroke="hsl(var(--background))"
                            strokeWidth={2}
                          >
                            {donutData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--popover))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontFamily: 'monospace'
                            }}
                            formatter={(value: number) => [`${value.toFixed(1)}%`]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Top allocations legend */}
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border/30">
                      {donutData.slice(0, 6).map((item, idx) => (
                        <div key={item.name} className="flex items-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="text-[10px] text-muted-foreground font-mono truncate">{item.name}</span>
                          <span className="text-[10px] font-mono text-foreground ml-auto">{item.value.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16 px-8 rounded-xl border border-dashed border-border/50 bg-card/20">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <RefreshCw className="h-7 w-7 text-primary/60" />
                </div>
                <h3 className="text-sm font-semibold mb-2">Ready to Optimize</h3>
                <p className="text-xs text-muted-foreground text-center max-w-sm mb-4">
                  Configure model parameters, add your analyst views, then click "Run Model" to generate optimal allocations.
                </p>
                <Button onClick={calculate} size="sm" className="gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Run Model
                </Button>
              </div>
            )}
            
            {/* Methodology Disclaimer */}
            {result && result.assets.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full group">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Model Assumptions & Limitations</span>
                  <ChevronDown className="h-3 w-3 ml-auto transition-transform group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="p-4 bg-muted/20 rounded-xl border border-border/30">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Returns are annualized from monthly data
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Long-only constraint applied (no shorts)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Covariance matrix regularized for stability
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        Optimal weights use simplex projection
                      </li>
                      <li className="flex items-start gap-2 sm:col-span-2">
                        <span className="text-amber-400">⚠</span>
                        This is for research purposes only and does not constitute investment advice
                      </li>
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </div>
      </div>
    </BloombergPanel>
  );
}
