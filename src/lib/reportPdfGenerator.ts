import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Report } from '@/types/reports';
import type { ReportBlock, ReportBranding as WYSIWYGBranding } from '@/types/reportBuilder';
import type { PortfolioHolding } from '@/lib/portfolioEngine';
import type { PerformanceMetrics, RiskMetrics } from '@/types/investment';

// Local formatting helpers
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

interface GeneratePDFOptions {
  report: Report;
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
}

interface GenerateWYSIWYGPDFOptions {
  blocks: ReportBlock[];
  branding: WYSIWYGBranding;
  pageSize: 'A4' | 'Letter';
  holdings?: PortfolioHolding[];
  performanceMetrics?: PerformanceMetrics | null;
  riskMetrics?: RiskMetrics | null;
  totalValue?: number;
  reportName?: string;
  returnAsBase64?: boolean;
}

// Theme colors
const COLORS = {
  background: '#0A0A0A',
  card: '#141414',
  border: '#2A2A2A',
  text: '#E0E0E0',
  textMuted: '#808080',
  primary: '#FFC107',
  positive: '#4CAF50',
  negative: '#FF5252',
};

export async function generateReportPDF({ report, holdings, performanceMetrics, riskMetrics, totalValue }: GeneratePDFOptions): Promise<void> {
  const pageFormat = report.page_size === 'Letter' ? 'letter' : 'a4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageFormat,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  const branding = report.branding;
  const accentColor = branding.accentColor || COLORS.primary;

  // Helper functions
  const addNewPageIfNeeded = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [255, 193, 7];
  };

  // Process each enabled section
  const enabledSections = report.sections.filter(s => s.enabled);

  for (const section of enabledSections) {
    addNewPageIfNeeded(40);

    switch (section.type) {
      case 'logo_header':
        // Header bar
        doc.setFillColor(...hexToRgb(accentColor));
        doc.rect(0, 0, pageWidth, 3, 'F');
        
        y = 20;
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(branding.headerTitle || 'Portfolio Report', pageWidth / 2, y, { align: 'center' });
        
        if (branding.headerSubtitle) {
          y += 10;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(180, 180, 180);
          doc.text(branding.headerSubtitle, pageWidth / 2, y, { align: 'center' });
        }
        
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
        
        y += 15;
        break;

      case 'portfolio_overview':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const overviewData = [
          ['Total Value', formatCurrency(totalValue)],
          ['IRR', performanceMetrics ? formatPercent(performanceMetrics.irr) : '—'],
          ['Total Return', performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—'],
          ['Sharpe Ratio', performanceMetrics?.sharpeRatio.toFixed(2) || '—'],
          ['Max Drawdown', performanceMetrics ? formatPercent(-performanceMetrics.maxDrawdown) : '—'],
        ];

        autoTable(doc, {
          startY: y,
          head: [],
          body: overviewData,
          theme: 'plain',
          styles: {
            fontSize: 10,
            cellPadding: 4,
            textColor: [224, 224, 224],
          },
          columnStyles: {
            0: { cellWidth: 60, textColor: [128, 128, 128] },
            1: { fontStyle: 'bold', halign: 'right' },
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'performance_summary':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const perfData = [
          ['Total Return', performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—'],
          ['Sharpe Ratio', performanceMetrics?.sharpeRatio.toFixed(2) || '—'],
          ['Max Drawdown', performanceMetrics ? formatPercent(-performanceMetrics.maxDrawdown) : '—'],
          ['Volatility', performanceMetrics ? formatPercent(performanceMetrics.volatility) : '—'],
        ];

        autoTable(doc, {
          startY: y,
          head: [],
          body: perfData,
          theme: 'plain',
          styles: {
            fontSize: 10,
            cellPadding: 4,
            textColor: [224, 224, 224],
          },
          columnStyles: {
            0: { cellWidth: 60, textColor: [128, 128, 128] },
            1: { fontStyle: 'bold', halign: 'right' },
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'asset_allocation':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const byType: Record<string, number> = {};
        holdings.forEach(h => {
          byType[h.assetType] = (byType[h.assetType] || 0) + h.currentValue;
        });

        const allocData = Object.entries(byType).map(([name, value]) => [
          name,
          formatCurrency(value),
          totalValue > 0 ? `${((value / totalValue) * 100).toFixed(1)}%` : '0%',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Asset Class', 'Value', 'Weight']],
          body: allocData,
          theme: 'striped',
          headStyles: {
            fillColor: [40, 40, 40],
            textColor: [180, 180, 180],
            fontSize: 9,
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [224, 224, 224],
          },
          alternateRowStyles: {
            fillColor: [25, 25, 25],
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'currency_exposure':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const byCurrency: Record<string, number> = {};
        holdings.forEach(h => {
          byCurrency[h.currency] = (byCurrency[h.currency] || 0) + h.currentValue;
        });

        const currencyData = Object.entries(byCurrency).map(([name, value]) => [
          name,
          formatCurrency(value),
          totalValue > 0 ? `${((value / totalValue) * 100).toFixed(1)}%` : '0%',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Currency', 'Value', 'Weight']],
          body: currencyData,
          theme: 'striped',
          headStyles: {
            fillColor: [40, 40, 40],
            textColor: [180, 180, 180],
            fontSize: 9,
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [224, 224, 224],
          },
          alternateRowStyles: {
            fillColor: [25, 25, 25],
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'geographic_allocation':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const byGeo: Record<string, number> = {};
        holdings.forEach(h => {
          byGeo[h.geography] = (byGeo[h.geography] || 0) + h.currentValue;
        });

        const geoData = Object.entries(byGeo).map(([name, value]) => [
          name,
          formatCurrency(value),
          totalValue > 0 ? `${((value / totalValue) * 100).toFixed(1)}%` : '0%',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Region', 'Value', 'Weight']],
          body: geoData,
          theme: 'striped',
          headStyles: {
            fillColor: [40, 40, 40],
            textColor: [180, 180, 180],
            fontSize: 9,
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [224, 224, 224],
          },
          alternateRowStyles: {
            fillColor: [25, 25, 25],
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'top_movers':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const sortedHoldings = [...holdings]
          .filter(h => h.unrealizedPL !== undefined)
          .sort((a, b) => (b.unrealizedPL || 0) - (a.unrealizedPL || 0));
        
        const topPerformers = sortedHoldings.slice(0, 5).map(h => [
          h.ticker,
          h.name,
          formatCurrency(h.unrealizedPL || 0),
        ]);
        
        const bottomPerformers = sortedHoldings.slice(-5).reverse().map(h => [
          h.ticker,
          h.name,
          formatCurrency(h.unrealizedPL || 0),
        ]);

        doc.setFontSize(10);
        doc.setTextColor(76, 175, 80);
        doc.text('Top Performers', margin, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [['Ticker', 'Name', 'P/L']],
          body: topPerformers,
          theme: 'plain',
          headStyles: {
            fillColor: [25, 35, 25],
            textColor: [76, 175, 80],
            fontSize: 8,
          },
          styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [224, 224, 224],
          },
          columnStyles: {
            2: { textColor: [76, 175, 80], halign: 'right' },
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 6;

        doc.setFontSize(10);
        doc.setTextColor(255, 82, 82);
        doc.text('Bottom Performers', margin, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [['Ticker', 'Name', 'P/L']],
          body: bottomPerformers,
          theme: 'plain',
          headStyles: {
            fillColor: [35, 25, 25],
            textColor: [255, 82, 82],
            fontSize: 8,
          },
          styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [224, 224, 224],
          },
          columnStyles: {
            2: { textColor: [255, 82, 82], halign: 'right' },
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'contribution_chart':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const contributionData = holdings
          .filter(h => h.unrealizedPL !== undefined)
          .sort((a, b) => Math.abs(b.unrealizedPL || 0) - Math.abs(a.unrealizedPL || 0))
          .slice(0, 10)
          .map(h => [
            h.ticker,
            h.name,
            formatCurrency(h.unrealizedPL || 0),
            totalValue > 0 ? formatPercent(((h.unrealizedPL || 0) / totalValue) * 100) : '—',
          ]);

        autoTable(doc, {
          startY: y,
          head: [['Ticker', 'Name', 'P/L', 'Contribution']],
          body: contributionData,
          theme: 'striped',
          headStyles: {
            fillColor: [40, 40, 40],
            textColor: [180, 180, 180],
            fontSize: 8,
          },
          styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [224, 224, 224],
          },
          columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'right' },
          },
          alternateRowStyles: {
            fillColor: [25, 25, 25],
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'performance_calendar':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text('Monthly returns heatmap - data from monthly valuations', margin, y);
        y += 15;
        break;

      case 'scenarios_snapshot':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const scenarioResults = [
          ['2008 Financial Crisis', '-28.5%'],
          ['COVID-19 Crash', '-18.2%'],
          ['Rates +200bp', '-8.4%'],
          ['Tech Bust -40%', '-22.1%'],
          ['Stagflation', '-15.8%'],
          ['EM Crisis', '-12.3%'],
        ];

        autoTable(doc, {
          startY: y,
          head: [['Scenario', 'Impact']],
          body: scenarioResults,
          theme: 'striped',
          headStyles: {
            fillColor: [40, 40, 40],
            textColor: [180, 180, 180],
            fontSize: 9,
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
            textColor: [224, 224, 224],
          },
          columnStyles: {
            1: { textColor: [255, 82, 82], halign: 'right' },
          },
          alternateRowStyles: {
            fillColor: [25, 25, 25],
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'holdings_table':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const holdingsData = holdings.map(h => [
          h.ticker,
          h.name,
          h.assetType,
          formatCurrency(h.currentValue),
          `${h.weight.toFixed(1)}%`,
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Ticker', 'Name', 'Type', 'Value', 'Weight']],
          body: holdingsData,
          theme: 'striped',
          headStyles: {
            fillColor: [40, 40, 40],
            textColor: [180, 180, 180],
            fontSize: 8,
          },
          styles: {
            fontSize: 8,
            cellPadding: 2,
            textColor: [224, 224, 224],
          },
          alternateRowStyles: {
            fillColor: [25, 25, 25],
          },
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 25 },
            1: { cellWidth: 50 },
            3: { halign: 'right' },
            4: { halign: 'right' },
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'risk_metrics':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        const riskData = [
          ['Volatility (Ann.)', riskMetrics ? formatPercent(riskMetrics.volatility) : '—'],
          ['Beta', riskMetrics?.beta.toFixed(2) || '—'],
          ['VaR 95%', riskMetrics ? formatPercent(-riskMetrics.var95) : '—'],
          ['Sharpe Ratio', riskMetrics?.sharpeRatio.toFixed(2) || '—'],
          ['Sortino Ratio', riskMetrics?.sortinoRatio?.toFixed(2) || '—'],
          ['Max Drawdown', riskMetrics ? formatPercent(-riskMetrics.maxDrawdown) : '—'],
        ];

        autoTable(doc, {
          startY: y,
          head: [],
          body: riskData,
          theme: 'plain',
          styles: {
            fontSize: 10,
            cellPadding: 4,
            textColor: [224, 224, 224],
          },
          columnStyles: {
            0: { cellWidth: 60, textColor: [128, 128, 128] },
            1: { fontStyle: 'bold', halign: 'right' },
          },
          margin: { left: margin, right: margin },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
        break;

      case 'custom_text':
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setTextColor(180, 180, 180);
        doc.setFont('helvetica', 'italic');
        doc.text('Commentary section - customize in report builder', margin, y);
        y += 15;
        break;

      default:
        // Generic section placeholder
        doc.setFontSize(14);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text(section.title.toUpperCase(), margin, y);
        y += 8;

        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`${section.type} section`, margin, y);
        y += 15;
        break;
    }
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(60, 60, 60);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    
    if (branding.footerText) {
      doc.text(branding.footerText, margin, pageHeight - 10);
    }
    
    if (branding.analystName) {
      doc.text(branding.analystName, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    if (branding.showPageNumbers !== false) {
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
  }

  // Save the PDF
  const fileName = `${report.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// New WYSIWYG Report PDF Generator
export async function generateWYSIWYGReportPDF({ 
  blocks, 
  branding, 
  pageSize, 
  holdings = [], 
  performanceMetrics, 
  riskMetrics, 
  totalValue = 0,
  reportName = 'Report',
  returnAsBase64 = false,
}: GenerateWYSIWYGPDFOptions): Promise<void | string> {
  const pageFormat = pageSize === 'Letter' ? 'letter' : 'a4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageFormat,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Get colors from branding
  const accentColor = branding.accentColor || COLORS.primary;
  const backgroundColor = branding.backgroundColor || COLORS.background;
  const textColor = branding.textColor || COLORS.text;
  const headingColor = branding.headingColor || '#FAFAF9';
  const mutedTextColor = branding.mutedTextColor || COLORS.textMuted;
  const cardBgColor = branding.tableHeaderBgColor || COLORS.card;
  const borderColor = branding.tableBorderColor || COLORS.border;
  const positiveColor = branding.chartPositiveColor || COLORS.positive;
  const negativeColor = branding.chartNegativeColor || COLORS.negative;

  // Helper functions
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [255, 193, 7];
  };

  // Fill page with dark background
  const fillPageBackground = () => {
    doc.setFillColor(...hexToRgb(backgroundColor));
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  // Draw a card/panel background
  const drawCardBackground = (x: number, yPos: number, width: number, height: number, withBorder = true) => {
    doc.setFillColor(...hexToRgb(cardBgColor));
    doc.roundedRect(x, yPos, width, height, 2, 2, 'F');
    if (withBorder) {
      doc.setDrawColor(...hexToRgb(borderColor));
      doc.setLineWidth(0.3);
      doc.roundedRect(x, yPos, width, height, 2, 2, 'S');
    }
  };

  // Add accent bar at the top of a section
  const drawAccentBar = (yPos: number) => {
    doc.setFillColor(...hexToRgb(accentColor));
    doc.rect(margin, yPos, 25, 0.8, 'F');
  };

  // Fill first page background
  fillPageBackground();

  const addNewPageIfNeeded = (requiredHeight: number) => {
    if (y + requiredHeight > pageHeight - 20) {
      doc.addPage();
      fillPageBackground(); // Fill new page with dark background
      y = margin;
      return true;
    }
    return false;
  };

  // Process each enabled block
  const enabledBlocks = blocks.filter(b => b.enabled);

  for (const block of enabledBlocks) {
    const config = block.config || {};
    
    switch (block.type) {
      case 'logo_header':
        // Header bar
        doc.setFillColor(...hexToRgb(accentColor));
        doc.rect(0, 0, pageWidth, 3, 'F');
        
        y = 20;
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(config.title || branding.headerTitle || 'Portfolio Report', pageWidth / 2, y, { align: 'center' });
        
        if (config.subtitle || branding.headerSubtitle) {
          y += 10;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(180, 180, 180);
          doc.text(config.subtitle || branding.headerSubtitle || '', pageWidth / 2, y, { align: 'center' });
        }
        
        y += 8;
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
        
        y += 15;
        break;

      case 'title':
        addNewPageIfNeeded(15);
        doc.setFontSize(20);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        const titleAlign = config.textAlign || 'center';
        const titleX = titleAlign === 'left' ? margin : titleAlign === 'right' ? pageWidth - margin : pageWidth / 2;
        doc.text(config.title || 'Title', titleX, y, { align: titleAlign as any });
        y += 12;
        break;

      case 'subtitle':
        addNewPageIfNeeded(10);
        doc.setFontSize(14);
        doc.setTextColor(180, 180, 180);
        doc.setFont('helvetica', 'normal');
        const subtitleAlign = config.textAlign || 'center';
        const subtitleX = subtitleAlign === 'left' ? margin : subtitleAlign === 'right' ? pageWidth - margin : pageWidth / 2;
        doc.text(config.subtitle || config.title || 'Subtitle', subtitleX, y, { align: subtitleAlign as any });
        y += 10;
        break;

      case 'free_text':
        addNewPageIfNeeded(20);
        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(config.text || '', pageWidth - (margin * 2));
        doc.text(lines, margin, y);
        y += lines.length * 5 + 10;
        break;

      case 'portfolio_overview':
        addNewPageIfNeeded(50);
        
        // Draw section card background
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), 45);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('PORTFOLIO OVERVIEW', margin + 4, y + 2);
        y += 10;

        const overviewData = [
          ['Total Value', formatCurrency(totalValue)],
          ['IRR', performanceMetrics ? formatPercent(performanceMetrics.irr) : '—'],
          ['Total Return', performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—'],
          ['Sharpe Ratio', performanceMetrics?.sharpeRatio.toFixed(2) || '—'],
          ['Max Drawdown', performanceMetrics ? formatPercent(-performanceMetrics.maxDrawdown) : '—'],
        ];

        autoTable(doc, {
          startY: y,
          head: [],
          body: overviewData,
          theme: 'plain',
          styles: { 
            fontSize: 10, 
            cellPadding: 3, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          columnStyles: {
            0: { cellWidth: 50, textColor: hexToRgb(mutedTextColor) },
            1: { fontStyle: 'bold', halign: 'right' },
          },
          margin: { left: margin + 4, right: margin + 4 },
          tableLineColor: hexToRgb(borderColor),
          tableLineWidth: 0,
        });
        y = (doc as any).lastAutoTable.finalY + 14;
        break;

      case 'performance_summary':
        addNewPageIfNeeded(45);
        
        // Draw section card background
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), 38);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('PERFORMANCE SUMMARY', margin + 4, y + 2);
        y += 10;

        const perfData = [
          ['Total Return', performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—'],
          ['Sharpe Ratio', performanceMetrics?.sharpeRatio.toFixed(2) || '—'],
          ['Max Drawdown', performanceMetrics ? formatPercent(-performanceMetrics.maxDrawdown) : '—'],
          ['Volatility', performanceMetrics ? formatPercent(performanceMetrics.volatility) : '—'],
        ];

        autoTable(doc, {
          startY: y,
          head: [],
          body: perfData,
          theme: 'plain',
          styles: { 
            fontSize: 10, 
            cellPadding: 3, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          columnStyles: {
            0: { cellWidth: 50, textColor: hexToRgb(mutedTextColor) },
            1: { fontStyle: 'bold', halign: 'right' },
          },
          margin: { left: margin + 4, right: margin + 4 },
        });
        y = (doc as any).lastAutoTable.finalY + 14;
        break;

      case 'asset_allocation':
        addNewPageIfNeeded(55);
        
        // Draw section card background
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), 50);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('ASSET ALLOCATION', margin + 4, y + 2);
        y += 10;

        const byType: Record<string, number> = {};
        holdings.forEach(h => {
          byType[h.assetType] = (byType[h.assetType] || 0) + h.currentValue;
        });

        const allocData = Object.entries(byType).map(([name, value]) => [
          name,
          formatCurrency(value),
          totalValue > 0 ? `${((value / totalValue) * 100).toFixed(1)}%` : '0%',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Asset Class', 'Value', 'Weight']],
          body: allocData,
          theme: 'plain',
          headStyles: { 
            fillColor: hexToRgb(branding.tableHeaderBgColor || '#161618'), 
            textColor: hexToRgb(accentColor), 
            fontSize: 9,
            fontStyle: 'bold',
          },
          styles: { 
            fontSize: 9, 
            cellPadding: 3, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          alternateRowStyles: { fillColor: hexToRgb(backgroundColor) },
          margin: { left: margin + 4, right: margin + 4 },
        });
        y = (doc as any).lastAutoTable.finalY + 14;
        break;

      case 'currency_exposure':
        addNewPageIfNeeded(55);
        
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), 50);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('CURRENCY EXPOSURE', margin + 4, y + 2);
        y += 10;

        const byCurrency: Record<string, number> = {};
        holdings.forEach(h => {
          byCurrency[h.currency] = (byCurrency[h.currency] || 0) + h.currentValue;
        });

        const currencyData = Object.entries(byCurrency).map(([name, value]) => [
          name,
          formatCurrency(value),
          totalValue > 0 ? `${((value / totalValue) * 100).toFixed(1)}%` : '0%',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Currency', 'Value', 'Weight']],
          body: currencyData,
          theme: 'plain',
          headStyles: { 
            fillColor: hexToRgb(branding.tableHeaderBgColor || '#161618'), 
            textColor: hexToRgb(accentColor), 
            fontSize: 9,
            fontStyle: 'bold',
          },
          styles: { 
            fontSize: 9, 
            cellPadding: 3, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          alternateRowStyles: { fillColor: hexToRgb(backgroundColor) },
          margin: { left: margin + 4, right: margin + 4 },
        });
        y = (doc as any).lastAutoTable.finalY + 14;
        break;

      case 'geographic_allocation':
        addNewPageIfNeeded(55);
        
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), 50);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('GEOGRAPHIC ALLOCATION', margin + 4, y + 2);
        y += 10;

        const byGeo: Record<string, number> = {};
        holdings.forEach(h => {
          byGeo[h.geography] = (byGeo[h.geography] || 0) + h.currentValue;
        });

        const geoData = Object.entries(byGeo).map(([name, value]) => [
          name,
          formatCurrency(value),
          totalValue > 0 ? `${((value / totalValue) * 100).toFixed(1)}%` : '0%',
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Region', 'Value', 'Weight']],
          body: geoData,
          theme: 'plain',
          headStyles: { 
            fillColor: hexToRgb(branding.tableHeaderBgColor || '#161618'), 
            textColor: hexToRgb(accentColor), 
            fontSize: 9,
            fontStyle: 'bold',
          },
          styles: { 
            fontSize: 9, 
            cellPadding: 3, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          alternateRowStyles: { fillColor: hexToRgb(backgroundColor) },
          margin: { left: margin + 4, right: margin + 4 },
        });
        y = (doc as any).lastAutoTable.finalY + 14;
        break;

      case 'holdings_table':
        addNewPageIfNeeded(70);
        
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), 65);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('HOLDINGS', margin + 4, y + 2);
        y += 10;

        const maxItems = config.maxItems || 20;
        const holdingsData = holdings.slice(0, maxItems).map(h => [
          h.ticker,
          h.name,
          h.assetType,
          formatCurrency(h.currentValue),
          `${h.weight.toFixed(1)}%`,
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Ticker', 'Name', 'Type', 'Value', 'Weight']],
          body: holdingsData,
          theme: 'plain',
          headStyles: { 
            fillColor: hexToRgb(branding.tableHeaderBgColor || '#161618'), 
            textColor: hexToRgb(accentColor), 
            fontSize: 8,
            fontStyle: 'bold',
          },
          styles: { 
            fontSize: 8, 
            cellPadding: 2, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          alternateRowStyles: { fillColor: hexToRgb(backgroundColor) },
          columnStyles: { 
            0: { fontStyle: 'bold', cellWidth: 25 }, 
            1: { cellWidth: 50 }, 
            3: { halign: 'right' }, 
            4: { halign: 'right' } 
          },
          margin: { left: margin + 4, right: margin + 4 },
        });
        y = (doc as any).lastAutoTable.finalY + 14;
        break;

      case 'risk_metrics':
        addNewPageIfNeeded(50);
        
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), 45);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('RISK METRICS', margin + 4, y + 2);
        y += 10;

        const riskData = [
          ['Volatility (Ann.)', riskMetrics ? formatPercent(riskMetrics.volatility) : '—'],
          ['Beta', riskMetrics?.beta.toFixed(2) || '—'],
          ['VaR 95%', riskMetrics ? formatPercent(-riskMetrics.var95) : '—'],
          ['Sharpe Ratio', riskMetrics?.sharpeRatio.toFixed(2) || '—'],
          ['Max Drawdown', riskMetrics ? formatPercent(-riskMetrics.maxDrawdown) : '—'],
        ];

        autoTable(doc, {
          startY: y,
          head: [],
          body: riskData,
          theme: 'plain',
          styles: { 
            fontSize: 10, 
            cellPadding: 3, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          columnStyles: { 
            0: { cellWidth: 50, textColor: hexToRgb(mutedTextColor) }, 
            1: { fontStyle: 'bold', halign: 'right' } 
          },
          margin: { left: margin + 4, right: margin + 4 },
        });
        y = (doc as any).lastAutoTable.finalY + 14;
        break;

      case 'top_movers':
        addNewPageIfNeeded(70);
        
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), 65);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('TOP MOVERS', margin + 4, y + 2);
        y += 10;

        const sortedHoldings = [...holdings]
          .filter(h => h.unrealizedPL !== undefined)
          .sort((a, b) => (b.unrealizedPL || 0) - (a.unrealizedPL || 0));
        
        const itemCount = config.maxItems || 5;
        const topPerformers = sortedHoldings.slice(0, itemCount).map(h => [h.ticker, h.name, formatCurrency(h.unrealizedPL || 0)]);
        const bottomPerformers = sortedHoldings.slice(-itemCount).reverse().map(h => [h.ticker, h.name, formatCurrency(h.unrealizedPL || 0)]);

        doc.setFontSize(9);
        doc.setTextColor(...hexToRgb(positiveColor));
        doc.text('Top Performers', margin + 4, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [['Ticker', 'Name', 'P/L']],
          body: topPerformers,
          theme: 'plain',
          headStyles: { 
            fillColor: [20, 35, 25], 
            textColor: hexToRgb(positiveColor), 
            fontSize: 8 
          },
          styles: { 
            fontSize: 8, 
            cellPadding: 2, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          columnStyles: { 2: { textColor: hexToRgb(positiveColor), halign: 'right' } },
          margin: { left: margin + 4, right: margin + 4 },
        });
        y = (doc as any).lastAutoTable.finalY + 6;

        doc.setFontSize(9);
        doc.setTextColor(...hexToRgb(negativeColor));
        doc.text('Bottom Performers', margin + 4, y);
        y += 4;

        autoTable(doc, {
          startY: y,
          head: [['Ticker', 'Name', 'P/L']],
          body: bottomPerformers,
          theme: 'plain',
          headStyles: { 
            fillColor: [35, 20, 20], 
            textColor: hexToRgb(negativeColor), 
            fontSize: 8 
          },
          styles: { 
            fontSize: 8, 
            cellPadding: 2, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          columnStyles: { 2: { textColor: hexToRgb(negativeColor), halign: 'right' } },
          margin: { left: margin + 4, right: margin + 4 },
        });
        y = (doc as any).lastAutoTable.finalY + 14;
        break;

      case 'scenarios_snapshot':
        addNewPageIfNeeded(50);
        
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), 45);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('SCENARIOS SNAPSHOT', margin + 4, y + 2);
        y += 10;

        const scenarioResults = [
          ['2008 Financial Crisis', '-28.5%'],
          ['COVID-19 Crash', '-18.2%'],
          ['Rates +200bp', '-8.4%'],
          ['Tech Bust -40%', '-22.1%'],
          ['Stagflation', '-15.8%'],
        ];

        autoTable(doc, {
          startY: y,
          head: [['Scenario', 'Impact']],
          body: scenarioResults,
          theme: 'plain',
          headStyles: { 
            fillColor: hexToRgb(branding.tableHeaderBgColor || '#161618'), 
            textColor: hexToRgb(accentColor), 
            fontSize: 9,
            fontStyle: 'bold',
          },
          styles: { 
            fontSize: 9, 
            cellPadding: 3, 
            textColor: hexToRgb(textColor),
            fillColor: hexToRgb(cardBgColor),
          },
          columnStyles: { 1: { textColor: hexToRgb(negativeColor), halign: 'right' } },
          alternateRowStyles: { fillColor: hexToRgb(backgroundColor) },
          margin: { left: margin + 4, right: margin + 4 },
        });
        y = (doc as any).lastAutoTable.finalY + 14;
        break;

      case 'footer':
        // Footer is handled at the end
        break;

      case 'page_break':
        doc.addPage();
        fillPageBackground(); // Fill new page with dark background
        y = margin;
        break;

      case 'spacer':
        y += 20;
        break;

      default:
        // Generic placeholder
        addNewPageIfNeeded(20);
        doc.setFontSize(12);
        doc.setTextColor(...hexToRgb(mutedTextColor));
        doc.text(`[${block.type.replace(/_/g, ' ').toUpperCase()}]`, margin, y);
        y += 15;
        break;
    }
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...hexToRgb(borderColor));
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(mutedTextColor));
    
    if (branding.footerText) {
      doc.text(branding.footerText, margin, pageHeight - 10);
    }
    
    if (branding.analystName) {
      doc.text(branding.analystName, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    
    if (branding.showPageNumbers) {
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
  }

  // Return base64 or save the PDF
  if (returnAsBase64) {
    // Return base64 string without the data URI prefix
    const base64 = doc.output('datauristring');
    // Remove the "data:application/pdf;filename=generated.pdf;base64," prefix
    return base64.split(',')[1];
  }
  
  const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
