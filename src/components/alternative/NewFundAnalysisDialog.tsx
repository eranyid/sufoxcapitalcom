import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Building2, Globe, Target, Calendar, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const strategies = [
  'Buyout', 'Growth Equity', 'Venture Capital', 'Direct Lending',
  'Mezzanine', 'Distressed', 'Core RE', 'Value-Add RE',
  'Opportunistic RE', 'Infrastructure', 'Secondaries', 'Multi-Strategy',
];

const geographies = ['North America', 'Europe', 'Asia-Pacific', 'Global', 'MENA', 'Latin America', 'Israel'];

interface NewFundAnalysisDialogProps {
  assetClass: string;
  onSubmit?: (fund: Record<string, string>) => void;
}

export function NewFundAnalysisDialog({ assetClass, onSubmit }: NewFundAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fundName: '',
    manager: '',
    strategy: '',
    vintage: new Date().getFullYear().toString(),
    geography: '',
    fundSize: '',
    gpCommitment: '',
    lpBase: '',
    managementFee: '2.0',
    carry: '20',
    hurdle: '8',
    lockup: '10',
  });

  const update = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = () => {
    if (!form.fundName.trim()) {
      toast.error('Fund name is required');
      return;
    }
    onSubmit?.(form);
    toast.success(`Fund "${form.fundName}" analysis created`);
    setOpen(false);
    setForm({ ...form, fundName: '', manager: '', fundSize: '', gpCommitment: '', lpBase: '' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 text-[10px] h-7">
          <Plus size={12} /> New Fund Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-sm">
              <Building2 size={14} className="text-primary" />
            </div>
            New Fund Analysis
            <Badge variant="outline" className="text-[8px] ml-auto">{assetClass}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Fund Identity */}
          <section>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Building2 size={9} /> Fund Identity
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FieldInput label="Fund Name *" value={form.fundName} onChange={v => update('fundName', v)} placeholder="e.g. Blackstone Capital Partners IX" />
              <FieldInput label="Manager / GP" value={form.manager} onChange={v => update('manager', v)} placeholder="e.g. Blackstone" />
            </div>
          </section>

          {/* Strategy & Focus */}
          <section>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Target size={9} /> Strategy & Focus
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground font-mono">Strategy</p>
                <Select value={form.strategy} onValueChange={v => update('strategy', v)}>
                  <SelectTrigger className="h-9 text-xs font-mono bg-muted/20 border-border/50">
                    <SelectValue placeholder="Select strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies.map(s => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-[9px] text-muted-foreground font-mono">Geography</p>
                <Select value={form.geography} onValueChange={v => update('geography', v)}>
                  <SelectTrigger className="h-9 text-xs font-mono bg-muted/20 border-border/50">
                    <SelectValue placeholder="Select geography" />
                  </SelectTrigger>
                  <SelectContent>
                    {geographies.map(g => (
                      <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          {/* Sizing & Economics */}
          <section>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <DollarSign size={9} /> Sizing & Economics
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FieldInput label="Vintage Year" value={form.vintage} onChange={v => update('vintage', v)} type="number" />
              <FieldInput label="Fund Size ($M)" value={form.fundSize} onChange={v => update('fundSize', v)} placeholder="500" type="number" />
              <FieldInput label="GP Commitment ($M)" value={form.gpCommitment} onChange={v => update('gpCommitment', v)} placeholder="25" type="number" />
              <FieldInput label="LP Base (#)" value={form.lpBase} onChange={v => update('lpBase', v)} placeholder="50" type="number" />
            </div>
          </section>

          {/* Fee Structure */}
          <section>
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Users size={9} /> Fee Structure
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FieldInput label="Management Fee (%)" value={form.managementFee} onChange={v => update('managementFee', v)} type="number" />
              <FieldInput label="Carried Interest (%)" value={form.carry} onChange={v => update('carry', v)} type="number" />
              <FieldInput label="Hurdle Rate (%)" value={form.hurdle} onChange={v => update('hurdle', v)} type="number" />
              <FieldInput label="Lockup (yrs)" value={form.lockup} onChange={v => update('lockup', v)} type="number" />
            </div>
          </section>

          {/* Quick Summary */}
          <div className="p-3 bg-primary/5 border border-primary/10 rounded-sm">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[8px] text-muted-foreground font-mono">GP %</p>
                <p className="text-xs font-mono text-primary">
                  {form.fundSize && form.gpCommitment
                    ? `${((parseFloat(form.gpCommitment) / parseFloat(form.fundSize)) * 100).toFixed(1)}%`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-muted-foreground font-mono">Fee Drag (10yr est.)</p>
                <p className="text-xs font-mono text-foreground">
                  {form.fundSize && form.managementFee
                    ? `$${(parseFloat(form.fundSize) * parseFloat(form.managementFee) / 100 * 10).toFixed(0)}M`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-[8px] text-muted-foreground font-mono">Net Carry Split</p>
                <p className="text-xs font-mono text-foreground">
                  {form.carry ? `${form.carry}/${100 - parseFloat(form.carry)}` : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-[10px] h-8">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit} className="text-[10px] h-8 gap-1">
            <Plus size={12} /> Create Analysis
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] text-muted-foreground font-mono">{label}</p>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-xs font-mono bg-muted/20 border-border/50"
      />
    </div>
  );
}
