 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Save, Play, TrendingDown, Activity, BarChart3 } from 'lucide-react';
 import { useWorkspaceAllocations } from '@/hooks/useWorkspaceAllocations';
 import { useWorkspaceAssumptions } from '@/hooks/useWorkspaceAssumptions';
 import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
 
 interface ScenariosStageProps {
   workspaceId: string;
   onComplete: () => void;
 }
 
 const REGIME_SCENARIOS = [
   { id: 'rates_up', name: 'Rising Rates', description: 'Fed tightening, +200bps', shocks: { 'US Bonds': -8, 'US Equities': -5, 'Real Estate': -10, 'Cash': 2 } },
   { id: 'rates_down', name: 'Rate Cuts', description: 'Fed easing, -100bps', shocks: { 'US Bonds': 5, 'US Equities': 8, 'Real Estate': 6, 'Cash': -1 } },
   { id: 'inflation', name: 'Inflation Spike', description: 'CPI +5%', shocks: { 'US Bonds': -12, 'Commodities': 15, 'Real Estate': 3, 'US Equities': -8 } },
   { id: 'recession', name: 'Recession', description: 'GDP -3%', shocks: { 'US Equities': -25, 'Emerging Markets': -30, 'US Bonds': 8, 'Cash': 2 } },
   { id: 'crisis', name: 'Financial Crisis', description: '2008-style', shocks: { 'US Equities': -45, 'Emerging Markets': -55, 'Real Estate': -30, 'US Bonds': 10, 'Cash': 2 } },
 ];
 
 export function ScenariosStage({ workspaceId, onComplete }: ScenariosStageProps) {
   const { flatAllocations, isLoading: allocLoading } = useWorkspaceAllocations(workspaceId);
   const { assumptions, isLoading: assumptionsLoading } = useWorkspaceAssumptions(workspaceId);
   const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
   const [results, setResults] = useState<{ scenario: string; impact: number }[] | null>(null);
 
   const runScenarioAnalysis = () => {
     const scenarioResults = REGIME_SCENARIOS.map(scenario => {
       let portfolioImpact = 0;
 
       flatAllocations
         .filter(a => a.level === 0)
         .forEach(alloc => {
           const shock = scenario.shocks[alloc.name as keyof typeof scenario.shocks] || 0;
           portfolioImpact += (alloc.weight / 100) * shock;
         });
 
       return {
         scenario: scenario.name,
         impact: portfolioImpact,
       };
     });
 
     setResults(scenarioResults);
   };
 
   if (allocLoading || assumptionsLoading) {
     return <div className="p-8 text-center text-muted-foreground">Loading data...</div>;
   }
 
   return (
     <div className="space-y-6 p-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Scenario & Stress Testing</h2>
           <p className="text-muted-foreground mt-1">
             Validate and explain portfolio behavior under different market conditions.
           </p>
         </div>
         <Button onClick={onComplete}>
           <Save className="h-4 w-4 mr-2" />
           Save & Continue
         </Button>
       </div>
 
       <Tabs defaultValue="regime" className="space-y-6">
         <TabsList>
           <TabsTrigger value="regime" className="gap-2">
             <TrendingDown className="h-4 w-4" />
             Regime Scenarios
           </TabsTrigger>
           <TabsTrigger value="stress" className="gap-2">
             <Activity className="h-4 w-4" />
             Stress Tests
           </TabsTrigger>
           <TabsTrigger value="drawdown" className="gap-2">
             <BarChart3 className="h-4 w-4" />
             Drawdown Analysis
           </TabsTrigger>
         </TabsList>
 
         <TabsContent value="regime" className="space-y-6">
           <div className="grid grid-cols-5 gap-4">
             {REGIME_SCENARIOS.map(scenario => (
               <Card 
                 key={scenario.id}
                 className={`cursor-pointer transition-colors ${
                   selectedScenario === scenario.id 
                     ? 'border-primary bg-primary/5' 
                     : 'hover:border-primary/50'
                 }`}
                 onClick={() => setSelectedScenario(scenario.id)}
               >
                 <CardContent className="pt-4">
                   <div className="font-medium">{scenario.name}</div>
                   <div className="text-xs text-muted-foreground mt-1">{scenario.description}</div>
                 </CardContent>
               </Card>
             ))}
           </div>
 
           <Button onClick={runScenarioAnalysis} className="gap-2">
             <Play className="h-4 w-4" />
             Run All Scenarios
           </Button>
 
           {results && (
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-lg">Portfolio Impact by Scenario</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={results} layout="vertical">
                       <XAxis 
                         type="number" 
                         tickFormatter={(v) => `${v.toFixed(0)}%`}
                         domain={['dataMin - 5', 'dataMax + 5']}
                       />
                       <YAxis type="category" dataKey="scenario" width={120} />
                       <Tooltip 
                         formatter={(v: number) => `${v.toFixed(1)}%`}
                         contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                       />
                       <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                         {results.map((entry, index) => (
                           <Cell 
                             key={`cell-${index}`} 
                             fill={entry.impact >= 0 ? '#10B981' : '#EF4444'} 
                           />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </CardContent>
             </Card>
           )}
         </TabsContent>
 
         <TabsContent value="stress">
           <Card>
             <CardContent className="py-12 text-center text-muted-foreground">
               <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>Monte Carlo stress testing available in full version.</p>
               <p className="text-sm mt-2">Configurable paths, VaR/CVaR calculations, and tail risk analysis.</p>
             </CardContent>
           </Card>
         </TabsContent>
 
         <TabsContent value="drawdown">
           <Card>
             <CardContent className="py-12 text-center text-muted-foreground">
               <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>Historical drawdown analysis available in full version.</p>
               <p className="text-sm mt-2">Max drawdown, recovery periods, and underwater charts.</p>
             </CardContent>
           </Card>
         </TabsContent>
       </Tabs>
     </div>
   );
 }