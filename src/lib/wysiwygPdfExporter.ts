/**
 * PDF Export Utilities
 * 
 * Provides two export modes:
 * 1. Vector PDF (default): Uses browser print pipeline for true vector text/graphics
 * 2. Screenshot PDF (fallback): Uses html2canvas for pixel-perfect visual capture
 * 
 * Vector mode produces:
 * - Selectable/searchable text
 * - Sharp vector graphics
 * - Small file sizes
 * - True print-grade quality
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useReactToPrint } from 'react-to-print';

// ============================================
// TYPES
// ============================================

export type ExportMode = 'vector' | 'screenshot';
export type ExportQuality = 'standard' | 'high' | 'print';

interface QualitySettings {
  scale: number;
  dpi: number;
  label: string;
  description: string;
  imageQuality: number;
  imageFormat: 'PNG' | 'JPEG';
}

export const QUALITY_PRESETS: Record<ExportQuality, QualitySettings> = {
  standard: {
    scale: 2,
    dpi: 150,
    label: 'Standard',
    description: 'Screen quality, faster export',
    imageQuality: 0.92,
    imageFormat: 'PNG',
  },
  high: {
    scale: 3,
    dpi: 300,
    label: 'High Quality',
    description: 'Print-ready, 300 DPI',
    imageQuality: 1.0,
    imageFormat: 'PNG',
  },
  print: {
    scale: 4,
    dpi: 400,
    label: 'Print Grade',
    description: 'Maximum quality, 400+ DPI',
    imageQuality: 1.0,
    imageFormat: 'PNG',
  },
};

export const EXPORT_MODES = {
  vector: {
    label: 'Investor PDF (Vector)',
    description: 'Selectable text, small file size, sharp graphics',
    icon: 'FileText',
  },
  screenshot: {
    label: 'Screenshot PDF',
    description: 'Pixel-perfect capture, larger file size',
    icon: 'Image',
  },
};

interface ExportOptions {
  blocks: Array<{ id: string; type: string; enabled: boolean }>;
  branding: { accentColor?: string };
  pageSize: 'A4' | 'Letter';
  reportName?: string;
  quality?: ExportQuality;
  mode?: ExportMode;
  onProgress?: (progress: number, message: string) => void;
}

interface ExportResult {
  success: boolean;
  error?: string;
  mode?: ExportMode;
  quality?: ExportQuality;
  actualDpi?: number;
  warnings?: string[];
  fileSize?: string;
}

// ============================================
// VECTOR PDF EXPORT (Browser Print Pipeline)
// ============================================

/**
 * Triggers browser print dialog for vector PDF export
 * This produces true vector text and graphics
 */
export function triggerVectorPrint(
  printRef: React.RefObject<HTMLDivElement | null>,
  reportName: string,
  onComplete?: (success: boolean) => void
) {
  if (!printRef.current) {
    console.error('Print reference not available');
    onComplete?.(false);
    return;
  }

  // The actual printing is handled by react-to-print hook
  // This function is just a placeholder for the trigger
  console.log('[Vector Export] Initiating print for:', reportName);
}

/**
 * Creates print-specific styles for the document
 */
export function getPrintStyles(pageSize: 'A4' | 'Letter'): string {
  return `
    @media print {
      @page {
        size: ${pageSize === 'A4' ? 'A4' : 'letter'} portrait;
        margin: 15mm 12mm;
      }
      
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        background: white !important;
      }
      
      .report-print-container {
        background: white !important;
        color: #1a1a1a !important;
      }
      
      .print-page {
        page-break-after: always;
        page-break-inside: avoid;
        break-after: page;
        break-inside: avoid;
      }
      
      .print-page:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      
      .print-block {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* Hide non-print elements */
      .no-print,
      [data-radix-portal],
      .sonner-toast {
        display: none !important;
      }
      
      /* Ensure SVG charts print correctly */
      svg {
        max-width: 100%;
        height: auto;
        shape-rendering: geometricPrecision;
      }
      
      /* Force backgrounds to print */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      /* Ensure text is selectable and sharp */
      p, span, h1, h2, h3, h4, h5, h6, div {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        text-rendering: optimizeLegibility;
      }
    }
  `;
}

// ============================================
// SCREENSHOT PDF EXPORT (html2canvas fallback)
// ============================================

const PAGE_DIMS = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
};

function detectExportCapabilities(): { 
  canCaptureDom: boolean; 
  maxScale: number;
} {
  const canCaptureDom = typeof html2canvas === 'function';
  const deviceMemory = (navigator as any).deviceMemory || 4;
  const maxScale = deviceMemory >= 8 ? 4 : deviceMemory >= 4 ? 3 : 2;
  return { canCaptureDom, maxScale };
}

function validateBlockIntegrity(
  originalBlocks: Array<{ id: string; enabled: boolean }>, 
  capturedPages: NodeListOf<Element>
): { valid: boolean; error?: string } {
  const enabledBlocks = originalBlocks.filter(b => b.enabled);
  const capturedBlockIds = new Set<string>();
  
  capturedPages.forEach(page => {
    const blocks = page.querySelectorAll('[data-block-id]');
    blocks.forEach(block => {
      const id = block.getAttribute('data-block-id');
      if (id) capturedBlockIds.add(id);
    });
  });
  
  const missingBlocks = enabledBlocks.filter(b => !capturedBlockIds.has(b.id));
  
  if (missingBlocks.length > 0) {
    return { 
      valid: false, 
      error: `Missing ${missingBlocks.length} block(s) in export`,
    };
  }
  
  return { valid: true };
}

async function capturePageHighRes(
  pageElement: Element,
  scale: number,
  onWarning?: (msg: string) => void
): Promise<HTMLCanvasElement | null> {
  try {
    const canvas = await html2canvas(pageElement as HTMLElement, {
      backgroundColor: '#0A0A0A',
      scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 30000,
      removeContainer: true,
      windowWidth: (pageElement as HTMLElement).scrollWidth,
      windowHeight: (pageElement as HTMLElement).scrollHeight,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }
          svg { shape-rendering: geometricPrecision; }
        `;
        clonedDoc.head.appendChild(style);
      },
    });
    return canvas;
  } catch (err) {
    onWarning?.(`Page capture failed: ${err instanceof Error ? err.message : 'Unknown'}`);
    return null;
  }
}

/**
 * Screenshot-based PDF export (fallback mode)
 */
export async function exportScreenshotPdf(
  documentElement: HTMLElement,
  options: ExportOptions
): Promise<ExportResult> {
  const { 
    blocks, 
    pageSize, 
    reportName = 'Report', 
    quality = 'high',
    onProgress 
  } = options;
  
  const warnings: string[] = [];
  const qualitySettings = QUALITY_PRESETS[quality];
  
  try {
    onProgress?.(0, `Initializing ${qualitySettings.label} export...`);
    
    const capabilities = detectExportCapabilities();
    const pages = documentElement.querySelectorAll('[data-page-number]');
    
    if (pages.length === 0) {
      return { success: false, error: 'No pages found to export', mode: 'screenshot' };
    }
    
    onProgress?.(5, 'Validating blocks...');
    const validation = validateBlockIntegrity(blocks, pages);
    if (!validation.valid) {
      return { success: false, error: validation.error, mode: 'screenshot' };
    }
    
    const pageDimensions = PAGE_DIMS[pageSize];
    const pageFormat = pageSize === 'Letter' ? 'letter' : 'a4';
    const effectiveScale = Math.min(qualitySettings.scale, capabilities.maxScale);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pageFormat,
      compress: true,
    });
    
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    
    let successfulCaptures = 0;
    let actualDpi = 0;
    
    onProgress?.(10, `Rendering at ${effectiveScale}x scale...`);
    
    for (let i = 0; i < pages.length; i++) {
      const progressPercent = 10 + ((i + 1) / pages.length) * 80;
      onProgress?.(progressPercent, `Capturing page ${i + 1}/${pages.length}...`);
      
      if (i > 0) doc.addPage();
      
      const canvas = await capturePageHighRes(
        pages[i], 
        effectiveScale,
        (msg) => warnings.push(msg)
      );
      
      if (canvas) {
        if (i === 0) {
          actualDpi = Math.round(canvas.width / (pageDimensions.width / 25.4));
        }
        
        const imgData = canvas.toDataURL(
          `image/${qualitySettings.imageFormat.toLowerCase()}`,
          qualitySettings.imageQuality
        );
        
        doc.addImage(imgData, qualitySettings.imageFormat, 0, 0, pdfWidth, pdfHeight, undefined, 'NONE');
        successfulCaptures++;
      } else {
        doc.setFillColor(10, 10, 10);
        doc.rect(0, 0, pdfWidth, pdfHeight, 'F');
        doc.setTextColor(200, 50, 50);
        doc.setFontSize(14);
        doc.text(`Page ${i + 1} - Capture Failed`, pdfWidth / 2, pdfHeight / 2, { align: 'center' });
      }
    }
    
    if (successfulCaptures === 0) {
      return { success: false, error: 'All page captures failed', mode: 'screenshot' };
    }
    
    onProgress?.(95, 'Generating file...');
    
    const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    onProgress?.(100, `Export complete! (${actualDpi} DPI)`);
    
    return { 
      success: true,
      mode: 'screenshot',
      quality,
      actualDpi,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      mode: 'screenshot',
    };
  }
}

// Legacy export for backward compatibility
export async function exportWYSIWYGPdf(
  documentElement: HTMLElement,
  options: ExportOptions
): Promise<ExportResult> {
  return exportScreenshotPdf(documentElement, options);
}

/**
 * Get quality preset information for UI display
 */
export function getQualityPresets(): Array<{
  value: ExportQuality;
  label: string;
  description: string;
  dpi: number;
}> {
  return Object.entries(QUALITY_PRESETS).map(([value, settings]) => ({
    value: value as ExportQuality,
    label: settings.label,
    description: settings.description,
    dpi: settings.dpi,
  }));
}

/**
 * Get export mode options for UI display
 */
export function getExportModes(): Array<{
  value: ExportMode;
  label: string;
  description: string;
}> {
  return Object.entries(EXPORT_MODES).map(([value, config]) => ({
    value: value as ExportMode,
    label: config.label,
    description: config.description,
  }));
}
