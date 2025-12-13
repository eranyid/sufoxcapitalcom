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
import { CrmCompany, COMPANY_STATUS_OPTIONS, CompanyStatus } from '@/types/crm';

interface AddCompanyDialogProps {
  onAdd: (company: Partial<CrmCompany>) => Promise<CrmCompany | null>;
}

export function AddCompanyDialog({ onAdd }: AddCompanyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [marketCap, setMarketCap] = useState('');
  const [sector, setSector] = useState('');
  const [geography, setGeography] = useState('');
  const [investmentThesis, setInvestmentThesis] = useState('');
  const [status, setStatus] = useState<CompanyStatus>('research');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setCompanyName('');
    setMarketCap('');
    setSector('');
    setGeography('');
    setInvestmentThesis('');
    setStatus('research');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!companyName.trim()) return;

    setLoading(true);
    const result = await onAdd({
      company_name: companyName.trim(),
      market_cap: marketCap.trim() || null,
      sector: sector.trim() || null,
      geography: geography.trim() || null,
      investment_thesis: investmentThesis.trim() || null,
      status,
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
          Add Company
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Company</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="market-cap">Market Cap</Label>
              <Input
                id="market-cap"
                value={marketCap}
                onChange={(e) => setMarketCap(e.target.value)}
                placeholder="e.g. $5B"
                className="bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector / Industry</Label>
              <Input
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g. Technology"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="geography">Geography</Label>
              <Input
                id="geography"
                value={geography}
                onChange={(e) => setGeography(e.target.value)}
                placeholder="e.g. North America"
                className="bg-background"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="thesis">Investment Thesis</Label>
            <Textarea
              id="thesis"
              value={investmentThesis}
              onChange={(e) => setInvestmentThesis(e.target.value)}
              placeholder="Brief investment rationale"
              rows={2}
              className="bg-background resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as CompanyStatus)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                {COMPANY_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSubmit} disabled={loading || !companyName.trim()}>
            {loading ? 'Adding...' : 'Add Company'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}