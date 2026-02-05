 import { useMemo } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Separator } from '@/components/ui/separator';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { Save, TrendingUp, Activity, Target, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
 import { useWorkspaceAllocations } from '@/hooks/useWorkspaceAllocations';
 import { useWorkspaceAssumptions } from '@/hooks/useWorkspaceAssumptions';
 import { useWorkspaceConstraints } from '@/hooks/useWorkspaceConstraints';
 import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
 import { cn } from '@/lib/utils';
 
 interface ExpectedReturnStageProps {
   workspaceId: string;
   onComplete: () => void;
 }
 
 const COLORS = ['#00E6D2', '#F59E0B', '#6366F1', '#EC4899', '#10B981', '#8B5CF6', '#F43F5E', '#3B82F6', '#84CC16', '#06B6D4'];
 
 export function ExpectedReturnStage({ workspaceId, onComplete }: ExpectedReturnStageProps) {
   const { flatAllocations, isLoading: allocLoading } = useWorkspaceAllocations(workspaceId);
   const { assumptions, isLoading: assumptionsLoading } = useWorkspaceAssumptions(workspaceId);
   const { constraints } = useWorkspaceConstraints(workspaceId);
 
   const metrics = useMemo(() => {
     if (flatAllocations.length === 0 || assumptions.length === 0) {
       return null;
     }
 
     // Map assumptions by asset class
     const assumptionMap = new Map(assumptions.map(a => [a.asset_class, a]));
 
     // Calculate weighted expected return
     let expectedReturn = 0;
     let expectedVolatilitySquared = 0;
     const contributions: { asset: string; weight: number; return: number; contribution: number; volatility: number }[] = [];
 
     flatAllocations
       .filter(a => a.level === 0)
       .forEach(alloc => {
         const assumption = assumptionMap.get(alloc.name);
         if (assumption) {
           const weight = alloc.weight / 100;
           const contribution = weight * assumption.expected_return;
           expectedReturn += contribution;
           expectedVolatilitySquared += (weight * assumption.expected_volatility) ** 2;
           
           contributions.push({
             asset: alloc.name,
             weight: alloc.weight,
             return: assumption.expected_return,
             contribution,
             volatility: assumption.expected_volatility,
           });
         }
       });
 
     // Simplified volatility (no correlation adjustment for now)
     const expectedVolatility = Math.sqrt(expectedVolatilitySquared);
     
     // Sharpe ratio
     const riskFreeRate = 4; // Default
     const sharpeRatio = expectedVolatility > 0 
       ? (expectedReturn - riskFreeRate) / expectedVolatility 
       : 0;
 
     // Diversification benefit (simple approximation)
     const sumOfIndividualVols = contributions.reduce((acc, c) => acc + (c.weight / 100) * c.volatility, 0);
     const diversificationBenefit = sumOfIndividualVols > 0 
       ? ((sumOfIndividualVols - expectedVolatility) / sumOfIndividualVols) * 100 
       : 0;
 
     // Constraint violations
     const violations: { constraint: string; current: number; limit: number; severity: 'hard' | 'soft' }[] = [];
     
     if (constraints?.target_return_nominal && expectedReturn < constraints.target_return_nominal) {
       violations.push({
         constraint: 'Target Return (Nominal)',
         current: expectedReturn,
         limit: constraints.target_return_nominal,
         severity: 'soft',
       });
     }
     
     if (constraints?.max_drawdown && expectedVolatility * 2 > constraints.max_drawdown) {
       violations.push({
         constraint: 'Max Drawdown (2σ)',
         current: expectedVolatility * 2,
         limit: constraints.max_drawdown,
         severity: 'hard',
       });
     }
 
     return {
       expectedReturn,
       expectedVolatility,
       sharpeRatio,
       diversificationBenefit,
       contributions,
       violations,
     };
   }, [flatAllocations, assumptions, constraints]);
 
   if (allocLoading || assumptionsLoading) {
     return <div className="p-8 text-center text-muted-foreground">Calculating expected returns...</div>;
   }
 
   if (!metrics) {
     return (
       <div className="p-8 text-center text-muted-foreground">
         <p>Complete previous stages (Assumptions & Construction) first.</p>
       </div>
     );
   }
 
   const pieData = metrics.contributions.map(c => ({
     name: c.asset,
     value: c.weight,
   }));
 
   const contributionData = metrics.contributions.map(c => ({
     name: c.asset.length > 12 ? c.asset.substring(0, 12) + '...' : c.asset,
     contribution: c.contribution,
     return: c.return,
   }));
 
   return (
     <div className="space-y-6 p-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Expected Portfolio Return</h2>
           <p className="text-muted-foreground mt-1">
             Pure arithmetic reality before optimization. Independent calculation of portfolio metrics.
           </p>
         </div>
         <Button onClick={onComplete}>
           <Save className="h-4 w-4 mr-2" />
           Continue to Optimization
         </Button>
       </div>
 
       {/* Key Metrics */}
       <div className="grid grid-cols-4 gap-4">
         <Card className="bg-card">
           <CardContent className="pt-4">
             <div className="flex items-center gap-2 text-muted-foreground text-sm">
               <TrendingUp className="h-4 w-4" />
               Expected Return
             </div>
             <div className="text-3xl font-bold mt-1 text-primary">
               {metrics.expectedReturn.toFixed(2)}%
             </div>
             <div className="text-xs text-muted-foreground mt-1">Annualized</div>
           </CardContent>
         </Card>
         <Card className="bg-card">
           <CardContent className="pt-4">
             <div className="flex items-center gap-2 text-muted-foreground text-sm">
               <Activity className="h-4 w-4" />
               Expected Volatility
             </div>
             <div className="text-3xl font-bold mt-1">
               {metrics.expectedVolatility.toFixed(2)}%
             </div>
             <div className="text-xs text-muted-foreground mt-1">Annualized σ</div>
           </CardContent>
         </Card>
         <Card className="bg-card">
           <CardContent className="pt-4">
             <div className="flex items-center gap-2 text-muted-foreground text-sm">
               <Target className="h-4 w-4" />
               Sharpe Ratio
             </div>
             <div className={cn(
               "text-3xl font-bold mt-1",
               metrics.sharpeRatio >= 0.5 ? "text-green-400" : metrics.sharpeRatio >= 0 ? "text-orange-400" : "text-red-400"
             )}>
               {metrics.sharpeRatio.toFixed(2)}
             </div>
             <div className="text-xs text-muted-foreground mt-1">Rf = 4%</div>
           </CardContent>
         </Card>
         <Card className="bg-card">
           <CardContent className="pt-4">
             <div className="flex items-center gap-2 text-muted-foreground text-sm">
               <BarChart3 className="h-4 w-4" />
               Diversification Benefit
             </div>
             <div className="text-3xl font-bold mt-1">
               {metrics.diversificationBenefit.toFixed(1)}%
             </div>
             <div className="text-xs text-muted-foreground mt-1">Vol reduction</div>
           </CardContent>
         </Card>
       </div>
 
       {/* Constraint Violations */}
       {metrics.violations.length > 0 && (
         <Card className="border-orange-500/30 bg-orange-500/5">
           <CardHeader className="pb-2">
             <div className="flex items-center gap-2">
               <AlertTriangle className="h-5 w-5 text-orange-400" />
               <CardTitle className="text-lg">Constraint Violations</CardTitle>
             </div>
           </CardHeader>
           <CardContent>
             <div className="space-y-2">
               {metrics.violations.map((v, i) => (
                 <div key={i} className="flex items-center justify-between p-2 rounded bg-background/50">
                   <div className="flex items-center gap-2">
                     <Badge variant={v.severity === 'hard' ? 'destructive' : 'secondary'}>
                       {v.severity}
                     </Badge>
                     <span>{v.constraint}</span>
                   </div>
                   <span className="font-mono text-sm">
                     {v.current.toFixed(1)}% vs {v.limit.toFixed(1)}% limit
                   </span>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Charts Row */}
       <div className="grid grid-cols-2 gap-6">
         {/* Allocation Pie */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-lg">Allocation Breakdown</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={pieData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={90}
                     dataKey="value"
                     label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                     labelLine={false}
                   >
                     {pieData.map((_, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Pie>
                   <Tooltip 
                     formatter={(value: number) => `${value.toFixed(1)}%`}
                     contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>
 
         {/* Return Contribution Bar */}
         <Card>
           <CardHeader className="pb-2">
             <CardTitle className="text-lg">Return Contribution</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={contributionData} layout="vertical">
                   <XAxis type="number" tickFormatter={(v) => `${v.toFixed(1)}%`} />
                   <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                   <Tooltip 
                     formatter={(value: number) => `${value.toFixed(2)}%`}
                     contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                   />
                   <Bar dataKey="contribution" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
           </CardContent>
         </Card>
       </div>
 
       {/* Detailed Table */}
       <Card>
         <CardHeader className="pb-2">
           <CardTitle className="text-lg">Risk & Return Attribution</CardTitle>
         </CardHeader>
         <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Asset Class</TableHead>
                 <TableHead className="text-right">Weight</TableHead>
                 <TableHead className="text-right">Expected Return</TableHead>
                 <TableHead className="text-right">Contribution</TableHead>
                 <TableHead className="text-right">Volatility</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {metrics.contributions.map((c, i) => (
                 <TableRow key={i}>
                   <TableCell className="font-medium">{c.asset}</TableCell>
                   <TableCell className="text-right font-mono">{c.weight.toFixed(1)}%</TableCell>
                   <TableCell className="text-right font-mono">{c.return.toFixed(1)}%</TableCell>
                   <TableCell className="text-right font-mono text-primary">{c.contribution.toFixed(2)}%</TableCell>
                   <TableCell className="text-right font-mono">{c.volatility.toFixed(1)}%</TableCell>
                 </TableRow>
               ))}
               <TableRow className="border-t-2 font-bold">
                 <TableCell>Total Portfolio</TableCell>
                 <TableCell className="text-right font-mono">100%</TableCell>
                 <TableCell className="text-right font-mono">{metrics.expectedReturn.toFixed(2)}%</TableCell>
                 <TableCell className="text-right font-mono text-primary">{metrics.expectedReturn.toFixed(2)}%</TableCell>
                 <TableCell className="text-right font-mono">{metrics.expectedVolatility.toFixed(2)}%</TableCell>
               </TableRow>
             </TableBody>
           </Table>
         </CardContent>
       </Card>
 
       <Separator />
 
       <div className="flex justify-end">
         <Button onClick={onComplete} size="lg">
           <Save className="h-4 w-4 mr-2" />
           Continue to Optimization
         </Button>
       </div>
     </div>
   );
 }