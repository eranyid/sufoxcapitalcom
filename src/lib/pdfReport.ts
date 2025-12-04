import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, MonthlyValuation, PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { ScenarioResult } from '@/lib/scenarioEngine';
import { shockTargetMeta, getHorizonLabel } from '@/data/scenarios';
import { format } from 'date-fns';

interface ReportData {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
}

export function generatePDFReport(data: ReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(15, 23, 42); // Navy background
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(212, 175, 55); // Gold text
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SUFOX Capital', 14, 25);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Investment Portfolio Report', 14, 33);
  doc.text(format(new Date(), 'MMMM dd, yyyy'), pageWidth - 14, 33, { align: 'right' });

  yPos = 50;

  // Executive Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, yPos);
  yPos += 10;

  if (data.performanceMetrics) {
    const metrics = data.performanceMetrics;
    const summaryData = [
      ['Total Portfolio Value', formatCurrency(metrics.totalValue)],
      ['Total P/L', formatCurrency(metrics.totalPL)],
      ['Realized P/L', formatCurrency(metrics.realizedPL)],
      ['Unrealized P/L', formatCurrency(metrics.unrealizedPL)],
      ['Total Return', formatPercent(metrics.totalReturn)],
      ['TWR (Time-Weighted Return)', formatPercent(metrics.twr)],
      ['IRR (Internal Rate of Return)', formatPercent(metrics.irr)],
      ['Win/Loss Ratio', metrics.winLossRatio.toFixed(2)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Value']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Risk Metrics
  if (data.riskMetrics && yPos < 200) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk Metrics', 14, yPos);
    yPos += 10;

    const riskData = [
      ['Volatility (Annualized)', formatPercent(data.riskMetrics.volatility)],
      ['Sharpe Ratio', data.riskMetrics.sharpeRatio.toFixed(2)],
      ['Sortino Ratio', data.riskMetrics.sortinoRatio.toFixed(2)],
      ['Maximum Drawdown', formatPercent(data.riskMetrics.maxDrawdown)],
      ['Value at Risk (95%)', formatPercent(data.riskMetrics.var95)],
      ['Value at Risk (99%)', formatPercent(data.riskMetrics.var99)],
      ['Beta to Benchmark', data.riskMetrics.beta.toFixed(2)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Risk Metric', 'Value']],
      body: riskData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Transactions Summary
  doc.addPage();
  yPos = 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Recent Transactions', 14, yPos);
  yPos += 10;

  if (data.transactions.length > 0) {
    const recentTx = data.transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    const txData = recentTx.map(tx => [
      format(new Date(tx.date), 'MM/dd/yyyy'),
      tx.assetName,
      tx.ticker,
      tx.transactionType.toUpperCase(),
      tx.quantity.toFixed(2),
      formatCurrency(tx.pricePerUnit),
      formatCurrency(tx.quantity * tx.pricePerUnit)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Asset', 'Ticker', 'Type', 'Qty', 'Price', 'Total']],
      body: txData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
      styles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No transactions recorded.', 14, yPos);
    yPos += 10;
  }

  // Monthly Performance
  if (data.performanceMetrics && data.performanceMetrics.monthlyReturns.length > 0) {
    if (yPos > 180) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Monthly Performance', 14, yPos);
    yPos += 10;

    const cumulativeMap = new Map(
      data.performanceMetrics.cumulativeReturns.map(c => [c.month, c.return])
    );

    const monthlyData = data.performanceMetrics.monthlyReturns.slice(-12).map(m => [
      m.month,
      formatPercent(m.return),
      formatPercent(cumulativeMap.get(m.month) || 0)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Month', 'Return', 'Cumulative']],
      body: monthlyData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `SUFOX Capital - Confidential | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  doc.save(`SUFOX_Portfolio_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Scenario Report PDF Export
export function generateScenarioPDFReport(result: ScenarioResult) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SUFOX Capital', 14, 22);
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Scenario Analysis Report', 14, 32);
  
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.text(format(new Date(), 'MMMM dd, yyyy HH:mm'), pageWidth - 14, 32, { align: 'right' });

  yPos = 55;

  // Scenario Overview
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Scenario: ' + result.definition.name, 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (result.definition.description) {
    doc.text(result.definition.description, 14, yPos);
    yPos += 6;
  }
  doc.text(`Type: ${result.definition.type.toUpperCase()} | Horizon: ${getHorizonLabel(result.definition.horizon)}`, 14, yPos);
  yPos += 12;

  // Summary Box
  const isPnlNegative = result.summary.totalPnlAbs < 0;
  doc.setFillColor(isPnlNegative ? 254 : 240, isPnlNegative ? 242 : 253, isPnlNegative ? 242 : 244);
  doc.roundedRect(14, yPos, pageWidth - 28, 35, 3, 3, 'F');
  
  doc.setTextColor(isPnlNegative ? 185 : 22, isPnlNegative ? 28 : 163, isPnlNegative ? 28 : 74);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(result.summary.totalPnlAbs), pageWidth / 2, yPos + 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text(formatPercent(result.summary.totalPnlPct), pageWidth / 2, yPos + 26, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('SCENARIO P&L IMPACT', pageWidth / 2, yPos + 33, { align: 'center' });
  
  yPos += 45;

  // Portfolio Values
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Portfolio Summary', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: [
      ['Portfolio Value (Before)', formatCurrency(result.summary.totalBefore)],
      ['Portfolio Value (After)', formatCurrency(result.summary.totalAfter)],
      ['P&L (Absolute)', formatCurrency(result.summary.totalPnlAbs)],
      ['P&L (Percentage)', formatPercent(result.summary.totalPnlPct)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Shock Parameters
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Shock Parameters Applied', 14, yPos);
  yPos += 8;

  const shockData = result.definition.shocks.map(shock => [
    shockTargetMeta[shock.target]?.label || shock.target,
    shockTargetMeta[shock.target]?.category || 'Other',
    `${shock.value > 0 ? '+' : ''}${shock.value}${shock.unit === 'bps' ? ' bps' : '%'}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Target', 'Category', 'Shock Value']],
    body: shockData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Impact by Asset Type
  if (Object.keys(result.summary.byAssetType).length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Impact by Asset Type', 14, yPos);
    yPos += 8;

    const assetTypeData = Object.entries(result.summary.byAssetType)
      .sort((a, b) => a[1].pnlAbs - b[1].pnlAbs)
      .map(([type, data]) => [
        type.replace(/_/g, ' ').toUpperCase(),
        formatCurrency(data.valueBefore),
        formatCurrency(data.valueAfter),
        formatCurrency(data.pnlAbs),
        formatPercent(data.pnlPct)
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Asset Type', 'Before', 'After', 'P&L', '%']],
      body: assetTypeData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // Impact by Geography
  if (Object.keys(result.summary.byGeography).length > 0) {
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Impact by Geography', 14, yPos);
    yPos += 8;

    const geoData = Object.entries(result.summary.byGeography)
      .sort((a, b) => a[1].pnlAbs - b[1].pnlAbs)
      .map(([geo, data]) => [
        geo.replace(/_/g, ' ').toUpperCase(),
        formatCurrency(data.valueBefore),
        formatCurrency(data.valueAfter),
        formatCurrency(data.pnlAbs),
        formatPercent(data.pnlPct)
      ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Geography', 'Before', 'After', 'P&L', '%']],
      body: geoData,
      theme: 'striped',
      headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // Detailed Holdings Impact
  doc.addPage();
  yPos = 20;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Holdings Impact', 14, yPos);
  yPos += 10;

  const holdingsData = result.perHolding.map(h => [
    h.ticker,
    h.name.length > 20 ? h.name.substring(0, 20) + '...' : h.name,
    h.assetType.replace(/_/g, ' '),
    formatCurrency(h.valueBefore),
    formatCurrency(h.pnlAbs),
    formatPercent(h.pnlPct)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Ticker', 'Name', 'Type', 'Value Before', 'P&L', '%']],
    body: holdingsData,
    theme: 'striped',
    headStyles: { fillColor: [15, 23, 42], textColor: [212, 175, 55] },
    styles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
    didParseCell: function(data) {
      // Color P&L columns based on value
      if (data.section === 'body' && (data.column.index === 4 || data.column.index === 5)) {
        const value = parseFloat(data.cell.raw?.toString().replace(/[^-\d.]/g, '') || '0');
        if (value < 0) {
          data.cell.styles.textColor = [185, 28, 28];
        } else if (value > 0) {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Risk Commentary
  if (yPos < 240) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Notes', 14, yPos);
    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    const worstHit = result.perHolding[0];
    const bestPerformer = result.perHolding[result.perHolding.length - 1];
    
    const notes = [
      `• Worst hit: ${worstHit?.ticker || 'N/A'} (${formatPercent(worstHit?.pnlPct || 0)})`,
      `• Best performer: ${bestPerformer?.ticker || 'N/A'} (${formatPercent(bestPerformer?.pnlPct || 0)})`,
      `• Total positions analyzed: ${result.perHolding.length}`,
      `• Scenario horizon: ${getHorizonLabel(result.definition.horizon)}`,
    ];

    notes.forEach(note => {
      doc.text(note, 14, yPos);
      yPos += 5;
    });
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `SUFOX Capital - Scenario Analysis | ${result.definition.name} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const safeName = result.definition.name.replace(/[^a-z0-9]/gi, '_');
  doc.save(`SUFOX_Scenario_${safeName}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
}
