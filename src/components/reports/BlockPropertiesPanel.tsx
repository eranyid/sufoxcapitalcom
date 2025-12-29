import { useState, useRef } from 'react';
import { ReportBlock, ReportBlockConfig, ReportBranding } from '@/types/reportBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Upload, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BlockPropertiesPanelProps {
  block: ReportBlock | null;
  branding: ReportBranding;
  onUpdateBlock: (id: string, config: Partial<ReportBlockConfig>) => void;
  onUpdateBranding: (branding: Partial<ReportBranding>) => void;
  onClose: () => void;
}

export function BlockPropertiesPanel({
  block,
  branding,
  onUpdateBlock,
  onUpdateBranding,
  onClose,
}: BlockPropertiesPanelProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !block) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, SVG, or WebP image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be smaller than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('report-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('report-logos')
        .getPublicUrl(filePath);

      onUpdateBlock(block.id, { logoUrl: urlData.publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  if (!block) {
    // Show global branding settings when no block is selected
    return (
      <div className="w-80 border-l border-border bg-card/50 flex flex-col">
        <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-medium">Report Branding</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
        
        {/* Live Color Preview Swatch Bar */}
        <div className="px-4 py-3 border-b border-border">
          <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Live Preview</Label>
          <div 
            className="rounded-lg p-3 transition-colors duration-200"
            style={{ backgroundColor: branding.backgroundColor }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div 
                className="w-3 h-3 rounded-full ring-1 ring-white/20" 
                style={{ backgroundColor: branding.accentColor }}
                title="Accent"
              />
              <span 
                className="text-xs font-semibold"
                style={{ color: branding.headingColor || '#FFFFFF' }}
              >
                Heading
              </span>
            </div>
            <p 
              className="text-[10px] mb-2"
              style={{ color: branding.textColor || '#E5E5E5' }}
            >
              Body text preview
            </p>
            <div className="flex gap-1 mb-2">
              {[
                branding.chartPrimaryColor || '#FFC107',
                branding.chartSecondaryColor || '#4A90D9',
                branding.chartPositiveColor || '#22C55E',
                branding.chartNegativeColor || '#EF4444',
              ].map((color, i) => (
                <div 
                  key={i}
                  className="flex-1 h-2 rounded-sm transition-colors duration-200"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div 
              className="rounded text-[8px] p-1 transition-colors duration-200"
              style={{ 
                backgroundColor: branding.tableHeaderBgColor || '#1A1A1A',
                color: branding.tableHeaderTextColor || '#FFC107',
                borderBottom: `1px solid ${branding.tableBorderColor || '#333333'}`
              }}
            >
              Table Header
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Primary Colors Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Primary Colors</h4>
              
              <div className="space-y-2">
                <Label className="text-xs">Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) => onUpdateBranding({ accentColor: e.target.value })}
                    className="w-10 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    value={branding.accentColor}
                    onChange={(e) => onUpdateBranding({ accentColor: e.target.value })}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={branding.backgroundColor}
                    onChange={(e) => onUpdateBranding({ backgroundColor: e.target.value })}
                    className="w-10 h-8 p-1 cursor-pointer"
                  />
                  <Input
                    value={branding.backgroundColor}
                    onChange={(e) => onUpdateBranding({ backgroundColor: e.target.value })}
                    className="flex-1 h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Text Colors Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text Colors</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Body Text</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.textColor || '#E5E5E5'}
                      onChange={(e) => onUpdateBranding({ textColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.textColor || '#E5E5E5'}
                      onChange={(e) => onUpdateBranding({ textColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Headings</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.headingColor || '#FFFFFF'}
                      onChange={(e) => onUpdateBranding({ headingColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.headingColor || '#FFFFFF'}
                      onChange={(e) => onUpdateBranding({ headingColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Muted Text</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.mutedTextColor || '#888888'}
                      onChange={(e) => onUpdateBranding({ mutedTextColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.mutedTextColor || '#888888'}
                      onChange={(e) => onUpdateBranding({ mutedTextColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Colors Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chart Colors</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Primary</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.chartPrimaryColor || '#FFC107'}
                      onChange={(e) => onUpdateBranding({ chartPrimaryColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.chartPrimaryColor || '#FFC107'}
                      onChange={(e) => onUpdateBranding({ chartPrimaryColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Secondary</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.chartSecondaryColor || '#4A90D9'}
                      onChange={(e) => onUpdateBranding({ chartSecondaryColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.chartSecondaryColor || '#4A90D9'}
                      onChange={(e) => onUpdateBranding({ chartSecondaryColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Positive</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.chartPositiveColor || '#22C55E'}
                      onChange={(e) => onUpdateBranding({ chartPositiveColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.chartPositiveColor || '#22C55E'}
                      onChange={(e) => onUpdateBranding({ chartPositiveColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Negative</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.chartNegativeColor || '#EF4444'}
                      onChange={(e) => onUpdateBranding({ chartNegativeColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.chartNegativeColor || '#EF4444'}
                      onChange={(e) => onUpdateBranding({ chartNegativeColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Table Colors Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Table Colors</h4>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Header BG</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.tableHeaderBgColor || '#1A1A1A'}
                      onChange={(e) => onUpdateBranding({ tableHeaderBgColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.tableHeaderBgColor || '#1A1A1A'}
                      onChange={(e) => onUpdateBranding({ tableHeaderBgColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Header Text</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.tableHeaderTextColor || '#FFC107'}
                      onChange={(e) => onUpdateBranding({ tableHeaderTextColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.tableHeaderTextColor || '#FFC107'}
                      onChange={(e) => onUpdateBranding({ tableHeaderTextColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Alt Row BG</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.tableRowAltBgColor || '#111111'}
                      onChange={(e) => onUpdateBranding({ tableRowAltBgColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.tableRowAltBgColor || '#111111'}
                      onChange={(e) => onUpdateBranding({ tableRowAltBgColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px]">Border</Label>
                  <div className="flex gap-1">
                    <Input
                      type="color"
                      value={branding.tableBorderColor || '#333333'}
                      onChange={(e) => onUpdateBranding({ tableBorderColor: e.target.value })}
                      className="w-8 h-7 p-0.5 cursor-pointer"
                    />
                    <Input
                      value={branding.tableBorderColor || '#333333'}
                      onChange={(e) => onUpdateBranding({ tableBorderColor: e.target.value })}
                      className="flex-1 h-7 text-[10px] px-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</h4>

              <div className="space-y-2">
                <Label className="text-xs">Header Title</Label>
                <Input
                  placeholder="Portfolio Report"
                  value={branding.headerTitle || ''}
                  onChange={(e) => onUpdateBranding({ headerTitle: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Header Subtitle</Label>
                <Input
                  placeholder="Q4 2024"
                  value={branding.headerSubtitle || ''}
                  onChange={(e) => onUpdateBranding({ headerSubtitle: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Footer Text</Label>
                <Textarea
                  placeholder="Confidential - For Internal Use Only"
                  value={branding.footerText || ''}
                  onChange={(e) => onUpdateBranding({ footerText: e.target.value })}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Analyst Name</Label>
                <Input
                  placeholder="John Smith, CFA"
                  value={branding.analystName || ''}
                  onChange={(e) => onUpdateBranding({ analystName: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Client Name</Label>
                <Input
                  placeholder="Client Name"
                  value={branding.clientName || ''}
                  onChange={(e) => onUpdateBranding({ clientName: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Options Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Options</h4>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Show Page Numbers</Label>
                <Switch
                  checked={branding.showPageNumbers}
                  onCheckedChange={(v) => onUpdateBranding({ showPageNumbers: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">Confidential Watermark</Label>
                <Switch
                  checked={branding.showConfidentialWatermark}
                  onCheckedChange={(v) => onUpdateBranding({ showConfidentialWatermark: v })}
                />
              </div>
            </div>

            {/* Color Presets */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Presets</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => onUpdateBranding({
                    accentColor: '#FFC107',
                    backgroundColor: '#0A0A0A',
                    textColor: '#E5E5E5',
                    headingColor: '#FFFFFF',
                    chartPrimaryColor: '#FFC107',
                    chartSecondaryColor: '#4A90D9',
                  })}
                >
                  Dark Gold
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => onUpdateBranding({
                    accentColor: '#3B82F6',
                    backgroundColor: '#0F172A',
                    textColor: '#CBD5E1',
                    headingColor: '#F1F5F9',
                    chartPrimaryColor: '#3B82F6',
                    chartSecondaryColor: '#8B5CF6',
                  })}
                >
                  Dark Blue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => onUpdateBranding({
                    accentColor: '#10B981',
                    backgroundColor: '#022C22',
                    textColor: '#D1FAE5',
                    headingColor: '#ECFDF5',
                    chartPrimaryColor: '#10B981',
                    chartSecondaryColor: '#F59E0B',
                  })}
                >
                  Dark Green
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => onUpdateBranding({
                    accentColor: '#2563EB',
                    backgroundColor: '#FFFFFF',
                    textColor: '#374151',
                    headingColor: '#111827',
                    chartPrimaryColor: '#2563EB',
                    chartSecondaryColor: '#7C3AED',
                    tableHeaderBgColor: '#F3F4F6',
                    tableHeaderTextColor: '#111827',
                    tableRowAltBgColor: '#F9FAFB',
                    tableBorderColor: '#E5E7EB',
                  })}
                >
                  Light Blue
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => onUpdateBranding({
                    accentColor: '#DC2626',
                    backgroundColor: '#FFFBEB',
                    textColor: '#451A03',
                    headingColor: '#78350F',
                    chartPrimaryColor: '#DC2626',
                    chartSecondaryColor: '#EA580C',
                    tableHeaderBgColor: '#FEF3C7',
                    tableHeaderTextColor: '#92400E',
                    tableRowAltBgColor: '#FFFBEB',
                    tableBorderColor: '#FDE68A',
                  })}
                >
                  Warm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[10px]"
                  onClick={() => onUpdateBranding({
                    accentColor: '#6366F1',
                    backgroundColor: '#18181B',
                    textColor: '#A1A1AA',
                    headingColor: '#FAFAFA',
                    chartPrimaryColor: '#6366F1',
                    chartSecondaryColor: '#EC4899',
                  })}
                >
                  Purple
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium capitalize">
            {block.type.replace(/_/g, ' ')}
          </h3>
          <p className="text-xs text-muted-foreground">Block Properties</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Logo Header specific */}
          {block.type === 'logo_header' && (
            <>
              <div className="space-y-2">
                <Label>Logo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {block.config.logoUrl ? (
                  <div className="relative group">
                    <img
                      src={block.config.logoUrl}
                      alt="Logo"
                      className="w-full h-20 object-contain rounded border border-border bg-muted/20"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : 'Change'}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-20 flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Upload size={20} />
                        <span className="text-xs">Upload Logo</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Alignment</Label>
                <Select
                  value={block.config.logoAlignment || 'center'}
                  onValueChange={(v) => onUpdateBlock(block.id, { logoAlignment: v as 'left' | 'center' | 'right' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Size</Label>
                <Select
                  value={block.config.logoSize || 'medium'}
                  onValueChange={(v) => onUpdateBlock(block.id, { logoSize: v as 'small' | 'medium' | 'large' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Title/Subtitle blocks */}
          {(block.type === 'title' || block.type === 'subtitle' || block.type === 'logo_header') && (
            <div className="space-y-2">
              <Label>Title Text</Label>
              <Input
                placeholder="Enter title..."
                value={block.config.title || ''}
                onChange={(e) => onUpdateBlock(block.id, { title: e.target.value })}
              />
            </div>
          )}

          {(block.type === 'subtitle' || block.type === 'logo_header') && (
            <div className="space-y-2">
              <Label>Subtitle Text</Label>
              <Input
                placeholder="Enter subtitle..."
                value={block.config.subtitle || ''}
                onChange={(e) => onUpdateBlock(block.id, { subtitle: e.target.value })}
              />
            </div>
          )}

          {/* Free text */}
          {block.type === 'free_text' && (
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                placeholder="Enter your commentary..."
                value={block.config.text || ''}
                onChange={(e) => onUpdateBlock(block.id, { text: e.target.value })}
                rows={6}
              />
            </div>
          )}

          {/* Text alignment for text blocks */}
          {['title', 'subtitle', 'free_text'].includes(block.type) && (
            <div className="space-y-2">
              <Label>Text Align</Label>
              <Select
                value={block.config.textAlign || 'center'}
                onValueChange={(v) => onUpdateBlock(block.id, { textAlign: v as 'left' | 'center' | 'right' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Show background toggle for data blocks */}
          {['portfolio_overview', 'performance_summary', 'risk_metrics'].includes(block.type) && (
            <div className="flex items-center justify-between">
              <Label>Show Background</Label>
              <Switch
                checked={block.config.showBackground ?? true}
                onCheckedChange={(v) => onUpdateBlock(block.id, { showBackground: v })}
              />
            </div>
          )}

          {/* Chart/Table toggles */}
          {['asset_allocation', 'currency_exposure', 'geographic_allocation'].includes(block.type) && (
            <>
              <div className="flex items-center justify-between">
                <Label>Show Chart</Label>
                <Switch
                  checked={block.config.showChart !== false}
                  onCheckedChange={(v) => onUpdateBlock(block.id, { showChart: v })}
                />
              </div>
            </>
          )}

          {/* Max items for lists */}
          {['holdings_table', 'top_movers', 'scenarios_snapshot', 'contribution_chart', 'transactions_summary'].includes(block.type) && (
            <div className="space-y-2">
              <Label>Max Items: {block.config.maxItems || 10}</Label>
              <Slider
                value={[block.config.maxItems || 10]}
                min={3}
                max={30}
                step={1}
                onValueChange={([v]) => onUpdateBlock(block.id, { maxItems: v })}
              />
            </div>
          )}

          {/* Footer specific */}
          {block.type === 'footer' && (
            <>
              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Input
                  placeholder="Confidential..."
                  value={block.config.footerText || ''}
                  onChange={(e) => onUpdateBlock(block.id, { footerText: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Analyst Name</Label>
                <Input
                  placeholder="John Smith, CFA"
                  value={block.config.analystName || ''}
                  onChange={(e) => onUpdateBlock(block.id, { analystName: e.target.value })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show Page Numbers</Label>
                <Switch
                  checked={block.config.showPageNumbers ?? true}
                  onCheckedChange={(v) => onUpdateBlock(block.id, { showPageNumbers: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Show Date</Label>
                <Switch
                  checked={block.config.showDate ?? true}
                  onCheckedChange={(v) => onUpdateBlock(block.id, { showDate: v })}
                />
              </div>
            </>
          )}

          {/* Column span */}
          <div className="space-y-2 pt-4 border-t border-border">
            <Label>Block Width</Label>
            <Select
              value={String(block.colSpan)}
              onValueChange={(v) => {
                // This needs to be handled at the parent level
                // For now, just show the current value
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">Half Width</SelectItem>
                <SelectItem value="12">Full Width</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}