import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CrmFund, FUND_STATUS_OPTIONS, PRIORITY_OPTIONS, FundStatus, Priority } from '@/types/crm';

interface AddFundDialogProps {
  onAdd: (fund: Partial<CrmFund>) => Promise<CrmFund | null>;
}

export function AddFundDialog({ onAdd }: AddFundDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fundName, setFundName] = useState('');
  const [strategy, setStrategy] = useState('');
  const [assetClass, setAssetClass] = useState('');
  const [geography, setGeography] = useState('');
  const [manager, setManager] = useState('');
  const [status, setStatus] = useState<FundStatus>('screening');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setFundName('');
    setStrategy('');
    setAssetClass('');
    setGeography('');
    setManager('');
    setStatus('screening');
    setPriority('medium');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!fundName.trim()) return;

    setLoading(true);
    const result = await onAdd({
      fund_name: fundName.trim(),
      strategy: strategy.trim() || null,
      asset_class: assetClass.trim() || null,
      geography: geography.trim() || null,
      manager: manager.trim() || null,
      status,
      priority,
      notes: notes.trim() || null,
    });

    setLoading(false);
    if (result) {
      resetForm();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus size={14} />
          Add Fund
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Fund</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fund-name">Fund Name *</Label>
            <Input
              id="fund-name"
              value={fundName}
              onChange={(e) => setFundName(e.target.value)}
              placeholder="Enter fund name"
              className="bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy</Label>
              <Input
                id="strategy"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="e.g. Long/Short Equity"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-class">Asset Class</Label>
              <Input
                id="asset-class"
                value={assetClass}
                onChange={(e) => setAssetClass(e.target.value)}
                placeholder="e.g. Equity, Fixed Income"
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="geography">Geography</Label>
              <Input
                id="geography"
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                placeholder="e.g. Global"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <Input
                id="manager"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
                placeholder="Fund manager name"
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as FundStatus)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {FUND_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              rows={2}
              className="bg-background resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !fundName.trim()}>
            {loading ? 'Adding...' : 'Add Fund'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
