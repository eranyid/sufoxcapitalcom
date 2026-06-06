import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Report } from '@/types/reports';
import type { ReportBlock, ReportBranding as WYSIWYGBranding } from '@/types/reportBuilder';
import type { PortfolioHolding } from '@/lib/portfolioEngine';
import type { PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { formatCurrency, formatPercent } from '@/lib/formatters';

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
        
        y = 10;
        
        // Render logo if available
        if (branding.logoUrl) {
          try {
            const logoResponse = await fetch(branding.logoUrl);
            const logoBlob = await logoResponse.blob();
            const logoBase64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(logoBlob);
            });
            
            const logoHeight = 15;
            const logoWidth = logoHeight * 2;
            const logoX = pageWidth / 2 - logoWidth / 2;
            
            doc.addImage(logoBase64, 'PNG', logoX, y, logoWidth, logoHeight);
            y += logoHeight + 5;
          } catch (logoError) {
            console.warn('Failed to embed logo in PDF:', logoError);
          }
        }
        
        y += 5;
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
  
  // Chart colors for pie charts and color dots
  const chartColors = [
    branding.chartPrimaryColor || '#D4A853',
    branding.chartSecondaryColor || '#6B8CAE',
    branding.accentColor || '#D4A853',
    '#7B9E87',
    '#A67B8A',
    '#8B7355',
    '#6B7B8A',
    '#9B8B6B',
  ];
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
        
        y = 10;
        
        // Render logo if available
        const logoUrl = config.logoUrl || branding.logoUrl;
        if (logoUrl) {
          try {
            // Fetch and embed the logo image
            const logoResponse = await fetch(logoUrl);
            const logoBlob = await logoResponse.blob();
            const logoBase64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(logoBlob);
            });
            
            // Determine logo size based on config
            const logoSize = config.logoSize || 'medium';
            const logoHeight = logoSize === 'small' ? 10 : logoSize === 'large' ? 20 : 15;
            const logoWidth = logoHeight * 2; // Assume 2:1 aspect ratio, will be constrained
            
            // Determine logo alignment
            const logoAlignment = config.logoAlignment || 'center';
            let logoX = pageWidth / 2 - logoWidth / 2; // center default
            if (logoAlignment === 'left') logoX = margin;
            if (logoAlignment === 'right') logoX = pageWidth - margin - logoWidth;
            
            doc.addImage(logoBase64, 'PNG', logoX, y, logoWidth, logoHeight);
            y += logoHeight + 5;
          } catch (logoError) {
            console.warn('Failed to embed logo in PDF:', logoError);
            // Continue without logo
          }
        }
        
        y += 5;
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
        addNewPageIfNeeded(60);
        
        // Draw section card background
        const allocCardHeight = 55;
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), allocCardHeight);
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

        const allocEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
        
        // Draw pie chart
        const pieX = margin + 25;
        const pieY = y + 18;
        const pieRadius = 15;
        let startAngle = -Math.PI / 2; // Start from top
        
        allocEntries.forEach(([_, value], i) => {
          const sliceAngle = totalValue > 0 ? (value / totalValue) * 2 * Math.PI : 0;
          const endAngle = startAngle + sliceAngle;
          
          // Draw pie slice
          doc.setFillColor(...hexToRgb(chartColors[i % chartColors.length]));
          
          // Create path for pie slice
          const centerX = pieX;
          const centerY = pieY;
          const segments = 20;
          const angleStep = sliceAngle / segments;
          
          // Build path points
          let path = `M ${centerX} ${centerY} `;
          for (let j = 0; j <= segments; j++) {
            const angle = startAngle + (j * angleStep);
            const x = centerX + pieRadius * Math.cos(angle);
            const y2 = centerY + pieRadius * Math.sin(angle);
            path += `L ${x} ${y2} `;
          }
          path += 'Z';
          
          // Draw as filled sector using lines
          doc.setDrawColor(...hexToRgb(chartColors[i % chartColors.length]));
          for (let j = 0; j < segments; j++) {
            const angle1 = startAngle + (j * angleStep);
            const angle2 = startAngle + ((j + 1) * angleStep);
            const x1 = centerX + pieRadius * Math.cos(angle1);
            const y1 = centerY + pieRadius * Math.sin(angle1);
            const x2 = centerX + pieRadius * Math.cos(angle2);
            const y2 = centerY + pieRadius * Math.sin(angle2);
            
            // Draw triangle for each segment
            doc.setFillColor(...hexToRgb(chartColors[i % chartColors.length]));
            const trianglePoints = [
              { x: centerX, y: centerY },
              { x: x1, y: y1 },
              { x: x2, y: y2 }
            ];
            // @ts-ignore - jsPDF supports triangle drawing
            doc.triangle(
              trianglePoints[0].x, trianglePoints[0].y,
              trianglePoints[1].x, trianglePoints[1].y,
              trianglePoints[2].x, trianglePoints[2].y,
              'F'
            );
          }
          
          startAngle = endAngle;
        });

        // Draw legend with data on the right side
        const legendX = margin + 55;
        let legendY = y + 4;
        
        allocEntries.slice(0, 5).forEach(([name, value], i) => {
          // Color dot
          doc.setFillColor(...hexToRgb(chartColors[i % chartColors.length]));
          doc.circle(legendX, legendY + 1.5, 2, 'F');
          
          // Name
          doc.setFontSize(9);
          doc.setTextColor(...hexToRgb(textColor));
          doc.text(name, legendX + 5, legendY + 2);
          
          // Value and percentage
          const pct = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
          doc.setTextColor(...hexToRgb(mutedTextColor));
          doc.text(`${formatCurrency(value)} (${pct}%)`, pageWidth - margin - 4, legendY + 2, { align: 'right' });
          
          legendY += 7;
        });

        y += allocCardHeight - 8;
        break;

      case 'currency_exposure':
        addNewPageIfNeeded(60);
        
        // Draw section card background
        const currencyCardHeight = 55;
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), currencyCardHeight);
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

        const currencyEntries = Object.entries(byCurrency).sort((a, b) => b[1] - a[1]);
        
        // Draw pie chart
        const currencyPieX = margin + 25;
        const currencyPieY = y + 18;
        const currencyPieRadius = 15;
        let currencyStartAngle = -Math.PI / 2; // Start from top
        
        currencyEntries.forEach(([_, value], i) => {
          const sliceAngle = totalValue > 0 ? (value / totalValue) * 2 * Math.PI : 0;
          const endAngle = currencyStartAngle + sliceAngle;
          
          // Draw pie slice using triangles
          const centerX = currencyPieX;
          const centerY = currencyPieY;
          const segments = 20;
          const angleStep = sliceAngle / segments;
          
          doc.setDrawColor(...hexToRgb(chartColors[i % chartColors.length]));
          for (let j = 0; j < segments; j++) {
            const angle1 = currencyStartAngle + (j * angleStep);
            const angle2 = currencyStartAngle + ((j + 1) * angleStep);
            const x1 = centerX + currencyPieRadius * Math.cos(angle1);
            const y1 = centerY + currencyPieRadius * Math.sin(angle1);
            const x2 = centerX + currencyPieRadius * Math.cos(angle2);
            const y2 = centerY + currencyPieRadius * Math.sin(angle2);
            
            doc.setFillColor(...hexToRgb(chartColors[i % chartColors.length]));
            // @ts-ignore - jsPDF supports triangle drawing
            doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
          }
          
          currencyStartAngle = endAngle;
        });

        // Draw legend with data on the right side
        const currencyLegendX = margin + 55;
        let currencyLegendY = y + 4;
        
        currencyEntries.slice(0, 5).forEach(([name, value], i) => {
          // Color dot
          doc.setFillColor(...hexToRgb(chartColors[i % chartColors.length]));
          doc.circle(currencyLegendX, currencyLegendY + 1.5, 2, 'F');
          
          // Name
          doc.setFontSize(9);
          doc.setTextColor(...hexToRgb(textColor));
          doc.text(name, currencyLegendX + 5, currencyLegendY + 2);
          
          // Value and percentage
          const pct = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
          doc.setTextColor(...hexToRgb(mutedTextColor));
          doc.text(`${formatCurrency(value)} (${pct}%)`, pageWidth - margin - 4, currencyLegendY + 2, { align: 'right' });
          
          currencyLegendY += 7;
        });

        y += currencyCardHeight - 8;
        break;

      case 'geographic_allocation':
        addNewPageIfNeeded(60);
        
        // Draw section card background
        const geoCardHeight = 55;
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), geoCardHeight);
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

        const geoEntries = Object.entries(byGeo).sort((a, b) => b[1] - a[1]);
        
        // Draw pie chart
        const geoPieX = margin + 25;
        const geoPieY = y + 18;
        const geoPieRadius = 15;
        let geoStartAngle = -Math.PI / 2; // Start from top
        
        geoEntries.forEach(([_, value], i) => {
          const sliceAngle = totalValue > 0 ? (value / totalValue) * 2 * Math.PI : 0;
          const endAngle = geoStartAngle + sliceAngle;
          
          // Draw pie slice using triangles
          const centerX = geoPieX;
          const centerY = geoPieY;
          const segments = 20;
          const angleStep = sliceAngle / segments;
          
          doc.setDrawColor(...hexToRgb(chartColors[i % chartColors.length]));
          for (let j = 0; j < segments; j++) {
            const angle1 = geoStartAngle + (j * angleStep);
            const angle2 = geoStartAngle + ((j + 1) * angleStep);
            const x1 = centerX + geoPieRadius * Math.cos(angle1);
            const y1 = centerY + geoPieRadius * Math.sin(angle1);
            const x2 = centerX + geoPieRadius * Math.cos(angle2);
            const y2 = centerY + geoPieRadius * Math.sin(angle2);
            
            doc.setFillColor(...hexToRgb(chartColors[i % chartColors.length]));
            // @ts-ignore - jsPDF supports triangle drawing
            doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
          }
          
          geoStartAngle = endAngle;
        });

        // Draw legend with data on the right side
        const geoLegendX = margin + 55;
        let geoLegendY = y + 4;
        
        geoEntries.slice(0, 5).forEach(([name, value], i) => {
          // Color dot
          doc.setFillColor(...hexToRgb(chartColors[i % chartColors.length]));
          doc.circle(geoLegendX, geoLegendY + 1.5, 2, 'F');
          
          // Name
          doc.setFontSize(9);
          doc.setTextColor(...hexToRgb(textColor));
          doc.text(name, geoLegendX + 5, geoLegendY + 2);
          
          // Value and percentage
          const pct = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : '0.0';
          doc.setTextColor(...hexToRgb(mutedTextColor));
          doc.text(`${formatCurrency(value)} (${pct}%)`, pageWidth - margin - 4, geoLegendY + 2, { align: 'right' });
          
          geoLegendY += 7;
        });

        y += geoCardHeight - 8;
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

      case 'contribution_chart':
        addNewPageIfNeeded(80);
        
        // Draw section card background
        const contribCardHeight = 75;
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), contribCardHeight);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('P/L CONTRIBUTION', margin + 4, y + 2);
        y += 12;

        // Get contribution data sorted by absolute value
        const contribMaxItems = config.maxItems || 10;
        const contributionData = holdings
          .filter(h => h.unrealizedPL !== undefined && h.unrealizedPL !== 0)
          .sort((a, b) => Math.abs(b.unrealizedPL || 0) - Math.abs(a.unrealizedPL || 0))
          .slice(0, contribMaxItems);

        if (contributionData.length > 0) {
          // Find max absolute value for scaling
          const maxAbsValue = Math.max(...contributionData.map(h => Math.abs(h.unrealizedPL || 0)));
          
          // Chart dimensions
          const chartX = margin + 35; // Leave space for ticker labels
          const chartWidth = pageWidth - margin - chartX - 50; // Leave space for value labels
          const barHeight = 5;
          const barSpacing = 6;
          const centerX = chartX + chartWidth / 2; // Center line for zero
          
          contributionData.forEach((holding, i) => {
            const barY = y + (i * barSpacing);
            const pl = holding.unrealizedPL || 0;
            const isPositive = pl >= 0;
            
            // Calculate bar width (proportional to max value)
            const barWidthRatio = Math.abs(pl) / maxAbsValue;
            const maxBarWidth = chartWidth / 2 - 2; // Half width minus padding
            const actualBarWidth = barWidthRatio * maxBarWidth;
            
            // Draw ticker label on the left
            doc.setFontSize(7);
            doc.setTextColor(...hexToRgb(textColor));
            doc.setFont('helvetica', 'bold');
            doc.text(holding.ticker, margin + 4, barY + 3.5);
            
            // Draw center line (zero axis) - just a thin vertical line
            doc.setDrawColor(...hexToRgb(borderColor));
            doc.setLineWidth(0.2);
            doc.line(centerX, y - 2, centerX, y + (contributionData.length * barSpacing));
            
            // Draw bar
            const barColor = isPositive ? positiveColor : negativeColor;
            doc.setFillColor(...hexToRgb(barColor));
            
            if (isPositive) {
              // Positive bar: draw from center to the right
              doc.roundedRect(centerX + 1, barY, actualBarWidth, barHeight, 1, 1, 'F');
            } else {
              // Negative bar: draw from center to the left
              doc.roundedRect(centerX - actualBarWidth - 1, barY, actualBarWidth, barHeight, 1, 1, 'F');
            }
            
            // Draw value label on the right
            doc.setFontSize(7);
            doc.setTextColor(...hexToRgb(isPositive ? positiveColor : negativeColor));
            doc.setFont('helvetica', 'normal');
            doc.text(formatCurrency(pl), pageWidth - margin - 4, barY + 3.5, { align: 'right' });
          });
          
          y += contributionData.length * barSpacing + 8;
        } else {
          doc.setFontSize(9);
          doc.setTextColor(...hexToRgb(mutedTextColor));
          doc.text('No P/L data available', margin + 4, y + 10);
          y += 20;
        }

        y += contribCardHeight - (contributionData.length * 6) - 15;
        break;

      case 'performance_calendar':
        addNewPageIfNeeded(70);
        
        // Draw section card background
        const calendarCardHeight = 65;
        drawCardBackground(margin, y - 2, pageWidth - (margin * 2), calendarCardHeight);
        drawAccentBar(y);
        y += 4;
        
        doc.setFontSize(11);
        doc.setTextColor(...hexToRgb(accentColor));
        doc.setFont('helvetica', 'bold');
        doc.text('MONTHLY RETURNS HEATMAP', margin + 4, y + 2);
        y += 10;

        // Get monthly returns data
        const monthlyReturns = performanceMetrics?.monthlyReturns || [];
        
        // Group by year and month
        const dataByYearMonth = new Map<string, number>();
        monthlyReturns.forEach(({ month, return: ret }) => {
          dataByYearMonth.set(month, ret);
        });

        // Get all years from data (most recent first)
        const calendarYears = [...new Set(monthlyReturns.map(d => d.month.split('-')[0]))].sort().reverse().slice(0, 4);
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Helper function to get color based on return value
        const getReturnColorHex = (ret: number | undefined): string => {
          if (ret === undefined) return mutedTextColor;
          
          const absRet = Math.abs(ret);
          
          if (ret >= 0) {
            // Green shades for positive
            if (absRet >= 10) return positiveColor;
            if (absRet >= 5) return '#3D8B40'; // Slightly dimmer green
            if (absRet >= 2) return '#2E6B30';
            if (absRet >= 0.5) return '#1F4B20';
            return '#153515';
          } else {
            // Red shades for negative
            if (absRet >= 10) return negativeColor;
            if (absRet >= 5) return '#CC4444';
            if (absRet >= 2) return '#993333';
            if (absRet >= 0.5) return '#662222';
            return '#441515';
          }
        };

        // Calculate cell dimensions
        const cellWidth = (pageWidth - (margin * 2) - 30 - 30) / 12; // 30 for year label, 30 for YTD
        const cellHeight = 8;
        const startX = margin + 30;
        let calY = y;

        // Draw header row with month names
        doc.setFontSize(6);
        doc.setTextColor(...hexToRgb(mutedTextColor));
        monthNames.forEach((monthName, idx) => {
          const cellX = startX + (idx * cellWidth);
          doc.text(monthName, cellX + cellWidth / 2, calY, { align: 'center' });
        });
        doc.text('YTD', startX + (12 * cellWidth) + 12, calY, { align: 'center' });
        calY += 5;

        // Draw each year row
        calendarYears.forEach((year) => {
          // Year label
          doc.setFontSize(8);
          doc.setTextColor(...hexToRgb(accentColor));
          doc.setFont('helvetica', 'bold');
          doc.text(year, margin + 4, calY + cellHeight / 2 + 1);

          // Calculate YTD for this year
          const yearReturns: number[] = [];
          
          // Draw month cells
          monthNames.forEach((_, idx) => {
            const monthKey = `${year}-${String(idx + 1).padStart(2, '0')}`;
            const ret = dataByYearMonth.get(monthKey);
            const cellX = startX + (idx * cellWidth);
            
            if (ret !== undefined) {
              yearReturns.push(ret);
            }
            
            // Draw cell background
            const cellColor = getReturnColorHex(ret);
            doc.setFillColor(...hexToRgb(cellColor));
            doc.rect(cellX, calY, cellWidth - 1, cellHeight, 'F');
            
            // Draw return value text
            doc.setFontSize(5);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'normal');
            if (ret !== undefined) {
              const displayVal = `${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%`;
              doc.text(displayVal, cellX + cellWidth / 2 - 0.5, calY + cellHeight / 2 + 1, { align: 'center' });
            } else {
              doc.setTextColor(...hexToRgb(mutedTextColor));
              doc.text('—', cellX + cellWidth / 2 - 0.5, calY + cellHeight / 2 + 1, { align: 'center' });
            }
          });

          // Calculate and draw YTD
          const ytdReturn = yearReturns.length > 0 
            ? (yearReturns.reduce((acc, r) => acc * (1 + r / 100), 1) - 1) * 100 
            : undefined;
          
          const ytdX = startX + (12 * cellWidth) + 2;
          const ytdColor = getReturnColorHex(ytdReturn);
          doc.setFillColor(...hexToRgb(ytdColor));
          doc.rect(ytdX, calY, 22, cellHeight, 'F');
          
          doc.setFontSize(6);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          if (ytdReturn !== undefined) {
            const ytdDisplayVal = `${ytdReturn >= 0 ? '+' : ''}${ytdReturn.toFixed(1)}%`;
            doc.text(ytdDisplayVal, ytdX + 11, calY + cellHeight / 2 + 1, { align: 'center' });
          } else {
            doc.setTextColor(...hexToRgb(mutedTextColor));
            doc.text('—', ytdX + 11, calY + cellHeight / 2 + 1, { align: 'center' });
          }

          calY += cellHeight + 2;
        });

        y += calendarCardHeight - 8;
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
