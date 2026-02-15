import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CheckCircle2, Circle, Clock, AlertTriangle, FileText, Users, Shield,
  Scale, BarChart3, Building2, Globe, Leaf, ChevronDown, ChevronRight,
  Plus, MessageSquare, Paperclip, Calendar, Flag, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DDStatus = 'not_started' | 'in_progress' | 'completed' | 'flagged' | 'na';

interface DDCheckItem {
  id: string;
  label: string;
  status: DDStatus;
  notes: string;
  assignee: string;
  dueDate: string;
  flag?: string;
}

interface DDWorkstream {
  id: string;
  title: string;
  icon: any;
  description: string;
  items: DDCheckItem[];
}

const STATUS_CONFIG: Record<DDStatus, { label: string; color: string; icon: any }> = {
  not_started: { label: 'Not Started', color: 'text-muted-foreground', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-blue-400', icon: Clock },
  completed: { label: 'Completed', color: 'text-green-400', icon: CheckCircle2 },
  flagged: { label: 'Flagged', color: 'text-destructive', icon: AlertTriangle },
  na: { label: 'N/A', color: 'text-muted-foreground/50', icon: XCircle },
};

const INITIAL_WORKSTREAMS: DDWorkstream[] = [
  {
    id: 'team',
    title: 'Team & Governance',
    icon: Users,
    description: 'Management team, key persons, alignment, and governance structure',
    items: [
      { id: 'team-1', label: 'Key Person Bios & Track Record', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'team-2', label: 'Organizational Chart', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'team-3', label: 'Key Person Risk & Succession Plan', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'team-4', label: 'GP Commitment & Alignment of Interest', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'team-5', label: 'Advisory Board / LPAC Structure', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'team-6', label: 'Reference Checks', status: 'not_started', notes: '', assignee: '', dueDate: '' },
    ],
  },
  {
    id: 'track-record',
    title: 'Track Record & Performance',
    icon: BarChart3,
    description: 'Historical fund performance, attribution, and benchmarking',
    items: [
      { id: 'tr-1', label: 'Prior Fund Performance (IRR, TVPI, DPI)', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'tr-2', label: 'Deal-Level Attribution Analysis', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'tr-3', label: 'Benchmark Comparison (PME, Peer Quartile)', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'tr-4', label: 'Loss Ratio & Write-Off History', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'tr-5', label: 'Realized vs Unrealized Composition', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'tr-6', label: 'Cash Flow J-Curve Analysis', status: 'not_started', notes: '', assignee: '', dueDate: '' },
    ],
  },
  {
    id: 'strategy',
    title: 'Investment Strategy',
    icon: Building2,
    description: 'Strategy clarity, sourcing edge, and value creation approach',
    items: [
      { id: 'st-1', label: 'Strategy Definition & Differentiation', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'st-2', label: 'Deal Sourcing & Origination Edge', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'st-3', label: 'Value Creation Playbook', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'st-4', label: 'Target Market / Sector Thesis', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'st-5', label: 'Exit Strategy & Timeline', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'st-6', label: 'Pipeline & Current Deployment Plan', status: 'not_started', notes: '', assignee: '', dueDate: '' },
    ],
  },
  {
    id: 'legal',
    title: 'Legal & Structure',
    icon: Scale,
    description: 'Fund terms, legal documentation, and structural review',
    items: [
      { id: 'lg-1', label: 'LPA / PPM Review', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'lg-2', label: 'Fee Structure Analysis (Mgmt + Carry)', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'lg-3', label: 'Waterfall Mechanics & Clawback', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'lg-4', label: 'Side Letter Terms', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'lg-5', label: 'Fund Domicile & Tax Structure', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'lg-6', label: 'Regulatory & Compliance Status', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'lg-7', label: 'Litigation & Disputes History', status: 'not_started', notes: '', assignee: '', dueDate: '' },
    ],
  },
  {
    id: 'operations',
    title: 'Operations & Infrastructure',
    icon: Shield,
    description: 'Back office, reporting, valuation, and controls',
    items: [
      { id: 'op-1', label: 'Fund Administrator & Auditor', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'op-2', label: 'Valuation Policy & Methodology', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'op-3', label: 'Reporting Frequency & Quality', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'op-4', label: 'IT / Cybersecurity Review', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'op-5', label: 'Compliance & AML / KYC Framework', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'op-6', label: 'Insurance Coverage (D&O, E&O)', status: 'not_started', notes: '', assignee: '', dueDate: '' },
    ],
  },
  {
    id: 'esg',
    title: 'ESG & Responsible Investing',
    icon: Leaf,
    description: 'Environmental, social, and governance integration',
    items: [
      { id: 'esg-1', label: 'ESG Policy & Integration Framework', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'esg-2', label: 'UN PRI / SFDR Classification', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'esg-3', label: 'Carbon Footprint / Climate Risk', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'esg-4', label: 'DEI Metrics & Initiatives', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'esg-5', label: 'Exclusion Lists & Controversies', status: 'not_started', notes: '', assignee: '', dueDate: '' },
    ],
  },
  {
    id: 'market',
    title: 'Market & Macro',
    icon: Globe,
    description: 'Market environment, competitive landscape, and timing',
    items: [
      { id: 'mk-1', label: 'Market Sizing & Growth Outlook', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'mk-2', label: 'Competitive Landscape (GP Peers)', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'mk-3', label: 'Macro Sensitivity & Cycle Positioning', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'mk-4', label: 'Regulatory / Political Risk', status: 'not_started', notes: '', assignee: '', dueDate: '' },
    ],
  },
  {
    id: 'documents',
    title: 'Document Checklist',
    icon: FileText,
    description: 'Key documents required for final investment decision',
    items: [
      { id: 'doc-1', label: 'PPM / Offering Memorandum', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'doc-2', label: 'LPA (Limited Partnership Agreement)', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'doc-3', label: 'Subscription Agreement', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'doc-4', label: 'Audited Financials (Prior Funds)', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'doc-5', label: 'DDQ (Due Diligence Questionnaire)', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'doc-6', label: 'Track Record Spreadsheet', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'doc-7', label: 'ESG Policy Document', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'doc-8', label: 'Org Chart & Team Bios', status: 'not_started', notes: '', assignee: '', dueDate: '' },
      { id: 'doc-9', label: 'Side Letter (if applicable)', status: 'not_started', notes: '', assignee: '', dueDate: '' },
    ],
  },
];

function StatusButton({ status, onChange }: { status: DDStatus; onChange: (s: DDStatus) => void }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const cycle: DDStatus[] = ['not_started', 'in_progress', 'completed', 'flagged', 'na'];
  const next = cycle[(cycle.indexOf(status) + 1) % cycle.length];

  return (
    <button
      onClick={() => onChange(next)}
      className={cn("flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded border border-border/50 hover:bg-muted/30 transition-colors whitespace-nowrap", config.color)}
      title={`Click to change to: ${STATUS_CONFIG[next].label}`}
    >
      <Icon size={10} />
      {config.label}
    </button>
  );
}

function WorkstreamCard({ workstream, onUpdate }: { workstream: DDWorkstream; onUpdate: (ws: DDWorkstream) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const completed = workstream.items.filter(i => i.status === 'completed' || i.status === 'na').length;
  const flagged = workstream.items.filter(i => i.status === 'flagged').length;
  const total = workstream.items.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const updateItem = (itemId: string, updates: Partial<DDCheckItem>) => {
    onUpdate({
      ...workstream,
      items: workstream.items.map(item => item.id === itemId ? { ...item, ...updates } : item),
    });
  };

  const Icon = workstream.icon;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/10 transition-colors"
      >
        <div className="p-1.5 rounded bg-primary/10 border border-primary/20">
          <Icon size={14} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">{workstream.title}</span>
            {flagged > 0 && (
              <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">{flagged} flagged</Badge>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground mt-0.5">{workstream.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-mono font-bold">{pct}%</span>
            <p className="text-[8px] text-muted-foreground">{completed}/{total}</p>
          </div>
          <Progress value={pct} className="w-20 h-1.5" />
          {expanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50">
          {workstream.items.map((item) => (
            <div key={item.id} className="border-b border-border/20 last:border-0">
              <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-muted/5">
                <StatusButton status={item.status} onChange={(s) => updateItem(item.id, { status: s })} />
                <span className="text-[10px] flex-1">{item.label}</span>
                {item.notes && <MessageSquare size={10} className="text-muted-foreground" />}
                {item.dueDate && <Calendar size={10} className="text-muted-foreground" />}
                <button
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                  className="text-[9px] text-muted-foreground hover:text-foreground px-1"
                >
                  {expandedItem === item.id ? 'Close' : 'Details'}
                </button>
              </div>
              {expandedItem === item.id && (
                <div className="px-4 pb-3 pt-1 bg-muted/5 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-muted-foreground font-medium">Assignee</label>
                      <Input
                        value={item.assignee}
                        onChange={(e) => updateItem(item.id, { assignee: e.target.value })}
                        placeholder="Who is responsible?"
                        className="h-7 text-[10px] mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground font-medium">Due Date</label>
                      <Input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) => updateItem(item.id, { dueDate: e.target.value })}
                        className="h-7 text-[10px] mt-0.5"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground font-medium">Notes / Findings</label>
                    <Textarea
                      value={item.notes}
                      onChange={(e) => updateItem(item.id, { notes: e.target.value })}
                      placeholder="Document findings, concerns, or approvals..."
                      className="min-h-[60px] text-[10px] mt-0.5 resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function DueDiligenceTab() {
  const [workstreams, setWorkstreams] = useState<DDWorkstream[]>(INITIAL_WORKSTREAMS);

  const updateWorkstream = (id: string, updated: DDWorkstream) => {
    setWorkstreams(ws => ws.map(w => w.id === id ? updated : w));
  };

  const totalItems = workstreams.reduce((acc, ws) => acc + ws.items.length, 0);
  const completedItems = workstreams.reduce((acc, ws) => acc + ws.items.filter(i => i.status === 'completed' || i.status === 'na').length, 0);
  const flaggedItems = workstreams.reduce((acc, ws) => acc + ws.items.filter(i => i.status === 'flagged').length, 0);
  const inProgressItems = workstreams.reduce((acc, ws) => acc + ws.items.filter(i => i.status === 'in_progress').length, 0);
  const overallPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const getOverallStatus = () => {
    if (flaggedItems > 0) return { label: 'Issues Found', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/30' };
    if (overallPct === 100) return { label: 'DD Complete', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' };
    if (overallPct > 50) return { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    return { label: 'Early Stage', color: 'text-muted-foreground', bg: 'bg-muted/30 border-border' };
  };

  const status = getOverallStatus();

  return (
    <div className="space-y-5">
      {/* Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className={cn("border", status.bg)}>
          <CardContent className="p-3 text-center">
            <div className={cn("text-lg font-bold font-mono", status.color)}>{overallPct}%</div>
            <div className="text-[9px] text-muted-foreground">Overall Progress</div>
            <Badge variant="outline" className={cn("text-[8px] mt-1", status.color)}>{status.label}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold font-mono text-green-400">{completedItems}</div>
            <div className="text-[9px] text-muted-foreground">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold font-mono text-blue-400">{inProgressItems}</div>
            <div className="text-[9px] text-muted-foreground">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className={cn("text-lg font-bold font-mono", flaggedItems > 0 ? "text-destructive" : "text-muted-foreground")}>{flaggedItems}</div>
            <div className="text-[9px] text-muted-foreground">Flagged</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold font-mono">{totalItems - completedItems - inProgressItems - flaggedItems}</div>
            <div className="text-[9px] text-muted-foreground">Remaining</div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-mono">Due Diligence Completion</span>
          <span className="font-mono font-bold">{completedItems} / {totalItems} items</span>
        </div>
        <Progress value={overallPct} className="h-2" />
      </div>

      {/* Workstreams */}
      <div className="space-y-3">
        {workstreams.map(ws => (
          <WorkstreamCard
            key={ws.id}
            workstream={ws}
            onUpdate={(updated) => updateWorkstream(ws.id, updated)}
          />
        ))}
      </div>

      {/* Decision Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs flex items-center gap-1.5">
            <Flag size={12} className="text-primary" /> Investment Decision Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-[9px] text-muted-foreground font-medium">Overall Assessment</label>
            <Textarea
              placeholder="Summarize the DD findings, key risks, and recommendation (Approve / Conditional / Decline)..."
              className="min-h-[80px] text-[10px] mt-1 resize-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="text-[10px] h-8 gap-1 border-green-500/30 text-green-400 hover:bg-green-500/10">
              <CheckCircle2 size={12} /> Approve
            </Button>
            <Button variant="outline" className="text-[10px] h-8 gap-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
              <AlertTriangle size={12} /> Conditional
            </Button>
            <Button variant="outline" className="text-[10px] h-8 gap-1 border-destructive/30 text-destructive hover:bg-destructive/10">
              <XCircle size={12} /> Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
