import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  Calendar, Plus, Trash2, ChevronDown, ChevronUp, 
  Filter, Tag, Star, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Target, Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Types
export interface Decision {
  id: string;
  company_id: string;
  ticker: string | null;
  decision_date: string;
  decision_type: string;
  direction: string;
  size_change: number | null;
  size_unit: string | null;
  rationale: string;
  key_assumptions: string | null;
  expected_outcome: string | null;
  catalyst_timeline: string | null;
  risks_breaks_thesis: string | null;
  confidence: number;
  tags: string[];
  created_at: string;
  user_id: string;
}

// Decision Type Options
export const DECISION_TYPE_OPTIONS = [
  { value: 'Initiate', label: 'Initiate', icon: TrendingUp, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { value: 'Add', label: 'Add', icon: TrendingUp, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { value: 'Reduce', label: 'Reduce', icon: TrendingDown, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'Exit', label: 'Exit', icon: TrendingDown, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { value: 'ThesisUpdate', label: 'Thesis Update', icon: Target, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { value: 'RiskUpdate', label: 'Risk Update', icon: AlertTriangle, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'Rebalance', label: 'Rebalance', icon: Minus, color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { value: 'HoldNoAction', label: 'Hold / No Action', icon: Minus, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
];

const DIRECTION_OPTIONS = [
  { value: 'Long', label: 'Long' },
  { value: 'Short', label: 'Short' },
  { value: 'N/A', label: 'N/A' },
];

const SIZE_UNIT_OPTIONS = [
  { value: 'shares', label: 'Shares' },
  { value: 'percent', label: 'Percent' },
  { value: 'currency', label: 'Currency' },
];

const CONFIDENCE_OPTIONS = [
  { value: 1, label: '1 - Very Low', color: 'text-red-400' },
  { value: 2, label: '2 - Low', color: 'text-orange-400' },
  { value: 3, label: '3 - Medium', color: 'text-amber-400' },
  { value: 4, label: '4 - High', color: 'text-emerald-400' },
  { value: 5, label: '5 - Very High', color: 'text-green-400' },
];

// Common tags for suggestions
const SUGGESTED_TAGS = [
  'Earnings', 'Valuation', 'Macro', 'Catalyst', 'Risk', 
  'Technical', 'Fundamental', 'Position Sizing', 'Rebalance', 'Market Timing'
];

interface DecisionLogSectionProps {
  companyId: string;
  companyTicker: string | null;
  decisions: Decision[];
  onDecisionsChange: (decisions: Decision[]) => void;
}

export function DecisionLogSection({ 
  companyId, 
  companyTicker, 
  decisions, 
  onDecisionsChange 
}: DecisionLogSectionProps) {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    decision_type: 'HoldNoAction',
    decision_date: format(new Date(), 'yyyy-MM-dd'),
    direction: 'N/A',
    size_change: '',
    size_unit: '',
    rationale: '',
    key_assumptions: '',
    expected_outcome: '',
    catalyst_timeline: '',
    risks_breaks_thesis: '',
    confidence: 3,
    tags: [] as string[],
    tagInput: '',
  });

  // Get unique tags from decisions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    decisions.forEach(d => d.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [decisions]);

  // Filter decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter(d => {
      if (filterType !== 'all' && d.decision_type !== filterType) return false;
      if (filterTag !== 'all' && !d.tags?.includes(filterTag)) return false;
      return true;
    });
  }, [decisions, filterType, filterTag]);

  const resetForm = () => {
    setFormData({
      decision_type: 'HoldNoAction',
      decision_date: format(new Date(), 'yyyy-MM-dd'),
      direction: 'N/A',
      size_change: '',
      size_unit: '',
      rationale: '',
      key_assumptions: '',
      expected_outcome: '',
      catalyst_timeline: '',
      risks_breaks_thesis: '',
      confidence: 3,
      tags: [],
      tagInput: '',
    });
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
    if (!user || !formData.rationale.trim()) {
      toast.error('Rationale is required');
      return;
    }

    setSaving(true);
    const { data, error } = await supabase
      .from('company_decisions')
      .insert({
        user_id: user.id,
        company_id: companyId,
        ticker: companyTicker,
        decision_type: formData.decision_type,
        decision_date: formData.decision_date,
        direction: formData.direction,
        size_change: formData.size_change ? parseFloat(formData.size_change) : null,
        size_unit: formData.size_unit || null,
        rationale: formData.rationale.trim(),
        key_assumptions: formData.key_assumptions.trim() || null,
        expected_outcome: formData.expected_outcome.trim() || null,
        catalyst_timeline: formData.catalyst_timeline.trim() || null,
        risks_breaks_thesis: formData.risks_breaks_thesis.trim() || null,
        confidence: formData.confidence,
        tags: formData.tags.length > 0 ? formData.tags : [],
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      toast.error('Failed to log decision');
      console.error(error);
      return;
    }

    onDecisionsChange([data as Decision, ...decisions]);
    setDialogOpen(false);
    resetForm();
    toast.success('Decision logged');
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('company_decisions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete decision');
      return;
    }

    onDecisionsChange(decisions.filter(d => d.id !== id));
    toast.success('Decision deleted');
  };

  const getDecisionTypeConfig = (type: string) => {
    return DECISION_TYPE_OPTIONS.find(o => o.value === type) || DECISION_TYPE_OPTIONS[7];
  };

  const renderConfidenceStars = (confidence: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            size={12}
            className={i <= confidence ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}
          />
        ))}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar size={18} className="text-primary" />
            Decision Log
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px] h-8 text-xs">
                  <Filter size={12} className="mr-1" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {DECISION_TYPE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {allTags.length > 0 && (
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-[120px] h-8 text-xs">
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
            </div>

            <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)} className="gap-1">
              <Plus size={14} />
              Add Decision
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDecisions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {decisions.length === 0 
              ? 'No decisions logged yet'
              : 'No decisions match the current filters'}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredDecisions.map(decision => {
              const typeConfig = getDecisionTypeConfig(decision.decision_type);
              const TypeIcon = typeConfig.icon;
              const isExpanded = expandedId === decision.id;

              return (
                <Collapsible
                  key={decision.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedId(isExpanded ? null : decision.id)}
                >
                  <div className="border border-border/50 rounded-lg bg-muted/20 group">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/40 transition-colors rounded-t-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline" className={`text-xs gap-1 ${typeConfig.color}`}>
                              <TypeIcon size={10} />
                              {typeConfig.label}
                            </Badge>
                            {decision.direction !== 'N/A' && (
                              <Badge variant="outline" className="text-xs">
                                {decision.direction}
                              </Badge>
                            )}
                            {renderConfidenceStars(decision.confidence)}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(decision.decision_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <p className="text-sm line-clamp-1">{decision.rationale}</p>
                          {decision.tags && decision.tags.length > 0 && (
                            <div className="flex items-center gap-1 mt-2 flex-wrap">
                              {decision.tags.slice(0, 3).map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                                  {tag}
                                </Badge>
                              ))}
                              {decision.tags.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{decision.tags.length - 3} more
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
                              handleDelete(decision.id);
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
                        {/* Full Rationale */}
                        <div>
                          <label className="text-xs text-muted-foreground uppercase tracking-wider">Rationale</label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{decision.rationale}</p>
                        </div>

                        {/* Size Change */}
                        {decision.size_change !== null && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Size Change</label>
                            <p className="text-sm mt-1">
                              {decision.size_change} {decision.size_unit || ''}
                            </p>
                          </div>
                        )}

                        {/* Key Assumptions */}
                        {decision.key_assumptions && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Key Assumptions</label>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{decision.key_assumptions}</p>
                          </div>
                        )}

                        {/* Expected Outcome */}
                        {decision.expected_outcome && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Expected Outcome</label>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{decision.expected_outcome}</p>
                          </div>
                        )}

                        {/* Catalyst Timeline */}
                        {decision.catalyst_timeline && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Catalyst Timeline</label>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{decision.catalyst_timeline}</p>
                          </div>
                        )}

                        {/* Risks / Thesis Breaks */}
                        {decision.risks_breaks_thesis && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Risks / What Breaks Thesis</label>
                            <p className="text-sm mt-1 whitespace-pre-wrap">{decision.risks_breaks_thesis}</p>
                          </div>
                        )}

                        {/* All Tags */}
                        {decision.tags && decision.tags.length > 0 && (
                          <div>
                            <label className="text-xs text-muted-foreground uppercase tracking-wider">Tags</label>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              {decision.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground pt-2">
                          Created {format(new Date(decision.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Add Decision Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Investment Decision</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Row 1: Type, Direction, Date */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Decision Type *</Label>
                <Select 
                  value={formData.decision_type} 
                  onValueChange={v => setFormData(prev => ({ ...prev, decision_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select 
                  value={formData.direction} 
                  onValueChange={v => setFormData(prev => ({ ...prev, direction: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIRECTION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.decision_date}
                  onChange={e => setFormData(prev => ({ ...prev, decision_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Row 2: Size Change */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Size Change</Label>
                <Input
                  type="number"
                  placeholder="e.g., 100"
                  value={formData.size_change}
                  onChange={e => setFormData(prev => ({ ...prev, size_change: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Size Unit</Label>
                <Select 
                  value={formData.size_unit} 
                  onValueChange={v => setFormData(prev => ({ ...prev, size_unit: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_UNIT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Rationale */}
            <div className="space-y-2">
              <Label>Rationale *</Label>
              <Textarea
                value={formData.rationale}
                onChange={e => setFormData(prev => ({ ...prev, rationale: e.target.value }))}
                placeholder="Why are you making this decision? What's the investment thesis?"
                rows={3}
              />
            </div>

            {/* Key Assumptions */}
            <div className="space-y-2">
              <Label>Key Assumptions</Label>
              <Textarea
                value={formData.key_assumptions}
                onChange={e => setFormData(prev => ({ ...prev, key_assumptions: e.target.value }))}
                placeholder="What assumptions underpin this decision?"
                rows={2}
              />
            </div>

            {/* Expected Outcome */}
            <div className="space-y-2">
              <Label>Expected Outcome</Label>
              <Textarea
                value={formData.expected_outcome}
                onChange={e => setFormData(prev => ({ ...prev, expected_outcome: e.target.value }))}
                placeholder="What do you expect to happen? Target price, return, etc."
                rows={2}
              />
            </div>

            {/* Catalyst Timeline */}
            <div className="space-y-2">
              <Label>Catalyst Timeline</Label>
              <Input
                value={formData.catalyst_timeline}
                onChange={e => setFormData(prev => ({ ...prev, catalyst_timeline: e.target.value }))}
                placeholder="e.g., Q1 earnings, 6-12 months, etc."
              />
            </div>

            {/* Risks / What Breaks Thesis */}
            <div className="space-y-2">
              <Label>Risks / What Breaks Thesis</Label>
              <Textarea
                value={formData.risks_breaks_thesis}
                onChange={e => setFormData(prev => ({ ...prev, risks_breaks_thesis: e.target.value }))}
                placeholder="What could go wrong? When would you exit?"
                rows={2}
              />
            </div>

            <Separator />

            {/* Confidence */}
            <div className="space-y-2">
              <Label>Confidence Level</Label>
              <div className="flex items-center gap-2">
                {CONFIDENCE_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={formData.confidence === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, confidence: opt.value }))}
                    className="flex-1"
                  >
                    <Star 
                      size={14} 
                      className={formData.confidence >= opt.value ? 'fill-current' : ''} 
                    />
                    <span className="ml-1">{opt.value}</span>
                  </Button>
                ))}
              </div>
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
                  .slice(0, 6)
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
              disabled={!formData.rationale.trim() || saving}
            >
              {saving ? 'Saving...' : 'Log Decision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
