import { useState, useRef, useCallback } from 'react';
import { ReportBlock, ReportBlockConfig, ReportBranding } from '@/types/reportBuilder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  X, Upload, Loader2, Wand2, Palette, Pipette, ChevronDown, 
  Type, LayoutGrid, PaintBucket, Table2, BarChart3, Settings2, 
  Sun, Moon, Sparkles, Copy, RotateCcw, Image, Paintbrush,
  Blend, Layers, MousePointerClick, Zap, BookOpen, FileText
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Extend Window interface for EyeDropper API
declare global {
  interface Window {
    EyeDropper?: new () => {
      open: () => Promise<{ sRGBHex: string }>;
    };
  }
}

// Color extraction utilities
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function getColorBrightness(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      const colorCounts: Record<string, { count: number; r: number; g: number; b: number }> = {};
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i] / 32) * 32;
        const g = Math.round(pixels[i + 1] / 32) * 32;
        const b = Math.round(pixels[i + 2] / 32) * 32;
        const a = pixels[i + 3];
        
        if (a < 128) continue;
        const brightness = getColorBrightness(r, g, b);
        if (brightness > 240 || brightness < 15) continue;
        
        const key = `${r},${g},${b}`;
        if (!colorCounts[key]) {
          colorCounts[key] = { count: 0, r, g, b };
        }
        colorCounts[key].count++;
      }

      const sortedColors = Object.values(colorCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map(c => rgbToHex(c.r, c.g, c.b));

      resolve(sortedColors.length > 0 ? sortedColors : ['#FFC107', '#4A90D9']);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

// Quick color presets
const QUICK_COLORS = [
  '#D4A853', '#FFC107', '#F59E0B', '#EAB308',
  '#3B82F6', '#2563EB', '#1D4ED8', '#4A90D9',
  '#10B981', '#22C55E', '#16A34A', '#059669',
  '#EF4444', '#DC2626', '#F87171', '#C75B5B',
  '#8B5CF6', '#6366F1', '#7C3AED', '#A855F7',
  '#EC4899', '#F472B6', '#DB2777', '#BE185D',
];

// Theme presets with better structure
const THEME_PRESETS = [
  {
    name: 'Gold Dark',
    emoji: '🌟',
    colors: {
      accentColor: '#D4A853',
      backgroundColor: '#0C0C0E',
      textColor: '#E8E4DC',
      headingColor: '#FAF8F5',
      mutedTextColor: '#8A8680',
      chartPrimaryColor: '#D4A853',
      chartSecondaryColor: '#5A7A9A',
      chartPositiveColor: '#4CAF7C',
      chartNegativeColor: '#C75B5B',
      tableHeaderBgColor: '#1C1A18',
      tableHeaderTextColor: '#D4A853',
      tableRowAltBgColor: '#141210',
      tableBorderColor: '#2A2825',
    }
  },
  {
    name: 'Ocean Dark',
    emoji: '🌊',
    colors: {
      accentColor: '#3B82F6',
      backgroundColor: '#0F172A',
      textColor: '#CBD5E1',
      headingColor: '#F1F5F9',
      mutedTextColor: '#64748B',
      chartPrimaryColor: '#3B82F6',
      chartSecondaryColor: '#8B5CF6',
      chartPositiveColor: '#22C55E',
      chartNegativeColor: '#EF4444',
      tableHeaderBgColor: '#1E293B',
      tableHeaderTextColor: '#93C5FD',
      tableRowAltBgColor: '#0F172A',
      tableBorderColor: '#334155',
    }
  },
  {
    name: 'Forest Dark',
    emoji: '🌲',
    colors: {
      accentColor: '#10B981',
      backgroundColor: '#022C22',
      textColor: '#D1FAE5',
      headingColor: '#ECFDF5',
      mutedTextColor: '#6EE7B7',
      chartPrimaryColor: '#10B981',
      chartSecondaryColor: '#F59E0B',
      chartPositiveColor: '#34D399',
      chartNegativeColor: '#F87171',
      tableHeaderBgColor: '#064E3B',
      tableHeaderTextColor: '#A7F3D0',
      tableRowAltBgColor: '#022C22',
      tableBorderColor: '#047857',
    }
  },
  {
    name: 'Purple Night',
    emoji: '🔮',
    colors: {
      accentColor: '#8B5CF6',
      backgroundColor: '#18181B',
      textColor: '#D4D4D8',
      headingColor: '#FAFAFA',
      mutedTextColor: '#71717A',
      chartPrimaryColor: '#8B5CF6',
      chartSecondaryColor: '#EC4899',
      chartPositiveColor: '#22C55E',
      chartNegativeColor: '#EF4444',
      tableHeaderBgColor: '#27272A',
      tableHeaderTextColor: '#C4B5FD',
      tableRowAltBgColor: '#18181B',
      tableBorderColor: '#3F3F46',
    }
  },
  {
    name: 'Blue Light',
    emoji: '☀️',
    colors: {
      accentColor: '#2563EB',
      backgroundColor: '#FFFFFF',
      textColor: '#374151',
      headingColor: '#111827',
      mutedTextColor: '#6B7280',
      chartPrimaryColor: '#2563EB',
      chartSecondaryColor: '#7C3AED',
      chartPositiveColor: '#16A34A',
      chartNegativeColor: '#DC2626',
      tableHeaderBgColor: '#F3F4F6',
      tableHeaderTextColor: '#1F2937',
      tableRowAltBgColor: '#F9FAFB',
      tableBorderColor: '#E5E7EB',
    }
  },
  {
    name: 'Green Light',
    emoji: '🌿',
    colors: {
      accentColor: '#059669',
      backgroundColor: '#FFFFFF',
      textColor: '#374151',
      headingColor: '#111827',
      mutedTextColor: '#6B7280',
      chartPrimaryColor: '#059669',
      chartSecondaryColor: '#0891B2',
      chartPositiveColor: '#16A34A',
      chartNegativeColor: '#DC2626',
      tableHeaderBgColor: '#ECFDF5',
      tableHeaderTextColor: '#065F46',
      tableRowAltBgColor: '#F0FDF4',
      tableBorderColor: '#D1FAE5',
    }
  },
  {
    name: 'Rose Light',
    emoji: '🌸',
    colors: {
      accentColor: '#EC4899',
      backgroundColor: '#FFFBEB',
      textColor: '#374151',
      headingColor: '#111827',
      mutedTextColor: '#6B7280',
      chartPrimaryColor: '#EC4899',
      chartSecondaryColor: '#8B5CF6',
      chartPositiveColor: '#16A34A',
      chartNegativeColor: '#DC2626',
      tableHeaderBgColor: '#FDF2F8',
      tableHeaderTextColor: '#BE185D',
      tableRowAltBgColor: '#FFF1F2',
      tableBorderColor: '#FBCFE8',
    }
  },
  {
    name: 'Midnight',
    emoji: '🌙',
    colors: {
      accentColor: '#6366F1',
      backgroundColor: '#030712',
      textColor: '#9CA3AF',
      headingColor: '#F9FAFB',
      mutedTextColor: '#6B7280',
      chartPrimaryColor: '#6366F1',
      chartSecondaryColor: '#14B8A6',
      chartPositiveColor: '#22C55E',
      chartNegativeColor: '#EF4444',
      tableHeaderBgColor: '#111827',
      tableHeaderTextColor: '#A5B4FC',
      tableRowAltBgColor: '#0F172A',
      tableBorderColor: '#1F2937',
    }
  },
];

// Font presets
const FONT_PRESETS = [
  { name: 'System', value: 'system-ui, -apple-system, sans-serif', label: 'System Default' },
  { name: 'Inter', value: 'Inter, sans-serif', label: 'Inter' },
  { name: 'Helvetica', value: 'Helvetica Neue, Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { name: 'Georgia', value: 'Georgia, serif', label: 'Georgia' },
  { name: 'Playfair', value: 'Playfair Display, serif', label: 'Playfair' },
  { name: 'Roboto', value: 'Roboto, sans-serif', label: 'Roboto' },
  { name: 'Mono', value: 'SF Mono, Consolas, monospace', label: 'Monospace' },
];

// Gradient presets
const GRADIENT_PRESETS = [
  { name: 'Sunset', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', preview: ['#f093fb', '#f5576c'] },
  { name: 'Ocean', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', preview: ['#667eea', '#764ba2'] },
  { name: 'Forest', value: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', preview: ['#11998e', '#38ef7d'] },
  { name: 'Fire', value: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)', preview: ['#f12711', '#f5af19'] },
  { name: 'Purple', value: 'linear-gradient(135deg, #8E2DE2 0%, #4A00E0 100%)', preview: ['#8E2DE2', '#4A00E0'] },
  { name: 'Gold', value: 'linear-gradient(135deg, #D4A853 0%, #B8860B 100%)', preview: ['#D4A853', '#B8860B'] },
  { name: 'Blue', value: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)', preview: ['#2193b0', '#6dd5ed'] },
  { name: 'Dark', value: 'linear-gradient(135deg, #434343 0%, #000000 100%)', preview: ['#434343', '#000000'] },
];

// Block style presets
const BLOCK_STYLE_PRESETS = [
  { name: 'Clean', borderRadius: 'md', shadow: 'none', borderWidth: 'none', padding: 'md' },
  { name: 'Card', borderRadius: 'lg', shadow: 'md', borderWidth: 'thin', padding: 'lg' },
  { name: 'Modern', borderRadius: 'xl', shadow: 'lg', borderWidth: 'none', padding: 'lg' },
  { name: 'Minimal', borderRadius: 'none', shadow: 'none', borderWidth: 'thin', padding: 'md' },
  { name: 'Glass', borderRadius: '2xl', shadow: 'xl', borderWidth: 'thin', padding: 'xl' },
  { name: 'Sharp', borderRadius: 'none', shadow: 'md', borderWidth: 'medium', padding: 'md' },
];

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  showQuickPicks?: boolean;
}

function ColorPicker({ label, value, onChange, showQuickPicks = true }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-9 h-9 rounded-lg border-2 border-border hover:border-primary/50 transition-colors flex-shrink-0 shadow-sm"
          style={{ backgroundColor: value }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 h-9 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
      {showQuickPicks && isOpen && (
        <div className="grid grid-cols-8 gap-1 p-2 bg-muted/50 rounded-lg mt-1">
          {QUICK_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color);
                setIsOpen(false);
              }}
              className={cn(
                "w-6 h-6 rounded-md border border-border/50 hover:scale-110 transition-transform",
                value === color && "ring-2 ring-primary ring-offset-1 ring-offset-background"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 px-1 hover:bg-muted/50 rounded-lg transition-colors">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 pb-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

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
  const [isExtractingColors, setIsExtractingColors] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isEyedropperSupported] = useState(() => typeof window !== 'undefined' && 'EyeDropper' in window);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleEyedropper = useCallback(async () => {
    if (!window.EyeDropper) {
      toast.error('Eyedropper is not supported in this browser');
      return;
    }

    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const color = result.sRGBHex;
      
      onUpdateBranding({ 
        accentColor: color,
        chartPrimaryColor: color,
        tableHeaderTextColor: color,
      });
      
      toast.success(`Applied ${color}`);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Eyedropper error:', error);
      }
    }
  }, [onUpdateBranding]);

  const handleExtractColors = useCallback(async () => {
    if (!branding.logoUrl) {
      toast.error('Please upload a logo first');
      return;
    }

    setIsExtractingColors(true);
    try {
      const colors = await extractColorsFromImage(branding.logoUrl);
      setExtractedColors(colors);
      
      if (colors.length > 0) {
        onUpdateBranding({ 
          accentColor: colors[0],
          chartPrimaryColor: colors[0],
          tableHeaderTextColor: colors[0],
        });
        
        if (colors.length > 1) {
          onUpdateBranding({ chartSecondaryColor: colors[1] });
        }
        
        toast.success(`Extracted ${colors.length} colors`);
      }
    } catch (error) {
      console.error('Color extraction error:', error);
      toast.error('Could not extract colors');
    } finally {
      setIsExtractingColors(false);
    }
  }, [branding.logoUrl, onUpdateBranding]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, forBlock: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a PNG, JPG, SVG, or WebP image');
      return;
    }

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

      if (forBlock && block) {
        onUpdateBlock(block.id, { logoUrl: urlData.publicUrl });
      } else {
        onUpdateBranding({ logoUrl: urlData.publicUrl });
      }
      toast.success('Logo uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsUploading(false);
    }
  };

  const resetToDefault = () => {
    onUpdateBranding(THEME_PRESETS[0].colors);
    toast.success('Reset to default theme');
  };

  const copyTheme = () => {
    const themeJson = JSON.stringify(branding, null, 2);
    navigator.clipboard.writeText(themeJson);
    toast.success('Theme copied to clipboard');
  };

  // Block-specific panel
  if (block) {
    return (
      <div className="w-80 border-l border-border bg-card/50 flex flex-col">
        <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <h3 className="text-sm font-semibold capitalize flex items-center gap-2">
              <Settings2 size={14} className="text-primary" />
              {block.type.replace(/_/g, ' ')}
            </h3>
            <p className="text-[10px] text-muted-foreground">Block Properties</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Logo Header specific */}
            {block.type === 'logo_header' && (
              <CollapsibleSection title="Logo" icon={<Image size={14} className="text-muted-foreground" />}>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={(e) => handleLogoUpload(e, true)}
                  className="hidden"
                />
                {block.config.logoUrl ? (
                  <div className="relative group rounded-lg overflow-hidden border border-border">
                    <img
                      src={block.config.logoUrl}
                      alt="Logo"
                      className="w-full h-24 object-contain bg-muted/20 p-2"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? <Loader2 size={14} className="animate-spin" /> : 'Change'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onUpdateBlock(block.id, { logoUrl: undefined })}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-24 flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 size={24} className="animate-spin" />
                    ) : (
                      <>
                        <Upload size={24} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to upload logo</span>
                      </>
                    )}
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Alignment</Label>
                    <Select
                      value={block.config.logoAlignment || 'center'}
                      onValueChange={(v) => onUpdateBlock(block.id, { logoAlignment: v as 'left' | 'center' | 'right' })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Size</Label>
                    <Select
                      value={block.config.logoSize || 'medium'}
                      onValueChange={(v) => onUpdateBlock(block.id, { logoSize: v as 'small' | 'medium' | 'large' })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Title/Subtitle blocks */}
            {(block.type === 'title' || block.type === 'subtitle' || block.type === 'logo_header') && (
              <CollapsibleSection title="Text Content" icon={<Type size={14} className="text-muted-foreground" />}>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Title</Label>
                  <Input
                    placeholder="Enter title..."
                    value={block.config.title || ''}
                    onChange={(e) => onUpdateBlock(block.id, { title: e.target.value })}
                    className="h-9"
                  />
                </div>

                {(block.type === 'subtitle' || block.type === 'logo_header') && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Subtitle</Label>
                    <Input
                      placeholder="Enter subtitle..."
                      value={block.config.subtitle || ''}
                      onChange={(e) => onUpdateBlock(block.id, { subtitle: e.target.value })}
                      className="h-9"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Alignment</Label>
                  <div className="flex gap-1">
                    {['left', 'center', 'right'].map((align) => (
                      <Button
                        key={align}
                        variant={block.config.textAlign === align ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 h-9"
                        onClick={() => onUpdateBlock(block.id, { textAlign: align as 'left' | 'center' | 'right' })}
                      >
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Free text */}
            {block.type === 'free_text' && (
              <CollapsibleSection title="Content" icon={<Type size={14} className="text-muted-foreground" />}>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Text Content</Label>
                  <Textarea
                    placeholder="Enter your commentary..."
                    value={block.config.text || ''}
                    onChange={(e) => onUpdateBlock(block.id, { text: e.target.value })}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Alignment</Label>
                  <div className="flex gap-1">
                    {['left', 'center', 'right'].map((align) => (
                      <Button
                        key={align}
                        variant={block.config.textAlign === align ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1 h-9"
                        onClick={() => onUpdateBlock(block.id, { textAlign: align as 'left' | 'center' | 'right' })}
                      >
                        {align.charAt(0).toUpperCase() + align.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Data block options */}
            {['portfolio_overview', 'performance_summary', 'risk_metrics'].includes(block.type) && (
              <CollapsibleSection title="Display" icon={<LayoutGrid size={14} className="text-muted-foreground" />}>
                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <Label className="text-xs">Show Background</Label>
                  <Switch
                    checked={block.config.showBackground ?? true}
                    onCheckedChange={(v) => onUpdateBlock(block.id, { showBackground: v })}
                  />
                </div>
              </CollapsibleSection>
            )}

            {/* Chart/Table toggles */}
            {['asset_allocation', 'currency_exposure', 'geographic_allocation'].includes(block.type) && (
              <CollapsibleSection title="Chart Options" icon={<BarChart3 size={14} className="text-muted-foreground" />}>
                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <Label className="text-xs">Show Chart</Label>
                  <Switch
                    checked={block.config.showChart !== false}
                    onCheckedChange={(v) => onUpdateBlock(block.id, { showChart: v })}
                  />
                </div>
              </CollapsibleSection>
            )}

            {/* Max items for lists */}
            {['holdings_table', 'top_movers', 'scenarios_snapshot', 'contribution_chart', 'transactions_summary'].includes(block.type) && (
              <CollapsibleSection title="Data Settings" icon={<Table2 size={14} className="text-muted-foreground" />}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Max Items</Label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                      {block.config.maxItems || 10}
                    </span>
                  </div>
                  <Slider
                    value={[block.config.maxItems || 10]}
                    min={3}
                    max={30}
                    step={1}
                    onValueChange={([v]) => onUpdateBlock(block.id, { maxItems: v })}
                    className="py-2"
                  />
                </div>
              </CollapsibleSection>
            )}

            {/* Footer specific */}
            {block.type === 'footer' && (
              <CollapsibleSection title="Footer Content" icon={<Type size={14} className="text-muted-foreground" />}>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Footer Text</Label>
                  <Input
                    placeholder="Confidential..."
                    value={block.config.footerText || ''}
                    onChange={(e) => onUpdateBlock(block.id, { footerText: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Analyst Name</Label>
                  <Input
                    placeholder="John Smith, CFA"
                    value={block.config.analystName || ''}
                    onChange={(e) => onUpdateBlock(block.id, { analystName: e.target.value })}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                    <Label className="text-xs">Show Page Numbers</Label>
                    <Switch
                      checked={block.config.showPageNumbers ?? true}
                      onCheckedChange={(v) => onUpdateBlock(block.id, { showPageNumbers: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                    <Label className="text-xs">Show Date</Label>
                    <Switch
                      checked={block.config.showDate ?? true}
                      onCheckedChange={(v) => onUpdateBlock(block.id, { showDate: v })}
                    />
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Appearance section - border, shadow, padding */}
            <CollapsibleSection title="Appearance" icon={<PaintBucket size={14} className="text-muted-foreground" />} defaultOpen={false}>
              {/* Border Radius */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Border Radius</Label>
                <div className="grid grid-cols-3 gap-1">
                  {(['none', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((radius) => (
                    <Button
                      key={radius}
                      variant={block.config.borderRadius === radius ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onUpdateBlock(block.id, { borderRadius: radius })}
                    >
                      {radius === 'none' ? 'None' : radius.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Shadow */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Shadow</Label>
                <div className="grid grid-cols-3 gap-1">
                  {(['none', 'sm', 'md', 'lg', 'xl', '2xl'] as const).map((shadow) => (
                    <Button
                      key={shadow}
                      variant={block.config.shadow === shadow ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onUpdateBlock(block.id, { shadow: shadow })}
                    >
                      {shadow === 'none' ? 'None' : shadow.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Border */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Border</Label>
                <div className="grid grid-cols-4 gap-1">
                  {(['none', 'thin', 'medium', 'thick'] as const).map((border) => (
                    <Button
                      key={border}
                      variant={block.config.borderWidth === border ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs capitalize"
                      onClick={() => onUpdateBlock(block.id, { borderWidth: border })}
                    >
                      {border}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Border Color - only show if border is not none */}
              {block.config.borderWidth && block.config.borderWidth !== 'none' && (
                <ColorPicker
                  label="Border Color"
                  value={block.config.borderColor || '#333333'}
                  onChange={(v) => onUpdateBlock(block.id, { borderColor: v })}
                  showQuickPicks={false}
                />
              )}

              {/* Padding */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Padding</Label>
                <div className="grid grid-cols-5 gap-1">
                  {(['none', 'sm', 'md', 'lg', 'xl'] as const).map((padding) => (
                    <Button
                      key={padding}
                      variant={block.config.padding === padding ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => onUpdateBlock(block.id, { padding: padding })}
                    >
                      {padding === 'none' ? '0' : padding.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <ColorPicker
                label="Background Color"
                value={block.config.backgroundColor || 'transparent'}
                onChange={(v) => onUpdateBlock(block.id, { backgroundColor: v })}
              />
            </CollapsibleSection>

            {/* Layout section - always show */}
            <CollapsibleSection title="Layout" icon={<LayoutGrid size={14} className="text-muted-foreground" />} defaultOpen={false}>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Block Width</Label>
                <div className="flex gap-1">
                  <Button
                    variant={block.colSpan === 6 ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => {/* Will be handled at parent level */}}
                  >
                    Half
                  </Button>
                  <Button
                    variant={block.colSpan === 12 ? 'default' : 'outline'}
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => {/* Will be handled at parent level */}}
                  >
                    Full
                  </Button>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Global branding panel
  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col">
      <div className="flex-shrink-0 px-4 py-3 border-b border-border flex items-center justify-between bg-muted/30">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Palette size={14} className="text-primary" />
            Edit Report
          </h3>
          <p className="text-[10px] text-muted-foreground">Customize your report</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyTheme} title="Copy theme">
            <Copy size={12} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetToDefault} title="Reset">
            <RotateCcw size={12} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
      </div>
      
      {/* Live Preview */}
      <div className="px-4 py-3 border-b border-border">
        <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 block">Live Preview</Label>
        <div 
          className="rounded-lg p-3 transition-all duration-300 shadow-inner"
          style={{ backgroundColor: branding.backgroundColor }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-4 h-4 rounded-full ring-1 ring-white/20 shadow-sm" 
              style={{ backgroundColor: branding.accentColor }}
            />
            <span 
              className="text-xs font-bold"
              style={{ color: branding.headingColor || '#FFFFFF' }}
            >
              Heading Text
            </span>
          </div>
          <p 
            className="text-[10px] mb-2"
            style={{ color: branding.textColor || '#E5E5E5' }}
          >
            Body text preview with styling
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
                className="flex-1 h-2.5 rounded transition-colors duration-200"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div 
            className="rounded text-[8px] p-1.5 transition-colors duration-200"
            style={{ 
              backgroundColor: branding.tableHeaderBgColor || '#1A1A1A',
              color: branding.tableHeaderTextColor || '#FFC107',
              borderBottom: `1px solid ${branding.tableBorderColor || '#333333'}`
            }}
          >
            Table Header Preview
          </div>
        </div>
      </div>

      <Tabs defaultValue="themes" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-6 h-9">
          <TabsTrigger value="themes" className="text-xs gap-1 px-1">
            <Sparkles size={11} />
            <span className="hidden sm:inline">Themes</span>
          </TabsTrigger>
          <TabsTrigger value="colors" className="text-xs gap-1 px-1">
            <PaintBucket size={11} />
            <span className="hidden sm:inline">Colors</span>
          </TabsTrigger>
          <TabsTrigger value="fonts" className="text-xs gap-1 px-1">
            <Type size={11} />
            <span className="hidden sm:inline">Fonts</span>
          </TabsTrigger>
          <TabsTrigger value="effects" className="text-xs gap-1 px-1">
            <Blend size={11} />
            <span className="hidden sm:inline">Effects</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs gap-1 px-1">
            <FileText size={11} />
            <span className="hidden sm:inline">Content</span>
          </TabsTrigger>
          <TabsTrigger value="options" className="text-xs gap-1 px-1">
            <Settings2 size={11} />
            <span className="hidden sm:inline">More</span>
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Themes Tab - FIRST */}
          <TabsContent value="themes" className="p-4 space-y-4 mt-0">
            {/* Mode Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="h-14 flex-col gap-1.5 bg-slate-900 hover:bg-slate-800 border-slate-700"
                onClick={() => onUpdateBranding({
                  accentColor: branding.accentColor || '#FFC107',
                  backgroundColor: '#0A0A0A',
                  textColor: '#E5E5E5',
                  headingColor: '#FFFFFF',
                  mutedTextColor: '#888888',
                  tableHeaderBgColor: '#1A1A1A',
                  tableHeaderTextColor: branding.accentColor || '#FFC107',
                  tableRowAltBgColor: '#111111',
                  tableBorderColor: '#333333',
                })}
              >
                <Moon size={18} className="text-white" />
                <span className="text-xs text-slate-300">Dark Mode</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 flex-col gap-1.5 bg-white hover:bg-gray-100 border-gray-300"
                onClick={() => onUpdateBranding({
                  accentColor: branding.accentColor || '#2563EB',
                  backgroundColor: '#FFFFFF',
                  textColor: '#1F2937',
                  headingColor: '#111827',
                  mutedTextColor: '#6B7280',
                  tableHeaderBgColor: '#F3F4F6',
                  tableHeaderTextColor: '#374151',
                  tableRowAltBgColor: '#F9FAFB',
                  tableBorderColor: '#E5E7EB',
                })}
              >
                <Sun size={18} className="text-gray-800" />
                <span className="text-xs text-gray-700">Light Mode</span>
              </Button>
            </div>

            {/* Theme Presets */}
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Theme Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {THEME_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  className="h-16 flex-col gap-1.5 p-2 hover:ring-2 hover:ring-primary/50"
                  onClick={() => {
                    onUpdateBranding(preset.colors);
                    toast.success(`Applied ${preset.name} theme`);
                  }}
                >
                  <div className="flex gap-1">
                    <div 
                      className="w-5 h-5 rounded-md border border-white/10 shadow-sm"
                      style={{ backgroundColor: preset.colors.backgroundColor }}
                    />
                    <div 
                      className="w-5 h-5 rounded-md shadow-sm"
                      style={{ backgroundColor: preset.colors.accentColor }}
                    />
                  </div>
                  <span className="text-[10px] flex items-center gap-1">
                    <span>{preset.emoji}</span>
                    {preset.name}
                  </span>
                </Button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-2 border-t border-border">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-2"
                  onClick={() => {
                    // Randomize theme
                    const randomTheme = THEME_PRESETS[Math.floor(Math.random() * THEME_PRESETS.length)];
                    onUpdateBranding(randomTheme.colors);
                    toast.success(`Applied ${randomTheme.name} theme`);
                  }}
                >
                  <Zap size={14} />
                  Surprise Me
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs gap-2"
                  onClick={() => {
                    // Invert colors
                    const isDark = (branding.backgroundColor || '#000000').toLowerCase().includes('0') || 
                                   (branding.backgroundColor || '#000000').toLowerCase() === '#000000';
                    if (isDark) {
                      onUpdateBranding({
                        backgroundColor: '#FFFFFF',
                        textColor: '#1F2937',
                        headingColor: '#111827',
                        mutedTextColor: '#6B7280',
                        tableHeaderBgColor: '#F3F4F6',
                        tableRowAltBgColor: '#F9FAFB',
                        tableBorderColor: '#E5E7EB',
                      });
                    } else {
                      onUpdateBranding({
                        backgroundColor: '#0A0A0A',
                        textColor: '#E5E5E5',
                        headingColor: '#FFFFFF',
                        mutedTextColor: '#888888',
                        tableHeaderBgColor: '#1A1A1A',
                        tableRowAltBgColor: '#111111',
                        tableBorderColor: '#333333',
                      });
                    }
                    toast.success('Colors inverted');
                  }}
                >
                  <RotateCcw size={14} />
                  Invert
                </Button>
              </div>
            </div>
          </TabsContent>
          {/* Colors Tab */}
          <TabsContent value="colors" className="p-4 space-y-4 mt-0">
            {/* Quick Tools */}
            <div className="flex gap-2">
              {isEyedropperSupported && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs gap-2"
                  onClick={handleEyedropper}
                >
                  <Pipette size={14} />
                  Pick from Screen
                </Button>
              )}
              {branding.logoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-9 text-xs gap-2"
                  onClick={handleExtractColors}
                  disabled={isExtractingColors}
                >
                  {isExtractingColors ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Wand2 size={14} />
                  )}
                  From Logo
                </Button>
              )}
            </div>

            {/* Extracted colors */}
            {extractedColors.length > 0 && (
              <div className="p-2 bg-muted/50 rounded-lg space-y-2">
                <Label className="text-[10px] text-muted-foreground">Extracted Colors</Label>
                <div className="flex gap-1">
                  {extractedColors.map((color, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onUpdateBranding({ 
                          accentColor: color,
                          chartPrimaryColor: color,
                          tableHeaderTextColor: color,
                        });
                        toast.success(`Applied ${color}`);
                      }}
                      className="w-8 h-8 rounded-lg border border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            <CollapsibleSection title="Primary Colors" icon={<PaintBucket size={14} className="text-muted-foreground" />}>
              <ColorPicker
                label="Accent Color"
                value={branding.accentColor}
                onChange={(v) => onUpdateBranding({ accentColor: v })}
              />
              <ColorPicker
                label="Background"
                value={branding.backgroundColor}
                onChange={(v) => onUpdateBranding({ backgroundColor: v })}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Text Colors" icon={<Type size={14} className="text-muted-foreground" />}>
              <div className="grid grid-cols-2 gap-3">
                <ColorPicker
                  label="Body Text"
                  value={branding.textColor || '#E5E5E5'}
                  onChange={(v) => onUpdateBranding({ textColor: v })}
                  showQuickPicks={false}
                />
                <ColorPicker
                  label="Headings"
                  value={branding.headingColor || '#FFFFFF'}
                  onChange={(v) => onUpdateBranding({ headingColor: v })}
                  showQuickPicks={false}
                />
              </div>
              <ColorPicker
                label="Muted Text"
                value={branding.mutedTextColor || '#888888'}
                onChange={(v) => onUpdateBranding({ mutedTextColor: v })}
                showQuickPicks={false}
              />
            </CollapsibleSection>

            <CollapsibleSection title="Chart Colors" icon={<BarChart3 size={14} className="text-muted-foreground" />}>
              <div className="grid grid-cols-2 gap-3">
                <ColorPicker
                  label="Primary"
                  value={branding.chartPrimaryColor || '#FFC107'}
                  onChange={(v) => onUpdateBranding({ chartPrimaryColor: v })}
                  showQuickPicks={false}
                />
                <ColorPicker
                  label="Secondary"
                  value={branding.chartSecondaryColor || '#4A90D9'}
                  onChange={(v) => onUpdateBranding({ chartSecondaryColor: v })}
                  showQuickPicks={false}
                />
                <ColorPicker
                  label="Positive"
                  value={branding.chartPositiveColor || '#22C55E'}
                  onChange={(v) => onUpdateBranding({ chartPositiveColor: v })}
                  showQuickPicks={false}
                />
                <ColorPicker
                  label="Negative"
                  value={branding.chartNegativeColor || '#EF4444'}
                  onChange={(v) => onUpdateBranding({ chartNegativeColor: v })}
                  showQuickPicks={false}
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Table Colors" icon={<Table2 size={14} className="text-muted-foreground" />}>
              <div className="grid grid-cols-2 gap-3">
                <ColorPicker
                  label="Header BG"
                  value={branding.tableHeaderBgColor || '#1A1A1A'}
                  onChange={(v) => onUpdateBranding({ tableHeaderBgColor: v })}
                  showQuickPicks={false}
                />
                <ColorPicker
                  label="Header Text"
                  value={branding.tableHeaderTextColor || '#FFC107'}
                  onChange={(v) => onUpdateBranding({ tableHeaderTextColor: v })}
                  showQuickPicks={false}
                />
                <ColorPicker
                  label="Alt Row BG"
                  value={branding.tableRowAltBgColor || '#111111'}
                  onChange={(v) => onUpdateBranding({ tableRowAltBgColor: v })}
                  showQuickPicks={false}
                />
                <ColorPicker
                  label="Border"
                  value={branding.tableBorderColor || '#333333'}
                  onChange={(v) => onUpdateBranding({ tableBorderColor: v })}
                  showQuickPicks={false}
                />
              </div>
            </CollapsibleSection>
          </TabsContent>

          {/* Fonts Tab - NEW */}
          <TabsContent value="fonts" className="p-4 space-y-4 mt-0">
            <CollapsibleSection title="Typography" icon={<Type size={14} className="text-muted-foreground" />}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Heading Font</Label>
                  <Select defaultValue="system-ui, -apple-system, sans-serif">
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_PRESETS.map((font) => (
                        <SelectItem key={font.name} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Body Font</Label>
                  <Select defaultValue="system-ui, -apple-system, sans-serif">
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_PRESETS.map((font) => (
                        <SelectItem key={font.name} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Font Sizes" icon={<Type size={14} className="text-muted-foreground" />}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Base Size</Label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">14px</span>
                  </div>
                  <Slider
                    defaultValue={[14]}
                    min={10}
                    max={20}
                    step={1}
                    className="py-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Heading Scale</Label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">1.25x</span>
                  </div>
                  <Slider
                    defaultValue={[1.25]}
                    min={1}
                    max={2}
                    step={0.05}
                    className="py-2"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Line Height</Label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">1.5</span>
                  </div>
                  <Slider
                    defaultValue={[1.5]}
                    min={1}
                    max={2.5}
                    step={0.1}
                    className="py-2"
                  />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Text Options" icon={<Type size={14} className="text-muted-foreground" />}>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Uppercase Headings</Label>
                    <p className="text-[10px] text-muted-foreground">Transform headings to uppercase</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Bold Numbers</Label>
                    <p className="text-[10px] text-muted-foreground">Emphasize numeric values</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Letter Spacing</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {['Tight', 'Normal', 'Wide', 'Wider'].map((spacing) => (
                      <Button
                        key={spacing}
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px]"
                      >
                        {spacing}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </TabsContent>

          {/* Effects Tab - NEW */}
          <TabsContent value="effects" className="p-4 space-y-4 mt-0">
            <CollapsibleSection title="Block Style Presets" icon={<Layers size={14} className="text-muted-foreground" />}>
              <div className="grid grid-cols-3 gap-2">
                {BLOCK_STYLE_PRESETS.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    className="h-14 flex-col gap-1.5"
                    onClick={() => toast.success(`${preset.name} style applied`)}
                  >
                    <div 
                      className={cn(
                        "w-8 h-6 bg-muted border border-border",
                        preset.borderRadius === 'none' ? 'rounded-none' : 
                        preset.borderRadius === 'md' ? 'rounded-md' : 
                        preset.borderRadius === 'lg' ? 'rounded-lg' : 
                        preset.borderRadius === 'xl' ? 'rounded-xl' : 
                        preset.borderRadius === '2xl' ? 'rounded-2xl' : 'rounded',
                        preset.shadow === 'none' ? '' : 
                        preset.shadow === 'md' ? 'shadow-md' : 
                        preset.shadow === 'lg' ? 'shadow-lg' : 
                        preset.shadow === 'xl' ? 'shadow-xl' : 'shadow',
                      )}
                    />
                    <span className="text-[10px]">{preset.name}</span>
                  </Button>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Gradients" icon={<Blend size={14} className="text-muted-foreground" />}>
              <Label className="text-[10px] text-muted-foreground mb-2 block">Header Gradient Presets</Label>
              <div className="grid grid-cols-4 gap-2">
                {GRADIENT_PRESETS.map((gradient) => (
                  <button
                    key={gradient.name}
                    onClick={() => toast.success(`${gradient.name} gradient applied`)}
                    className="group relative h-10 rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary/50"
                    style={{ background: gradient.value }}
                    title={gradient.name}
                  >
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-white font-medium">
                      {gradient.name}
                    </span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Shadows & Depth" icon={<Layers size={14} className="text-muted-foreground" />}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Global Shadow</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {['None', 'Subtle', 'Medium', 'Strong'].map((shadow) => (
                      <Button
                        key={shadow}
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px]"
                      >
                        {shadow}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Blur Amount</Label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">0px</span>
                  </div>
                  <Slider
                    defaultValue={[0]}
                    min={0}
                    max={20}
                    step={2}
                    className="py-2"
                  />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Borders" icon={<Paintbrush size={14} className="text-muted-foreground" />}>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Border Style</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {['None', 'Solid', 'Dashed', 'Dotted'].map((style) => (
                      <Button
                        key={style}
                        variant="outline"
                        size="sm"
                        className="h-8 text-[10px]"
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Corner Style</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {['Square', 'Rounded', 'Pill'].map((corner) => (
                      <Button
                        key={corner}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        {corner}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Special Effects" icon={<Sparkles size={14} className="text-muted-foreground" />}>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Glassmorphism</Label>
                    <p className="text-[10px] text-muted-foreground">Frosted glass effect</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Subtle Patterns</Label>
                    <p className="text-[10px] text-muted-foreground">Add texture to backgrounds</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Accent Borders</Label>
                    <p className="text-[10px] text-muted-foreground">Add accent color to block borders</p>
                  </div>
                  <Switch />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Opacity</Label>
                    <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">100%</span>
                  </div>
                  <Slider
                    defaultValue={[100]}
                    min={50}
                    max={100}
                    step={5}
                    className="py-2"
                  />
                </div>
              </div>
            </CollapsibleSection>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="p-4 space-y-4 mt-0">
            {/* Logo Upload */}
            <CollapsibleSection title="Logo" icon={<Image size={14} className="text-muted-foreground" />}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                onChange={(e) => handleLogoUpload(e, false)}
                className="hidden"
              />
              {branding.logoUrl ? (
                <div className="relative group rounded-lg overflow-hidden border border-border">
                  <img
                    src={branding.logoUrl}
                    alt="Logo"
                    className="w-full h-20 object-contain bg-muted/20 p-2"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 size={14} className="animate-spin" /> : 'Change'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onUpdateBranding({ logoUrl: undefined })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2 border-dashed hover:border-primary hover:bg-primary/5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Upload size={20} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload logo</span>
                    </>
                  )}
                </Button>
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Header & Footer" icon={<Type size={14} className="text-muted-foreground" />}>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Header Title</Label>
                <Input
                  placeholder="Portfolio Report"
                  value={branding.headerTitle || ''}
                  onChange={(e) => onUpdateBranding({ headerTitle: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Header Subtitle</Label>
                <Input
                  placeholder="Q4 2024"
                  value={branding.headerSubtitle || ''}
                  onChange={(e) => onUpdateBranding({ headerSubtitle: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Footer Text</Label>
                <Textarea
                  placeholder="Confidential - For Internal Use Only"
                  value={branding.footerText || ''}
                  onChange={(e) => onUpdateBranding({ footerText: e.target.value })}
                  rows={2}
                  className="resize-none text-xs"
                />
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Author Info" icon={<Settings2 size={14} className="text-muted-foreground" />}>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Analyst Name</Label>
                <Input
                  placeholder="John Smith, CFA"
                  value={branding.analystName || ''}
                  onChange={(e) => onUpdateBranding({ analystName: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Client Name</Label>
                <Input
                  placeholder="Client Name"
                  value={branding.clientName || ''}
                  onChange={(e) => onUpdateBranding({ clientName: e.target.value })}
                  className="h-9"
                />
              </div>
            </CollapsibleSection>
          </TabsContent>

          {/* Options Tab */}
          <TabsContent value="options" className="p-4 space-y-4 mt-0">
            <CollapsibleSection title="Page Options" icon={<Settings2 size={14} className="text-muted-foreground" />}>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Page Numbers</Label>
                    <p className="text-[10px] text-muted-foreground">Show page numbers in footer</p>
                  </div>
                  <Switch
                    checked={branding.showPageNumbers}
                    onCheckedChange={(v) => onUpdateBranding({ showPageNumbers: v })}
                  />
                </div>

                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Confidential Watermark</Label>
                    <p className="text-[10px] text-muted-foreground">Add watermark to pages</p>
                  </div>
                  <Switch
                    checked={branding.showConfidentialWatermark}
                    onCheckedChange={(v) => onUpdateBranding({ showConfidentialWatermark: v })}
                  />
                </div>

                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Date in Header</Label>
                    <p className="text-[10px] text-muted-foreground">Show current date</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Table of Contents</Label>
                    <p className="text-[10px] text-muted-foreground">Auto-generate TOC</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Export Options" icon={<Settings2 size={14} className="text-muted-foreground" />}>
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Export Quality</Label>
                  <div className="grid grid-cols-3 gap-1">
                    {['Draft', 'Standard', 'High'].map((quality) => (
                      <Button
                        key={quality}
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                      >
                        {quality}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Embed Fonts</Label>
                    <p className="text-[10px] text-muted-foreground">Include fonts in PDF</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Compress Images</Label>
                    <p className="text-[10px] text-muted-foreground">Reduce file size</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Data Settings" icon={<Table2 size={14} className="text-muted-foreground" />}>
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Number Format</Label>
                  <Select defaultValue="us">
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">1,234.56 (US)</SelectItem>
                      <SelectItem value="eu">1.234,56 (EU)</SelectItem>
                      <SelectItem value="ch">1'234.56 (CH)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date Format</Label>
                  <Select defaultValue="mdy">
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mdy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dmy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="ymd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Currency Display</Label>
                  <Select defaultValue="symbol">
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="symbol">$1,234</SelectItem>
                      <SelectItem value="code">USD 1,234</SelectItem>
                      <SelectItem value="none">1,234</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Accessibility" icon={<Settings2 size={14} className="text-muted-foreground" />}>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">High Contrast Mode</Label>
                    <p className="text-[10px] text-muted-foreground">Improve readability</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between py-2 px-1 rounded-lg hover:bg-muted/50">
                  <div>
                    <Label className="text-xs">Screen Reader Tags</Label>
                    <p className="text-[10px] text-muted-foreground">Add alt text to charts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CollapsibleSection>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
