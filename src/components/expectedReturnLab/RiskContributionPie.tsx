 import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
 import { BloombergPanel } from '@/components/ui/bloomberg-panel';
 import { OptimizationResult } from '@/types/expectedReturnLab';
 import { PieChartIcon } from 'lucide-react';
 
 interface RiskContributionPieProps {
   results: OptimizationResult[];
 }
 
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
 
 export function RiskContributionPie({ results }: RiskContributionPieProps) {
   const data = results
     .filter(r => r.riskContribution > 1)
     .map(r => ({
       name: r.assetClass.length > 15 ? r.assetClass.slice(0, 13) + '...' : r.assetClass,
       fullName: r.assetClass,
       value: r.riskContribution,
     }))
     .sort((a, b) => b.value - a.value);
   
   if (data.length === 0) {
     return (
       <BloombergPanel
         title="Risk Contribution"
         titleIcon={<PieChartIcon className="h-4 w-4 text-primary" />}
       >
         <div className="p-8 text-center">
           <p className="text-sm text-muted-foreground">Run optimization to see risk breakdown</p>
         </div>
       </BloombergPanel>
     );
   }
   
   return (
     <BloombergPanel
       title="Risk Contribution by Asset"
       titleIcon={<PieChartIcon className="h-4 w-4 text-primary" />}
       contentClassName="p-4"
     >
       <div className="h-[280px]">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie
               data={data}
               cx="50%"
               cy="50%"
               innerRadius={50}
               outerRadius={90}
               paddingAngle={2}
               dataKey="value"
               label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
               labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
             >
               {data.map((entry, index) => (
                 <Cell 
                   key={`cell-${index}`} 
                   fill={COLORS[index % COLORS.length]}
                   stroke="hsl(var(--background))"
                   strokeWidth={2}
                 />
               ))}
             </Pie>
             <Tooltip
               contentStyle={{
                 backgroundColor: 'hsl(var(--card))',
                 border: '1px solid hsl(var(--border))',
                 borderRadius: '8px',
                 fontSize: '12px',
               }}
               formatter={(value: number) => [`${value.toFixed(1)}%`, 'Risk Contribution']}
               labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
             />
           </PieChart>
         </ResponsiveContainer>
       </div>
       
       <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono">
         Shows how each asset contributes to total portfolio volatility
       </p>
     </BloombergPanel>
   );
 }