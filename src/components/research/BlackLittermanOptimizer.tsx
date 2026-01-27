import { useState, useMemo, useCallback } from 'react';
import { usePortfolio } from '@/context/PortfolioContext';
import { calculateBlackLitterman, getAvailableAssets, AnalystView, BlackLittermanInputs, BlackLittermanResult } from '@/lib/blackLitterman';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Brain, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle, Info, Target, Scale, RefreshCw, ShieldAlert } from 'lucide-react';
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

// ============= View Card Component =============
interface ViewCardProps {
  view: AnalystView;
  onRemove: (id: string) => void;
}

function ViewCard({ view, onRemove }: ViewCardProps) {
  const confidenceLabel = view.confidence >= 80 ? 'High' : view.confidence >= 50 ? 'Medium' : 'Low';
  const confidenceColor = view.confidence >= 80 ? 'text-success' : view.confidence >= 50 ? 'text-warning' : 'text-muted-foreground';
  
  return (
    <Card className="bg-secondary/50 border-border/50">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {view.direction === 'outperform' ? (
                <TrendingUp className="h-3.5 w-3.5 text-success flex-shrink-0" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
              )}
              <span className="font-mono text-xs font-medium text-foreground truncate">
                {view.asset}
              </span>
              {view.comparison === 'relative' && view.comparisonAsset && (
                <>
                  <span className="text-muted-foreground text-[10px]">vs</span>
                  <span className="font-mono text-xs text-muted-foreground truncate">
                    {view.comparisonAsset}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className={view.magnitude >= 0 ? 'text-success' : 'text-destructive'}>
                {view.magnitude >= 0 ? '+' : ''}{view.magnitude.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">•</span>
              <span className={confidenceColor}>
                {confidenceLabel} ({view.confidence}%)
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(view.id)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
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
        <Button variant="outline" size="sm" className="h-7 text-[10px]">
          <Plus className="h-3 w-3 mr-1" />
          Add View
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]" aria-describedby="add-view-description">
        <DialogHeader>
          <DialogTitle className="text-sm font-mono flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            Add Analyst View
          </DialogTitle>
          <DialogDescription id="add-view-description" className="text-[10px]">
            Express your investment thesis by specifying expected returns or relative performance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Asset Selection */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground font-mono">Asset</Label>
            <Select value={asset} onValueChange={setAsset}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select asset..." />
              </SelectTrigger>
              <SelectContent>
                {assets.map(a => (
                  <SelectItem key={a.ticker} value={a.ticker} className="text-xs">
                    <span className="font-mono">{a.ticker}</span>
                    <span className="text-muted-foreground ml-2">{a.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Direction */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground font-mono">Direction</Label>
            <div className="flex gap-2">
              <Button
                variant={direction === 'outperform' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDirection('outperform')}
                className="flex-1 h-8 text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Outperform
              </Button>
              <Button
                variant={direction === 'underperform' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setDirection('underperform')}
                className="flex-1 h-8 text-xs"
              >
                <TrendingDown className="h-3 w-3 mr-1" />
                Underperform
              </Button>
            </div>
          </div>
          
          {/* Comparison Type */}
          <div className="space-y-2">
            <Label className="text-[10px] text-muted-foreground font-mono">Comparison</Label>
            <div className="flex gap-2">
              <Button
                variant={comparison === 'absolute' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparison('absolute')}
                className="flex-1 h-8 text-xs"
              >
                Absolute
              </Button>
              <Button
                variant={comparison === 'relative' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparison('relative')}
                className="flex-1 h-8 text-xs"
              >
                Relative
              </Button>
            </div>
          </div>
          
          {/* Comparison Asset (if relative) */}
          {comparison === 'relative' && (
            <div className="space-y-2">
              <Label className="text-[10px] text-muted-foreground font-mono">Compare To</Label>
              <Select value={comparisonAsset} onValueChange={setComparisonAsset}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select comparison asset..." />
                </SelectTrigger>
                <SelectContent>
                  {assets.filter(a => a.ticker !== asset).map(a => (
                    <SelectItem key={a.ticker} value={a.ticker} className="text-xs">
                      <span className="font-mono">{a.ticker}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Magnitude */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-[10px] text-muted-foreground font-mono">
                Expected {comparison === 'relative' ? 'Outperformance' : 'Return'}
              </Label>
              <span className="font-mono text-xs text-primary">
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
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-[10px] text-muted-foreground font-mono">Confidence Level</Label>
              <span className={`font-mono text-xs ${
                confidence >= 80 ? 'text-success' : confidence >= 50 ? 'text-warning' : 'text-muted-foreground'
              }`}>
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
            <p className="text-[9px] text-muted-foreground">
              Higher confidence = stronger weight on your view vs market equilibrium
            </p>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={!asset || (comparison === 'relative' && !comparisonAsset)}
            className="w-full"
          >
            Add View
          </Button>
        </div>
      </DialogContent>
    </Dialog>
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
      .slice(0, 12)
      .map(item => ({
        asset: item.asset,
        equilibrium: item.equilibrium,
        posterior: item.posterior,
        delta: item.delta
      }));
  }, [result]);
  
  // Chart data for weight allocation
  const weightAllocationData = useMemo(() => {
    if (!result) return [];
    return result.assets
      .map((asset, i) => ({
        name: asset,
        market: result.marketWeights[i] * 100,
        optimal: result.optimalWeights[i] * 100
      }))
      .filter(d => d.market > 0.5 || d.optimal > 0.5)
      .sort((a, b) => b.optimal - a.optimal);
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
    'hsl(0, 80%, 60%)',     // Coral
    'hsl(210, 100%, 55%)',  // Blue
    'hsl(120, 60%, 40%)',   // Green
    'hsl(280, 80%, 60%)',   // Purple
    'hsl(30, 100%, 50%)',   // Orange
    'hsl(190, 80%, 50%)',   // Cyan
  ];
  
  const hasData = transactions.length > 0 && valuations.length > 0;
  
  if (!hasData) {
    return (
      <BloombergPanel title="Black-Litterman Optimizer" titleIcon={<Brain className="h-4 w-4 text-primary" />}>
        <div className="p-8 text-center">
          <Brain className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-sm font-medium mb-1 text-primary">No Data Available</h3>
          <p className="text-muted-foreground text-xs max-w-md mx-auto">
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
          variant="outline" 
          size="sm" 
          onClick={calculate}
          disabled={isCalculating}
          className="h-7 text-[10px]"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isCalculating ? 'animate-spin' : ''}`} />
          {isCalculating ? 'Computing...' : 'Run Model'}
        </Button>
      }
      contentClassName="p-0"
    >
      {/* Info Banner */}
      <div className="flex items-start gap-2 p-3 bg-primary/5 border-b border-border/30">
        <Info className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground font-mono">
          Black-Litterman combines market equilibrium returns with your analyst views to produce a stable, 
          intuitive allocation. Add views to tilt the portfolio towards your investment thesis.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* LEFT PANEL: Market & Inputs */}
        <div className="space-y-4">
          <Card className="bg-secondary/30 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-mono flex items-center gap-2">
                <Scale className="h-3.5 w-3.5 text-primary" />
                Model Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tau */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-[10px] text-muted-foreground font-mono">Tau (τ)</Label>
                  <span className="font-mono text-xs text-foreground">{tau.toFixed(3)}</span>
                </div>
                <Slider
                  value={[tau]}
                  onValueChange={([v]) => setTau(v)}
                  min={0.01}
                  max={0.1}
                  step={0.005}
                  className="py-1"
                />
                <p className="text-[9px] text-muted-foreground">
                  Scales the uncertainty in equilibrium. Higher = more weight on views.
                </p>
              </div>
              
              {/* Risk Aversion */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-[10px] text-muted-foreground font-mono">Risk Aversion (δ)</Label>
                  <span className="font-mono text-xs text-foreground">{riskAversion.toFixed(2)}</span>
                </div>
                <Slider
                  value={[riskAversion]}
                  onValueChange={([v]) => setRiskAversion(v)}
                  min={1}
                  max={5}
                  step={0.1}
                  className="py-1"
                />
                <p className="text-[9px] text-muted-foreground">
                  Market risk aversion coefficient. Higher = more conservative.
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Equilibrium Returns Preview */}
          {result && (
            <Card className="bg-secondary/30 border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Market Equilibrium (Π)
                </CardTitle>
                <CardDescription className="text-[9px]">
                  Implied returns from reverse optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[180px]">
                  <div className="space-y-1.5">
                    {result.viewImpact
                      .sort((a, b) => b.equilibrium - a.equilibrium)
                      .map(item => (
                        <div key={item.asset} className="flex justify-between items-center text-[10px]">
                          <span className="font-mono text-muted-foreground">{item.asset}</span>
                          <span className={`font-mono ${item.equilibrium >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {item.equilibrium >= 0 ? '+' : ''}{item.equilibrium.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* MIDDLE PANEL: Analyst Views */}
        <div className="space-y-4">
          <Card className="bg-secondary/30 border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-mono flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-primary" />
                  Analyst Views
                </CardTitle>
                <AddViewDialog assets={availableAssets} onAdd={handleAddView} />
              </div>
              <CardDescription className="text-[9px]">
                Express your investment views to tilt the portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {views.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-[10px] text-muted-foreground">
                    No views added yet. Click "Add View" to express your investment thesis.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2 pr-2">
                    {views.map(view => (
                      <ViewCard key={view.id} view={view} onRemove={handleRemoveView} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          {/* View Summary */}
          {views.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[9px]">
                {views.length} View{views.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="text-[9px] text-success border-success/30">
                {views.filter(v => v.direction === 'outperform').length} Bullish
              </Badge>
              <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">
                {views.filter(v => v.direction === 'underperform').length} Bearish
              </Badge>
            </div>
          )}
        </div>
        
        {/* RIGHT PANEL: Results & Charts */}
        <div className="space-y-4">
          {result?.validationErrors && result.validationErrors.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-xs font-mono text-destructive">Issues</span>
              </div>
              <ul className="space-y-1">
                {result.validationErrors.map((err, idx) => (
                  <li key={idx} className="text-[10px] font-mono text-muted-foreground">• {err}</li>
                ))}
              </ul>
            </div>
          )}
          
          {result && result.assets.length > 0 && (
            <>
              {/* Return Comparison Chart */}
              <Card className="bg-secondary/30 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono">Return Comparison</CardTitle>
                  <CardDescription className="text-[9px]">
                    Market equilibrium vs Black-Litterman posterior
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={returnComparisonData} 
                        layout="vertical"
                        margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="2 2" stroke="hsl(0, 0%, 18%)" strokeWidth={0.5} />
                        <XAxis 
                          type="number" 
                          tick={{ fill: 'hsl(0, 0%, 45%)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                          tickFormatter={v => `${v.toFixed(0)}%`}
                        />
                        <YAxis 
                          dataKey="asset" 
                          type="category" 
                          width={50}
                          tick={{ fill: 'hsl(0, 0%, 45%)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            fontSize: '10px',
                            fontFamily: 'JetBrains Mono'
                          }}
                          formatter={(value: number, name: string) => [
                            `${value.toFixed(2)}%`,
                            name === 'equilibrium' ? 'Equilibrium' : 'BL Posterior'
                          ]}
                        />
                        <Bar dataKey="equilibrium" fill="hsl(0, 0%, 40%)" name="equilibrium" />
                        <Bar dataKey="posterior" fill="hsl(45, 100%, 50%)" name="posterior" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Optimal Weights Donut */}
              <Card className="bg-secondary/30 border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-mono">Optimal Allocation</CardTitle>
                  <CardDescription className="text-[9px]">
                    Black-Litterman optimal weights
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={1}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value }) => value >= 5 ? `${name}` : ''}
                          labelLine={false}
                        >
                          {donutData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            fontSize: '10px',
                            fontFamily: 'JetBrains Mono'
                          }}
                          formatter={(value: number) => [`${value.toFixed(1)}%`]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Methodology Disclaimer */}
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full">
                  <ShieldAlert className="h-3 w-3" />
                  <span className="font-mono">Model Assumptions & Limitations</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 p-2 bg-muted/30 rounded-sm">
                  <ul className="space-y-1 text-[9px] text-muted-foreground font-mono">
                    <li>• Returns are annualized from monthly data</li>
                    <li>• Long-only constraint applied (no short positions)</li>
                    <li>• Covariance matrix regularized for numerical stability</li>
                    <li>• Optimal weights use simplex projection</li>
                    <li>• This is not investment advice</li>
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
          
          {!result && (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-xs text-muted-foreground mb-2">
                Configure parameters and add views, then click "Run Model"
              </p>
              <Button onClick={calculate} size="sm" className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" />
                Run Model
              </Button>
            </div>
          )}
        </div>
      </div>
    </BloombergPanel>
  );
}
