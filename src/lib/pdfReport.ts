import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, MonthlyValuation, PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { ScenarioResult } from '@/lib/scenarioEngine';
import { shockTargetMeta, getHorizonLabel } from '@/data/scenarios';
import { FactorModelResults } from '@/lib/factorModel';
import { format } from 'date-fns';

// Monte Carlo Results interface for PDF
export interface MonteCarloResultsForPDF {
  horizonResults: {
    horizon: number;
    p5: number;
    p25: number;
    p50: number;
    p75: number;
    p95: number;
    probGain: number;
    probLoss: number;
    var95: number;
    cvar95: number;
    expectedValue: number;
  }[];
  currentValue: number;
  annualizedReturn: number;
  annualizedVol: number;
  numSimulations: number;
}

// Bloomberg Terminal Theme Colors
const THEME = {
  bg: { r: 11, g: 14, b: 17 },           // #0B0E11
  bgSecondary: { r: 22, g: 26, b: 31 },  // #161A1F
  accent: { r: 0, g: 230, b: 210 },      // #00E6D2 turquoise
  accentYellow: { r: 230, g: 255, b: 0 }, // #E6FF00
  positive: { r: 34, g: 197, b: 94 },    // green
  negative: { r: 239, g: 68, b: 68 },    // red
  text: { r: 255, g: 255, b: 255 },      // white
  textMuted: { r: 156, g: 163, b: 175 }, // gray
  border: { r: 55, g: 65, b: 81 },       // border gray
};

interface ReportData {
  transactions: Transaction[];
  valuations: MonthlyValuation[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  factorModel?: FactorModelResults | null;
  monteCarlo?: MonteCarloResultsForPDF | null;
}

function addTerminalHeader(doc: jsPDF, title: string, subtitle?: string) {
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
  const dateStr = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  doc.text(subtitle || dateStr, pageWidth - 14, 34, { align: 'right' });
  
  // Terminal code
  doc.setTextColor(THEME.accentYellow.r, THEME.accentYellow.g, THEME.accentYellow.b);
  doc.setFontSize(8);
  doc.text('RPT<GO>', pageWidth - 14, 44, { align: 'right' });
}

function addTerminalFooter(doc: jsPDF, pageNum: number, totalPages: number, context?: string) {
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
  doc.text('SUFOX CAPITAL | CONFIDENTIAL', 14, pageHeight - 8);
  
  if (context) {
    doc.text(context, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }
  
  doc.setTextColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
  doc.text(`${pageNum}/${totalPages}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
}

function addSectionHeader(doc: jsPDF, title: string, yPos: number, code?: string): number {
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

const terminalTableStyles = {
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

export function generatePDFReport(data: ReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Full page dark background
  doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
  
  addTerminalHeader(doc, 'PORTFOLIO REPORT', format(new Date(), 'yyyy-MM-dd HH:mm'));
  
  let yPos = 60;

  // Executive Summary with KPI boxes
  yPos = addSectionHeader(doc, 'Executive Summary', yPos, 'SUMM<GO>');

  if (data.performanceMetrics) {
    const metrics = data.performanceMetrics;
    
    // KPI Grid
    const kpis = [
      { label: 'TOTAL VALUE', value: formatCurrency(metrics.totalValue), color: 'white' },
      { label: 'TOTAL P/L', value: formatCurrency(metrics.totalPL), color: metrics.totalPL >= 0 ? 'positive' : 'negative' },
      { label: 'TOTAL RETURN', value: formatPercent(metrics.totalReturn), color: metrics.totalReturn >= 0 ? 'positive' : 'negative' },
      { label: 'TWR', value: formatPercent(metrics.twr), color: metrics.twr >= 0 ? 'positive' : 'negative' },
    ];

    const boxWidth = (pageWidth - 28 - 15) / 4;
    kpis.forEach((kpi, i) => {
      const x = 14 + i * (boxWidth + 5);
      
      // KPI box background
      doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
      doc.rect(x, yPos, boxWidth, 28, 'F');
      
      // Top accent
      const accentColor = kpi.color === 'positive' ? THEME.positive : 
                          kpi.color === 'negative' ? THEME.negative : THEME.accent;
      doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
      doc.rect(x, yPos, boxWidth, 2, 'F');
      
      // Label
      doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
      doc.setFontSize(6);
      doc.text(kpi.label, x + 3, yPos + 9);
      
      // Value
      doc.setTextColor(accentColor.r, accentColor.g, accentColor.b);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value, x + 3, yPos + 21);
    });

    yPos += 38;

    // Detailed Performance Metrics Table
    const summaryData = [
      ['Realized P/L', formatCurrency(metrics.realizedPL), metrics.realizedPL >= 0 ? 'pos' : 'neg'],
      ['Unrealized P/L', formatCurrency(metrics.unrealizedPL), metrics.unrealizedPL >= 0 ? 'pos' : 'neg'],
      ['IRR', formatPercent(metrics.irr), metrics.irr >= 0 ? 'pos' : 'neg'],
      ['Win/Loss Ratio', metrics.winLossRatio.toFixed(2), metrics.winLossRatio >= 1 ? 'pos' : 'neg'],
    ];

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['METRIC', 'VALUE', '']],
      body: summaryData.map(([metric, value]) => [metric, value, '']),
      didParseCell: function(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const rowData = summaryData[hookData.row.index];
          if (rowData[2] === 'pos') {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          } else if (rowData[2] === 'neg') {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          }
        }
      },
      columnStyles: {
        2: { cellWidth: 1 }, // Hide indicator column
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // Risk Metrics
  if (data.riskMetrics && yPos < 180) {
    yPos = addSectionHeader(doc, 'Risk Analytics', yPos, 'RISK<GO>');

    const riskData = [
      ['Volatility (Ann.)', formatPercent(data.riskMetrics.volatility)],
      ['Sharpe Ratio', data.riskMetrics.sharpeRatio.toFixed(3)],
      ['Sortino Ratio', data.riskMetrics.sortinoRatio.toFixed(3)],
      ['Max Drawdown', formatPercent(data.riskMetrics.maxDrawdown)],
      ['VaR 95%', formatPercent(data.riskMetrics.var95)],
      ['VaR 99%', formatPercent(data.riskMetrics.var99)],
      ['Beta', data.riskMetrics.beta.toFixed(3)],
    ];

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['RISK METRIC', 'VALUE']],
      body: riskData,
      didParseCell: function(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const metric = riskData[hookData.row.index][0];
          if (metric.includes('Drawdown') || metric.includes('VaR')) {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // Page 2: Transactions
  doc.addPage();
  doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
  addTerminalHeader(doc, 'TRANSACTIONS', 'Recent Activity');
  yPos = 60;

  yPos = addSectionHeader(doc, 'Recent Transactions', yPos, 'TXN<GO>');

  if (data.transactions.length > 0) {
    const recentTx = data.transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 25);

    const txData = recentTx.map(tx => [
      format(new Date(tx.date), 'yyyy-MM-dd'),
      tx.ticker,
      tx.transactionType.toUpperCase(),
      tx.quantity.toFixed(2),
      formatCurrency(tx.pricePerUnit),
      formatCurrency(tx.quantity * tx.pricePerUnit)
    ]);

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['DATE', 'TICKER', 'TYPE', 'QTY', 'PRICE', 'TOTAL']],
      body: txData,
      didParseCell: function(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const type = hookData.cell.raw?.toString();
          if (type === 'BUY') {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          } else if (type === 'SELL') {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  } else {
    doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
    doc.setFontSize(9);
    doc.text('No transactions recorded.', 14, yPos);
    yPos += 10;
  }

  // Monthly Performance
  if (data.performanceMetrics && data.performanceMetrics.monthlyReturns.length > 0) {
    if (yPos > 160) {
      doc.addPage();
      doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
      addTerminalHeader(doc, 'PERFORMANCE', 'Monthly Returns');
      yPos = 60;
    }

    yPos = addSectionHeader(doc, 'Monthly Performance', yPos, 'PERF<GO>');

    const cumulativeMap = new Map(
      data.performanceMetrics.cumulativeReturns.map(c => [c.month, c.return])
    );

    const monthlyData = data.performanceMetrics.monthlyReturns.slice(-12).map(m => [
      m.month,
      formatPercent(m.return),
      formatPercent(cumulativeMap.get(m.month) || 0),
      m.return >= 0 ? 'pos' : 'neg'
    ]);

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['MONTH', 'RETURN', 'CUMULATIVE', '']],
      body: monthlyData.map(([month, ret, cum]) => [month, ret, cum, '']),
      didParseCell: function(hookData) {
        if (hookData.section === 'body' && (hookData.column.index === 1 || hookData.column.index === 2)) {
          const rowData = monthlyData[hookData.row.index];
          if (rowData[3] === 'pos') {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          } else {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          }
        }
      },
      columnStyles: {
        3: { cellWidth: 1 },
      },
    });
  }

  // Monte Carlo Simulation Section
  if (data.monteCarlo && data.monteCarlo.horizonResults.length > 0) {
    doc.addPage();
    doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
    addTerminalHeader(doc, 'MONTE CARLO', 'Risk Simulation');
    yPos = 60;

    yPos = addSectionHeader(doc, 'Monte Carlo Simulation', yPos, 'MC<GO>');

    // Monte Carlo Configuration
    const mcConfig = [
      ['Current Portfolio Value', formatCurrency(data.monteCarlo.currentValue)],
      ['Expected Annual Return', formatPercent(data.monteCarlo.annualizedReturn)],
      ['Annual Volatility', `${data.monteCarlo.annualizedVol.toFixed(1)}%`],
      ['Simulations Run', data.monteCarlo.numSimulations.toLocaleString()],
      ['Model', 'Geometric Brownian Motion (GBM)'],
    ];

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['PARAMETER', 'VALUE']],
      body: mcConfig,
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Horizon Results Table
    yPos = addSectionHeader(doc, 'Portfolio Projections by Horizon', yPos, 'PROJ<GO>');

    const horizonData = data.monteCarlo.horizonResults.map(h => [
      `${h.horizon} Years`,
      formatCurrency(h.p5),
      formatCurrency(h.p25),
      formatCurrency(h.p50),
      formatCurrency(h.p75),
      formatCurrency(h.p95),
    ]);

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['HORIZON', '5th %ile', '25th %ile', 'MEDIAN', '75th %ile', '95th %ile']],
      body: horizonData,
      didParseCell: function(hookData) {
        if (hookData.section === 'head') {
          if (hookData.column.index >= 1 && hookData.column.index <= 2) {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          } else if (hookData.column.index >= 4) {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Risk Metrics from Monte Carlo
    yPos = addSectionHeader(doc, 'Probability & Risk Metrics', yPos, 'RISK<GO>');

    const mcRiskData = data.monteCarlo.horizonResults.map(h => [
      `${h.horizon} Years`,
      `${h.probGain.toFixed(1)}%`,
      `${h.probLoss.toFixed(1)}%`,
      formatPercent(h.var95),
      formatPercent(h.cvar95),
      formatCurrency(h.expectedValue),
    ]);

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['HORIZON', 'P(GAIN)', 'P(LOSS)', 'VaR 95%', 'CVaR 95%', 'EXP. VALUE']],
      body: mcRiskData,
      didParseCell: function(hookData) {
        if (hookData.section === 'body') {
          if (hookData.column.index === 1) {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          } else if (hookData.column.index === 2 || hookData.column.index === 3 || hookData.column.index === 4) {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // Factor Model Section
  if (data.factorModel) {
    doc.addPage();
    doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
    addTerminalHeader(doc, 'FACTOR MODEL', 'Risk Attribution');
    yPos = 60;

    // Systematic vs Specific Risk Summary
    yPos = addSectionHeader(doc, 'Risk Decomposition', yPos, 'FMOD<GO>');

    // Risk decomposition boxes
    const halfWidth = (pageWidth - 38) / 2;
    
    // Systematic risk box
    doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
    doc.rect(14, yPos, halfWidth, 35, 'F');
    doc.setFillColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
    doc.rect(14, yPos, halfWidth, 2, 'F');
    
    doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
    doc.setFontSize(7);
    doc.text('SYSTEMATIC RISK (FACTOR-DRIVEN)', 18, yPos + 10);
    doc.setTextColor(THEME.accent.r, THEME.accent.g, THEME.accent.b);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.factorModel.systematicPct.toFixed(1)}%`, 18, yPos + 26);

    // Specific risk box
    doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
    doc.rect(24 + halfWidth, yPos, halfWidth, 35, 'F');
    doc.setFillColor(THEME.accentYellow.r, THEME.accentYellow.g, THEME.accentYellow.b);
    doc.rect(24 + halfWidth, yPos, halfWidth, 2, 'F');
    
    doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
    doc.setFontSize(7);
    doc.text('SPECIFIC RISK (IDIOSYNCRATIC)', 28 + halfWidth, yPos + 10);
    doc.setTextColor(THEME.accentYellow.r, THEME.accentYellow.g, THEME.accentYellow.b);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${data.factorModel.specificPct.toFixed(1)}%`, 28 + halfWidth, yPos + 26);

    yPos += 45;

    // Additional factor model stats
    const fmStats = [
      ['Total Variance', `${(data.factorModel.totalVariance * 100).toFixed(4)}%`],
      ['Systematic Variance', `${(data.factorModel.systematicVariance * 100).toFixed(4)}%`],
      ['Specific Variance', `${(data.factorModel.specificVariance * 100).toFixed(4)}%`],
      ['Residual Volatility (Ann.)', `${data.factorModel.residualVolatility.toFixed(2)}%`],
    ];

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['VARIANCE DECOMPOSITION', 'VALUE']],
      body: fmStats,
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Factor Exposures
    yPos = addSectionHeader(doc, 'Factor Exposures (Betas)', yPos, 'BETA<GO>');

    const exposureData = data.factorModel.exposures.slice(0, 12).map(exp => [
      exp.factorLabel,
      exp.factorType.toUpperCase(),
      exp.beta.toFixed(3),
      exp.tStat.toFixed(2),
      `${(exp.r2 * 100).toFixed(1)}%`,
      exp.pValue < 0.01 ? '***' : exp.pValue < 0.05 ? '**' : exp.pValue < 0.10 ? '*' : '',
    ]);

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['FACTOR', 'TYPE', 'BETA', 't-STAT', 'R²', 'SIG']],
      body: exposureData,
      didParseCell: function(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 2) {
          const beta = parseFloat(hookData.cell.raw?.toString() || '0');
          if (beta > 0) {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          } else if (beta < 0) {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          }
        }
        if (hookData.section === 'body' && hookData.column.index === 5) {
          hookData.cell.styles.textColor = [THEME.accentYellow.r, THEME.accentYellow.g, THEME.accentYellow.b];
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;

    // Factor Risk Contribution
    if (yPos > 200) {
      doc.addPage();
      doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
      addTerminalHeader(doc, 'FACTOR MODEL', 'Risk Contribution');
      yPos = 60;
    }

    yPos = addSectionHeader(doc, 'Factor Risk Contribution', yPos, 'FRSK<GO>');

    const riskContribData = data.factorModel.risk
      .filter(r => Math.abs(r.contributionPct) > 0.5)
      .slice(0, 10)
      .map(r => [
        r.factorLabel,
        `${r.contributionPct.toFixed(1)}%`,
        r.contributionPct >= 0 ? 'pos' : 'neg'
      ]);

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['FACTOR', 'CONTRIBUTION TO RISK', '']],
      body: riskContribData.map(([factor, contrib]) => [factor, contrib, '']),
      didParseCell: function(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 1) {
          const rowData = riskContribData[hookData.row.index];
          if (rowData[2] === 'pos') {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          } else {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          }
        }
      },
      columnStyles: {
        2: { cellWidth: 1 },
      },
    });
  }

  // Add footers to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addTerminalFooter(doc, i, pageCount, 'PORTFOLIO ANALYTICS');
  }

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
  
  // Full page dark background
  doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
  
  addTerminalHeader(doc, 'SCENARIO ANALYSIS', result.definition.name);
  
  let yPos = 60;

  // Scenario Overview
  yPos = addSectionHeader(doc, 'Scenario Definition', yPos, 'SCN<GO>');
  
  doc.setTextColor(THEME.text.r, THEME.text.g, THEME.text.b);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(result.definition.name, 14, yPos);
  yPos += 6;
  
  if (result.definition.description) {
    doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(result.definition.description, pageWidth - 28);
    doc.text(lines, 14, yPos);
    yPos += lines.length * 4 + 4;
  }
  
  doc.setTextColor(THEME.accentYellow.r, THEME.accentYellow.g, THEME.accentYellow.b);
  doc.setFontSize(8);
  doc.text(`TYPE: ${result.definition.type.toUpperCase()} | HORIZON: ${getHorizonLabel(result.definition.horizon)}`, 14, yPos);
  yPos += 12;

  // P&L Impact Box
  const isPnlNegative = result.summary.totalPnlAbs < 0;
  const pnlColor = isPnlNegative ? THEME.negative : THEME.positive;
  
  doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
  doc.rect(14, yPos, pageWidth - 28, 40, 'F');
  
  // Top accent
  doc.setFillColor(pnlColor.r, pnlColor.g, pnlColor.b);
  doc.rect(14, yPos, pageWidth - 28, 3, 'F');
  
  doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
  doc.setFontSize(8);
  doc.text('SCENARIO P&L IMPACT', pageWidth / 2, yPos + 12, { align: 'center' });
  
  doc.setTextColor(pnlColor.r, pnlColor.g, pnlColor.b);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(result.summary.totalPnlAbs), pageWidth / 2, yPos + 28, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(formatPercent(result.summary.totalPnlPct), pageWidth / 2, yPos + 38, { align: 'center' });
  
  yPos += 52;

  // Portfolio Summary Table
  yPos = addSectionHeader(doc, 'Portfolio Summary', yPos, 'PORT<GO>');

  autoTable(doc, {
    ...terminalTableStyles,
    startY: yPos,
    head: [['METRIC', 'VALUE']],
    body: [
      ['Value Before', formatCurrency(result.summary.totalBefore)],
      ['Value After', formatCurrency(result.summary.totalAfter)],
      ['P&L (Absolute)', formatCurrency(result.summary.totalPnlAbs)],
      ['P&L (Percentage)', formatPercent(result.summary.totalPnlPct)],
    ],
    didParseCell: function(hookData) {
      if (hookData.section === 'body' && hookData.column.index === 1) {
        const metric = hookData.row.index;
        if (metric >= 2) {
          hookData.cell.styles.textColor = isPnlNegative 
            ? [THEME.negative.r, THEME.negative.g, THEME.negative.b]
            : [THEME.positive.r, THEME.positive.g, THEME.positive.b];
        }
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Shock Parameters
  yPos = addSectionHeader(doc, 'Shock Parameters', yPos, 'SHCK<GO>');

  const shockData = result.definition.shocks.map(shock => [
    shockTargetMeta[shock.target]?.label || shock.target,
    shockTargetMeta[shock.target]?.category || 'Other',
    `${shock.value > 0 ? '+' : ''}${shock.value}${shock.unit === 'bps' ? ' bps' : '%'}`
  ]);

  autoTable(doc, {
    ...terminalTableStyles,
    startY: yPos,
    head: [['TARGET', 'CATEGORY', 'SHOCK']],
    body: shockData,
    didParseCell: function(hookData) {
      if (hookData.section === 'body' && hookData.column.index === 2) {
        const value = parseFloat(hookData.cell.raw?.toString().replace(/[^-\d.]/g, '') || '0');
        if (value < 0) {
          hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
        } else if (value > 0) {
          hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
        }
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Impact by Asset Type
  if (Object.keys(result.summary.byAssetType).length > 0) {
    if (yPos > 180) {
      doc.addPage();
      doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
      addTerminalHeader(doc, 'SCENARIO ANALYSIS', 'Impact Breakdown');
      yPos = 60;
    }

    yPos = addSectionHeader(doc, 'Impact by Asset Type', yPos, 'ATYP<GO>');

    const assetTypeData = Object.entries(result.summary.byAssetType)
      .sort((a, b) => a[1].pnlAbs - b[1].pnlAbs)
      .map(([type, data]) => [
        type.replace(/_/g, ' ').toUpperCase(),
        formatCurrency(data.valueBefore),
        formatCurrency(data.valueAfter),
        formatCurrency(data.pnlAbs),
        formatPercent(data.pnlPct),
        data.pnlAbs < 0 ? 'neg' : 'pos'
      ]);

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['ASSET TYPE', 'BEFORE', 'AFTER', 'P&L', '%', '']],
      body: assetTypeData.map(row => row.slice(0, 5)),
      didParseCell: function(hookData) {
        if (hookData.section === 'body' && (hookData.column.index === 3 || hookData.column.index === 4)) {
          const rowData = assetTypeData[hookData.row.index];
          if (rowData[5] === 'neg') {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          } else {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // Impact by Geography
  if (Object.keys(result.summary.byGeography).length > 0) {
    if (yPos > 200) {
      doc.addPage();
      doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
      doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
      addTerminalHeader(doc, 'SCENARIO ANALYSIS', 'Geographic Impact');
      yPos = 60;
    }

    yPos = addSectionHeader(doc, 'Impact by Geography', yPos, 'GEO<GO>');

    const geoData = Object.entries(result.summary.byGeography)
      .sort((a, b) => a[1].pnlAbs - b[1].pnlAbs)
      .map(([geo, data]) => [
        geo.replace(/_/g, ' ').toUpperCase(),
        formatCurrency(data.valueBefore),
        formatCurrency(data.valueAfter),
        formatCurrency(data.pnlAbs),
        formatPercent(data.pnlPct),
        data.pnlAbs < 0 ? 'neg' : 'pos'
      ]);

    autoTable(doc, {
      ...terminalTableStyles,
      startY: yPos,
      head: [['GEOGRAPHY', 'BEFORE', 'AFTER', 'P&L', '%', '']],
      body: geoData.map(row => row.slice(0, 5)),
      didParseCell: function(hookData) {
        if (hookData.section === 'body' && (hookData.column.index === 3 || hookData.column.index === 4)) {
          const rowData = geoData[hookData.row.index];
          if (rowData[5] === 'neg') {
            hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
          } else {
            hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // Detailed Holdings Impact - New Page
  doc.addPage();
  doc.setFillColor(THEME.bgSecondary.r, THEME.bgSecondary.g, THEME.bgSecondary.b);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
  addTerminalHeader(doc, 'SCENARIO ANALYSIS', 'Holdings Detail');
  yPos = 60;

  yPos = addSectionHeader(doc, 'Holdings Impact Detail', yPos, 'HLDG<GO>');

  const holdingsData = result.perHolding.map(h => [
    h.ticker,
    h.name.length > 18 ? h.name.substring(0, 18) + '...' : h.name,
    h.assetType.replace(/_/g, ' ').substring(0, 10),
    formatCurrency(h.valueBefore),
    formatCurrency(h.pnlAbs),
    formatPercent(h.pnlPct),
    h.pnlAbs < 0 ? 'neg' : 'pos'
  ]);

  autoTable(doc, {
    ...terminalTableStyles,
    startY: yPos,
    head: [['TICKER', 'NAME', 'TYPE', 'VALUE', 'P&L', '%', '']],
    body: holdingsData.map(row => row.slice(0, 6)),
    didParseCell: function(hookData) {
      if (hookData.section === 'body' && (hookData.column.index === 4 || hookData.column.index === 5)) {
        const rowData = holdingsData[hookData.row.index];
        if (rowData[6] === 'neg') {
          hookData.cell.styles.textColor = [THEME.negative.r, THEME.negative.g, THEME.negative.b];
        } else {
          hookData.cell.styles.textColor = [THEME.positive.r, THEME.positive.g, THEME.positive.b];
        }
      }
      // Highlight ticker column
      if (hookData.section === 'body' && hookData.column.index === 0) {
        hookData.cell.styles.textColor = [THEME.accentYellow.r, THEME.accentYellow.g, THEME.accentYellow.b];
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Analysis Summary
  if (yPos < 220) {
    yPos = addSectionHeader(doc, 'Analysis Summary', yPos, 'ANLS<GO>');

    const worstHit = result.perHolding[0];
    const bestPerformer = result.perHolding[result.perHolding.length - 1];

    doc.setFillColor(THEME.bg.r, THEME.bg.g, THEME.bg.b);
    doc.rect(14, yPos, pageWidth - 28, 45, 'F');

    doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
    doc.setFontSize(8);
    
    let textY = yPos + 10;
    doc.text('WORST PERFORMER', 20, textY);
    doc.setTextColor(THEME.negative.r, THEME.negative.g, THEME.negative.b);
    doc.setFontSize(10);
    doc.text(`${worstHit?.ticker || 'N/A'} ${formatPercent(worstHit?.pnlPct || 0)}`, 20, textY + 8);

    doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
    doc.setFontSize(8);
    doc.text('BEST PERFORMER', pageWidth / 2 + 10, textY);
    doc.setTextColor(THEME.positive.r, THEME.positive.g, THEME.positive.b);
    doc.setFontSize(10);
    doc.text(`${bestPerformer?.ticker || 'N/A'} ${formatPercent(bestPerformer?.pnlPct || 0)}`, pageWidth / 2 + 10, textY + 8);

    doc.setTextColor(THEME.textMuted.r, THEME.textMuted.g, THEME.textMuted.b);
    doc.setFontSize(8);
    textY += 22;
    doc.text(`POSITIONS ANALYZED: ${result.perHolding.length}`, 20, textY);
    doc.text(`SCENARIO HORIZON: ${getHorizonLabel(result.definition.horizon)}`, pageWidth / 2 + 10, textY);
  }

  // Add footers to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addTerminalFooter(doc, i, pageCount, result.definition.name.toUpperCase());
  }

  const safeName = result.definition.name.replace(/[^a-z0-9]/gi, '_');
  doc.save(`SUFOX_Scenario_${safeName}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
}
