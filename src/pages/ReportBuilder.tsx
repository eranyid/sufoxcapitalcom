import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Save, 
  Settings2, 
  GripVertical, 
  Plus, 
  Trash2, 
  Eye,
  EyeOff,
  ChevronRight,
  FileText
} from 'lucide-react';
import { useReport } from '@/hooks/useReports';
import { usePortfolio } from '@/context/PortfolioContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SECTION_LIBRARY, type ReportSection, type ReportBranding } from '@/types/reports';
import { ReportSectionPreview } from '@/components/reports/ReportSectionPreview';
import { generateReportPDF } from '@/lib/reportPdfGenerator';

export default function ReportBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { report, loading, updateReport } = useReport(id);
  const { computedData, performanceMetrics, riskMetrics } = usePortfolio();
  
  const holdings = computedData.holdings;
  const totalValue = computedData.totalPortfolioValue;
  
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [branding, setBranding] = useState<ReportBranding>({});
  const [pageSize, setPageSize] = useState<'A4' | 'Letter'>('A4');
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state from report
  useState(() => {
    if (report) {
      setSections(report.sections);
      setBranding(report.branding);
      setPageSize(report.page_size);
    }
  });

  // Update local state when report loads
  if (report && sections.length === 0 && report.sections.length > 0) {
    setSections(report.sections);
    setBranding(report.branding);
    setPageSize(report.page_size);
  }

  const handleSave = async () => {
    setIsSaving(true);
    const success = await updateReport({ sections, branding, page_size: pageSize });
    setIsSaving(false);
    if (success) {
      setHasChanges(false);
      toast.success('Report saved');
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateReportPDF({
        report: { ...report!, sections, branding, page_size: pageSize },
        holdings,
        performanceMetrics,
        riskMetrics,
        totalValue,
      });
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const addSection = (type: ReportSection['type']) => {
    const sectionDef = SECTION_LIBRARY.find(s => s.type === type);
    if (!sectionDef) return;

    const newSection: ReportSection = {
      id: crypto.randomUUID(),
      type,
      title: sectionDef.label,
      enabled: true,
    };
    setSections(prev => [...prev, newSection]);
    setHasChanges(true);
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setHasChanges(true);
  };

  const toggleSection = (id: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
    setHasChanges(true);
  };

  const updateSectionTitle = (id: string, title: string) => {
    setSections(prev => prev.map(s => 
      s.id === id ? { ...s, title } : s
    ));
    setHasChanges(true);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    setSections(newSections);
    setHasChanges(true);
  };

  const updateBranding = (updates: Partial<ReportBranding>) => {
    setBranding(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col p-4 md:p-6">
        <Skeleton className="h-10 w-64 mb-4" />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <FileText size={48} className="text-muted-foreground mb-4" />
        <h2 className="text-lg font-medium">Report not found</h2>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 flex-shrink-0"
              onClick={() => navigate('/reports')}
            >
              <ArrowLeft size={16} />
            </Button>
            <Input
              value={report.name}
              onChange={(e) => updateReport({ name: e.target.value })}
              className="text-lg font-semibold border-transparent hover:border-border bg-transparent h-auto py-1 px-2 max-w-xs"
            />
            {hasChanges && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                Unsaved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Select value={pageSize} onValueChange={(v) => { setPageSize(v as 'A4' | 'Letter'); setHasChanges(true); }}>
              <SelectTrigger className="w-[90px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="Letter">Letter</SelectItem>
              </SelectContent>
            </Select>
            <Sheet open={brandingOpen} onOpenChange={setBrandingOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8">
                  <Settings2 size={14} />
                  <span className="hidden sm:inline">Branding</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Report Branding</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-100px)] pr-4">
                  <div className="space-y-6 py-6">
                    <div className="space-y-2">
                      <Label>Logo URL</Label>
                      <Input
                        placeholder="https://example.com/logo.png"
                        value={branding.logoUrl || ''}
                        onChange={(e) => updateBranding({ logoUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={branding.accentColor || '#FFC107'}
                          onChange={(e) => updateBranding({ accentColor: e.target.value })}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={branding.accentColor || '#FFC107'}
                          onChange={(e) => updateBranding({ accentColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Header Title</Label>
                      <Input
                        placeholder="Portfolio Report"
                        value={branding.headerTitle || ''}
                        onChange={(e) => updateBranding({ headerTitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Header Subtitle</Label>
                      <Input
                        placeholder="Q4 2024"
                        value={branding.headerSubtitle || ''}
                        onChange={(e) => updateBranding({ headerSubtitle: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Footer Text</Label>
                      <Textarea
                        placeholder="Confidential - For Internal Use Only"
                        value={branding.footerText || ''}
                        onChange={(e) => updateBranding({ footerText: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Analyst / Signature</Label>
                      <Input
                        placeholder="John Smith, CFA"
                        value={branding.analystName || ''}
                        onChange={(e) => updateBranding({ analystName: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Page Numbers</Label>
                      <Switch
                        checked={branding.showPageNumbers !== false}
                        onCheckedChange={(v) => updateBranding({ showPageNumbers: v })}
                      />
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 h-8"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              <Save size={14} />
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
            </Button>
            <Button 
              size="sm" 
              className="gap-1.5 h-8"
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              <Download size={14} />
              <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export PDF'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-0">
        {/* Section Library */}
        <div className="border-r border-border bg-card/30 overflow-hidden flex flex-col order-2 lg:order-1">
          <div className="flex-shrink-0 px-4 py-3 border-b border-border">
            <h3 className="text-sm font-medium">Section Library</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Click to add sections</p>
          </div>
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-2">
              {SECTION_LIBRARY.map((item) => {
                const isAdded = sections.some(s => s.type === item.type);
                return (
                  <button
                    key={item.type}
                    onClick={() => addSection(item.type)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors",
                      isAdded 
                        ? "border-primary/30 bg-primary/5" 
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.label}</span>
                      {isAdded && <span className="text-[10px] text-primary">Added</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Canvas / Preview */}
        <div className="lg:col-span-2 overflow-hidden flex flex-col order-1 lg:order-2">
          <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-medium">Report Layout</h3>
            <span className="text-xs text-muted-foreground">{sections.filter(s => s.enabled).length} sections</span>
          </div>
          <ScrollArea className="flex-1 p-4">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Plus size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">No sections added</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Select sections from the library to build your report
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <Collapsible key={section.id}>
                    <div className={cn(
                      "border rounded-lg transition-colors",
                      section.enabled ? "border-border bg-card" : "border-border/50 bg-muted/30"
                    )}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                          <GripVertical size={14} className="text-muted-foreground flex-shrink-0" />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Input
                              value={section.title}
                              onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="h-7 text-sm font-medium border-transparent hover:border-border bg-transparent"
                            />
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => { e.stopPropagation(); toggleSection(section.id); }}
                            >
                              {section.enabled ? <Eye size={14} /> : <EyeOff size={14} className="text-muted-foreground" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                            >
                              <Trash2 size={14} />
                            </Button>
                            <ChevronRight size={14} className="text-muted-foreground transition-transform [[data-state=open]_&]:rotate-90" />
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-3 pb-3 pt-0">
                          <div className="border-t border-border pt-3">
                            <ReportSectionPreview 
                              section={section}
                              holdings={holdings}
                              performanceMetrics={performanceMetrics}
                              riskMetrics={riskMetrics}
                              totalValue={totalValue}
                              branding={branding}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
