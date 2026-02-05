 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
 import { BloombergPanel } from '@/components/ui/bloomberg-panel';
 import { OptimizationResult } from '@/types/expectedReturnLab';
 import { BarChart3 } from 'lucide-react';
 
 interface AllocationComparisonChartProps {
   results: OptimizationResult[];
 }
 
 export function AllocationComparisonChart({ results }: AllocationComparisonChartProps) {
   const data = results
     .filter(r => r.inputWeight > 0.5 || r.optimizedWeight > 0.5)
     .map(r => ({
       name: r.assetClass.length > 20 ? r.assetClass.slice(0, 18) + '...' : r.assetClass,
       fullName: r.assetClass,
       input: r.inputWeight,
       optimized: r.optimizedWeight,
     }))
     .sort((a, b) => b.optimized - a.optimized);
   
   if (data.length === 0) {
     return (
       <BloombergPanel
         title="Allocation Comparison"
         titleIcon={<BarChart3 className="h-4 w-4 text-primary" />}
       >
         <div className="p-8 text-center">
           <p className="text-sm text-muted-foreground">Run optimization to see comparison</p>
         </div>
       </BloombergPanel>
     );
   }
   
   return (
     <BloombergPanel
       title="Allocation: Input vs Optimized"
       titleIcon={<BarChart3 className="h-4 w-4 text-primary" />}
       contentClassName="p-4"
     >
       <div className="h-[300px]">
         <ResponsiveContainer width="100%" height="100%">
           <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
             <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
             <XAxis 
               type="number" 
               domain={[0, 'auto']}
               tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
               tickFormatter={(v) => `${v}%`}
             />
             <YAxis 
               type="category" 
               dataKey="name"
               width={120}
               tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
             />
             <Tooltip
               contentStyle={{
                 backgroundColor: 'hsl(var(--card))',
                 border: '1px solid hsl(var(--border))',
                 borderRadius: '8px',
                 fontSize: '12px',
               }}
               formatter={(value: number, name: string) => [
                 `${value.toFixed(1)}%`,
                 name === 'input' ? 'Input Weight' : 'Optimized Weight'
               ]}
               labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
             />
             <Legend 
               verticalAlign="top"
               height={36}
               formatter={(value) => (
                 <span className="text-xs text-muted-foreground">
                   {value === 'input' ? 'Input Allocation' : 'Optimized Allocation'}
                 </span>
               )}
             />
             <Bar 
               dataKey="input" 
               fill="hsl(var(--muted-foreground))"
               opacity={0.5}
               radius={[0, 4, 4, 0]}
             />
             <Bar 
               dataKey="optimized" 
               fill="hsl(var(--primary))"
               radius={[0, 4, 4, 0]}
             />
           </BarChart>
         </ResponsiveContainer>
       </div>
     </BloombergPanel>
   );
 }