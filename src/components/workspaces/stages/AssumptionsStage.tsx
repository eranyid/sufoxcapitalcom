 import { useState } from 'react';
 import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Button } from '@/components/ui/button';
 import { Badge } from '@/components/ui/badge';
 import { Slider } from '@/components/ui/slider';
 import { Separator } from '@/components/ui/separator';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Save, Plus, Trash2, Wand2, TrendingUp, Activity } from 'lucide-react';
 import { useWorkspaceAssumptions } from '@/hooks/useWorkspaceAssumptions';
 import type { WorkspaceAssumption, AssumptionSource } from '@/types/workspaces';
 import { cn } from '@/lib/utils';
 
 interface AssumptionsStageProps {
   workspaceId: string;
   onComplete: () => void;
 }
 
 const sourceColors: Record<AssumptionSource, string> = {
   market_implied: 'bg-blue-500/20 text-blue-400',
   analyst_view: 'bg-primary/20 text-primary',
   client_view: 'bg-purple-500/20 text-purple-400',
   hybrid: 'bg-orange-500/20 text-orange-400',
 };
 
 export function AssumptionsStage({ workspaceId, onComplete }: AssumptionsStageProps) {
   const { assumptions, isLoading, initializeDefaults, upsertAssumption, deleteAssumption } = useWorkspaceAssumptions(workspaceId);
   const [newAsset, setNewAsset] = useState('');
 
   const handleAddAsset = async () => {
     if (!newAsset.trim()) return;
     await upsertAssumption.mutateAsync({
       asset_class: newAsset.trim(),
       expected_return: 5,
       expected_volatility: 10,
       confidence_level: 50,
       source_tag: 'analyst_view',
     });
     setNewAsset('');
   };
 
   const handleUpdateAssumption = async (
     assumption: WorkspaceAssumption,
     field: keyof WorkspaceAssumption,
     value: number | string
   ) => {
     await upsertAssumption.mutateAsync({
       ...assumption,
       [field]: value,
     });
   };
 
   if (isLoading) {
     return <div className="p-8 text-center text-muted-foreground">Loading assumptions...</div>;
   }
 
   return (
     <div className="space-y-6 p-6">
       <div className="flex items-center justify-between">
         <div>
           <h2 className="text-2xl font-bold">Expected Return Assumptions</h2>
           <p className="text-muted-foreground mt-1">
             Single Source of Truth for all downstream engines. No optimization runs without this layer.
           </p>
         </div>
         <div className="flex gap-2">
           {assumptions.length === 0 && (
             <Button variant="outline" onClick={() => initializeDefaults.mutate()}>
               <Wand2 className="h-4 w-4 mr-2" />
               Initialize Defaults
             </Button>
           )}
           <Button onClick={onComplete}>
             <Save className="h-4 w-4 mr-2" />
             Save & Continue
           </Button>
         </div>
       </div>
 
       {/* Summary Stats */}
       {assumptions.length > 0 && (
         <div className="grid grid-cols-4 gap-4">
           <Card className="bg-card">
             <CardContent className="pt-4">
               <div className="flex items-center gap-2 text-muted-foreground text-sm">
                 <TrendingUp className="h-4 w-4" />
                 Avg Expected Return
               </div>
               <div className="text-2xl font-bold mt-1">
                 {(assumptions.reduce((acc, a) => acc + a.expected_return, 0) / assumptions.length).toFixed(1)}%
               </div>
             </CardContent>
           </Card>
           <Card className="bg-card">
             <CardContent className="pt-4">
               <div className="flex items-center gap-2 text-muted-foreground text-sm">
                 <Activity className="h-4 w-4" />
                 Avg Volatility
               </div>
               <div className="text-2xl font-bold mt-1">
                 {(assumptions.reduce((acc, a) => acc + a.expected_volatility, 0) / assumptions.length).toFixed(1)}%
               </div>
             </CardContent>
           </Card>
           <Card className="bg-card">
             <CardContent className="pt-4">
               <div className="text-muted-foreground text-sm">Asset Classes</div>
               <div className="text-2xl font-bold mt-1">{assumptions.length}</div>
             </CardContent>
           </Card>
           <Card className="bg-card">
             <CardContent className="pt-4">
               <div className="text-muted-foreground text-sm">Avg Confidence</div>
               <div className="text-2xl font-bold mt-1">
                 {(assumptions.reduce((acc, a) => acc + a.confidence_level, 0) / assumptions.length).toFixed(0)}%
               </div>
             </CardContent>
           </Card>
         </div>
       )}
 
       {/* Assumptions Table */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-lg">Asset Class Assumptions</CardTitle>
           <CardDescription>
             Forward-looking assumptions for each asset class. All values are annualized.
           </CardDescription>
         </CardHeader>
         <CardContent>
           <Table>
             <TableHeader>
               <TableRow>
                 <TableHead className="w-[200px]">Asset Class</TableHead>
                 <TableHead className="w-[120px]">Expected Return</TableHead>
                 <TableHead className="w-[120px]">Volatility</TableHead>
                 <TableHead className="w-[180px]">Confidence</TableHead>
                 <TableHead className="w-[140px]">Source</TableHead>
                 <TableHead className="w-[60px]"></TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {assumptions.map((assumption) => (
                 <TableRow key={assumption.id}>
                   <TableCell className="font-medium">{assumption.asset_class}</TableCell>
                   <TableCell>
                     <div className="flex items-center gap-1">
                       <Input
                         type="number"
                         step="0.1"
                         className="w-20 h-8"
                         value={assumption.expected_return}
                         onChange={(e) => handleUpdateAssumption(assumption, 'expected_return', parseFloat(e.target.value) || 0)}
                       />
                       <span className="text-muted-foreground">%</span>
                     </div>
                   </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-1">
                       <Input
                         type="number"
                         step="0.1"
                         className="w-20 h-8"
                         value={assumption.expected_volatility}
                         onChange={(e) => handleUpdateAssumption(assumption, 'expected_volatility', parseFloat(e.target.value) || 0)}
                       />
                       <span className="text-muted-foreground">%</span>
                     </div>
                   </TableCell>
                   <TableCell>
                     <div className="flex items-center gap-2">
                       <Slider
                         value={[assumption.confidence_level]}
                         onValueChange={([v]) => handleUpdateAssumption(assumption, 'confidence_level', v)}
                         max={100}
                         step={5}
                         className="w-24"
                       />
                       <span className="w-10 text-xs font-mono">{assumption.confidence_level}%</span>
                     </div>
                   </TableCell>
                   <TableCell>
                     <Select
                       value={assumption.source_tag}
                       onValueChange={(v) => handleUpdateAssumption(assumption, 'source_tag', v)}
                     >
                       <SelectTrigger className="h-8 w-[130px]">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="market_implied">Market Implied</SelectItem>
                         <SelectItem value="analyst_view">Analyst View</SelectItem>
                         <SelectItem value="client_view">Client View</SelectItem>
                         <SelectItem value="hybrid">Hybrid</SelectItem>
                       </SelectContent>
                     </Select>
                   </TableCell>
                   <TableCell>
                     <Button
                       variant="ghost"
                       size="icon"
                       className="h-8 w-8 text-muted-foreground hover:text-destructive"
                       onClick={() => deleteAssumption.mutate(assumption.id)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
 
           {/* Add new asset */}
           <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
             <Input
               placeholder="New asset class name..."
               value={newAsset}
               onChange={(e) => setNewAsset(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleAddAsset()}
               className="w-64"
             />
             <Button variant="outline" onClick={handleAddAsset} disabled={!newAsset.trim()}>
               <Plus className="h-4 w-4 mr-2" />
               Add Asset Class
             </Button>
           </div>
         </CardContent>
       </Card>
 
       <Separator />
 
       <div className="flex justify-end">
         <Button onClick={onComplete} size="lg">
           <Save className="h-4 w-4 mr-2" />
           Save Assumptions & Continue
         </Button>
       </div>
     </div>
   );
 }