import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Plus, Building2, Target, DollarSign, Users, ShieldCheck,
  FileText, ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle,
  Globe, Calendar, Briefcase, Eye, Scale, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STEPS = [
  { id: 'identity', label: 'Fund Identity', icon: Building2 },
  { id: 'strategy', label: 'Strategy & Terms', icon: Target },
  { id: 'sizing', label: 'Sizing & Capital', icon: DollarSign },
  { id: 'duediligence', label: 'Due Diligence', icon: ShieldCheck },
  { id: 'review', label: 'Review & Create', icon: CheckCircle2 },
];

const strategies = [
  'Buyout', 'Growth Equity', 'Venture Capital', 'Direct Lending',
  'Mezzanine', 'Distressed', 'Core RE', 'Value-Add RE',
  'Opportunistic RE', 'Infrastructure', 'Secondaries', 'Multi-Strategy',
  'Fund of Funds', 'Co-Investment', 'Special Situations',
];

const geographies = ['North America', 'Europe', 'Asia-Pacific', 'Global', 'MENA', 'Latin America', 'Israel', 'Emerging Markets'];

const sectors = ['Technology', 'Healthcare', 'Financial Services', 'Industrials', 'Consumer', 'Energy', 'Real Estate', 'TMT', 'Diversified'];

const currencies = ['USD', 'EUR', 'GBP', 'ILS', 'CHF', 'JPY'];

const ddChecklist = [
  { id: 'track_record', label: 'Track Record Analysis', desc: 'Historical fund returns, quartile ranking, persistence' },
  { id: 'team', label: 'Team & Key Person', desc: 'Key person risk, team stability, succession plan' },
  { id: 'strategy_edge', label: 'Strategy & Edge', desc: 'Sourcing advantage, value creation, differentiation' },
  { id: 'governance', label: 'Governance & Controls', desc: 'LP advisory, valuation committee, conflict policy' },
  { id: 'legal', label: 'Legal & Compliance', desc: 'Fund docs, side letters, regulatory standing' },
  { id: 'operations', label: 'Operational DD', desc: 'Admin, audit, reporting quality, cybersecurity' },
  { id: 'esg', label: 'ESG & Impact', desc: 'ESG integration, UN PRI alignment, impact metrics' },
  { id: 'references', label: 'Reference Checks', desc: 'Existing LP references, co-investor feedback' },
];

interface NewFundAnalysisDialogProps {
  assetClass: string;
  onSubmit?: (fund: Record<string, string>) => void;
}

export function NewFundAnalysisDialog({ assetClass, onSubmit }: NewFundAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fundName: '',
    manager: '',
    fundNumber: '',
    domicile: '',
    legalStructure: '',
    strategy: '',
    geography: '',
    sectorFocus: '',
    vintage: new Date().getFullYear().toString(),
    fundSize: '',
    hardCap: '',
    gpCommitment: '',
    lpBase: '',
    currency: 'USD',
    targetReturn: '',
    managementFee: '2.0',
    carry: '20',
    hurdle: '8',
    lockup: '10',
    investmentPeriod: '5',
    fundTerm: '10',
    clawback: true,
    waterfall: 'european',
    minCommitment: '',
    targetAllocation: '',
    investmentThesis: '',
    keyRisks: '',
    ddNotes: '',
    ddChecklist: [] as string[],
    priority: 'medium',
    source: '',
  });

  const update = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleDdItem = (id: string) => {
    setForm(prev => ({
      ...prev,
      ddChecklist: prev.ddChecklist.includes(id)
        ? prev.ddChecklist.filter(x => x !== id)
        : [...prev.ddChecklist, id],
    }));
  };

  const canProceed = () => {
    if (step === 0) return form.fundName.trim().length > 0;
    return true;
  };

  const handleSubmit = () => {
    if (!form.fundName.trim()) {
      toast.error('Fund name is required');
      return;
    }
    onSubmit?.(form as any);
    toast.success(`Fund "${form.fundName}" analysis pipeline created`);
    setOpen(false);
    setStep(0);
  };

  const pf = (v: string) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setStep(0); }}>
      <DialogTrigger asChild>
        <button
          className="group relative inline-flex items-center justify-center gap-1.5 px-4 h-8 text-[10px] font-bold font-mono text-foreground border-2 border-primary rounded-sm bg-transparent cursor-pointer transition-all duration-500 hover:shadow-[inset_0_0_25px_hsl(var(--primary)/0.4)] before:content-[''] before:absolute before:top-[80%] before:left-[3%] before:w-[95%] before:h-[40%] before:bg-card before:transition-transform before:duration-500 before:origin-center after:content-[''] after:absolute after:top-[-10px] after:left-[3%] after:w-[95%] after:h-[40%] after:bg-card after:transition-transform after:duration-500 after:origin-center hover:before:scale-0 hover:after:scale-0"
        >
          <Plus size={12} className="relative z-10" />
          <span className="relative z-10">New Fund Analysis</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-sm flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 border border-primary/20 rounded-sm">
              <Building2 size={14} className="text-primary" />
            </div>
            New Fund Analysis Pipeline
            <Badge variant="outline" className="text-[8px] ml-auto">{assetClass}</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = i === step;
              const isDone = i < step;
              return (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    onClick={() => i <= step && setStep(i)}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1.5 rounded-sm text-[9px] font-mono transition-all w-full",
                      isActive && "bg-primary/15 text-primary border border-primary/30",
                      isDone && "bg-success/10 text-success cursor-pointer",
                      !isActive && !isDone && "text-muted-foreground/50"
                    )}
                  >
                    {isDone ? <CheckCircle2 size={10} /> : <Icon size={10} />}
                    <span className="hidden md:inline truncate">{s.label}</span>
                    <span className="md:hidden">{i + 1}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={cn("w-4 h-px mx-0.5 shrink-0", isDone ? "bg-success/40" : "bg-border/40")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Step 0: Fund Identity */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <SectionLabel icon={Building2} label="Fund Identity" />
              <div className="grid grid-cols-2 gap-3">
                <FieldInput label="Fund Name *" value={form.fundName} onChange={v => update('fundName', v)} placeholder="e.g. Blackstone Capital Partners IX" />
                <FieldInput label="Manager / GP" value={form.manager} onChange={v => update('manager', v)} placeholder="e.g. Blackstone" />
                <FieldInput label="Fund Number / Series" value={form.fundNumber} onChange={v => update('fundNumber', v)} placeholder="e.g. Fund IX" />
                <FieldInput label="Domicile" value={form.domicile} onChange={v => update('domicile', v)} placeholder="e.g. Cayman Islands" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FieldSelect label="Legal Structure" value={form.legalStructure} onChange={v => update('legalStructure', v)} placeholder="Select structure"
                  options={['Limited Partnership', 'LLC', 'SCSp', 'SCA', 'Trust', 'Other']} />
                <FieldSelect label="Priority" value={form.priority} onChange={v => update('priority', v)} placeholder="Priority"
                  options={['high', 'medium', 'low']} />
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground font-mono mb-1">Source / Referral</p>
                <Input value={form.source} onChange={e => update('source', e.target.value)} placeholder="e.g. Placement agent, direct, existing relationship"
                  className="h-9 text-xs font-mono bg-muted/20 border-border/50" />
              </div>
            </div>
          )}

          {/* Step 1: Strategy & Terms */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <SectionLabel icon={Target} label="Strategy & Focus" />
              <div className="grid grid-cols-2 gap-3">
                <FieldSelect label="Strategy" value={form.strategy} onChange={v => update('strategy', v)} placeholder="Select strategy" options={strategies} />
                <FieldSelect label="Geography" value={form.geography} onChange={v => update('geography', v)} placeholder="Select geography" options={geographies} />
                <FieldSelect label="Sector Focus" value={form.sectorFocus} onChange={v => update('sectorFocus', v)} placeholder="Select sector" options={sectors} />
                <FieldSelect label="Currency" value={form.currency} onChange={v => update('currency', v)} placeholder="Currency" options={currencies} />
              </div>

              <SectionLabel icon={Scale} label="Fee Structure & Terms" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FieldInput label="Management Fee (%)" value={form.managementFee} onChange={v => update('managementFee', v)} type="number" />
                <FieldInput label="Carried Interest (%)" value={form.carry} onChange={v => update('carry', v)} type="number" />
                <FieldInput label="Hurdle Rate (%)" value={form.hurdle} onChange={v => update('hurdle', v)} type="number" />
                <FieldSelect label="Waterfall" value={form.waterfall} onChange={v => update('waterfall', v)} placeholder="Type" options={['european', 'american', 'hybrid']} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FieldInput label="Investment Period (yrs)" value={form.investmentPeriod} onChange={v => update('investmentPeriod', v)} type="number" />
                <FieldInput label="Fund Term (yrs)" value={form.fundTerm} onChange={v => update('fundTerm', v)} type="number" />
                <FieldInput label="Lockup (yrs)" value={form.lockup} onChange={v => update('lockup', v)} type="number" />
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground cursor-pointer">
                    <Checkbox checked={form.clawback} onCheckedChange={v => update('clawback', v)} />
                    GP Clawback
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Sizing & Capital */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <SectionLabel icon={DollarSign} label="Capital Structure" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FieldInput label="Vintage Year" value={form.vintage} onChange={v => update('vintage', v)} type="number" />
                <FieldInput label="Fund Size ($M)" value={form.fundSize} onChange={v => update('fundSize', v)} placeholder="500" type="number" />
                <FieldInput label="Hard Cap ($M)" value={form.hardCap} onChange={v => update('hardCap', v)} placeholder="600" type="number" />
                <FieldInput label="GP Commitment ($M)" value={form.gpCommitment} onChange={v => update('gpCommitment', v)} placeholder="25" type="number" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <FieldInput label="LP Base (#)" value={form.lpBase} onChange={v => update('lpBase', v)} placeholder="50" type="number" />
                <FieldInput label="Min Commitment ($M)" value={form.minCommitment} onChange={v => update('minCommitment', v)} placeholder="5" type="number" />
                <FieldInput label="Target Net IRR (%)" value={form.targetReturn} onChange={v => update('targetReturn', v)} placeholder="15" type="number" />
                <FieldInput label="Our Allocation ($M)" value={form.targetAllocation} onChange={v => update('targetAllocation', v)} placeholder="20" type="number" />
              </div>

              {/* Computed Metrics */}
              <div className="p-3 bg-primary/5 border border-primary/10 rounded-sm">
                <p className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Computed Metrics</p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <Metric label="GP %" value={form.fundSize && form.gpCommitment ? `${((pf(form.gpCommitment) / pf(form.fundSize)) * 100).toFixed(1)}%` : '—'} />
                  <Metric label="Fee Drag (10yr)" value={form.fundSize && form.managementFee ? `$${(pf(form.fundSize) * pf(form.managementFee) / 100 * 10).toFixed(0)}M` : '—'} />
                  <Metric label="Carry Split" value={form.carry ? `${form.carry}/${100 - pf(form.carry)}` : '—'} />
                  <Metric label="Alloc. %" value={form.fundSize && form.targetAllocation ? `${((pf(form.targetAllocation) / pf(form.fundSize)) * 100).toFixed(1)}%` : '—'} />
                </div>
              </div>

              <SectionLabel icon={FileText} label="Investment Thesis" />
              <Textarea
                value={form.investmentThesis}
                onChange={e => update('investmentThesis', e.target.value)}
                placeholder="Describe the fund's investment thesis, edge, and why it fits the portfolio..."
                className="text-xs font-mono bg-muted/20 border-border/50 min-h-[80px]"
              />
              <div>
                <p className="text-[9px] text-muted-foreground font-mono mb-1">Key Risks & Concerns</p>
                <Textarea
                  value={form.keyRisks}
                  onChange={e => update('keyRisks', e.target.value)}
                  placeholder="Key risks, concentration risk, key person dependency, market timing..."
                  className="text-xs font-mono bg-muted/20 border-border/50 min-h-[60px]"
                />
              </div>
            </div>
          )}

          {/* Step 3: Due Diligence */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <SectionLabel icon={ShieldCheck} label="Due Diligence Checklist" />
              <p className="text-[10px] text-muted-foreground">Track DD workstream completion. Check items as they are initiated or completed.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ddChecklist.map(item => (
                  <label
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all",
                      form.ddChecklist.includes(item.id)
                        ? "border-success/30 bg-success/5"
                        : "border-border/40 bg-muted/10 hover:border-border/60"
                    )}
                  >
                    <Checkbox
                      checked={form.ddChecklist.includes(item.id)}
                      onCheckedChange={() => toggleDdItem(item.id)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-[11px] font-semibold">{item.label}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/10 border border-border/30 rounded-sm">
                <BarChart3 size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-mono">
                  {form.ddChecklist.length}/{ddChecklist.length} items initiated
                </span>
                <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{ width: `${(form.ddChecklist.length / ddChecklist.length) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground font-mono mb-1">DD Notes</p>
                <Textarea
                  value={form.ddNotes}
                  onChange={e => update('ddNotes', e.target.value)}
                  placeholder="Additional notes, contacts, next steps..."
                  className="text-xs font-mono bg-muted/20 border-border/50 min-h-[80px]"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <SectionLabel icon={Eye} label="Review Analysis Setup" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ReviewCard title="Fund Identity" items={[
                  ['Fund', form.fundName || '—'],
                  ['Manager', form.manager || '—'],
                  ['Series', form.fundNumber || '—'],
                  ['Domicile', form.domicile || '—'],
                  ['Structure', form.legalStructure || '—'],
                  ['Priority', form.priority],
                ]} />
                <ReviewCard title="Strategy" items={[
                  ['Strategy', form.strategy || '—'],
                  ['Geography', form.geography || '—'],
                  ['Sector', form.sectorFocus || '—'],
                  ['Currency', form.currency],
                  ['Waterfall', form.waterfall],
                  ['Clawback', form.clawback ? 'Yes' : 'No'],
                ]} />
                <ReviewCard title="Capital" items={[
                  ['Vintage', form.vintage],
                  ['Fund Size', form.fundSize ? `$${form.fundSize}M` : '—'],
                  ['Hard Cap', form.hardCap ? `$${form.hardCap}M` : '—'],
                  ['GP Commit', form.gpCommitment ? `$${form.gpCommitment}M` : '—'],
                  ['Our Alloc.', form.targetAllocation ? `$${form.targetAllocation}M` : '—'],
                  ['Target IRR', form.targetReturn ? `${form.targetReturn}%` : '—'],
                ]} />
                <ReviewCard title="Terms" items={[
                  ['Mgmt Fee', `${form.managementFee}%`],
                  ['Carry', `${form.carry}%`],
                  ['Hurdle', `${form.hurdle}%`],
                  ['Inv. Period', `${form.investmentPeriod} yrs`],
                  ['Fund Term', `${form.fundTerm} yrs`],
                  ['Lockup', `${form.lockup} yrs`],
                ]} />
              </div>
              {form.investmentThesis && (
                <div className="p-3 bg-muted/10 border border-border/30 rounded-sm">
                  <p className="text-[9px] font-mono text-muted-foreground mb-1">Investment Thesis</p>
                  <p className="text-[10px] text-foreground leading-relaxed">{form.investmentThesis}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <ShieldCheck size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-mono">
                  DD Progress: {form.ddChecklist.length}/{ddChecklist.length} items
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 pt-3 border-t border-border/30 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step === 0 ? setOpen(false) : setStep(step - 1)}
            className="text-[10px] h-8 gap-1"
          >
            <ArrowLeft size={11} /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <div className="text-[9px] text-muted-foreground font-mono">
            Step {step + 1} of {STEPS.length}
          </div>
          {step < STEPS.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="text-[10px] h-8 gap-1"
            >
              Next <ArrowRight size={11} />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} className="text-[10px] h-8 gap-1">
              <Plus size={12} /> Create Analysis
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
      <Icon size={9} /> {label}
    </p>
  );
}

function FieldInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] text-muted-foreground font-mono">{label}</p>
      <Input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="h-9 text-xs font-mono bg-muted/20 border-border/50" />
    </div>
  );
}

function FieldSelect({ label, value, onChange, placeholder, options }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; options: string[];
}) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] text-muted-foreground font-mono">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 text-xs font-mono bg-muted/20 border-border/50">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[8px] text-muted-foreground font-mono">{label}</p>
      <p className="text-xs font-mono text-primary">{value}</p>
    </div>
  );
}

function ReviewCard({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div className="p-3 bg-muted/10 border border-border/30 rounded-sm space-y-1.5">
      <p className="text-[9px] font-mono text-primary uppercase tracking-wider">{title}</p>
      {items.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-mono">{k}</span>
          <span className="text-foreground font-mono">{v}</span>
        </div>
      ))}
    </div>
  );
}
