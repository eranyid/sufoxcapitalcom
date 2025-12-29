import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Report } from '@/types/reports';
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
