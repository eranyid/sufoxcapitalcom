/**
 * ReportPrintView - Dark Theme Print-Optimized Report Rendering
 * 
 * This component renders the report in a print-optimized format for
 * browser-native PDF export via window.print() / react-to-print.
 * 
 * CRITICAL: Enforces TRUE WYSIWYG dark theme printing.
 * The exported PDF must look identical to the editor - including dark backgrounds.
 * 
 * Features:
 * - Dark theme matching editor (NOT white/paper mode)
 * - Vector text (selectable, searchable)
 * - SVG charts (sharp at any zoom)
 * - Proper page breaks
 * - No editor chrome / drag handles
 * - Forced background color printing
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
  theme?: 'dark' | 'light';
}

// Page dimensions in mm for CSS
const PAGE_CSS_SIZES = {
  A4: { width: '210mm', height: '297mm' },
  Letter: { width: '8.5in', height: '11in' },
};

// Dark theme colors (matching editor)
const DARK_THEME = {
  pageBackground: '#0A0A0A',
  cardBackground: '#111111',
  cardBorder: '#222222',
  textPrimary: '#E5E5E5',
  textSecondary: '#999999',
  textMuted: '#666666',
};

// Light theme colors (optional fallback)
const LIGHT_THEME = {
  pageBackground: '#FFFFFF',
  cardBackground: '#FAFAFA',
  cardBorder: '#E5E5E5',
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
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
      theme = 'dark', // Default to dark theme for true WYSIWYG
    },
    ref
  ) {
    // Use branding colors if available, otherwise fall back to theme defaults
    const colors = {
      pageBackground: branding.backgroundColor || (theme === 'dark' ? DARK_THEME.pageBackground : LIGHT_THEME.pageBackground),
      cardBackground: branding.tableRowAltBgColor || (theme === 'dark' ? DARK_THEME.cardBackground : LIGHT_THEME.cardBackground),
      cardBorder: branding.tableBorderColor || (theme === 'dark' ? DARK_THEME.cardBorder : LIGHT_THEME.cardBorder),
      textPrimary: branding.textColor || (theme === 'dark' ? DARK_THEME.textPrimary : LIGHT_THEME.textPrimary),
      textSecondary: branding.mutedTextColor || (theme === 'dark' ? DARK_THEME.textSecondary : LIGHT_THEME.textSecondary),
      textMuted: branding.mutedTextColor || (theme === 'dark' ? DARK_THEME.textMuted : LIGHT_THEME.textMuted),
    };
    
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

    // Critical: Generate print styles that FORCE dark background printing
    const printStyles = `
      /* =====================================================
         CRITICAL: Force Background Color Printing
         This ensures dark theme is preserved in PDF export
         ===================================================== */
      
      @media print {
        @page {
          size: ${pageSize === 'A4' ? 'A4' : 'letter'} portrait;
          margin: 10mm 8mm;
        }
        
        /* CRITICAL: Force background graphics to print */
        html {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          background: ${colors.pageBackground} !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        /* Force dark background on all print elements */
        .report-print-container,
        .report-print-container * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        .report-print-container {
          background: ${colors.pageBackground} !important;
          background-color: ${colors.pageBackground} !important;
        }
        
        .print-page {
          background: ${colors.pageBackground} !important;
          background-color: ${colors.pageBackground} !important;
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
        
        .print-card {
          background: ${colors.cardBackground} !important;
          background-color: ${colors.cardBackground} !important;
          border-color: ${colors.cardBorder} !important;
        }
        
        /* Hide non-print elements */
        .no-print,
        [data-radix-portal],
        .sonner-toast,
        .sidebar,
        nav {
          display: none !important;
        }
        
        /* Ensure SVG charts print correctly with dark theme */
        svg {
          max-width: 100%;
          height: auto;
          background: transparent !important;
        }
        
        /* Force all text colors */
        .print-text-primary {
          color: ${colors.textPrimary} !important;
        }
        
        .print-text-secondary {
          color: ${colors.textSecondary} !important;
        }
        
        .print-text-muted {
          color: ${colors.textMuted} !important;
        }
        
        /* Prevent browser from stripping backgrounds */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        
        /* Disable any light mode overrides */
        .light, [data-theme="light"] {
          background: ${colors.pageBackground} !important;
          color: ${colors.textPrimary} !important;
        }
      }
      
      /* Screen preview - match print output exactly */
      @media screen {
        .report-print-container {
          background: #1a1a1a;
          padding: 20px;
        }
        
        .print-page {
          background: ${colors.pageBackground};
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          margin: 0 auto 20px;
        }
      }
    `;

    const renderPage = (pageBlocks: ReportBlock[], pageNum: number, isFirst: boolean) => (
      <div 
        key={pageNum}
        className="print-page relative"
        data-page-number={pageNum}
        style={{
          width: pageDims.width,
          minHeight: pageDims.height,
          padding: '12mm 10mm',
          boxSizing: 'border-box',
          backgroundColor: colors.pageBackground,
          color: colors.textPrimary,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Confidential Watermark */}
        {branding.showConfidentialWatermark && (
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
            style={{ opacity: 0.04, zIndex: 1 }}
          >
            <span 
              style={{ 
                fontSize: '80px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
                color: colors.textMuted,
                transform: 'rotate(-30deg)',
              }}
            >
              CONFIDENTIAL
            </span>
          </div>
        )}

        {/* Header on first page */}
        {isFirst && (
          <PrintHeader 
            branding={branding} 
            colors={colors}
          />
        )}

        <div className="flex-1 relative" style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pageBlocks.map((block) => (
            <PrintBlock
              key={block.id}
              block={block}
              holdings={holdings}
              performanceMetrics={performanceMetrics}
              riskMetrics={riskMetrics}
              totalValue={totalValue}
              branding={branding}
              colors={colors}
            />
          ))}
        </div>

        <PrintFooter 
          branding={branding} 
          pageNumber={pageNum} 
          totalPages={totalPages}
          colors={colors}
        />
      </div>
    );

    return (
      <div 
        ref={ref} 
        className="report-print-container"
        data-print-document="true"
        data-theme={theme}
        style={{
          backgroundColor: colors.pageBackground,
          colorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        }}
      >
        {/* Critical: Inject print styles that force dark background */}
        <style dangerouslySetInnerHTML={{ __html: printStyles }} />

        {pageNumbers.length === 0 ? (
          // Single page with all blocks if no page assignments
          renderPage(enabledBlocks, 1, true)
        ) : (
          pageNumbers.map((pageNum, idx) => 
            renderPage(blocksByPage[pageNum] || [], pageNum, idx === 0)
          )
        )}
      </div>
    );
  }
);

// Dark theme print header
function PrintHeader({ 
  branding, 
  colors 
}: { 
  branding: ReportBranding;
  colors: typeof DARK_THEME;
}) {
  return (
    <header 
      className="mb-6 pb-4"
      style={{ 
        borderBottom: `2px solid ${branding.accentColor || '#ff8c00'}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h1 
            className="text-2xl font-bold print-text-primary"
            style={{ color: colors.textPrimary }}
          >
            {branding.headerTitle || 'Investment Report'}
          </h1>
          {branding.headerSubtitle && (
            <p 
              className="text-sm mt-1 print-text-secondary"
              style={{ color: colors.textSecondary }}
            >
              {branding.headerSubtitle}
            </p>
          )}
        </div>
        
        <div 
          className="text-right text-sm print-text-muted"
          style={{ color: colors.textMuted }}
        >
          <div>{format(new Date(), 'MMMM d, yyyy')}</div>
          {branding.analystName && (
            <div className="mt-1">Prepared by: {branding.analystName}</div>
          )}
        </div>
      </div>
    </header>
  );
}

// Dark theme print footer
function PrintFooter({ 
  branding, 
  pageNumber, 
  totalPages,
  colors,
}: { 
  branding: ReportBranding; 
  pageNumber: number; 
  totalPages: number;
  colors: typeof DARK_THEME;
}) {
  return (
    <footer 
      className="pt-4 flex justify-between items-center text-xs print-text-muted"
      style={{ 
        borderTop: `1px solid ${colors.cardBorder}`,
        marginTop: 'auto',
        color: colors.textMuted,
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

// Calculate print height based on block height setting
const getPrintBlockHeight = (block: ReportBlock): string => {
  const heightMap: Record<string, string> = {
    'auto': 'auto',
    'xs': '60px',
    'sm': '80px',
    'md': '120px',
    'lg': '160px',
    'xl': '200px',
    '2xl': '260px',
    '3xl': '320px',
  };
  return heightMap[block.height] || 'auto';
};

// Dark theme print block wrapper
function PrintBlock({
  block,
  holdings,
  performanceMetrics,
  riskMetrics,
  totalValue,
  branding,
  colors,
}: {
  block: ReportBlock;
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
  branding: ReportBranding;
  colors: typeof DARK_THEME;
}) {
  const blockHeight = getPrintBlockHeight(block);
  const needsExplicitHeight = blockHeight !== 'auto';
  
  return (
    <div 
      className="print-block"
      data-block-id={block.id}
      style={{
        breakInside: 'avoid',
        pageBreakInside: 'avoid',
      }}
    >
      <div 
        className="print-card rounded-lg overflow-hidden"
        style={{
          backgroundColor: colors.cardBackground,
          border: `1px solid ${colors.cardBorder}`,
          padding: '12px 16px',
          height: needsExplicitHeight ? blockHeight : 'auto',
          minHeight: needsExplicitHeight ? blockHeight : undefined,
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
export type { ReportPrintViewProps };
