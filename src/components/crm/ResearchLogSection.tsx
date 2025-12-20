import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Calculator, MessageSquare, FileText, ChevronDown, ChevronUp,
  Plus, Filter, Tag, Trash2, Loader2, HelpCircle, BookOpen
} from 'lucide-react';
import { useCompanyResearch, ResearchEntry, CreateResearchEntry, ResearchEntryType } from '@/hooks/useCompanyResearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Entry type config
const ENTRY_TYPE_CONFIG: Record<ResearchEntryType, { label: string; icon: typeof Calculator; color: string }> = {
  CALCULATION: { label: 'Calculation', icon: Calculator, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  QUESTION: { label: 'Question', icon: HelpCircle, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  ANSWER: { label: 'Answer', icon: MessageSquare, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  NOTE: { label: 'Note', icon: FileText, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

// Calculator type options
const CALCULATOR_TYPES = [
  { value: 'TaxLot', label: 'Tax Lot Optimizer' },
  { value: 'Scenario', label: 'Scenario Analysis' },
  { value: 'DCF-lite', label: 'DCF Lite Valuation' },
  { value: 'CPI-adjusted-gain', label: 'CPI-Adjusted Gain' },
  { value: 'Position-sizing', label: 'Position Sizing' },
  { value: 'Risk-reward', label: 'Risk/Reward' },
  { value: 'Custom', label: 'Custom Calculation' },
];

// Common tags
const SUGGESTED_TAGS = [
  'Valuation', 'Risk', 'Tax', 'Scenario', 'Position Size',
  'Entry', 'Exit', 'Thesis', 'Earnings', 'Catalyst'
];

interface ResearchLogSectionProps {
  companyId: string;
  companyTicker: string | null;
}

export function ResearchLogSection({ companyId, companyTicker }: ResearchLogSectionProps) {
  const { entries, loading, createEntry, deleteEntry } = useCompanyResearch(companyId);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<ResearchEntryType>('NOTE');
  
  // Filter states
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  
  // Expanded entries
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    question_text: '',
    calculator_type: '',
    inputs_text: '',
    outputs_text: '',
    output_summary: '',
    tags: [] as string[],
    tagInput: '',
  });
  const [saving, setSaving] = useState(false);

  // Get all unique tags from entries
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach(e => e.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [entries]);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterType !== 'all' && e.entry_type !== filterType) return false;
      if (filterTag !== 'all' && !e.tags?.includes(filterTag)) return false;
      return true;
    });
  }, [entries, filterType, filterTag]);

  const resetForm = () => {
    setFormData({
      title: '',
      question_text: '',
      calculator_type: '',
      inputs_text: '',
      outputs_text: '',
      output_summary: '',
      tags: [],
      tagInput: '',
    });
  };

  const openDialog = (type: ResearchEntryType) => {
    setDialogType(type);
    resetForm();
    setDialogOpen(true);
  };

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmed], tagInput: '' }));
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    
    setSaving(true);

    // Parse inputs/outputs as JSON if provided
    let inputs_json = {};
    let outputs_json = {};
    
    try {
      if (formData.inputs_text.trim()) {
        inputs_json = JSON.parse(formData.inputs_text);
      }
    } catch {
      inputs_json = { raw: formData.inputs_text };
    }
    
    try {
      if (formData.outputs_text.trim()) {
        outputs_json = JSON.parse(formData.outputs_text);
      }
    } catch {
      outputs_json = { raw: formData.outputs_text };
    }

    const entry: CreateResearchEntry = {
      company_id: companyId,
      ticker: companyTicker,
      entry_type: dialogType,
      title: formData.title.trim(),
      question_text: formData.question_text.trim() || null,
      calculator_type: formData.calculator_type || null,
      inputs_json,
      outputs_json,
      output_summary: formData.output_summary.trim() || null,
      tags: formData.tags,
    };

    await createEntry(entry);
    setSaving(false);
    setDialogOpen(false);
    resetForm();
  };

  const getEntryTypeConfig = (type: ResearchEntryType) => {
    return ENTRY_TYPE_CONFIG[type] || ENTRY_TYPE_CONFIG.NOTE;
  };

  const renderJsonPreview = (json: unknown, maxLength = 100) => {
    if (!json || (typeof json === 'object' && Object.keys(json as object).length === 0)) {
      return null;
    }
    const str = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
    const truncated = str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
    return (
      <pre className="text-xs bg-muted/50 p-2 rounded overflow-auto max-h-[200px] font-mono">
        {truncated}
      </pre>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={18} />
          <span>Loading research log...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen size={18} className="text-primary" />
            Calculator & Q&A
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filters */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <Filter size={12} className="mr-1" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(ENTRY_TYPE_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {allTags.length > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <Tag size={12} className="mr-1" />
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {allTags.map(tag => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Create buttons */}
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => openDialog('CALCULATION')} className="gap-1 h-8 text-xs">
                <Calculator size={12} />
                Calc
              </Button>
              <Button size="sm" variant="outline" onClick={() => openDialog('QUESTION')} className="gap-1 h-8 text-xs">
                <HelpCircle size={12} />
                Q&A
              </Button>
              <Button size="sm" variant="outline" onClick={() => openDialog('NOTE')} className="gap-1 h-8 text-xs">
                <Plus size={12} />
                Note
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEntries.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              {entries.length === 0 
                ? 'No research entries yet'
                : 'No entries match the current filters'}
            </p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => openDialog('CALCULATION')}>
                <Calculator size={14} className="mr-1" />
                New Calculation
              </Button>
              <Button size="sm" variant="outline" onClick={() => openDialog('QUESTION')}>
                <HelpCircle size={14} className="mr-1" />
                New Question
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map(entry => {
              const config = getEntryTypeConfig(entry.entry_type as ResearchEntryType);
              const Icon = config.icon;
              const isExpanded = expandedId === entry.id;

              return (
                <Collapsible
                  key={entry.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="border border-border/50 rounded-lg bg-muted/20 group">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={`text-xs gap-1 ${config.color}`}>
                              <Icon size={10} />
                              {config.label}
                            </Badge>
                            {entry.calculator_type && (
                              <Badge variant="secondary" className="text-xs">
                                {entry.calculator_type}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{entry.title}</p>
                          {entry.output_summary && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {entry.output_summary}
                            </p>
                          )}
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {entry.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {entry.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{entry.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEntry(entry.id);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="p-3 pt-0 space-y-3 border-t border-border/30">
                        {/* Question text */}
                        {entry.question_text && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Question</label>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{entry.question_text}</p>
                          </div>
                        )}

                        {/* Inputs */}
                        {entry.inputs_json && Object.keys(entry.inputs_json as object).length > 0 && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Inputs</label>
                            <div className="mt-1">{renderJsonPreview(entry.inputs_json)}</div>
                          </div>
                        )}

                        {/* Outputs */}
                        {entry.outputs_json && Object.keys(entry.outputs_json as object).length > 0 && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Outputs</label>
                            <div className="mt-1">{renderJsonPreview(entry.outputs_json)}</div>
                          </div>
                        )}

                        {/* Output Summary */}
                        {entry.output_summary && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Summary</label>
                            <p className="text-sm mt-1">{entry.output_summary}</p>
                          </div>
                        )}

                        {/* All Tags */}
                        {entry.tags && entry.tags.length > 0 && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Tags</label>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {entry.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Create Entry Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(() => {
                const config = getEntryTypeConfig(dialogType);
                const Icon = config.icon;
                return (
                  <>
                    <Icon size={18} />
                    New {config.label}
                  </>
                );
              })()}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={dialogType === 'CALCULATION' ? 'e.g., Tax lot analysis for Q4' : 'e.g., Why is the P/E so high?'}
              />
            </div>

            {/* Question text (for QUESTION type) */}
            {(dialogType === 'QUESTION' || dialogType === 'ANSWER') && (
              <div className="space-y-2">
                <Label>Question</Label>
                <Textarea
                  value={formData.question_text}
                  onChange={e => setFormData(prev => ({ ...prev, question_text: e.target.value }))}
                  placeholder="What do you want to research or understand?"
                  rows={3}
                />
              </div>
            )}

            {/* Calculator type (for CALCULATION type) */}
            {dialogType === 'CALCULATION' && (
              <div className="space-y-2">
                <Label>Calculator Type</Label>
                <Select 
                  value={formData.calculator_type} 
                  onValueChange={v => setFormData(prev => ({ ...prev, calculator_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CALCULATOR_TYPES.map(ct => (
                      <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Inputs */}
            {dialogType === 'CALCULATION' && (
              <div className="space-y-2">
                <Label>Inputs (JSON or plain text)</Label>
                <Textarea
                  value={formData.inputs_text}
                  onChange={e => setFormData(prev => ({ ...prev, inputs_text: e.target.value }))}
                  placeholder='{"shares": 100, "costBasis": 50.00}'
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>
            )}

            {/* Outputs */}
            {(dialogType === 'CALCULATION' || dialogType === 'ANSWER') && (
              <div className="space-y-2">
                <Label>Output / Result (JSON or plain text)</Label>
                <Textarea
                  value={formData.outputs_text}
                  onChange={e => setFormData(prev => ({ ...prev, outputs_text: e.target.value }))}
                  placeholder='{"realGain": 2500, "taxEstimate": 625}'
                  rows={3}
                  className="font-mono text-xs"
                />
              </div>
            )}

            <Separator />

            {/* Output Summary */}
            <div className="space-y-2">
              <Label>Summary (1-line for Performance view)</Label>
              <Input
                value={formData.output_summary}
                onChange={e => setFormData(prev => ({ ...prev, output_summary: e.target.value }))}
                placeholder="e.g., Real gain: $2,500 | Tax: $625"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={formData.tagInput}
                  onChange={e => setFormData(prev => ({ ...prev, tagInput: e.target.value }))}
                  placeholder="Add tag..."
                  className="flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(formData.tagInput);
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAddTag(formData.tagInput)}
                  disabled={!formData.tagInput.trim()}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {SUGGESTED_TAGS
                  .filter(t => !formData.tags.includes(t))
                  .slice(0, 5)
                  .map(tag => (
                    <Badge 
                      key={tag}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-muted"
                      onClick={() => handleAddTag(tag)}
                    >
                      + {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!formData.title.trim() || saving}
            >
              {saving ? 'Saving...' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
