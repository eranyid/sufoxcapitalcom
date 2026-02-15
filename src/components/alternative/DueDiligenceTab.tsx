import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, Circle, Clock, AlertTriangle, Flag, XCircle,
  ChevronDown, ChevronRight, MessageSquare, Calendar, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DDStatus, DDCheckItem, DDWorkstream, INITIAL_WORKSTREAMS } from '@/data/dueDiligenceQuestions';

const STATUS_CONFIG: Record<DDStatus, { label: string; color: string; icon: any }> = {
  not_started: { label: 'Not Started', color: 'text-muted-foreground', icon: Circle },
  in_progress: { label: 'In Progress', color: 'text-blue-400', icon: Clock },
  completed: { label: 'Completed', color: 'text-green-400', icon: CheckCircle2 },
  flagged: { label: 'Flagged', color: 'text-destructive', icon: AlertTriangle },
  na: { label: 'N/A', color: 'text-muted-foreground/50', icon: XCircle },
};

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

function WorkstreamCard({ workstream, onUpdate, searchQuery }: { workstream: DDWorkstream; onUpdate: (ws: DDWorkstream) => void; searchQuery: string }) {
  const [expanded, setExpanded] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return workstream.items;
    return workstream.items.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [workstream.items, searchQuery]);

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

  if (searchQuery && filteredItems.length === 0) return null;

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
            <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4">{total} items</Badge>
            {flagged > 0 && (
              <Badge variant="destructive" className="text-[8px] px-1 py-0 h-4">{flagged} flagged</Badge>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{workstream.description}</p>
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
        <div className="border-t border-border/50 max-h-[400px] overflow-y-auto">
          {filteredItems.map((item) => (
            <div key={item.id} className="border-b border-border/20 last:border-0">
              <div className="flex items-center gap-2 px-4 py-2 hover:bg-muted/5">
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
                      <Input value={item.assignee} onChange={(e) => updateItem(item.id, { assignee: e.target.value })} placeholder="Who is responsible?" className="h-7 text-[10px] mt-0.5" />
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground font-medium">Due Date</label>
                      <Input type="date" value={item.dueDate} onChange={(e) => updateItem(item.id, { dueDate: e.target.value })} className="h-7 text-[10px] mt-0.5" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] text-muted-foreground font-medium">Notes / Findings</label>
                    <Textarea value={item.notes} onChange={(e) => updateItem(item.id, { notes: e.target.value })} placeholder="Document findings, concerns, or approvals..." className="min-h-[60px] text-[10px] mt-0.5 resize-none" />
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
  const [searchQuery, setSearchQuery] = useState('');

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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className={cn("border", status.bg)}>
          <CardContent className="p-3 text-center">
            <div className={cn("text-lg font-bold font-mono", status.color)}>{overallPct}%</div>
            <div className="text-[9px] text-muted-foreground">Overall Progress</div>
            <Badge variant="outline" className={cn("text-[8px] mt-1", status.color)}>{status.label}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold font-mono">{totalItems}</div>
            <div className="text-[9px] text-muted-foreground">Total Items</div>
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

      {/* Progress + Search */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-muted-foreground font-mono">Due Diligence Completion — {workstreams.length} Workstreams</span>
          <span className="font-mono font-bold">{completedItems} / {totalItems} items</span>
        </div>
        <Progress value={overallPct} className="h-2" />
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search DD items..."
            className="h-8 text-[10px] pl-8"
          />
        </div>
      </div>

      {/* Workstreams */}
      <div className="space-y-3">
        {workstreams.map(ws => (
          <WorkstreamCard
            key={ws.id}
            workstream={ws}
            onUpdate={(updated) => updateWorkstream(ws.id, updated)}
            searchQuery={searchQuery}
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
            <Textarea placeholder="Summarize the DD findings, key risks, and recommendation (Approve / Conditional / Decline)..." className="min-h-[80px] text-[10px] mt-1 resize-none" />
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
