import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X } from 'lucide-react';
import {
  Position,
  AssetType,
  Region,
  LiquidityBucket,
  StyleTag,
  ASSET_TYPE_LABELS,
  REGION_LABELS,
  LIQUIDITY_LABELS,
  STYLE_TAG_LABELS,
  COMMON_SECTORS,
  COMMON_CURRENCIES,
  COUNTRIES_BY_REGION,
} from '@/types/allocationBuilder';

interface AddPositionDialogProps {
  onAdd: (position: Omit<Position, 'id' | 'createdAt' | 'updatedAt'>) => void;
  existingAllocation: number;
}

export function AddPositionDialog({ onAdd, existingAllocation }: AddPositionDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('equity');
  const [allocation, setAllocation] = useState('');
  const [region, setRegion] = useState<Region>('north_america');
  const [country, setCountry] = useState('United States');
  const [sector, setSector] = useState('Technology');
  const [industry, setIndustry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [liquidityBucket, setLiquidityBucket] = useState<LiquidityBucket>('highly_liquid');
  const [styleTags, setStyleTags] = useState<StyleTag[]>([]);
  const [notes, setNotes] = useState('');

  const remainingAllocation = 100 - existingAllocation;

  const handleSubmit = () => {
    if (!name.trim() || !allocation) return;
    
    onAdd({
      name: name.trim(),
      assetType,
      allocation: parseFloat(allocation),
      region,
      country,
      sector,
      industry,
      currency,
      liquidityBucket,
      styleTags,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setName('');
    setAllocation('');
    setIndustry('');
    setNotes('');
    setStyleTags([]);
    setOpen(false);
  };

  const toggleStyleTag = (tag: StyleTag) => {
    setStyleTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const availableCountries = COUNTRIES_BY_REGION[region] || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus size={14} />
          Add Position
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Add Position
            <Badge variant="outline" className="font-mono text-xs">
              {remainingAllocation.toFixed(1)}% remaining
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Row 1: Name and Allocation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Position Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., S&P 500 ETF"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allocation">Allocation % *</Label>
              <Input
                id="allocation"
                type="number"
                value={allocation}
                onChange={(e) => setAllocation(e.target.value)}
                placeholder="e.g., 10"
                min={0}
                max={100}
                step={0.1}
              />
            </div>
          </div>

          {/* Row 2: Asset Type and Sector */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={assetType} onValueChange={(v) => setAssetType(v as AssetType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SECTORS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Region and Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={region} onValueChange={(v) => {
                setRegion(v as Region);
                setCountry(COUNTRIES_BY_REGION[v as Region]?.[0] || '');
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGION_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Currency and Liquidity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Liquidity</Label>
              <Select value={liquidityBucket} onValueChange={(v) => setLiquidityBucket(v as LiquidityBucket)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LIQUIDITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">Industry (Optional)</Label>
            <Input
              id="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g., Software, Semiconductors"
            />
          </div>

          {/* Style Tags */}
          <div className="space-y-2">
            <Label>Style Tags</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STYLE_TAG_LABELS).map(([key, label]) => (
                <Badge
                  key={key}
                  variant={styleTags.includes(key as StyleTag) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleStyleTag(key as StyleTag)}
                >
                  {styleTags.includes(key as StyleTag) && <X size={10} className="mr-1" />}
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Investment rationale or additional details..."
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !allocation}>
            Add Position
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
