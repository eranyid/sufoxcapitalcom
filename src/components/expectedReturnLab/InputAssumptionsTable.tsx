import { useState } from 'react';
import { Plus, Trash2, RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
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
        {/* Header Row */}
        <div className="grid grid-cols-[minmax(140px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_80px_minmax(130px,1fr)_32px] gap-2 px-4 py-2 border-b border-border/50 text-xs text-muted-foreground">
          <div>Asset Class</div>
          <div className="flex items-center gap-1 justify-center">
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                E[R] %
                <Info className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>Expected Annual Return</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                Vol %
                <Info className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>Expected Annual Volatility</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                Weight
                <Info className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>Market Cap / Target Weight</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1 justify-center">
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                Confidence
                <Info className="h-3 w-3" />
              </TooltipTrigger>
              <TooltipContent>View Confidence (0-100%)</TooltipContent>
            </Tooltip>
          </div>
          <div></div>
        </div>
        
        {/* Asset Rows */}
        <div className="divide-y divide-border/30">
          {assets.map((asset) => (
            <div 
              key={asset.id} 
              className="grid grid-cols-[minmax(140px,1.5fr)_minmax(120px,1fr)_minmax(120px,1fr)_80px_minmax(130px,1fr)_32px] gap-2 px-4 py-3 items-center group hover:bg-muted/30 transition-colors"
            >
              {/* Asset Class Name */}
              <div>
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
                    className={cn(
                      "text-xs font-medium cursor-pointer hover:text-primary transition-colors",
                      asset.assetClass === 'Cash & Equivalents' && 'text-primary'
                    )}
                    onClick={() => setEditingId(asset.id)}
                  >
                    {asset.assetClass}
                  </span>
                )}
              </div>
              
              {/* Expected Return - Visual Slider */}
              <div className="flex items-center gap-2">
                <Slider
                  value={[asset.expectedReturn]}
                  onValueChange={([v]) => handleUpdate(asset.id, 'expectedReturn', v)}
                  min={0}
                  max={15}
                  step={0.5}
                  className="flex-1 [&_[role=slider]]:bg-emerald-500 [&_[role=slider]]:border-emerald-500 [&_.bg-primary]:bg-emerald-500"
                />
                <span className="font-mono text-[11px] w-10 text-right text-emerald-400">
                  {asset.expectedReturn.toFixed(1)}%
                </span>
              </div>
              
              {/* Volatility - Visual Slider */}
              <div className="flex items-center gap-2">
                <Slider
                  value={[asset.expectedVolatility]}
                  onValueChange={([v]) => handleUpdate(asset.id, 'expectedVolatility', v)}
                  min={0}
                  max={40}
                  step={1}
                  className="flex-1 [&_[role=slider]]:bg-rose-500 [&_[role=slider]]:border-rose-500 [&_.bg-primary]:bg-rose-500"
                />
                <span className="font-mono text-[11px] w-8 text-right text-rose-400">
                  {asset.expectedVolatility}%
                </span>
              </div>
              
              {/* Weight - Numeric Input (kept as requested) */}
              <div className="flex justify-center">
                <Input
                  type="number"
                  value={asset.marketCapWeight}
                  onChange={(e) => handleUpdate(asset.id, 'marketCapWeight', parseFloat(e.target.value) || 0)}
                  className="h-7 text-xs text-center font-mono w-16"
                  step={1}
                />
              </div>
              
              {/* Confidence - Visual Slider */}
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
                  "font-mono text-[11px] w-8 text-right",
                  asset.viewConfidence >= 80 ? 'text-primary' : 
                  asset.viewConfidence >= 50 ? 'text-amber-400' : 'text-muted-foreground'
                )}>
                  {asset.viewConfidence}%
                </span>
              </div>
              
              {/* Delete Button */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(asset.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
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
