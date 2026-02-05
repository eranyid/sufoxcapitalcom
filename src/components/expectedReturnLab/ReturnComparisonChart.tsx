 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
 import { BloombergPanel } from '@/components/ui/bloomberg-panel';
 import { OptimizationResult } from '@/types/expectedReturnLab';
 import { TrendingUp } from 'lucide-react';
 
 interface ReturnComparisonChartProps {
   results: OptimizationResult[];
 }
 
 export function ReturnComparisonChart({ results }: ReturnComparisonChartProps) {
   const data = results
     .map(r => ({
       name: r.assetClass.length > 18 ? r.assetClass.slice(0, 16) + '...' : r.assetClass,
       fullName: r.assetClass,
       implied: r.impliedMarketReturn,
       posterior: r.posteriorReturn,
       delta: r.posteriorReturn - r.impliedMarketReturn,
     }))
     .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
     .slice(0, 10);
   
   if (data.length === 0) {
     return (
       <BloombergPanel
         title="Return Comparison"
         titleIcon={<TrendingUp className="h-4 w-4 text-primary" />}
       >
         <div className="p-8 text-center">
           <p className="text-sm text-muted-foreground">Run optimization to see return comparison</p>
         </div>
       </BloombergPanel>
     );
   }
   
   return (
     <BloombergPanel
       title="Implied vs Posterior Returns"
       titleIcon={<TrendingUp className="h-4 w-4 text-primary" />}
       contentClassName="p-4"
     >
       <div className="h-[300px]">
         <ResponsiveContainer width="100%" height="100%">
           <BarChart data={data} margin={{ left: 0, right: 20 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
             <XAxis 
               dataKey="name"
               tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
               angle={-35}
               textAnchor="end"
               height={70}
             />
             <YAxis 
               tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
               tickFormatter={(v) => `${v}%`}
             />
             <Tooltip
               contentStyle={{
                 backgroundColor: 'hsl(var(--card))',
                 border: '1px solid hsl(var(--border))',
                 borderRadius: '8px',
                 fontSize: '12px',
               }}
               formatter={(value: number, name: string) => [
                 `${value.toFixed(2)}%`,
                 name === 'implied' ? 'Implied (Market)' : 'Posterior (BL)'
               ]}
               labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
             />
             <ReferenceLine y={0} stroke="hsl(var(--border))" />
             <Bar 
               dataKey="implied" 
               fill="hsl(var(--muted-foreground))"
               opacity={0.5}
               radius={[4, 4, 0, 0]}
             />
             <Bar 
               dataKey="posterior"
               radius={[4, 4, 0, 0]}
             >
               {data.map((entry, index) => (
                 <Cell 
                   key={`cell-${index}`}
                   fill={entry.delta > 0.5 ? 'hsl(var(--success))' : entry.delta < -0.5 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                 />
               ))}
             </Bar>
           </BarChart>
         </ResponsiveContainer>
       </div>
       
       {/* Legend */}
       <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-border/30">
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded bg-muted-foreground/50" />
           <span className="text-[10px] text-muted-foreground">Implied (Market Equilibrium)</span>
         </div>
         <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded bg-primary" />
           <span className="text-[10px] text-muted-foreground">Posterior (BL Adjusted)</span>
         </div>
       </div>
     </BloombergPanel>
   );
 }