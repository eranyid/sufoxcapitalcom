 import { useState, useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Slider } from '@/components/ui/slider';
 import { Separator } from '@/components/ui/separator';
 import { Badge } from '@/components/ui/badge';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Save, Play, TrendingUp, ArrowRight, Zap, Settings2 } from 'lucide-react';
 import { useWorkspaceAllocations } from '@/hooks/useWorkspaceAllocations';
 import { useWorkspaceAssumptions } from '@/hooks/useWorkspaceAssumptions';
 import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, Legend } from 'recharts';
 import { cn } from '@/lib/utils';
 
 // Local optimization types
 interface OptimizationParams {
   tau: number;
   riskAversion: number;
   riskFreeRate: number;
   longOnly: boolean;
   maxWeight: number;
 }
 
 interface LocalOptimizationResult {
   optimizedWeights: Record<string, number>;
   expectedReturnBefore: number;
   expectedReturnAfter: number;
   volatilityBefore: number;
   volatilityAfter: number;
   sharpeBefore: number;
   sharpeAfter: number;
   efficientFrontier: { risk: number; return: number }[];
 }
 
 interface OptimizationStageProps {
   workspaceId: string;
   onComplete: () => void;
 }
 
 export function OptimizationStage({ workspaceId, onComplete }: OptimizationStageProps) {
   const { flatAllocations, isLoading: allocLoading, upsertAllocation } = useWorkspaceAllocations(workspaceId);
   const { assumptions, isLoading: assumptionsLoading } = useWorkspaceAssumptions(workspaceId);
 
   const [params, setParams] = useState<OptimizationParams>({
     tau: 0.05,
     riskAversion: 2.5,
     riskFreeRate: 4,
     longOnly: true,
     maxWeight: 40,
   });
 
   const [result, setResult] = useState<LocalOptimizationResult | null>(null);
   const [isOptimizing, setIsOptimizing] = useState(false);
 
   const inputData = useMemo(() => {
     if (flatAllocations.length === 0 || assumptions.length === 0) return null;
 
     const assumptionMap = new Map(assumptions.map(a => [a.asset_class, a]));
     const assets: { name: string; weight: number; expectedReturn: number; volatility: number; confidence: number }[] = [];
 
     flatAllocations
       .filter(a => a.level === 0)
       .forEach(alloc => {
         const assumption = assumptionMap.get(alloc.name);
         if (assumption) {
           assets.push({
             name: alloc.name,
             weight: alloc.weight,
             expectedReturn: assumption.expected_return,
             volatility: assumption.expected_volatility,
             confidence: assumption.confidence_level,
           });
         }
       });
 
     return assets;
   }, [flatAllocations, assumptions]);
 
   const runOptimization = () => {
     if (!inputData) return;
 
     setIsOptimizing(true);
 
     // Simplified mean-variance optimization
     const n = inputData.length;
     const weights = inputData.map(a => a.weight / 100);
     const returns = inputData.map(a => a.expectedReturn / 100);
     const vols = inputData.map(a => a.volatility / 100);
     
     // Calculate current portfolio metrics
     const currentReturn = weights.reduce((acc, w, i) => acc + w * returns[i], 0);
     const currentVol = Math.sqrt(weights.reduce((acc, w, i) => acc + (w * vols[i]) ** 2, 0));
     const currentSharpe = currentVol > 0 ? (currentReturn - params.riskFreeRate / 100) / currentVol : 0;
     
     // Simple optimization: weight by Sharpe-like score
     const scores = inputData.map((a, i) => {
       const sharpe = vols[i] > 0 ? (returns[i] - params.riskFreeRate / 100) / vols[i] : 0;
       const confidenceBoost = 1 + (a.confidence / 100) * 0.5;
       return Math.max(0, sharpe * confidenceBoost);
     });
     
     const totalScore = scores.reduce((a, b) => a + b, 0);
     let optWeights = totalScore > 0 
       ? scores.map(s => s / totalScore)
       : new Array(n).fill(1 / n);
     
     // Apply max weight constraint
     const maxW = params.maxWeight / 100;
     optWeights = optWeights.map(w => Math.min(w, maxW));
     const sum = optWeights.reduce((a, b) => a + b, 0);
     optWeights = optWeights.map(w => w / sum);
     
     // Calculate optimized metrics
     const optReturn = optWeights.reduce((acc, w, i) => acc + w * returns[i], 0);
     const optVol = Math.sqrt(optWeights.reduce((acc, w, i) => acc + (w * vols[i]) ** 2, 0));
     const optSharpe = optVol > 0 ? (optReturn - params.riskFreeRate / 100) / optVol : 0;
     
     // Generate efficient frontier
     const frontier: { risk: number; return: number }[] = [];
     for (let targetVol = 0.02; targetVol <= 0.25; targetVol += 0.01) {
       frontier.push({
         risk: targetVol,
         return: params.riskFreeRate / 100 + optSharpe * targetVol,
       });
     }
     
     // Build result
     const optimizedWeights: Record<string, number> = {};
     inputData.forEach((a, i) => {
       optimizedWeights[a.name] = optWeights[i];
     });
 
     setResult({
       optimizedWeights,
       expectedReturnBefore: currentReturn,
       expectedReturnAfter: optReturn,
       volatilityBefore: currentVol,
       volatilityAfter: optVol,
       sharpeBefore: currentSharpe,
       sharpeAfter: optSharpe,
       efficientFrontier: frontier,
     });
     setIsOptimizing(false);
   };
 
   const applyOptimizedWeights = async () => {
     if (!result) return;
 
     for (const [name, weight] of Object.entries(result.optimizedWeights)) {
       const allocation = flatAllocations.find(a => a.name === name && a.level === 0);
       if (allocation) {
         await upsertAllocation.mutateAsync({
           ...allocation,
           weight: weight * 100,
         });
       }
     }
     
     onComplete();
   };
 
   if (allocLoading || assumptionsLoading) {
     return <div className="p-8 text-center text-muted-foreground">Loading data...</div>;
   }
 
   if (!inputData || inputData.length === 0) {
     return (
       <div className="p-8 text-center text-muted-foreground">
         <p>Complete previous stages (Assumptions & Construction) first.</p>
       </div>
     );
   }
 
   return (
     <div className="space-y-6 p-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Black-Litterman Optimization</h2>
           <p className="text-muted-foreground mt-1">
             Align portfolio weights with your views while respecting constraints.
           </p>
         </div>
         <Button onClick={onComplete}>
           <Save className="h-4 w-4 mr-2" />
           Save & Continue
         </Button>
       </div>
 
       <div className="grid grid-cols-3 gap-6">
         {/* Parameters Panel */}
         <Card>
           <CardHeader className="pb-3">
             <div className="flex items-center gap-2">
               <Settings2 className="h-5 w-5 text-primary" />
               <CardTitle className="text-lg">Optimization Parameters</CardTitle>
             </div>
           </CardHeader>
           <CardContent className="space-y-5">
             <div className="space-y-2">
               <Label>Tau (τ) — View Uncertainty</Label>
               <div className="flex items-center gap-3">
                 <Slider
                   value={[params.tau]}
                   onValueChange={([v]) => setParams(p => ({ ...p, tau: v }))}
                   min={0.01}
                   max={0.2}
                   step={0.01}
                   className="flex-1"
                 />
                 <span className="w-12 font-mono text-sm">{params.tau.toFixed(2)}</span>
               </div>
               <p className="text-xs text-muted-foreground">Lower = stronger confidence in equilibrium</p>
             </div>
 
             <div className="space-y-2">
               <Label>Risk Aversion (λ)</Label>
               <div className="flex items-center gap-3">
                 <Slider
                   value={[params.riskAversion]}
                   onValueChange={([v]) => setParams(p => ({ ...p, riskAversion: v }))}
                   min={0.5}
                   max={5}
                   step={0.1}
                   className="flex-1"
                 />
                 <span className="w-12 font-mono text-sm">{params.riskAversion.toFixed(1)}</span>
               </div>
             </div>
 
             <div className="space-y-2">
               <Label>Risk-Free Rate (%)</Label>
               <Input
                 type="number"
                 step="0.1"
                 value={params.riskFreeRate}
                 onChange={(e) => setParams(p => ({ ...p, riskFreeRate: parseFloat(e.target.value) || 0 }))}
               />
             </div>
 
             <div className="space-y-2">
               <Label>Max Weight per Asset (%)</Label>
               <div className="flex items-center gap-3">
                 <Slider
                   value={[params.maxWeight || 100]}
                   onValueChange={([v]) => setParams(p => ({ ...p, maxWeight: v }))}
                   min={10}
                   max={100}
                   step={5}
                   className="flex-1"
                 />
                 <span className="w-12 font-mono text-sm">{params.maxWeight}%</span>
               </div>
             </div>
 
             <Separator />
 
             <Button onClick={runOptimization} className="w-full" disabled={isOptimizing}>
               <Play className="h-4 w-4 mr-2" />
               Run Optimization
             </Button>
           </CardContent>
         </Card>
 
         {/* Results Panel */}
         <div className="col-span-2 space-y-6">
           {result ? (
             <>
               {/* Metrics Comparison */}
               <div className="grid grid-cols-3 gap-4">
                 <Card className="bg-card">
                   <CardContent className="pt-4">
                     <div className="text-muted-foreground text-sm">Expected Return</div>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="text-lg font-mono">{(result.expectedReturnBefore * 100).toFixed(2)}%</span>
                       <ArrowRight className="h-4 w-4 text-muted-foreground" />
                       <span className="text-lg font-mono text-primary">{(result.expectedReturnAfter * 100).toFixed(2)}%</span>
                     </div>
                     <Badge className={cn(
                       "mt-2",
                       result.expectedReturnAfter > result.expectedReturnBefore 
                         ? "bg-green-500/20 text-green-400" 
                         : "bg-orange-500/20 text-orange-400"
                     )}>
                       {result.expectedReturnAfter > result.expectedReturnBefore ? '+' : ''}
                       {((result.expectedReturnAfter - result.expectedReturnBefore) * 100).toFixed(2)}%
                     </Badge>
                   </CardContent>
                 </Card>
                 <Card className="bg-card">
                   <CardContent className="pt-4">
                     <div className="text-muted-foreground text-sm">Volatility</div>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="text-lg font-mono">{(result.volatilityBefore * 100).toFixed(2)}%</span>
                       <ArrowRight className="h-4 w-4 text-muted-foreground" />
                       <span className="text-lg font-mono">{(result.volatilityAfter * 100).toFixed(2)}%</span>
                     </div>
                   </CardContent>
                 </Card>
                 <Card className="bg-card">
                   <CardContent className="pt-4">
                     <div className="text-muted-foreground text-sm">Sharpe Ratio</div>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="text-lg font-mono">{result.sharpeBefore.toFixed(2)}</span>
                       <ArrowRight className="h-4 w-4 text-muted-foreground" />
                       <span className="text-lg font-mono text-primary">{result.sharpeAfter.toFixed(2)}</span>
                     </div>
                   </CardContent>
                 </Card>
               </div>
 
               {/* Efficient Frontier */}
               {result.efficientFrontier && result.efficientFrontier.length > 0 && (
                 <Card>
                   <CardHeader className="pb-2">
                     <CardTitle className="text-lg">Efficient Frontier</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="h-64">
                       <ResponsiveContainer width="100%" height="100%">
                         <LineChart data={result.efficientFrontier}>
                           <XAxis 
                             dataKey="risk" 
                             tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                             label={{ value: 'Risk (σ)', position: 'bottom', offset: -5 }}
                           />
                           <YAxis 
                             tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                             label={{ value: 'Return', angle: -90, position: 'insideLeft' }}
                           />
                           <Tooltip 
                             formatter={(v: number) => `${(v * 100).toFixed(2)}%`}
                             contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                           />
                           <Line 
                             type="monotone" 
                             dataKey="return" 
                             stroke="hsl(var(--primary))" 
                             strokeWidth={2}
                             dot={false}
                           />
                           <ReferenceDot 
                             x={result.volatilityBefore} 
                             y={result.expectedReturnBefore} 
                             r={6} 
                             fill="#F59E0B" 
                             stroke="#fff"
                           />
                           <ReferenceDot 
                             x={result.volatilityAfter} 
                             y={result.expectedReturnAfter} 
                             r={6} 
                             fill="#10B981" 
                             stroke="#fff"
                           />
                           <Legend 
                             payload={[
                               { value: 'Current', type: 'circle', color: '#F59E0B' },
                               { value: 'Optimized', type: 'circle', color: '#10B981' },
                             ]}
                           />
                         </LineChart>
                       </ResponsiveContainer>
                     </div>
                   </CardContent>
                 </Card>
               )}
 
               {/* Weights Comparison Table */}
               <Card>
                 <CardHeader className="pb-2">
                   <CardTitle className="text-lg">Weight Adjustments</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <Table>
                     <TableHeader>
                       <TableRow>
                         <TableHead>Asset Class</TableHead>
                         <TableHead className="text-right">Current</TableHead>
                         <TableHead className="text-right">Optimized</TableHead>
                         <TableHead className="text-right">Change</TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {Object.entries(result.optimizedWeights).map(([name, weight]) => {
                         const current = inputData.find(a => a.name === name)?.weight || 0;
                         const change = weight * 100 - current;
                         return (
                           <TableRow key={name}>
                             <TableCell className="font-medium">{name}</TableCell>
                             <TableCell className="text-right font-mono">{current.toFixed(1)}%</TableCell>
                             <TableCell className="text-right font-mono text-primary">{(weight * 100).toFixed(1)}%</TableCell>
                             <TableCell className={cn(
                               "text-right font-mono",
                               change > 0 ? "text-green-400" : change < 0 ? "text-red-400" : "text-muted-foreground"
                             )}>
                               {change > 0 ? '+' : ''}{change.toFixed(1)}%
                             </TableCell>
                           </TableRow>
                         );
                       })}
                     </TableBody>
                   </Table>
                 </CardContent>
               </Card>
 
               <div className="flex justify-end gap-3">
                 <Button variant="outline" onClick={onComplete}>
                   Skip (Keep Current Weights)
                 </Button>
                 <Button onClick={applyOptimizedWeights} className="gap-2">
                   <Zap className="h-4 w-4" />
                   Apply Optimized Weights
                 </Button>
               </div>
             </>
           ) : (
             <Card className="h-full flex items-center justify-center">
               <CardContent className="text-center py-16">
                 <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                 <p className="text-muted-foreground">
                   Configure parameters and run optimization to see results.
                 </p>
               </CardContent>
             </Card>
           )}
         </div>
       </div>
     </div>
   );
 }