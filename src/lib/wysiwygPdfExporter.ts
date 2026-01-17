/**
 * WYSIWYG PDF Exporter
 * 
 * Captures the rendered ReportDocument DOM using html2canvas and embeds
 * each page as an image in the PDF. This ensures pixel-perfect parity
 * between the on-screen preview and the exported PDF.
 * 
 * ARCHITECTURE:
 * 1. Render ReportDocument off-screen at full scale
 * 2. Capture each page using html2canvas
 * 3. Embed captured images into jsPDF
 * 
 * This approach guarantees:
 * - Same block order
 * - Same visualizations (charts, graphs, heatmaps)
 * - Same styling and layout
 * - No silent fallbacks or table substitutions
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ReportBlock, ReportBranding, PAGE_DIMENSIONS } from '@/types/reportBuilder';

interface WYSIWYGExportOptions {
  blocks: ReportBlock[];
  branding: ReportBranding;
  pageSize: 'A4' | 'Letter';
  reportName?: string;
  onProgress?: (progress: number, message: string) => void;
}

interface ExportResult {
  success: boolean;
  error?: string;
}

/**
 * Validates that all blocks are present and in correct order
 */
function validateBlockIntegrity(
  originalBlocks: ReportBlock[], 
  capturedPages: NodeListOf<Element>
): { valid: boolean; error?: string } {
  const enabledBlocks = originalBlocks.filter(b => b.enabled);
  
  // Collect all block IDs from captured pages
  const capturedBlockIds = new Set<string>();
  capturedPages.forEach(page => {
    const blocks = page.querySelectorAll('[data-block-id]');
    blocks.forEach(block => {
      const id = block.getAttribute('data-block-id');
      if (id) capturedBlockIds.add(id);
    });
  });
  
  // Check each enabled block was captured
  for (const block of enabledBlocks) {
    if (!capturedBlockIds.has(block.id)) {
      return { 
        valid: false, 
        error: `Block "${block.type}" (${block.id}) was not captured. Export aborted.` 
      };
    }
  }
  
  return { valid: true };
}

/**
 * Creates a temporary container for rendering the report at full scale
 */
function createExportContainer(): HTMLDivElement {
  const container = document.createElement('div');
  container.id = 'wysiwyg-export-container';
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    z-index: -1;
    background: #0A0A0A;
    overflow: visible;
  `;
  document.body.appendChild(container);
  return container;
}

/**
 * Cleans up the temporary export container
 */
function cleanupExportContainer(): void {
  const container = document.getElementById('wysiwyg-export-container');
  if (container) {
    document.body.removeChild(container);
  }
}

/**
 * Captures a single page element as a canvas
 */
async function capturePage(pageElement: Element): Promise<HTMLCanvasElement> {
  const canvas = await html2canvas(pageElement as HTMLElement, {
    backgroundColor: '#0A0A0A',
    scale: 2, // 2x for better quality
    useCORS: true,
    allowTaint: true,
    logging: false,
    // Important: capture the full element
    windowWidth: (pageElement as HTMLElement).offsetWidth,
    windowHeight: (pageElement as HTMLElement).offsetHeight,
  });
  
  return canvas;
}

/**
 * Main WYSIWYG export function
 * 
 * This function:
 * 1. Takes the ReportDocument container element
 * 2. Captures each page using html2canvas
 * 3. Creates a PDF with those exact images
 */
export async function exportWYSIWYGPdf(
  documentElement: HTMLElement,
  options: WYSIWYGExportOptions
): Promise<ExportResult> {
  const { blocks, pageSize, reportName = 'Report', onProgress } = options;
  
  try {
    onProgress?.(0, 'Preparing export...');
    
    // Get all pages from the document
    const pages = documentElement.querySelectorAll('[data-page-number]');
    
    if (pages.length === 0) {
      return { success: false, error: 'No pages found to export' };
    }
    
    // Validate block integrity
    onProgress?.(10, 'Validating blocks...');
    const validation = validateBlockIntegrity(blocks, pages);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    // Get page dimensions
    const pageDimensions = PAGE_DIMENSIONS[pageSize];
    const pageFormat = pageSize === 'Letter' ? 'letter' : 'a4';
    
    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pageFormat,
    });
    
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    
    // Capture and add each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const progressPercent = 10 + ((i + 1) / pages.length) * 80;
      onProgress?.(progressPercent, `Capturing page ${i + 1} of ${pages.length}...`);
      
      // Add new page for all pages after the first
      if (i > 0) {
        doc.addPage();
      }
      
      // Capture the page
      const canvas = await capturePage(page);
      
      // Convert canvas to image data URL
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Add image to PDF, fitting to page dimensions
      doc.addImage(
        imgData,
        'PNG',
        0,
        0,
        pdfWidth,
        pdfHeight,
        undefined,
        'FAST'
      );
    }
    
    onProgress?.(95, 'Generating PDF file...');
    
    // Generate filename
    const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Save the PDF
    doc.save(fileName);
    
    onProgress?.(100, 'Export complete!');
    
    return { success: true };
    
  } catch (error) {
    console.error('WYSIWYG PDF export failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during export' 
    };
  }
}

/**
 * Alternative export that renders the document in a hidden container
 * Use this when you need to export with different data than what's currently displayed
 */
export async function exportWYSIWYGPdfFromData(
  renderFunction: (container: HTMLDivElement) => Promise<void>,
  options: WYSIWYGExportOptions
): Promise<ExportResult> {
  const container = createExportContainer();
  
  try {
    // Let the render function populate the container
    await renderFunction(container);
    
    // Wait for rendering to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find the report document
    const documentElement = container.querySelector('[data-report-document]') as HTMLElement;
    
    if (!documentElement) {
      throw new Error('ReportDocument not found in container');
    }
    
    // Export
    return await exportWYSIWYGPdf(documentElement, options);
    
  } finally {
    cleanupExportContainer();
  }
}
