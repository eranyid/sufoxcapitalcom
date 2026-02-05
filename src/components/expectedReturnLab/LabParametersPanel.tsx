 import { Settings2, Info, TrendingUp, Calendar, Shield, Scale } from 'lucide-react';
 import { Label } from '@/components/ui/label';
 import { Input } from '@/components/ui/input';
 import { Slider } from '@/components/ui/slider';
 import { Switch } from '@/components/ui/switch';
 import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
 import { BloombergPanel } from '@/components/ui/bloomberg-panel';
 import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
 import { LabParameters } from '@/types/expectedReturnLab';
 import { cn } from '@/lib/utils';
 
 interface LabParametersPanelProps {
   params: LabParameters;
   onParamsChange: (params: LabParameters) => void;
 }
 
 export function LabParametersPanel({ params, onParamsChange }: LabParametersPanelProps) {
   const handleChange = (field: keyof LabParameters, value: number | boolean) => {
     onParamsChange({ ...params, [field]: value });
   };
   
   return (
     <BloombergPanel
       title="Model Parameters"
       titleIcon={<Settings2 className="h-4 w-4 text-primary" />}
       contentClassName="p-4 space-y-5"
     >
       {/* Risk-Free Rate */}
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <TrendingUp className="h-3.5 w-3.5 text-primary" />
             <Label className="text-xs text-muted-foreground">Risk-Free Rate</Label>
             <Tooltip>
               <TooltipTrigger>
                 <Info className="h-3 w-3 text-muted-foreground" />
               </TooltipTrigger>
               <TooltipContent>Current short-term Treasury yield</TooltipContent>
             </Tooltip>
           </div>
           <span className="font-mono text-sm font-semibold text-foreground">{params.riskFreeRate.toFixed(1)}%</span>
         </div>
         <Slider
           value={[params.riskFreeRate]}
           onValueChange={([v]) => handleChange('riskFreeRate', v)}
           min={0}
           max={10}
           step={0.1}
         />
       </div>
       
       {/* Investment Horizon */}
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Calendar className="h-3.5 w-3.5 text-primary" />
             <Label className="text-xs text-muted-foreground">Investment Horizon</Label>
           </div>
           <span className="font-mono text-sm font-semibold text-foreground">{params.investmentHorizon} years</span>
         </div>
         <Select 
           value={params.investmentHorizon.toString()} 
           onValueChange={(v) => handleChange('investmentHorizon', parseInt(v))}
         >
           <SelectTrigger className="h-8">
             <SelectValue />
           </SelectTrigger>
           <SelectContent>
             {[1, 3, 5, 7, 10, 15, 20, 30].map(y => (
               <SelectItem key={y} value={y.toString()}>{y} year{y > 1 ? 's' : ''}</SelectItem>
             ))}
           </SelectContent>
         </Select>
       </div>
       
       {/* Risk Aversion */}
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Shield className="h-3.5 w-3.5 text-primary" />
             <Label className="text-xs text-muted-foreground">Risk Aversion (λ)</Label>
             <Tooltip>
               <TooltipTrigger>
                 <Info className="h-3 w-3 text-muted-foreground" />
               </TooltipTrigger>
               <TooltipContent>Higher values = more risk-averse optimization</TooltipContent>
             </Tooltip>
           </div>
           <span className="font-mono text-sm font-semibold text-foreground">{params.riskAversion.toFixed(1)}</span>
         </div>
         <Slider
           value={[params.riskAversion]}
           onValueChange={([v]) => handleChange('riskAversion', v)}
           min={0.5}
           max={10}
           step={0.1}
         />
       </div>
       
       {/* Tau */}
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Scale className="h-3.5 w-3.5 text-primary" />
             <Label className="text-xs text-muted-foreground">Tau (τ)</Label>
             <Tooltip>
               <TooltipTrigger>
                 <Info className="h-3 w-3 text-muted-foreground" />
               </TooltipTrigger>
               <TooltipContent>Uncertainty in equilibrium returns (typically 0.02-0.10)</TooltipContent>
             </Tooltip>
           </div>
           <span className="font-mono text-sm font-semibold text-foreground">{params.tau.toFixed(2)}</span>
         </div>
         <Slider
           value={[params.tau]}
           onValueChange={([v]) => handleChange('tau', v)}
           min={0.01}
           max={0.15}
           step={0.01}
         />
       </div>
       
       {/* Max Weight */}
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <Label className="text-xs text-muted-foreground">Max Weight per Asset</Label>
           <span className="font-mono text-sm font-semibold text-foreground">{params.maxWeightPerAsset}%</span>
         </div>
         <Slider
           value={[params.maxWeightPerAsset]}
           onValueChange={([v]) => handleChange('maxWeightPerAsset', v)}
           min={10}
           max={100}
           step={5}
         />
       </div>
       
       {/* Allow Shorts */}
       <div className="flex items-center justify-between pt-2 border-t border-border/30">
         <div className="flex items-center gap-2">
           <Label className="text-xs text-muted-foreground">Allow Short Positions</Label>
           <Tooltip>
             <TooltipTrigger>
               <Info className="h-3 w-3 text-muted-foreground" />
             </TooltipTrigger>
             <TooltipContent>Enable negative weights in optimization</TooltipContent>
           </Tooltip>
         </div>
         <Switch
           checked={params.allowShorts}
           onCheckedChange={(v) => handleChange('allowShorts', v)}
         />
       </div>
     </BloombergPanel>
   );
 }