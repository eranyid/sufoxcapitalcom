import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { PRIORITY_OPTIONS, HEALTH_OPTIONS } from '@/types/projects';
import type { ProjectPriority, ProjectHealth } from '@/types/projects';
import { MILESTONE_TEMPLATES, suggestTemplate, type MilestoneTemplate } from '@/lib/milestoneTemplates';
import { useMilestoneTemplates } from '@/hooks/useMilestoneTemplates';

export interface CreateProjectData {
  name: string;
  description?: string;
  priority: ProjectPriority;
  health_status: ProjectHealth;
  target_date?: string;
  /** Optional milestone template to generate right after creation. */
  milestoneTemplate?: MilestoneTemplate;
  milestoneStartDate?: string;
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateProjectData) => Promise<boolean>;
}

export function CreateProjectDialog({ open, onOpenChange, onCreate }: CreateProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [healthStatus, setHealthStatus] = useState<ProjectHealth>('on_track');
  const [targetDate, setTargetDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [milestoneKey, setMilestoneKey] = useState<string>('none');

  const { templates: customTemplates } = useMilestoneTemplates();
  const allTemplates = [...MILESTONE_TEMPLATES.filter(t => t.milestones.length > 0), ...customTemplates];

  // Suggest a template from the name/description as the user types.
  const suggested = suggestTemplate({ name, description });

  const handleCreate = async () => {
    if (!name.trim()) return;

    const chosenTemplate =
      milestoneKey !== 'none' ? allTemplates.find(t => t.key === milestoneKey) : undefined;

    setCreating(true);
    const success = await onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      priority,
      health_status: healthStatus,
      target_date: targetDate || undefined,
      milestoneTemplate: chosenTemplate,
      milestoneStartDate: undefined,
    });

    if (success) {
      setName('');
      setDescription('');
      setPriority('medium');
      setHealthStatus('on_track');
      setTargetDate('');
      setMilestoneKey('none');
      onOpenChange(false);
    }
    setCreating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter project name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the project"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Health Status</Label>
              <Select value={healthStatus} onValueChange={(v) => setHealthStatus(v as ProjectHealth)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HEALTH_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary" />
              Milestones
            </Label>
            <Select value={milestoneKey} onValueChange={setMilestoneKey}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Don't generate milestones</SelectItem>
                {allTemplates.map(t => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label} ({t.milestones.length}){t.custom ? ' · custom' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {suggested && milestoneKey === 'none' && (
              <button
                type="button"
                className="text-xs text-primary hover:underline"
                onClick={() => setMilestoneKey(suggested.key)}
              >
                Suggested: {suggested.label}
              </button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
