import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, MonthlyValuation, PerformanceMetrics, RiskMetrics } from '@/types/investment';
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
