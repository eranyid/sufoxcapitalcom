import { useState } from 'react';
import { Plus, Trash2, Pencil, LayoutList, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMilestoneTemplates, type CustomTemplateInput } from '@/hooks/useMilestoneTemplates';
import type { MilestoneTemplate, MilestoneTemplateDef } from '@/lib/milestoneTemplates';

interface TemplateManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DraftRow {
  title: string;
  description: string;
  dayOffset: string;
}

const emptyRow = (): DraftRow => ({ title: '', description: '', dayOffset: '' });

export function TemplateManagerDialog({ open, onOpenChange }: TemplateManagerDialogProps) {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useMilestoneTemplates();
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState<DraftRow[]>([emptyRow()]);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setEditingId(null);
    setLabel('');
    setDescription('');
    setRows([emptyRow()]);
  };

  const startCreate = () => {
    resetForm();
    setMode('edit');
  };

  const startEdit = (t: MilestoneTemplate) => {
    setEditingId(t.id || null);
    setLabel(t.label);
    setDescription(t.description);
    setRows(
      t.milestones.length > 0
        ? t.milestones.map(m => ({
            title: m.title,
            description: m.description,
            dayOffset: m.dayOffset === null ? '' : String(m.dayOffset),
          }))
        : [emptyRow()],
    );
    setMode('edit');
  };

  const updateRow = (i: number, patch: Partial<DraftRow>) => {
    setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const handleSave = async () => {
    const milestones: MilestoneTemplateDef[] = rows
      .filter(r => r.title.trim())
      .map(r => ({
        title: r.title.trim(),
        description: r.description.trim(),
        dayOffset: r.dayOffset.trim() === '' ? null : Number(r.dayOffset),
      }));

    if (!label.trim() || milestones.length === 0) return;

    const input: CustomTemplateInput = {
      label: label.trim(),
      description: description.trim() || undefined,
      icon: 'LayoutList',
      milestones,
    };

    setSaving(true);
    const ok = editingId ? await updateTemplate(editingId, input) : !!(await createTemplate(input));
    setSaving(false);
    if (ok) {
      resetForm();
      setMode('list');
    }
  };

  const handleClose = (state: boolean) => {
    if (!state) {
      resetForm();
      setMode('list');
    }
    onOpenChange(state);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'edit' && (
              <button type="button" onClick={() => { resetForm(); setMode('list'); }} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft size={16} />
              </button>
            )}
            <LayoutList size={18} className="text-primary" />
            {mode === 'list' ? 'Custom Templates' : editingId ? 'Edit Template' : 'New Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'list'
              ? 'Reusable milestone templates you can apply to any project.'
              : 'Define milestones with optional day offsets from the project start date.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'list' ? (
          <div className="space-y-3 py-2">
            {templates.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-4 text-center">
                No custom templates yet. Create one to reuse across projects.
              </p>
            ) : (
              templates.map(t => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.label}</span>
                      <Badge variant="secondary" className="text-[10px]">{t.milestones.length}</Badge>
                    </div>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(t)}>
                      <Pencil size={13} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => t.id && deleteTemplate(t.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={startCreate}>
              <Plus size={14} />
              New Template
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. UE5 Feature Pipeline" autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional" rows={2} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Milestones</label>
              <div className="space-y-2">
                {rows.map((row, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-4 text-right mt-2.5">{i + 1}</span>
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={row.title}
                        onChange={e => updateRow(i, { title: e.target.value })}
                        placeholder="Milestone title"
                        className="h-8"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={row.description}
                          onChange={e => updateRow(i, { description: e.target.value })}
                          placeholder="Description (optional)"
                          className="h-8 flex-1"
                        />
                        <Input
                          type="number"
                          value={row.dayOffset}
                          onChange={e => updateRow(i, { dayOffset: e.target.value })}
                          placeholder="day +"
                          className="h-8 w-20"
                          title="Days offset from start date"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => setRows(prev => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => setRows(prev => [...prev, emptyRow()])}
              >
                <Plus size={13} />
                Add row
              </Button>
            </div>
          </div>
        )}

        {mode === 'edit' && (
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setMode('list'); }}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !label.trim() || !rows.some(r => r.title.trim())}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
