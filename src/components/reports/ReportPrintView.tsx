/**
 * ReportPrintView - Print-Optimized Report Rendering
 * 
 * This component renders the report in a print-optimized format for
 * browser-native PDF export via window.print() / react-to-print.
 * 
 * Features:
 * - Vector text (selectable, searchable)
 * - SVG charts (sharp at any zoom)
 * - Proper page breaks
 * - No editor chrome / drag handles
 * - Print-safe colors and backgrounds
 */

import { forwardRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  ReportBlock, 
  ReportBranding, 
  PAGE_DIMENSIONS,
} from '@/types/reportBuilder';
import { ReportBlockRenderer } from './ReportBlockRenderer';
import type { PortfolioHolding } from '@/lib/portfolioEngine';
import type { PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { format } from 'date-fns';

interface ReportPrintViewProps {
  blocks: ReportBlock[];
  branding: ReportBranding;
  pageSize: 'A4' | 'Letter';
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
}

// Page dimensions in mm for CSS
const PAGE_CSS_SIZES = {
  A4: { width: '210mm', height: '297mm' },
  Letter: { width: '8.5in', height: '11in' },
};

const ReportPrintView = forwardRef<HTMLDivElement, ReportPrintViewProps>(
  function ReportPrintView(
    {
      blocks,
      branding,
      pageSize,
      holdings,
      performanceMetrics,
      riskMetrics,
      totalValue,
    },
    ref
  ) {
    const enabledBlocks = useMemo(() => 
      blocks.filter(b => b.enabled).sort((a, b) => a.row - b.row),
      [blocks]
    );

    // Group blocks by page
    const blocksByPage = useMemo(() => {
      const pages: Record<number, ReportBlock[]> = {};
      enabledBlocks.forEach(block => {
        const page = block.page || 1;
        if (!pages[page]) pages[page] = [];
        pages[page].push(block);
      });
      return pages;
    }, [enabledBlocks]);

    const pageNumbers = Object.keys(blocksByPage).map(Number).sort((a, b) => a - b);
    const totalPages = pageNumbers.length || 1;
    const pageDims = PAGE_CSS_SIZES[pageSize];

    return (
      <div 
        ref={ref} 
        className="report-print-container"
        data-print-document="true"
      >
        {/* Print-specific styles injected inline for reliability */}
        <style>{`
          @media print {
            @page {
              size: ${pageSize === 'A4' ? 'A4' : 'letter'} portrait;
              margin: 15mm 12mm;
            }
            
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
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
            .no-print {
              display: none !important;
            }
            
            /* Ensure SVG charts print correctly */
            svg {
              max-width: 100%;
              height: auto;
            }
            
            /* Force backgrounds to print */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
          
          /* Screen preview styles */
          @media screen {
            .report-print-container {
              background: #f5f5f5;
              padding: 20px;
            }
            
            .print-page {
              background: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              margin: 0 auto 20px;
            }
          }
        `}</style>

        {pageNumbers.length === 0 ? (
          // Single page with all blocks if no page assignments
          <div 
            className="print-page"
            style={{
              width: pageDims.width,
              minHeight: pageDims.height,
              padding: '15mm 12mm',
              boxSizing: 'border-box',
              backgroundColor: 'white',
              color: '#1a1a1a',
            }}
          >
            <PrintHeader branding={branding} />
            
            <div className="space-y-4">
              {enabledBlocks.map((block) => (
                <PrintBlock
                  key={block.id}
                  block={block}
                  holdings={holdings}
                  performanceMetrics={performanceMetrics}
                  riskMetrics={riskMetrics}
                  totalValue={totalValue}
                  branding={branding}
                />
              ))}
            </div>

            <PrintFooter 
              branding={branding} 
              pageNumber={1} 
              totalPages={1} 
            />
          </div>
        ) : (
          pageNumbers.map((pageNum, idx) => (
            <div 
              key={pageNum}
              className="print-page"
              style={{
                width: pageDims.width,
                minHeight: pageDims.height,
                padding: '15mm 12mm',
                boxSizing: 'border-box',
                backgroundColor: 'white',
                color: '#1a1a1a',
              }}
            >
              {/* Header on first page */}
              {idx === 0 && <PrintHeader branding={branding} />}

              <div className="space-y-4">
                {blocksByPage[pageNum]?.map((block) => (
                  <PrintBlock
                    key={block.id}
                    block={block}
                    holdings={holdings}
                    performanceMetrics={performanceMetrics}
                    riskMetrics={riskMetrics}
                    totalValue={totalValue}
                    branding={branding}
                  />
                ))}
              </div>

              <PrintFooter 
                branding={branding} 
                pageNumber={idx + 1} 
                totalPages={totalPages} 
              />
            </div>
          ))
        )}
      </div>
    );
  }
);

// Print-optimized header
function PrintHeader({ branding }: { branding: ReportBranding }) {
  return (
    <header 
      className="mb-6 pb-4"
      style={{ borderBottom: `2px solid ${branding.accentColor || '#ff8c00'}` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 
            className="text-2xl font-bold"
            style={{ color: '#1a1a1a' }}
          >
            {branding.headerTitle || 'Investment Report'}
          </h1>
          {branding.headerSubtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {branding.headerSubtitle}
            </p>
          )}
        </div>
        
        <div className="text-right text-sm text-gray-500">
          <div>{format(new Date(), 'MMMM d, yyyy')}</div>
          {branding.analystName && (
            <div className="mt-1">Prepared by: {branding.analystName}</div>
          )}
        </div>
      </div>
    </header>
  );
}

// Print-optimized footer
function PrintFooter({ 
  branding, 
  pageNumber, 
  totalPages 
}: { 
  branding: ReportBranding; 
  pageNumber: number; 
  totalPages: number;
}) {
  return (
    <footer 
      className="mt-auto pt-4 flex justify-between items-center text-xs text-gray-500"
      style={{ 
        borderTop: '1px solid #e5e5e5',
        marginTop: 'auto',
        position: 'relative',
        bottom: 0,
      }}
    >
      <div>
        {branding.footerText || 'Confidential - For authorized use only'}
      </div>
      {branding.showPageNumbers !== false && (
        <div>Page {pageNumber} of {totalPages}</div>
      )}
    </footer>
  );
}

// Print-optimized block wrapper
function PrintBlock({
  block,
  holdings,
  performanceMetrics,
  riskMetrics,
  totalValue,
  branding,
}: {
  block: ReportBlock;
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
  branding: ReportBranding;
}) {
  return (
    <div 
      className="print-block"
      style={{
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <div 
        className="rounded-lg overflow-hidden"
        style={{
          backgroundColor: '#fafafa',
          border: '1px solid #e5e5e5',
          padding: '16px',
        }}
      >
        <ReportBlockRenderer
          block={block}
          holdings={holdings}
          performanceMetrics={performanceMetrics}
          riskMetrics={riskMetrics}
          totalValue={totalValue}
          branding={branding}
          isPrintMode={true}
        />
      </div>
    </div>
  );
}

export { ReportPrintView };
