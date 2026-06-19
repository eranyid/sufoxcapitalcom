import { useState } from 'react';
import {
  Search, Building2, RefreshCw, FileCheck, UserPlus, LayoutList, Sparkles, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MILESTONE_TEMPLATES, suggestTemplate, type MilestoneTemplate } from '@/lib/milestoneTemplates';
import { useMilestoneTemplates } from '@/hooks/useMilestoneTemplates';

const ICON_MAP: Record<string, React.ReactNode> = {
  Search: <Search size={20} />,
  Building2: <Building2 size={20} />,
  RefreshCw: <RefreshCw size={20} />,
  FileCheck: <FileCheck size={20} />,
  UserPlus: <UserPlus size={20} />,
  LayoutList: <LayoutList size={20} />,
};

interface GenerateMilestonesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (template: MilestoneTemplate, startDate?: string) => Promise<boolean>;
  projectStartDate?: string | null;
  hasMilestones: boolean;
  onClearAll: () => Promise<boolean>;
  /** Project metadata used to suggest a relevant template. */
  projectName?: string | null;
  projectDescription?: string | null;
  projectLabels?: string[] | null;
}

export function GenerateMilestonesDialog({
  open,
  onOpenChange,
  onGenerate,
  projectStartDate,
  hasMilestones,
  onClearAll,
  projectName,
  projectDescription,
  projectLabels,
}: GenerateMilestonesDialogProps) {
  const { templates: customTemplates } = useMilestoneTemplates();
  const [selected, setSelected] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(projectStartDate || '');
  const [generating, setGenerating] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const templates = [...MILESTONE_TEMPLATES, ...customTemplates];
  const selectedTemplate = templates.find(t => t.key === selected);
  const suggested = suggestTemplate({ name: projectName, description: projectDescription, labels: projectLabels });

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    if (hasMilestones && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    setGenerating(true);
    if (hasMilestones && confirmReplace) {
      await onClearAll();
    }
    const success = await onGenerate(selectedTemplate, startDate || undefined);
    setGenerating(false);

    if (success) {
      setSelected(null);
      setConfirmReplace(false);
      onOpenChange(false);
    }
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setSelected(null);
      setConfirmReplace(false);
    }
    onOpenChange(openState);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            Generate Milestones
          </DialogTitle>
          <DialogDescription>
            Choose a template to auto-generate milestones for this project. Due dates are calculated from the start date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Start date picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="max-w-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Milestone due dates are offset from this date. Defaults to today if blank.
            </p>
          </div>

          {/* Smart suggestion */}
          {suggested && selected !== suggested.key && (
            <button
              type="button"
              onClick={() => setSelected(suggested.key)}
              className="flex items-center gap-2 w-full text-left p-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <Sparkles size={16} className="text-primary shrink-0" />
              <span className="text-sm">
                Suggested for this project: <span className="font-medium">{suggested.label}</span>
              </span>
            </button>
          )}

          {/* Template grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {templates.map(template => {
              const isSelected = selected === template.key;
              return (
                <button
                  key={template.key}
                  type="button"
                  className={`relative text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                  }`}
                  onClick={() => setSelected(isSelected ? null : template.key)}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check size={16} className="text-primary" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 p-2 rounded-md ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {ICON_MAP[template.icon] || <LayoutList size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{template.label}</span>
                        {template.milestones.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {template.milestones.length}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Preview */}
          {selectedTemplate && selectedTemplate.milestones.length > 0 && (
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Preview — {selectedTemplate.milestones.length} milestones
              </h4>
              <div className="space-y-2">
                {selectedTemplate.milestones.map((m, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-right mt-0.5">
                      {i + 1}.
                    </span>
                    <div>
                      <span className="text-sm font-medium">{m.title}</span>
                      {m.dayOffset !== null && (
                        <span className="text-xs text-muted-foreground ml-2">
                          +{m.dayOffset}d
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Replace warning */}
          {confirmReplace && (
            <div className="border border-destructive/30 bg-destructive/5 rounded-lg p-3">
              <p className="text-sm text-destructive">
                This will replace all existing milestones. Continue?
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          <Button
            onClick={handleGenerate}
            disabled={!selected || generating}
            className="gap-1.5"
          >
            <Sparkles size={14} />
            {generating
              ? 'Generating...'
              : confirmReplace
                ? 'Replace & Generate'
                : 'Generate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
