import { useState, useEffect, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MILESTONE_TEMPLATES, suggestTemplate, type MilestoneTemplate } from '@/lib/milestoneTemplates';
import { useMilestoneTemplates } from '@/hooks/useMilestoneTemplates';
import { useBatchMilestones, type BatchTarget } from '@/hooks/useBatchMilestones';
import type { Project } from '@/types/projects';

interface BatchGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onGenerated: () => void;
}

export function BatchGenerateDialog({ open, onOpenChange, projects, onGenerated }: BatchGenerateDialogProps) {
  const { templates: customTemplates } = useMilestoneTemplates();
  const { batchGenerate, generating } = useBatchMilestones();

  const allTemplates = useMemo(
    () => [...MILESTONE_TEMPLATES.filter(t => t.milestones.length > 0), ...customTemplates],
    [customTemplates],
  );

  const [templateKey, setTemplateKey] = useState<string>('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  // Per-project start dates, keyed by project id.
  const [startDates, setStartDates] = useState<Record<string, string>>({});

  const selectedTemplate: MilestoneTemplate | undefined = allTemplates.find(t => t.key === templateKey);

  // Seed per-project start dates from each project's start/target date.
  useEffect(() => {
    if (!open) return;
    setStartDates(prev => {
      const next = { ...prev };
      for (const p of projects) {
        if (!next[p.id]) {
          next[p.id] = p.start_date || '';
        }
      }
      return next;
    });
  }, [open, projects]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    const targets: BatchTarget[] = projects.map(p => ({
      projectId: p.id,
      startDate: startDates[p.id] || undefined,
    }));
    const success = await batchGenerate(selectedTemplate, targets, replaceExisting);
    if (success) {
      onGenerated();
      onOpenChange(false);
      setTemplateKey('');
      setReplaceExisting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            Batch Generate Milestones
          </DialogTitle>
          <DialogDescription>
            Apply one template to {projects.length} selected project{projects.length > 1 ? 's' : ''}. Each project keeps its own start date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Template picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <Select value={templateKey} onValueChange={setTemplateKey}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {allTemplates.map(t => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label} ({t.milestones.length})
                    {t.custom ? ' · custom' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Per-project start dates */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Start dates</label>
            <div className="border border-border rounded-lg divide-y divide-border/50 max-h-[260px] overflow-y-auto">
              {projects.map(p => {
                const suggestion = suggestTemplate({ name: p.name, description: p.description, labels: p.labels });
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      {suggestion && (
                        <button
                          type="button"
                          className="text-[11px] text-primary hover:underline"
                          onClick={() => setTemplateKey(suggestion.key)}
                          title="Use suggested template"
                        >
                          Suggested: {suggestion.label}
                        </button>
                      )}
                    </div>
                    <Input
                      type="date"
                      value={startDates[p.id] || ''}
                      onChange={e => setStartDates(prev => ({ ...prev, [p.id]: e.target.value }))}
                      className="h-8 w-[150px] shrink-0"
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Milestone due dates are offset from each project's start date. Blank defaults to today.
            </p>
          </div>

          {/* Preview */}
          {selectedTemplate && (
            <div className="flex flex-wrap gap-1.5">
              {selectedTemplate.milestones.map((m, i) => (
                <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                  {m.title}
                  {m.dayOffset !== null && <span className="ml-1 text-muted-foreground">+{m.dayOffset}d</span>}
                </Badge>
              ))}
            </div>
          )}

          {/* Replace toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={replaceExisting}
              onCheckedChange={v => setReplaceExisting(v === true)}
            />
            Replace existing milestones on these projects
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleGenerate} disabled={!selectedTemplate || generating} className="gap-1.5">
            <Sparkles size={14} />
            {generating ? 'Generating...' : `Generate for ${projects.length}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
