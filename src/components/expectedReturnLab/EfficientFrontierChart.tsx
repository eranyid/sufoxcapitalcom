 import { useMemo } from 'react';
 import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
 import { BloombergPanel } from '@/components/ui/bloomberg-panel';
 import { AssetAssumption, LabParameters, PortfolioMetrics } from '@/types/expectedReturnLab';
 import { generateEfficientFrontier } from '@/lib/expectedReturnEngine';
 import { LineChart } from 'lucide-react';
 
 interface EfficientFrontierChartProps {
   assets: AssetAssumption[];
   params: LabParameters;
   inputMetrics: PortfolioMetrics | null;
   optimizedMetrics: PortfolioMetrics | null;
 }
 
 export function EfficientFrontierChart({ 
   assets, 
   params,
   inputMetrics,
   optimizedMetrics
 }: EfficientFrontierChartProps) {
   
   const frontierData = useMemo(() => {
     if (assets.length < 2) return [];
     return generateEfficientFrontier(assets, params, undefined, 30);
   }, [assets, params]);
   
   // Individual asset points
   const assetPoints = assets.map(a => ({
     risk: a.expectedVolatility,
     return: a.expectedReturn,
     name: a.assetClass,
     type: 'asset'
   }));
   
   // Portfolio points
   const portfolioPoints = [];
   if (inputMetrics) {
     portfolioPoints.push({
       risk: inputMetrics.expectedVolatility,
       return: inputMetrics.expectedReturn,
       name: 'Input Portfolio',
       type: 'input'
     });
   }
   if (optimizedMetrics) {
     portfolioPoints.push({
       risk: optimizedMetrics.expectedVolatility,
       return: optimizedMetrics.expectedReturn,
       name: 'Optimized Portfolio',
       type: 'optimized'
     });
   }
   
   if (frontierData.length === 0) {
     return (
       <BloombergPanel
         title="Efficient Frontier"
         titleIcon={<LineChart className="h-4 w-4 text-primary" />}
       >
         <div className="p-8 text-center">
           <p className="text-sm text-muted-foreground">Add at least 2 assets to see frontier</p>
         </div>
       </BloombergPanel>
     );
   }
   
   return (
     <BloombergPanel
       title="Efficient Frontier"
       titleIcon={<LineChart className="h-4 w-4 text-primary" />}
       contentClassName="p-4"
     >
       <div className="h-[300px]">
         <ResponsiveContainer width="100%" height="100%">
           <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
             <XAxis 
               type="number" 
               dataKey="risk" 
               name="Risk"
               domain={[0, 'auto']}
               tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
               tickFormatter={(v) => `${v.toFixed(0)}%`}
               label={{ value: 'Volatility (%)', position: 'bottom', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
             />
             <YAxis 
               type="number" 
               dataKey="return" 
               name="Return"
               domain={['auto', 'auto']}
               tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
               tickFormatter={(v) => `${v.toFixed(0)}%`}
               label={{ value: 'E[R] (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
             />
             <Tooltip
               contentStyle={{
                 backgroundColor: 'hsl(var(--card))',
                 border: '1px solid hsl(var(--border))',
                 borderRadius: '8px',
                 fontSize: '12px',
               }}
               formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
             />
             <ReferenceLine 
               y={params.riskFreeRate} 
               stroke="hsl(var(--muted-foreground))" 
               strokeDasharray="5 5"
               label={{ value: 'Rf', position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
             />
             
             {/* Efficient Frontier Line */}
             <Scatter 
               name="Frontier" 
               data={frontierData} 
               fill="hsl(var(--primary))"
               line={{ stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
               shape={(props: any) => (
                 <circle cx={props.cx} cy={props.cy} r={2} fill="hsl(var(--primary))" opacity={0.6} />
               )}
             />
             
             {/* Individual Assets */}
             <Scatter 
               name="Assets" 
               data={assetPoints}
               fill="hsl(var(--muted-foreground))"
               shape={(props: any) => (
                 <circle cx={props.cx} cy={props.cy} r={4} fill="hsl(var(--muted-foreground))" opacity={0.5} />
               )}
             />
             
             {/* Portfolio Points */}
             {inputMetrics && (
               <Scatter 
                 name="Input" 
                 data={[portfolioPoints.find(p => p.type === 'input')]}
                 fill="hsl(var(--warning))"
                 shape={(props: any) => (
                   <circle cx={props.cx} cy={props.cy} r={8} fill="hsl(var(--warning))" stroke="hsl(var(--background))" strokeWidth={2} />
                 )}
               />
             )}
             {optimizedMetrics && (
               <Scatter 
                 name="Optimized" 
                 data={[portfolioPoints.find(p => p.type === 'optimized')]}
                 fill="hsl(var(--primary))"
                 shape={(props: any) => (
                   <circle cx={props.cx} cy={props.cy} r={8} fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth={2} />
                 )}
               />
             )}
           </ScatterChart>
         </ResponsiveContainer>
       </div>
       
       {/* Legend */}
       <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border/30">
         <div className="flex items-center gap-2">
           <div className="w-3 h-0.5 bg-primary" />
           <span className="text-[10px] text-muted-foreground">Efficient Frontier</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-warning" />
           <span className="text-[10px] text-muted-foreground">Input Portfolio</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-primary" />
           <span className="text-[10px] text-muted-foreground">Optimized</span>
         </div>
       </div>
     </BloombergPanel>
   );
 }