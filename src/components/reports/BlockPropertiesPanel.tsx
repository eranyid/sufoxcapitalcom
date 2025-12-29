import { useState, useRef, useCallback } from 'react';
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
import { X, Upload, Loader2, Wand2, Palette, Pipette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Scale down for performance
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Group similar colors
      const colorCounts: Record<string, { count: number; r: number; g: number; b: number }> = {};
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i] / 32) * 32;
        const g = Math.round(pixels[i + 1] / 32) * 32;
        const b = Math.round(pixels[i + 2] / 32) * 32;
        const a = pixels[i + 3];
        
        // Skip transparent pixels and near-white/near-black
        if (a < 128) continue;
        const brightness = getColorBrightness(r, g, b);
        if (brightness > 240 || brightness < 15) continue;
        
        const key = `${r},${g},${b}`;
        if (!colorCounts[key]) {
          colorCounts[key] = { count: 0, r, g, b };
        }
        colorCounts[key].count++;
      }

      // Sort by frequency and get top colors
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
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [isEyedropperSupported] = useState(() => typeof window !== 'undefined' && 'EyeDropper' in window);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEyedropper = useCallback(async () => {
    if (!window.EyeDropper) {
      toast.error('Eyedropper is not supported in this browser');
      return;
    }

    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const color = result.sRGBHex;
      
      setPickedColor(color);
      onUpdateBranding({ 
        accentColor: color,
        chartPrimaryColor: color,
        tableHeaderTextColor: color,
      });
      
      toast.success(`Picked color: ${color}`);
    } catch (error) {
      // User cancelled or error occurred
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
        // Auto-apply the primary color as accent
        onUpdateBranding({ 
          accentColor: colors[0],
          chartPrimaryColor: colors[0],
          tableHeaderTextColor: colors[0],
        });
        
        if (colors.length > 1) {
          onUpdateBranding({ chartSecondaryColor: colors[1] });
        }
        
        toast.success(`Extracted ${colors.length} colors from logo`);
      }
    } catch (error) {
      console.error('Color extraction error:', error);
      toast.error('Could not extract colors from logo');
    } finally {
      setIsExtractingColors(false);
    }
  }, [branding.logoUrl, onUpdateBranding]);

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

        {/* Extract Colors from Logo Section */}
        {branding.logoUrl && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider">Extract from Logo</Label>
            </div>
            <div className="flex items-center gap-2">
              <img 
                src={branding.logoUrl} 
                alt="Logo" 
                className="w-10 h-10 object-contain rounded border border-border bg-muted/30"
              />
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs gap-1"
                onClick={handleExtractColors}
                disabled={isExtractingColors}
              >
                {isExtractingColors ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Wand2 size={12} />
                )}
                {isExtractingColors ? 'Extracting...' : 'Extract Colors'}
              </Button>
            </div>
            
            {/* Extracted colors palette */}
            {extractedColors.length > 0 && (
              <div className="mt-3">
                <Label className="text-[10px] text-muted-foreground mb-2 block">Click to apply:</Label>
                <div className="flex flex-wrap gap-1">
                  {extractedColors.map((color, i) => (
                    <button
                      key={i}
                      className="w-7 h-7 rounded-md border border-border hover:scale-110 transition-transform cursor-pointer ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-1"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        onUpdateBranding({ 
                          accentColor: color,
                          chartPrimaryColor: color,
                          tableHeaderTextColor: color,
                        });
                        toast.success(`Applied ${color} as accent`);
                      }}
                      title={`Apply ${color}`}
                    />
                  ))}
                </div>
                <div className="flex gap-1 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] flex-1"
                    onClick={() => {
                      if (extractedColors.length >= 2) {
                        onUpdateBranding({
                          accentColor: extractedColors[0],
                          chartPrimaryColor: extractedColors[0],
                          chartSecondaryColor: extractedColors[1],
                          tableHeaderTextColor: extractedColors[0],
                        });
                        toast.success('Applied extracted colors');
                      }
                    }}
                  >
                    <Palette size={10} className="mr-1" />
                    Apply All
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* Eyedropper Tool */}
            {isEyedropperSupported && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pick Color</h4>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-9 text-xs gap-2"
                    onClick={handleEyedropper}
                  >
                    <Pipette size={14} />
                    Pick from Screen
                  </Button>
                  {pickedColor && (
                    <div 
                      className="w-9 h-9 rounded-md border border-border flex-shrink-0"
                      style={{ backgroundColor: pickedColor }}
                      title={pickedColor}
                    />
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Click anywhere on the report to pick a color
                </p>
              </div>
            )}

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

            {/* Day/Night Mode Toggle */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mode</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs flex flex-col items-center gap-1 bg-slate-900 hover:bg-slate-800 border-slate-700"
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
                  <span className="text-white">🌙</span>
                  <span className="text-slate-300">Night</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs flex flex-col items-center gap-1 bg-white hover:bg-gray-100 border-gray-300"
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
                  <span className="text-gray-800">☀️</span>
                  <span className="text-gray-700">Day</span>
                </Button>
              </div>
            </div>

            {/* Color Presets */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Theme Presets</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 text-[10px] flex flex-col gap-0.5 p-1"
                  onClick={() => onUpdateBranding({
                    accentColor: '#FFC107',
                    backgroundColor: '#0A0A0A',
                    textColor: '#E5E5E5',
                    headingColor: '#FFFFFF',
                    mutedTextColor: '#888888',
                    chartPrimaryColor: '#FFC107',
                    chartSecondaryColor: '#4A90D9',
                    chartPositiveColor: '#22C55E',
                    chartNegativeColor: '#EF4444',
                    tableHeaderBgColor: '#1A1A1A',
                    tableHeaderTextColor: '#FFC107',
                    tableRowAltBgColor: '#111111',
                    tableBorderColor: '#333333',
                  })}
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-[#0A0A0A] border border-gray-600" />
                    <div className="w-3 h-3 rounded-sm bg-[#FFC107]" />
                  </div>
                  <span>Gold Dark</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 text-[10px] flex flex-col gap-0.5 p-1"
                  onClick={() => onUpdateBranding({
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
                  })}
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-[#0F172A] border border-gray-600" />
                    <div className="w-3 h-3 rounded-sm bg-[#3B82F6]" />
                  </div>
                  <span>Ocean Dark</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 text-[10px] flex flex-col gap-0.5 p-1"
                  onClick={() => onUpdateBranding({
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
                  })}
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-[#022C22] border border-gray-600" />
                    <div className="w-3 h-3 rounded-sm bg-[#10B981]" />
                  </div>
                  <span>Forest Dark</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 text-[10px] flex flex-col gap-0.5 p-1"
                  onClick={() => onUpdateBranding({
                    accentColor: '#6366F1',
                    backgroundColor: '#18181B',
                    textColor: '#D4D4D8',
                    headingColor: '#FAFAFA',
                    mutedTextColor: '#71717A',
                    chartPrimaryColor: '#6366F1',
                    chartSecondaryColor: '#EC4899',
                    chartPositiveColor: '#22C55E',
                    chartNegativeColor: '#EF4444',
                    tableHeaderBgColor: '#27272A',
                    tableHeaderTextColor: '#A5B4FC',
                    tableRowAltBgColor: '#18181B',
                    tableBorderColor: '#3F3F46',
                  })}
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-[#18181B] border border-gray-600" />
                    <div className="w-3 h-3 rounded-sm bg-[#6366F1]" />
                  </div>
                  <span>Purple Dark</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 text-[10px] flex flex-col gap-0.5 p-1"
                  onClick={() => onUpdateBranding({
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
                  })}
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-[#FFFFFF] border border-gray-300" />
                    <div className="w-3 h-3 rounded-sm bg-[#2563EB]" />
                  </div>
                  <span>Blue Light</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-12 text-[10px] flex flex-col gap-0.5 p-1"
                  onClick={() => onUpdateBranding({
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
                  })}
                >
                  <div className="flex gap-0.5">
                    <div className="w-3 h-3 rounded-sm bg-[#FFFFFF] border border-gray-300" />
                    <div className="w-3 h-3 rounded-sm bg-[#059669]" />
                  </div>
                  <span>Green Light</span>
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