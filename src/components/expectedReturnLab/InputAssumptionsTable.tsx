 import { useState } from 'react';
 import { Plus, Trash2, RotateCcw, Info } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Slider } from '@/components/ui/slider';
 import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
 import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
 import { BloombergPanel } from '@/components/ui/bloomberg-panel';
 import { AssetAssumption, DEFAULT_ASSET_CLASSES } from '@/types/expectedReturnLab';
 import { cn } from '@/lib/utils';
 
 interface InputAssumptionsTableProps {
   assets: AssetAssumption[];
   onAssetsChange: (assets: AssetAssumption[]) => void;
 }
 
 export function InputAssumptionsTable({ assets, onAssetsChange }: InputAssumptionsTableProps) {
   const [editingId, setEditingId] = useState<string | null>(null);
   
   const handleAdd = () => {
     const newAsset: AssetAssumption = {
       id: crypto.randomUUID(),
       assetClass: 'New Asset Class',
       expectedReturn: 5,
       expectedVolatility: 15,
       marketCapWeight: 5,
       viewConfidence: 50,
     };
     onAssetsChange([...assets, newAsset]);
   };
   
   const handleRemove = (id: string) => {
     onAssetsChange(assets.filter(a => a.id !== id));
   };
   
   const handleUpdate = (id: string, field: keyof AssetAssumption, value: string | number) => {
     onAssetsChange(assets.map(a => 
       a.id === id ? { ...a, [field]: value } : a
     ));
   };
   
   const handleReset = () => {
     onAssetsChange(DEFAULT_ASSET_CLASSES.map(a => ({
       ...a,
       id: crypto.randomUUID(),
     })));
   };
   
   const totalWeight = assets.reduce((sum, a) => sum + a.marketCapWeight, 0);
   const isBalanced = Math.abs(totalWeight - 100) < 0.01;
   
   return (
     <BloombergPanel
       title="Asset Class Assumptions"
       titleIcon={<Info className="h-4 w-4 text-primary" />}
       actions={
         <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 text-xs gap-1.5">
             <RotateCcw className="h-3 w-3" />
             Reset
           </Button>
           <Button variant="outline" size="sm" onClick={handleAdd} className="h-7 text-xs gap-1.5">
             <Plus className="h-3 w-3" />
             Add Asset
           </Button>
         </div>
       }
       contentClassName="p-0"
     >
       <div className="overflow-x-auto">
         <Table>
           <TableHeader>
             <TableRow className="hover:bg-transparent">
               <TableHead className="w-[200px] text-xs">Asset Class</TableHead>
               <TableHead className="w-[100px] text-xs text-right">
                 <Tooltip>
                   <TooltipTrigger className="flex items-center gap-1 justify-end">
                     E[R] %
                     <Info className="h-3 w-3 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent>Expected Annual Return</TooltipContent>
                 </Tooltip>
               </TableHead>
               <TableHead className="w-[100px] text-xs text-right">
                 <Tooltip>
                   <TooltipTrigger className="flex items-center gap-1 justify-end">
                     Vol %
                     <Info className="h-3 w-3 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent>Expected Annual Volatility</TooltipContent>
                 </Tooltip>
               </TableHead>
               <TableHead className="w-[100px] text-xs text-right">
                 <Tooltip>
                   <TooltipTrigger className="flex items-center gap-1 justify-end">
                     Weight %
                     <Info className="h-3 w-3 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent>Market Cap / Target Weight</TooltipContent>
                 </Tooltip>
               </TableHead>
               <TableHead className="w-[140px] text-xs">
                 <Tooltip>
                   <TooltipTrigger className="flex items-center gap-1">
                     Confidence
                     <Info className="h-3 w-3 text-muted-foreground" />
                   </TooltipTrigger>
                   <TooltipContent>View Confidence (0-100%)</TooltipContent>
                 </Tooltip>
               </TableHead>
               <TableHead className="w-[40px]"></TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {assets.map((asset) => (
               <TableRow key={asset.id} className="group">
                 <TableCell className="py-2">
                   {editingId === asset.id ? (
                     <Input
                       value={asset.assetClass}
                       onChange={(e) => handleUpdate(asset.id, 'assetClass', e.target.value)}
                       onBlur={() => setEditingId(null)}
                       autoFocus
                       className="h-7 text-xs"
                     />
                   ) : (
                     <span 
                       className="text-xs font-medium cursor-pointer hover:text-primary"
                       onClick={() => setEditingId(asset.id)}
                     >
                       {asset.assetClass}
                     </span>
                   )}
                 </TableCell>
                 <TableCell className="py-2">
                   <Input
                     type="number"
                     value={asset.expectedReturn}
                     onChange={(e) => handleUpdate(asset.id, 'expectedReturn', parseFloat(e.target.value) || 0)}
                     className="h-7 text-xs text-right font-mono w-20 ml-auto"
                     step={0.5}
                   />
                 </TableCell>
                 <TableCell className="py-2">
                   <Input
                     type="number"
                     value={asset.expectedVolatility}
                     onChange={(e) => handleUpdate(asset.id, 'expectedVolatility', parseFloat(e.target.value) || 0)}
                     className="h-7 text-xs text-right font-mono w-20 ml-auto"
                     step={1}
                   />
                 </TableCell>
                 <TableCell className="py-2">
                   <Input
                     type="number"
                     value={asset.marketCapWeight}
                     onChange={(e) => handleUpdate(asset.id, 'marketCapWeight', parseFloat(e.target.value) || 0)}
                     className="h-7 text-xs text-right font-mono w-20 ml-auto"
                     step={1}
                   />
                 </TableCell>
                 <TableCell className="py-2">
                   <div className="flex items-center gap-2">
                     <Slider
                       value={[asset.viewConfidence]}
                       onValueChange={([v]) => handleUpdate(asset.id, 'viewConfidence', v)}
                       min={10}
                       max={95}
                       step={5}
                       className="flex-1"
                     />
                     <span className={cn(
                       "font-mono text-[10px] w-8 text-right",
                       asset.viewConfidence >= 80 ? 'text-emerald-400' : 
                       asset.viewConfidence >= 50 ? 'text-amber-400' : 'text-muted-foreground'
                     )}>
                       {asset.viewConfidence}%
                     </span>
                   </div>
                 </TableCell>
                 <TableCell className="py-2">
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => handleRemove(asset.id)}
                     className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                   >
                     <Trash2 className="h-3 w-3" />
                   </Button>
                 </TableCell>
               </TableRow>
             ))}
           </TableBody>
         </Table>
       </div>
       
       {/* Weight Summary */}
       <div className={cn(
         "flex items-center justify-between px-4 py-2 border-t text-xs",
         isBalanced ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'
       )}>
         <span className="text-muted-foreground">Total Weight</span>
         <span className={cn(
           "font-mono font-semibold",
           isBalanced ? 'text-emerald-400' : 'text-destructive'
         )}>
           {totalWeight.toFixed(1)}%
           {!isBalanced && (
             <span className="text-muted-foreground ml-2">
               ({totalWeight > 100 ? '+' : ''}{(totalWeight - 100).toFixed(1)}%)
             </span>
           )}
         </span>
       </div>
     </BloombergPanel>
   );
 }