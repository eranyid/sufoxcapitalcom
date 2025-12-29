import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Report, ReportSection, ReportBranding } from '@/types/reports';
import type { Holding, PortfolioMetrics } from '@/types/investment';
import { formatCurrency, formatPercent } from '@/lib/calculations';

interface GeneratePDFOptions {
  report: Report;
  holdings: Holding[];
  metrics: PortfolioMetrics | null;
  kpis: { label: string; value: string | number; change?: number }[];
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

export async function generateReportPDF({ report, holdings, metrics, kpis, totalValue }: GeneratePDFOptions): Promise<void> {
  const pageFormat = report.page_size === 'Letter' ? 'letter' : 'a4';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: pageFormat,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
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
          ...kpis.slice(0, 5).map(k => [k.label, String(k.value)]),
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
          ['YTD Return', metrics ? formatPercent(metrics.ytdReturn) : '—'],
          ['Sharpe Ratio', metrics?.sharpe.toFixed(2) || '—'],
          ['Max Drawdown', metrics ? formatPercent(metrics.maxDrawdown) : '—'],
          ['Volatility', metrics ? formatPercent(metrics.volatility) : '—'],
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
          h.assetName,
          h.assetType,
          formatCurrency(h.currentValue),
          totalValue > 0 ? `${((h.currentValue / totalValue) * 100).toFixed(1)}%` : '0%',
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
          ['Volatility (Ann.)', metrics ? formatPercent(metrics.volatility) : '—'],
          ['Beta', metrics?.beta.toFixed(2) || '—'],
          ['VaR 95%', metrics ? formatPercent(metrics.var95) : '—'],
          ['Sharpe Ratio', metrics?.sharpe.toFixed(2) || '—'],
          ['Sortino Ratio', metrics?.sortino?.toFixed(2) || '—'],
          ['Max Drawdown', metrics ? formatPercent(metrics.maxDrawdown) : '—'],
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
