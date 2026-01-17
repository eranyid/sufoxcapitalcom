/**
 * ReportDocument - Single Source of Truth for Report Rendering
 * 
 * This component is used for BOTH:
 * 1. On-screen preview in the Report Builder
 * 2. PDF export via html2canvas capture
 * 
 * This ensures WYSIWYG - what you see in preview IS what you get in the PDF.
 */

import { forwardRef } from 'react';
import { ReportBlock, ReportBranding, PAGE_DIMENSIONS, GRID_COLUMNS, GRID_ROW_HEIGHT } from '@/types/reportBuilder';
import { ReportBlockRenderer } from './ReportBlockRenderer';
import type { PortfolioHolding } from '@/lib/portfolioEngine';
import type { PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { cn } from '@/lib/utils';

interface ReportDocumentProps {
  blocks: ReportBlock[];
  branding: ReportBranding;
  pageSize: 'A4' | 'Letter';
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
  /** When true, renders at full scale for PDF capture (no scaling) */
  forExport?: boolean;
  /** Scale factor for preview mode */
  scale?: number;
  /** Classname for container */
  className?: string;
}

/**
 * ReportDocument renders the complete report layout.
 * The same component is used for preview and export to guarantee visual parity.
 */
export const ReportDocument = forwardRef<HTMLDivElement, ReportDocumentProps>(({
  blocks,
  branding,
  pageSize,
  holdings,
  performanceMetrics,
  riskMetrics,
  totalValue,
  forExport = false,
  scale = 0.7,
  className,
}, ref) => {
  const pageDimensions = PAGE_DIMENSIONS[pageSize];
  
  // For export, use full scale. For preview, use the provided scale.
  const effectiveScale = forExport ? 1 : scale;
  
  // Page dimensions in pixels (1mm ≈ 3.78px at 96 DPI)
  const mmToPx = 3.78;
  const pageWidthPx = pageDimensions.width * mmToPx;
  const pageHeightPx = pageDimensions.height * mmToPx;
  
  // Group blocks by page
  const blocksByPage: Record<number, ReportBlock[]> = {};
  blocks.filter(b => b.enabled).forEach(block => {
    const page = block.page || 1;
    if (!blocksByPage[page]) blocksByPage[page] = [];
    blocksByPage[page].push(block);
  });
  
  const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b);
  const totalPages = pageNumbers.length || 1;
  
  // Ensure at least one page
  if (pageNumbers.length === 0) {
    pageNumbers.push(1);
    blocksByPage[1] = [];
  }

  return (
    <div 
      ref={ref} 
      className={cn(
        "report-document",
        forExport && "report-document--export",
        className
      )}
      style={{
        // For export, we render at full size. For preview, we scale down.
        width: forExport ? 'auto' : pageWidthPx * effectiveScale,
      }}
      data-report-document="true"
    >
      {pageNumbers.map((pageNum) => {
        const pageBlocks = blocksByPage[pageNum] || [];
        
        return (
          <div
            key={pageNum}
            className={cn(
              "report-page bg-card overflow-hidden",
              !forExport && "rounded-lg shadow-xl mb-8 mx-auto"
            )}
            style={{
              width: forExport ? pageWidthPx : pageWidthPx * effectiveScale,
              minHeight: forExport ? pageHeightPx : pageHeightPx * effectiveScale,
              // Important: for export, don't use transform scale
              ...(forExport ? {} : {
                transform: `scale(${effectiveScale})`,
                transformOrigin: 'top left',
              }),
            }}
            data-page-number={pageNum}
          >
            {/* Page header accent bar */}
            <div 
              className="h-1"
              style={{ backgroundColor: branding.accentColor }}
            />
            
            {/* Page content grid */}
            <div 
              className="p-6"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
                gap: forExport ? 12 : 8,
                minHeight: forExport 
                  ? pageHeightPx - 50 
                  : (pageHeightPx * effectiveScale) - 50,
              }}
            >
              {pageBlocks.map((block) => (
                <div
                  key={block.id}
                  className="report-block rounded-lg border border-border/50 overflow-hidden"
                  style={{
                    gridColumn: `span ${block.colSpan} / span ${block.colSpan}`,
                    minHeight: block.height * GRID_ROW_HEIGHT * (forExport ? 1 : effectiveScale),
                  }}
                  data-block-id={block.id}
                  data-block-type={block.type}
                >
                  <div className="p-3 h-full">
                    <ReportBlockRenderer
                      block={block}
                      holdings={holdings}
                      performanceMetrics={performanceMetrics}
                      riskMetrics={riskMetrics}
                      totalValue={totalValue}
                      branding={branding}
                    />
                  </div>
                </div>
              ))}
              
              {/* Empty page placeholder */}
              {pageBlocks.length === 0 && (
                <div 
                  className="col-span-full flex items-center justify-center border-2 border-dashed border-border rounded-lg"
                  style={{ 
                    minHeight: forExport ? 200 : 100,
                  }}
                >
                  <span className="text-sm text-muted-foreground">
                    Empty page - add blocks to populate
                  </span>
                </div>
              )}
            </div>
            
            {/* Page footer */}
            {branding.showPageNumbers && (
              <div 
                className="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted-foreground"
                style={{
                  fontSize: forExport ? 11 : 10,
                }}
              >
                <span>{branding.footerText || ''}</span>
                <span>Page {pageNum} of {totalPages}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

ReportDocument.displayName = 'ReportDocument';
