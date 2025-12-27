import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Bloomberg Terminal Theme Colors
const THEME = {
  bg: { r: 0, g: 0, b: 0 },
  bgSecondary: { r: 17, g: 17, b: 17 },
  accent: { r: 255, g: 140, b: 0 },
  accentYellow: { r: 255, g: 176, b: 0 },
  positive: { r: 0, g: 200, b: 83 },
  negative: { r: 255, g: 59, b: 48 },
  text: { r: 255, g: 255, b: 255 },
  textMuted: { r: 136, g: 136, b: 136 },
  border: { r: 51, g: 51, b: 51 },
  blue: { r: 59, g: 130, b: 246 },
};

// Interfaces
interface Holding {
  ticker: string;
  assetName: string;
  assetType: string;
  quantity: number;
  currentPrice: number;
  value: number;
  currentWeight: number;
  targetWeight: number;
}

interface SuggestedTrade {
  ticker: string;
  assetName: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  value: number;
  weightChange: number;
}

interface TaxOptimizedSell {
  ticker: string;
  assetName: string;
  requiredSellValue: number;
  requiredSellShares: number;
  selectedLots: {
    purchaseDate: string;
    sharesSold: number;
    realGain: number;
    taxImpact: number;
    purchaseCPI: number;
    currentCPI: number;
  }[];
  totalProceeds: number;
  totalNominalGain: number;
  totalRealGain: number;
  totalInflationAdjustment: number;
  taxEstimate: number;
  netProceeds: number;
}

interface RebalanceAnalysis {
  trades: SuggestedTrade[];
  taxOptimizedSells: TaxOptimizedSell[];
  totalTurnover: number;
  numberOfTrades: number;
  cashImpact: number;
  estimatedCost: number;
  trackingErrorImpact: number;
  beforeAllocation: { name: string; weight: number }[];
  afterAllocation: { name: string; weight: number }[];
  // Enhanced tax fields
  totalRealizedGains: number;
  totalRealizedLosses: number;
  grossTaxOnGains: number;
  taxShieldFromLosses: number;
  netTaxPayable: number;
  totalNetProceeds: number;
  targetsMet: boolean;
  warnings: string[];
}

export interface RebalanceReportData {
  analysis: RebalanceAnalysis;
  currentHoldings: Holding[];
  totalPortfolioValue: number;
  minTradeSize: number;
  cpiInfo: {
    currentCPI: number;
    source: string;
    firstDate: string;
    lastDate: string;
    error?: string;
  };
  policyApplied: boolean;
  equalWeightApplied: boolean;
}

function addPageBackground(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
}

function addHeader(doc: jsPDF, title: string, subtitle?: string, code?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Dark header background
  doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Accent line at top
  doc.setFillColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
  doc.rect(0, 0, pageWidth, 3, 'F');
  
  // SUFOX branding
  doc.setTextColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('SUFOX', 14, 28);
  
  // CAPITAL in yellow
  doc.setTextColor(THEME.accentYellow.r, THEME.accentYellow.g, THEME.accentYellow.b);
  doc.setFontSize(10);
  doc.text('CAPITAL', 14, 36);
  
  // Title on right
  doc.setTextColor(THEME.text.r, THEME.text.g, THEME.text.b);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth - 14, 24, { align: 'right' });
  
  // Subtitle/date
  doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle || format(new Date(), 'yyyy-MM-dd HH:mm:ss'), pageWidth - 14, 34, { align: 'right' });
  
  // Terminal code
  if (code) {
    doc.setTextColor(THEME.accentYellow.r, THEME.accentYellow.g, THEME.accentYellow.b);
    doc.setFontSize(8);
    doc.text(code, pageWidth - 14, 44, { align: 'right' });
  }
}

function addFooter(doc: jsPDF, pageNum: number, totalPages: number, section?: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Footer background
  doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  
  // Bottom accent line
  doc.setFillColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
  doc.rect(0, pageHeight - 2, pageWidth, 2, 'F');
  
  // Footer text
  doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
  doc.setFontSize(7);
  doc.text('SUFOX CAPITAL | CONFIDENTIAL | FOR EXECUTION PLANNING PURPOSES ONLY', 14, pageHeight - 8);
  
  if (section) {
    doc.text(section, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }
  
  doc.setTextColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
  doc.text(`${pageNum}/${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
}

function addSectionTitle(doc: jsPDF, title: string, yPos: number, code?: string): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Section divider line
  doc.setDrawColor(THEME.border.r, THEME.border.g, THEME.border.b);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, pageWidth - 14, yPos);
  
  yPos += 8;
  
  // Section title
  doc.setTextColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(title.toUpperCase(), 14, yPos);
  
  // Terminal code
  if (code) {
    doc.setTextColor(THEME.accentYellow.r, THEME.accentYellow.g, THEME.accentYellow.b);
    doc.setFontSize(8);
    doc.text(code, pageWidth - 14, yPos, { align: 'right' });
  }
  
  return yPos + 8;
}

const tableStyles = {
  theme: 'plain' as const,
  styles: {
    fontSize: 8,
    cellPadding: 3,
    textColor: [THEME.text.r, THEME.text.g, THEME.text.b] as [number, number, number],
    fillColor: [THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b] as [number, number, number],
    lineColor: [THEME.border.r, THEME.border.g, THEME.border.b] as [number, number, number],
    lineWidth: 0.1,
    font: 'helvetica',
  },
  headStyles: {
    fillColor: [THEME.bg.r, THEME.bg.g, THEME.bg.b] as [number, number, number],
    textColor: [THEME.accent.r, THEME.accent.g, THEME.accent.b] as [number, number, number],
    fontStyle: 'bold' as const,
    fontSize: 8,
  },
  alternateRowStyles: {
    fillColor: [THEME.bg.r, THEME.bg.g, THEME.bg.b] as [number, number, number],
  },
  margin: { left: 14, right: 14 },
};

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatFullCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function addKPIBox(doc: jsPDF, x: number, y: number, width: number, label: string, value: string, colorType: 'accent' | 'positive' | 'negative' | 'blue' | 'white' = 'white') {
  // Box background
  doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
  doc.rect(x, y, width, 28, 'F');
  
  // Top accent
  const colors = {
    accent: THEME.accent,
    positive: THEME.positive,
    negative: THEME.negative,
    blue: THEME.blue,
    white: THEME.text,
  };
  const accentColor = colors[colorType];
  doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
  doc.rect(x, y, width, 2, 'F');
  
  // Label
  doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text(label.toUpperCase(), x + 3, y + 10);
  
  // Value
  doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(value, x + 3, y + 22);
}

export function generateRebalanceReport(data: RebalanceReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const timestamp = format(now, 'yyyy-MM-dd_HH-mm');
  
  // Page tracking
  let currentPage = 1;
  const totalPages = 4; // We'll estimate and update if needed
  
  // ========================================
  // PAGE 1: Cover & Executive Summary
  // ========================================
  addPageBackground(doc);
  addHeader(doc, 'REBALANCE EXECUTION REPORT', format(now, 'yyyy-MM-dd HH:mm'), 'RBAL<GO>');
  
  let yPos = 60;
  
  // Cover info
  doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
  doc.rect(14, yPos, pageWidth - 28, 50, 'F');
  
  doc.setTextColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('SUFOX Capital', 20, yPos + 18);
  doc.setTextColor(THEME.text.r, THEME.text.g, THEME.text.b);
  doc.setFontSize(12);
  doc.text('Rebalance Execution Report', 20, yPos + 30);
  
  doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
  doc.setFontSize(9);
  doc.text(`Generated: ${format(now, 'MMMM dd, yyyy HH:mm:ss')}`, 20, yPos + 40);
  doc.text('Report Version: v1.0', pageWidth - 34, yPos + 40, { align: 'right' });
  
  yPos += 58;
  
  // Disclaimer
  doc.setFillColor(THEME.border.r, THEME.border.g, THEME.border.b);
  doc.rect(14, yPos, pageWidth - 28, 15, 'F');
  doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
  doc.setFontSize(7);
  doc.text('DISCLAIMER: For informational and execution planning purposes only. Verify all data before execution.', 18, yPos + 9);
  
  yPos += 22;
  
  // Executive Summary Section
  yPos = addSectionTitle(doc, 'Executive Summary', yPos, 'SUMM<GO>');
  
  // KPI Boxes Row 1
  const boxWidth = (pageWidth - 28 - 15) / 4;
  const { analysis } = data;
  
  const buyTrades = analysis.trades.filter(t => t.action === 'BUY').length;
  const sellTrades = analysis.trades.filter(t => t.action === 'SELL').length;
  
  addKPIBox(doc, 14, yPos, boxWidth, 'Portfolio Value', formatCurrency(data.totalPortfolioValue), 'accent');
  addKPIBox(doc, 14 + boxWidth + 5, yPos, boxWidth, 'Trades', `${analysis.numberOfTrades} (${buyTrades}B/${sellTrades}S)`, 'white');
  addKPIBox(doc, 14 + (boxWidth + 5) * 2, yPos, boxWidth, 'Turnover', formatCurrency(analysis.totalTurnover), 'white');
  addKPIBox(doc, 14 + (boxWidth + 5) * 3, yPos, boxWidth, 'Est. Cost', formatCurrency(analysis.estimatedCost), 'negative');
  
  yPos += 35;
  
  // KPI Boxes Row 2
  addKPIBox(doc, 14, yPos, boxWidth, 'Net Tax Payable', formatCurrency(analysis.netTaxPayable), 'blue');
  addKPIBox(doc, 14 + boxWidth + 5, yPos, boxWidth, 'Net Cash Impact', formatCurrency(analysis.cashImpact), analysis.cashImpact >= 0 ? 'positive' : 'negative');
  addKPIBox(doc, 14 + (boxWidth + 5) * 2, yPos, boxWidth, 'Targets Met', analysis.targetsMet ? 'YES' : 'PARTIAL', analysis.targetsMet ? 'positive' : 'accent');
  addKPIBox(doc, 14 + (boxWidth + 5) * 3, yPos, boxWidth, 'Net Proceeds', formatCurrency(analysis.totalNetProceeds), 'positive');
  
  yPos += 40;
  
  // Constraints Box
  yPos = addSectionTitle(doc, 'Execution Constraints', yPos, 'CNST<GO>');
  
  const constraintsData = [
    ['Min Trade Size', `${data.minTradeSize}% of portfolio`],
    ['Whole-Share Rounding', 'YES (Applied)'],
    ['Weight Mode', data.policyApplied ? 'Investment Policy' : data.equalWeightApplied ? 'Equal Weight' : 'Manual'],
    ['Tax Calculation', 'Israeli CGT 25% on Real Gains'],
    ['CPI Source', data.cpiInfo.source],
    ['CPI Data Range', `${data.cpiInfo.firstDate} → ${data.cpiInfo.lastDate}`],
    ['Current CPI', data.cpiInfo.currentCPI.toFixed(2)],
  ];
  
  autoTable(doc, {
    ...tableStyles,
    startY: yPos,
    head: [['CONSTRAINT', 'VALUE']],
    body: constraintsData,
    columnStyles: {
      0: { cellWidth: 60 },
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Warnings
  if (analysis.warnings.length > 0) {
    doc.setFillColor(80, 60, 0);
    doc.rect(14, yPos, pageWidth - 28, 5 + analysis.warnings.length * 8, 'F');
    doc.setTextColor(255, 200, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('WARNINGS:', 18, yPos + 8);
    doc.setFont('helvetica', 'normal');
    analysis.warnings.forEach((w, i) => {
      doc.text(`• ${w}`, 45, yPos + 8 + i * 8);
    });
    yPos += 8 + analysis.warnings.length * 8;
  }
  
  addFooter(doc, currentPage, totalPages, 'EXECUTIVE SUMMARY');
  
  // ========================================
  // PAGE 2: Rebalance Snapshot & Execution Blotter
  // ========================================
  doc.addPage();
  currentPage++;
  addPageBackground(doc);
  addHeader(doc, 'REBALANCE SNAPSHOT', 'Portfolio Allocation', 'SNAP<GO>');
  yPos = 60;
  
  yPos = addSectionTitle(doc, 'Rebalance Snapshot', yPos, 'ALLO<GO>');
  
  // Build snapshot data
  const snapshotData = data.currentHoldings.map(h => {
    const trade = analysis.trades.find(t => t.ticker === h.ticker);
    const taxData = analysis.taxOptimizedSells.find(s => s.ticker === h.ticker.toUpperCase());
    const weightDiff = h.targetWeight - h.currentWeight;
    const action = trade ? trade.action : (Math.abs(weightDiff) < data.minTradeSize ? 'HOLD' : '—');
    const notes: string[] = [];
    
    if (trade && trade.quantity !== Math.round(Math.abs((weightDiff / 100) * data.totalPortfolioValue) / h.currentPrice)) {
      notes.push('Rounded');
    }
    if (!trade && Math.abs(weightDiff) > 0 && Math.abs(weightDiff) < data.minTradeSize) {
      notes.push('Skip: Min size');
    }
    
    return {
      ticker: h.ticker,
      assetName: h.assetName.slice(0, 20),
      currentWeight: h.currentWeight.toFixed(2),
      targetWeight: h.targetWeight.toFixed(2),
      weightDiff: formatPercent(weightDiff),
      action,
      tradeValue: trade ? formatCurrency(trade.value) : '—',
      tradeQty: trade ? trade.quantity.toString() : '—',
      tax: taxData ? formatCurrency(taxData.taxEstimate) : '—',
      netProceeds: taxData ? formatCurrency(taxData.netProceeds) : (trade && trade.action === 'BUY' ? `-${formatCurrency(trade.value)}` : '—'),
      notes: notes.join(', ') || '—',
      isPositive: weightDiff >= 0,
      isSell: action === 'SELL',
    };
  });
  
  autoTable(doc, {
    ...tableStyles,
    startY: yPos,
    head: [['TICKER', 'ASSET', 'CURR %', 'TGT %', 'Δ', 'ACTION', 'VALUE', 'QTY', 'TAX', 'NET', 'NOTES']],
    body: snapshotData.map(r => [r.ticker, r.assetName, r.currentWeight, r.targetWeight, r.weightDiff, r.action, r.tradeValue, r.tradeQty, r.tax, r.netProceeds, r.notes]),
    columnStyles: {
      0: { cellWidth: 15, fontStyle: 'bold' },
      1: { cellWidth: 25 },
      2: { halign: 'right' as const, cellWidth: 13 },
      3: { halign: 'right' as const, cellWidth: 13 },
      4: { halign: 'right' as const, cellWidth: 13 },
      5: { halign: 'center' as const, cellWidth: 15 },
      6: { halign: 'right' as const, cellWidth: 18 },
      7: { halign: 'right' as const, cellWidth: 12 },
      8: { halign: 'right' as const, cellWidth: 15 },
      9: { halign: 'right' as const, cellWidth: 18 },
      10: { cellWidth: 25 },
    },
    didParseCell: function(hookData) {
      if (hookData.section === 'body') {
        const rowData = snapshotData[hookData.row.index];
        if (hookData.column.index === 4) {
          hookData.cell.styles.textColor = rowData.isPositive 
            ? [THEME.positive.r, THEME.positive.g, THEME.positive.b] 
            : [THEME.negative.r, THEME.negative.g, THEME.negative.b];
        }
        if (hookData.column.index === 5) {
          if (rowData.action === 'BUY') {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          } else if (rowData.action === 'SELL') {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          }
        }
        if (hookData.column.index === 8 && rowData.isSell) {
          hookData.cell.styles.textColor = [THEME.blue.r, THEME.blue.g, THEME.blue.b];
        }
      }
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Execution Blotter
  yPos = addSectionTitle(doc, 'Execution Blotter', yPos, 'BLOT<GO>');
  
  // Execution Checklist
  doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
  doc.rect(14, yPos, pageWidth - 28, 30, 'F');
  doc.setTextColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTION CHECKLIST:', 18, yPos + 8);
  doc.setTextColor(THEME.text.r, THEME.text.g, THEME.text.b);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const checklist = ['☐ Confirm liquidity/spreads', '☐ Confirm trading hours', '☐ Confirm restrictions', '☐ Confirm rounding applied'];
  checklist.forEach((item, i) => {
    doc.text(item, 18 + (i * 45), yPos + 18);
  });
  doc.text('☐ Verify prices current', 18, yPos + 26);
  doc.text('☐ Confirm order types', 63, yPos + 26);
  doc.text('☐ Check tax implications', 108, yPos + 26);
  
  yPos += 38;
  
  // Execution Table
  const executionData = analysis.trades.map((t, idx) => {
    const taxData = analysis.taxOptimizedSells.find(s => s.ticker === t.ticker.toUpperCase());
    const holding = data.currentHoldings.find(h => h.ticker === t.ticker);
    const priority = Math.abs(t.weightChange) >= 5 ? 'HIGH' : 'NORMAL';
    
    return {
      order: (idx + 1).toString(),
      action: t.action,
      ticker: t.ticker,
      qty: t.quantity.toString(),
      price: holding ? formatFullCurrency(holding.currentPrice) : 'N/A',
      notional: formatCurrency(t.value),
      rationale: 'Rebalance to target',
      priority,
    };
  });
  
  autoTable(doc, {
    ...tableStyles,
    startY: yPos,
    head: [['#', 'ACTION', 'TICKER', 'QTY', 'EST. PRICE', 'NOTIONAL', 'RATIONALE', 'PRIORITY']],
    body: executionData.map(r => [r.order, r.action, r.ticker, r.qty, r.price, r.notional, r.rationale, r.priority]),
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' as const },
      1: { cellWidth: 18, halign: 'center' as const },
      2: { cellWidth: 20, fontStyle: 'bold' },
      3: { cellWidth: 18, halign: 'right' as const },
      4: { cellWidth: 25, halign: 'right' as const },
      5: { cellWidth: 25, halign: 'right' as const },
      6: { cellWidth: 45 },
      7: { cellWidth: 20, halign: 'center' as const },
    },
    didParseCell: function(hookData) {
      if (hookData.section === 'body') {
        const rowData = executionData[hookData.row.index];
        if (hookData.column.index === 1) {
          hookData.cell.styles.textColor = rowData.action === 'BUY' 
            ? [THEME.positive.r, THEME.positive.g, THEME.positive.b]
            : [THEME.negative.r, THEME.negative.g, THEME.negative.b];
        }
        if (hookData.column.index === 7) {
          hookData.cell.styles.textColor = rowData.priority === 'HIGH'
            ? [THEME.negative.r, THEME.negative.g, THEME.negative.b]
            : [THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b];
        }
      }
    },
  });
  
  addFooter(doc, currentPage, totalPages, 'REBALANCE SNAPSHOT & BLOTTER');
  
  // ========================================
  // PAGE 3: Tax Impact Section
  // ========================================
  doc.addPage();
  currentPage++;
  addPageBackground(doc);
  addHeader(doc, 'TAX IMPACT ANALYSIS', 'Israeli CGT 25%', 'TAX<GO>');
  yPos = 60;
  
  yPos = addSectionTitle(doc, 'Tax Summary', yPos, 'TSUM<GO>');
  
  // Tax Summary KPIs
  const totalRealGain = analysis.taxOptimizedSells.reduce((sum, s) => sum + s.totalRealGain, 0);
  const totalInflationAdj = analysis.taxOptimizedSells.reduce((sum, s) => sum + s.totalInflationAdjustment, 0);
  const totalProceeds = analysis.taxOptimizedSells.reduce((sum, s) => sum + s.totalProceeds, 0);
  
  const taxBoxWidth = (pageWidth - 28 - 10) / 3;
  addKPIBox(doc, 14, yPos, taxBoxWidth, 'Total Real Gain', formatCurrency(totalRealGain), totalRealGain >= 0 ? 'positive' : 'negative');
  addKPIBox(doc, 14 + taxBoxWidth + 5, yPos, taxBoxWidth, 'Net Tax Payable', formatCurrency(analysis.netTaxPayable), 'blue');
  addKPIBox(doc, 14 + (taxBoxWidth + 5) * 2, yPos, taxBoxWidth, 'Net Proceeds After Tax', formatCurrency(analysis.totalNetProceeds), 'positive');
  
  yPos += 40;
  
  // Tax Method Info
  doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
  doc.rect(14, yPos, pageWidth - 28, 20, 'F');
  doc.setTextColor(THEME.blue.r, THEME.blue.g, THEME.blue.b);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ISRAELI TAX RULES:', 18, yPos + 8);
  doc.setTextColor(THEME.text.r, THEME.text.g, THEME.text.b);
  doc.setFont('helvetica', 'normal');
  doc.text('Real Gain = Sale Price - (Purchase Price × Current CPI ÷ Purchase CPI)', 18, yPos + 16);
  doc.text(`CPI Source: Israel CBS (${data.cpiInfo.source})`, pageWidth / 2 + 20, yPos + 16);
  
  yPos += 28;
  
  // Tax Breakdown by Asset
  if (analysis.taxOptimizedSells.length > 0) {
    yPos = addSectionTitle(doc, 'Tax Breakdown by Asset', yPos, 'TDET<GO>');
    
    const taxBreakdownData = analysis.taxOptimizedSells.map(s => [
      s.ticker,
      formatCurrency(s.totalProceeds),
      formatCurrency(s.totalNominalGain),
      formatCurrency(s.totalInflationAdjustment),
      formatCurrency(s.totalRealGain),
      formatCurrency(s.taxEstimate),
      formatCurrency(s.netProceeds),
    ]);
    
    autoTable(doc, {
      ...tableStyles,
      startY: yPos,
      head: [['TICKER', 'PROCEEDS', 'NOM. GAIN', 'CPI ADJ.', 'REAL GAIN', 'TAX (25%)', 'NET']],
      body: taxBreakdownData,
      columnStyles: {
        0: { cellWidth: 20, fontStyle: 'bold' },
        1: { halign: 'right' as const },
        2: { halign: 'right' as const },
        3: { halign: 'right' as const },
        4: { halign: 'right' as const },
        5: { halign: 'right' as const },
        6: { halign: 'right' as const },
      },
      didParseCell: function(hookData) {
        if (hookData.section === 'body') {
          const sellData = analysis.taxOptimizedSells[hookData.row.index];
          if (hookData.column.index === 4) {
            hookData.cell.styles.textColor = sellData.totalRealGain >= 0
              ? [THEME.positive.r, THEME.positive.g, THEME.positive.b]
              : [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          }
          if (hookData.column.index === 5) {
            hookData.cell.styles.textColor = [THEME.blue.r, THEME.blue.g, THEME.blue.b];
          }
        }
      },
      foot: [['TOTAL', formatCurrency(totalProceeds), '', formatCurrency(totalInflationAdj), formatCurrency(totalRealGain), formatCurrency(analysis.netTaxPayable), formatCurrency(analysis.totalNetProceeds)]],
      footStyles: {
        fillColor: [THEME.bg.r, THEME.bg.g, THEME.bg.b] as [number, number, number],
        textColor: [THEME.accent.r, THEME.accent.g, THEME.accent.b] as [number, number, number],
        fontStyle: 'bold' as const,
      },
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Tax Lot Details
    yPos = addSectionTitle(doc, 'Tax Lot Selection Details', yPos, 'LOTS<GO>');
    
    for (const sell of analysis.taxOptimizedSells) {
      // Check if we need a new page
      if (yPos > pageHeight - 80) {
        addFooter(doc, currentPage, totalPages, 'TAX IMPACT');
        doc.addPage();
        currentPage++;
        addPageBackground(doc);
        addHeader(doc, 'TAX LOT DETAILS', 'Continued', 'LOTS<GO>');
        yPos = 60;
      }
      
      // Ticker header
      doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
      doc.rect(14, yPos, pageWidth - 28, 12, 'F');
      doc.setTextColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(sell.ticker, 18, yPos + 8);
      doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Shares: ${sell.requiredSellShares} | Proceeds: ${formatCurrency(sell.totalProceeds)} | Tax: ${formatCurrency(sell.taxEstimate)}`, pageWidth - 20, yPos + 8, { align: 'right' });
      
      yPos += 15;
      
      const lotData = sell.selectedLots.map(lot => [
        format(new Date(lot.purchaseDate), 'MMM dd, yyyy'),
        lot.sharesSold.toString(),
        lot.purchaseCPI.toFixed(2),
        lot.currentCPI.toFixed(2),
        `+${((lot.currentCPI / lot.purchaseCPI - 1) * 100).toFixed(1)}%`,
        lot.realGain >= 0 ? `+${formatCurrency(lot.realGain)}` : formatCurrency(lot.realGain),
        formatCurrency(lot.taxImpact),
      ]);
      
      autoTable(doc, {
        ...tableStyles,
        startY: yPos,
        head: [['PURCHASE DATE', 'SHARES', 'PURCH CPI', 'CURR CPI', 'CPI ADJ', 'REAL GAIN', 'TAX']],
        body: lotData,
        styles: { ...tableStyles.styles, fontSize: 7 },
        headStyles: { ...tableStyles.headStyles, fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { halign: 'right' as const, cellWidth: 18 },
          2: { halign: 'right' as const, cellWidth: 22 },
          3: { halign: 'right' as const, cellWidth: 22 },
          4: { halign: 'center' as const, cellWidth: 22 },
          5: { halign: 'right' as const, cellWidth: 25 },
          6: { halign: 'right' as const, cellWidth: 22 },
        },
        didParseCell: function(hookData) {
          if (hookData.section === 'body') {
            const lot = sell.selectedLots[hookData.row.index];
            if (hookData.column.index === 5) {
              hookData.cell.styles.textColor = lot.realGain >= 0
                ? [THEME.positive.r, THEME.positive.g, THEME.positive.b]
                : [THEME.negative.r, THEME.negative.g, THEME.negative.b];
            }
            if (hookData.column.index === 6) {
              hookData.cell.styles.textColor = [THEME.blue.r, THEME.blue.g, THEME.blue.b];
            }
          }
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  } else {
    // No sells
    doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
    doc.setFontSize(9);
    doc.text('No SELL trades in this rebalance. Tax impact: $0.', 14, yPos);
    yPos += 15;
  }
  
  // CPI Warning if needed
  if (data.cpiInfo.error) {
    doc.setFillColor(80, 60, 0);
    doc.rect(14, yPos, pageWidth - 28, 15, 'F');
    doc.setTextColor(255, 200, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠ TAX WARNING:', 18, yPos + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`CPI data issue: ${data.cpiInfo.error}. Tax figures are estimates.`, 65, yPos + 10);
  }
  
  addFooter(doc, currentPage, totalPages, 'TAX IMPACT');
  
  // ========================================
  // PAGE 4: Post-Trade Portfolio & Audit Trail
  // ========================================
  doc.addPage();
  currentPage++;
  addPageBackground(doc);
  addHeader(doc, 'POST-TRADE & AUDIT', 'Final State', 'AUDT<GO>');
  yPos = 60;
  
  // Post-Trade Portfolio
  yPos = addSectionTitle(doc, 'Expected Post-Trade Allocation', yPos, 'POST<GO>');
  
  // Calculate post-trade weights
  const postTradeData = analysis.afterAllocation
    .sort((a, b) => b.weight - a.weight)
    .map(a => {
      const before = analysis.beforeAllocation.find(b => b.name === a.name);
      const beforeWeight = before ? before.weight : 0;
      const diff = a.weight - beforeWeight;
      return {
        ticker: a.name,
        beforeWeight: beforeWeight.toFixed(2) + '%',
        afterWeight: a.weight.toFixed(2) + '%',
        change: formatPercent(diff),
        changeNum: diff,
      };
    });
  
  autoTable(doc, {
    ...tableStyles,
    startY: yPos,
    head: [['TICKER', 'BEFORE', 'AFTER', 'CHANGE']],
    body: postTradeData.map(r => [r.ticker, r.beforeWeight, r.afterWeight, r.change]),
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold' },
      1: { halign: 'right' as const, cellWidth: 30 },
      2: { halign: 'right' as const, cellWidth: 30 },
      3: { halign: 'right' as const, cellWidth: 30 },
    },
    didParseCell: function(hookData) {
      if (hookData.section === 'body' && hookData.column.index === 3) {
        const rowData = postTradeData[hookData.row.index];
        hookData.cell.styles.textColor = rowData.changeNum >= 0
          ? [THEME.positive.r, THEME.positive.g, THEME.positive.b]
          : [THEME.negative.r, THEME.negative.g, THEME.negative.b];
      }
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Residual Drift Analysis
  yPos = addSectionTitle(doc, 'Residual Drift Causes', yPos, 'DRFT<GO>');
  
  const driftData = [
    ['Whole-share rounding', 'Applied to all trades - may cause minor weight deviations'],
    ['Min trade size filter', `${data.minTradeSize}% threshold - small deviations ignored`],
    ['Missing price data', analysis.warnings.some(w => w.includes('price')) ? 'Some assets affected' : 'None detected'],
    ['Target weight sum', Math.abs(analysis.afterAllocation.reduce((s, a) => s + a.weight, 0) - 100) < 0.5 ? '100% (OK)' : 'Deviation detected'],
  ];
  
  autoTable(doc, {
    ...tableStyles,
    startY: yPos,
    head: [['CAUSE', 'STATUS']],
    body: driftData,
    columnStyles: {
      0: { cellWidth: 50 },
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Audit Trail
  yPos = addSectionTitle(doc, 'Audit Trail', yPos, 'LOG<GO>');
  
  const auditData = [
    ['Report Generated', format(now, 'yyyy-MM-dd HH:mm:ss')],
    ['Min Trade Size', `${data.minTradeSize}%`],
    ['Whole Share Rounding', 'ENABLED'],
    ['CPI Adjustment', 'ENABLED'],
    ['Weight Mode', data.policyApplied ? 'Investment Policy' : data.equalWeightApplied ? 'Equal Weight' : 'Manual'],
    ['CPI Data Fetched', data.cpiInfo.error ? 'PARTIAL' : 'YES'],
    ['Holdings Priced', 'YES'],
    ['Total Holdings', data.currentHoldings.length.toString()],
    ['Total Trades Generated', analysis.numberOfTrades.toString()],
    ['Tax Calculation Method', 'Israeli CGT 25% on Real (CPI-adjusted) Gains'],
  ];
  
  autoTable(doc, {
    ...tableStyles,
    startY: yPos,
    head: [['PARAMETER', 'VALUE']],
    body: auditData,
    columnStyles: {
      0: { cellWidth: 60 },
    },
  });
  
  addFooter(doc, currentPage, totalPages, 'AUDIT TRAIL');
  
  // Save the PDF
  doc.save(`SUFOX_Rebalance_Report_${timestamp}.pdf`);
}
