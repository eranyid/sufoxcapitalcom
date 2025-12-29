import { 
  ReportBlock, 
  ReportBranding, 
  BLOCK_LIBRARY,
  DEFAULT_BRANDING,
  ReportBlockType 
} from '@/types/reportBuilder';
import { 
  FileText, 
  BarChart3, 
  Users, 
  Briefcase,
  Sparkles,
  LayoutTemplate,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'essential' | 'detailed' | 'custom';
  blocks: Omit<ReportBlock, 'id'>[];
  branding: Partial<ReportBranding>;
}

// Helper to create block from type
const createBlock = (
  type: ReportBlockType, 
  row: number, 
  overrides: Partial<Omit<ReportBlock, 'id' | 'type'>> = {}
): Omit<ReportBlock, 'id'> => {
  const libraryItem = BLOCK_LIBRARY.find(b => b.type === type);
  return {
    type,
    row,
    colSpan: overrides.colSpan ?? libraryItem?.defaultColSpan ?? 12,
    colStart: overrides.colStart ?? 0,
    height: overrides.height ?? libraryItem?.defaultHeight ?? 4,
    config: { ...libraryItem?.defaultConfig, ...overrides.config },
    enabled: true,
    page: overrides.page ?? 1,
  };
};

export const REPORT_TEMPLATES: ReportTemplate[] = [
  // QUARTERLY REVIEW
  {
    id: 'quarterly-review',
    name: 'Quarterly Review',
    description: 'Comprehensive quarterly performance report with all key metrics and analysis',
    icon: <BarChart3 className="h-5 w-5" />,
    category: 'detailed',
    branding: {
      headerTitle: 'Quarterly Portfolio Review',
      headerSubtitle: 'Q4 2024',
      footerText: 'Confidential - For Internal Use Only',
    },
    blocks: [
      createBlock('logo_header', 0, { config: { logoAlignment: 'center', logoSize: 'medium' } }),
      createBlock('title', 1, { config: { title: 'Quarterly Portfolio Review', fontSize: '2xl', fontWeight: 'bold', textAlign: 'center' } }),
      createBlock('subtitle', 2, { config: { text: 'Performance Period: Q4 2024', fontSize: 'lg', textAlign: 'center' } }),
      createBlock('portfolio_overview', 3),
      createBlock('performance_summary', 4),
      createBlock('contribution_chart', 5, { colSpan: 6 }),
      createBlock('top_movers', 6, { colSpan: 6 }),
      createBlock('performance_calendar', 7),
      createBlock('page_break', 8),
      createBlock('asset_allocation', 9, { page: 2, colSpan: 6 }),
      createBlock('geographic_allocation', 10, { page: 2, colSpan: 6 }),
      createBlock('risk_metrics', 11, { page: 2 }),
      createBlock('holdings_table', 12, { page: 2, height: 12 }),
      createBlock('footer', 13, { page: 2, config: { showPageNumbers: true, showDate: true } }),
    ],
  },

  // PERFORMANCE SUMMARY
  {
    id: 'performance-summary',
    name: 'Performance Summary',
    description: 'Concise one-page overview focused on returns and key performance indicators',
    icon: <Sparkles className="h-5 w-5" />,
    category: 'essential',
    branding: {
      headerTitle: 'Performance Summary',
      footerText: 'Generated Report',
    },
    blocks: [
      createBlock('logo_header', 0, { height: 2, config: { logoAlignment: 'left', logoSize: 'small' } }),
      createBlock('title', 1, { height: 1, config: { title: 'Performance Summary', fontSize: 'xl', fontWeight: 'bold', textAlign: 'left' } }),
      createBlock('portfolio_overview', 2, { height: 3 }),
      createBlock('performance_summary', 3, { height: 3 }),
      createBlock('contribution_chart', 4, { colSpan: 6, height: 6 }),
      createBlock('asset_allocation', 5, { colSpan: 6, height: 6 }),
      createBlock('top_movers', 6, { height: 5 }),
    ],
  },

  // CLIENT PRESENTATION
  {
    id: 'client-presentation',
    name: 'Client Presentation',
    description: 'Professional presentation-style report optimized for client meetings',
    icon: <Users className="h-5 w-5" />,
    category: 'detailed',
    branding: {
      headerTitle: 'Investment Portfolio Update',
      headerSubtitle: 'Prepared for [Client Name]',
      footerText: 'Private & Confidential',
      showConfidentialWatermark: true,
    },
    blocks: [
      createBlock('logo_header', 0, { height: 4, config: { logoAlignment: 'center', logoSize: 'large' } }),
      createBlock('title', 1, { height: 2, config: { title: 'Investment Portfolio Update', fontSize: '2xl', fontWeight: 'bold', textAlign: 'center' } }),
      createBlock('subtitle', 2, { height: 1, config: { text: 'Prepared for [Client Name]', fontSize: 'lg', textAlign: 'center' } }),
      createBlock('spacer', 3, { height: 2 }),
      createBlock('free_text', 4, { height: 3, config: { text: 'This report provides a comprehensive overview of your investment portfolio performance and current positioning.', textAlign: 'center' } }),
      createBlock('page_break', 5),
      createBlock('title', 6, { page: 2, height: 1, config: { title: 'Portfolio Overview', fontSize: 'xl', fontWeight: 'semibold' } }),
      createBlock('portfolio_overview', 7, { page: 2 }),
      createBlock('performance_summary', 8, { page: 2 }),
      createBlock('page_break', 9, { page: 2 }),
      createBlock('title', 10, { page: 3, height: 1, config: { title: 'Asset Allocation', fontSize: 'xl', fontWeight: 'semibold' } }),
      createBlock('asset_allocation', 11, { page: 3, colSpan: 6, height: 6 }),
      createBlock('geographic_allocation', 12, { page: 3, colSpan: 6, height: 6 }),
      createBlock('xray_architecture', 13, { page: 3, height: 6 }),
      createBlock('page_break', 14, { page: 3 }),
      createBlock('title', 15, { page: 4, height: 1, config: { title: 'Risk Analysis', fontSize: 'xl', fontWeight: 'semibold' } }),
      createBlock('risk_metrics', 16, { page: 4 }),
      createBlock('risk_return_scatter', 17, { page: 4, height: 7 }),
      createBlock('footer', 18, { page: 4, config: { showPageNumbers: true, showDate: true, confidentialWatermark: true } }),
    ],
  },

  // EXECUTIVE BRIEF
  {
    id: 'executive-brief',
    name: 'Executive Brief',
    description: 'High-level summary for executives with key metrics only',
    icon: <Briefcase className="h-5 w-5" />,
    category: 'essential',
    branding: {
      headerTitle: 'Executive Brief',
      footerText: 'Internal Use Only',
    },
    blocks: [
      createBlock('logo_header', 0, { height: 2, config: { logoAlignment: 'left', logoSize: 'small' } }),
      createBlock('title', 1, { height: 1, config: { title: 'Portfolio Executive Brief', fontSize: 'xl', fontWeight: 'bold' } }),
      createBlock('portfolio_overview', 2, { height: 4 }),
      createBlock('asset_allocation', 3, { colSpan: 6, height: 5 }),
      createBlock('risk_metrics', 4, { colSpan: 6, height: 5 }),
      createBlock('top_movers', 5, { height: 4 }),
    ],
  },

  // RISK REPORT
  {
    id: 'risk-report',
    name: 'Risk Report',
    description: 'Detailed risk analysis including VaR, scenarios, and factor exposures',
    icon: <FileText className="h-5 w-5" />,
    category: 'detailed',
    branding: {
      headerTitle: 'Risk Analysis Report',
      footerText: 'Risk Management',
    },
    blocks: [
      createBlock('logo_header', 0),
      createBlock('title', 1, { config: { title: 'Risk Analysis Report', fontSize: '2xl', fontWeight: 'bold', textAlign: 'center' } }),
      createBlock('risk_metrics', 2),
      createBlock('risk_return_scatter', 3, { height: 7 }),
      createBlock('page_break', 4),
      createBlock('title', 5, { page: 2, height: 1, config: { title: 'Factor Exposure', fontSize: 'xl', fontWeight: 'semibold' } }),
      createBlock('factor_exposure', 6, { page: 2, height: 6 }),
      createBlock('title', 7, { page: 2, height: 1, config: { title: 'Stress Scenarios', fontSize: 'xl', fontWeight: 'semibold' } }),
      createBlock('scenarios_snapshot', 8, { page: 2, height: 5 }),
      createBlock('drawdown_chart', 9, { page: 2, height: 5 }),
      createBlock('footer', 10, { page: 2 }),
    ],
  },

  // BLANK TEMPLATE
  {
    id: 'blank',
    name: 'Blank Report',
    description: 'Start from scratch with an empty canvas',
    icon: <LayoutTemplate className="h-5 w-5" />,
    category: 'custom',
    branding: DEFAULT_BRANDING,
    blocks: [],
  },
];

interface TemplateCardProps {
  template: ReportTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all hover:shadow-md",
        isSelected 
          ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
          : "border-border hover:border-primary/50 bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-md",
          isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm">{template.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {template.description}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium",
              template.category === 'essential' && "bg-green-500/10 text-green-600",
              template.category === 'detailed' && "bg-blue-500/10 text-blue-600",
              template.category === 'custom' && "bg-muted text-muted-foreground"
            )}>
              {template.category === 'essential' ? '1 Page' : 
               template.category === 'detailed' ? 'Multi-Page' : 'Custom'}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {template.blocks.length} blocks
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

interface TemplateSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: ReportTemplate) => void;
}

export function TemplateSelectorDialog({ 
  open, 
  onOpenChange, 
  onSelectTemplate 
}: TemplateSelectorDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const selectedTemplate = REPORT_TEMPLATES.find(t => t.id === selectedId);
  
  const handleApply = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      onOpenChange(false);
      setSelectedId(null);
    }
  };

  const essentialTemplates = REPORT_TEMPLATES.filter(t => t.category === 'essential');
  const detailedTemplates = REPORT_TEMPLATES.filter(t => t.category === 'detailed');
  const customTemplates = REPORT_TEMPLATES.filter(t => t.category === 'custom');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Select a template to get started quickly. You can customize everything after applying.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-6">
            {/* Essential Templates */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Essential (1 Page)
              </h4>
              <div className="grid gap-3">
                {essentialTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedId === template.id}
                    onSelect={() => setSelectedId(template.id)}
                  />
                ))}
              </div>
            </div>

            {/* Detailed Templates */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Detailed (Multi-Page)
              </h4>
              <div className="grid gap-3">
                {detailedTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedId === template.id}
                    onSelect={() => setSelectedId(template.id)}
                  />
                ))}
              </div>
            </div>

            {/* Custom Templates */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Custom
              </h4>
              <div className="grid gap-3">
                {customTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedId === template.id}
                    onSelect={() => setSelectedId(template.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={!selectedTemplate}>
            Apply Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to apply a template
import { useState } from 'react';

export function useTemplateApplicator() {
  const applyTemplate = (
    template: ReportTemplate,
    setBlocks: (blocks: ReportBlock[]) => void,
    setBranding: (fn: (prev: ReportBranding) => ReportBranding) => void
  ) => {
    // Generate IDs for blocks
    const blocksWithIds: ReportBlock[] = template.blocks.map(block => ({
      ...block,
      id: crypto.randomUUID(),
    }));

    setBlocks(blocksWithIds);
    setBranding(prev => ({ ...prev, ...template.branding }));
  };

  return { applyTemplate };
}
