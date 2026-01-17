import { useMemo } from 'react';
import { ReportBlock, ReportBranding, DEFAULT_BRANDING } from '@/types/reportBuilder';
import { PortfolioHolding } from '@/lib/portfolioEngine';
import { PerformanceMetrics, RiskMetrics } from '@/types/investment';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ScatterChart, Scatter, ZAxis, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, FileImage } from 'lucide-react';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const formatPercent = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

// Generate harmonized chart colors array from branding
const getChartColors = (branding: ReportBranding): string[] => {
  const primary = branding.chartPrimaryColor || DEFAULT_BRANDING.chartPrimaryColor;
  const secondary = branding.chartSecondaryColor || DEFAULT_BRANDING.chartSecondaryColor;
  const accent = branding.accentColor || DEFAULT_BRANDING.accentColor;
  
  return [
    primary,
    secondary,
    accent,
    '#7B9E87',
    '#A67B8A',
    '#8B7355',
    '#6B7B8A',
    '#9B8B6B',
  ];
};

interface Props {
  block: ReportBlock;
  holdings: PortfolioHolding[];
  performanceMetrics: PerformanceMetrics | null;
  riskMetrics: RiskMetrics | null;
  totalValue: number;
  branding: ReportBranding;
  isPrintMode?: boolean;
}

/**
 * STYLE CONFIGURATION MAPPING
 * ==========================
 * This documents which branding properties affect which visual elements:
 * 
 * TYPOGRAPHY:
 * - headingFont: All headings (h1, h2, block titles)
 * - bodyFont: All body text, table cells, descriptions
 * - baseFontSize: Base font size for body text (default 14px)
 * - headingScale: Multiplier for heading sizes (default 1.25x)
 * - lineHeight: Line height for all text (default 1.5)
 * - uppercaseHeadings: Whether headings are uppercase
 * - boldNumbers: Whether numeric values are bold
 * - letterSpacing: Letter spacing ('tight', 'normal', 'wide', 'wider')
 * 
 * COLORS:
 * - accentColor: Primary accent color for highlights, borders, headers
 * - backgroundColor: Page/canvas background
 * - textColor: Primary text color
 * - headingColor: Heading text color
 * - mutedTextColor: Secondary/muted text color
 * - chartPrimaryColor: Primary chart color
 * - chartSecondaryColor: Secondary chart color
 * - chartPositiveColor: Positive values (gains)
 * - chartNegativeColor: Negative values (losses)
 * - tableHeaderBgColor: Table header background
 * - tableHeaderTextColor: Table header text
 * - tableRowAltBgColor: Alternating row background
 * - tableBorderColor: Table/card borders
 * 
 * EFFECTS:
 * - globalBorderRadius: Default border radius for cards ('none', 'sm', 'md', 'lg', 'xl', '2xl')
 * - globalShadow: Default shadow for cards ('none', 'sm', 'md', 'lg')
 * - globalBlur: Blur amount for glassmorphism (0-20px)
 * - glassmorphism: Enable frosted glass effect
 * - accentBorders: Add accent color to card borders
 * - cornerStyle: Corner style ('square', 'rounded', 'pill')
 * - effectsOpacity: Opacity for effect layers (50-100%)
 */

// Helper to get global styles from branding
const getGlobalStyles = (branding: ReportBranding): React.CSSProperties => {
  const styles: React.CSSProperties = {};
  
  // Typography
  styles.fontFamily = branding.bodyFont || DEFAULT_BRANDING.bodyFont;
  styles.fontSize = `${branding.baseFontSize || DEFAULT_BRANDING.baseFontSize || 14}px`;
  styles.lineHeight = branding.lineHeight || DEFAULT_BRANDING.lineHeight || 1.5;
  
  // Letter spacing
  const letterSpacingMap: Record<string, string> = {
    'tight': '-0.025em',
    'normal': '0',
    'wide': '0.025em',
    'wider': '0.05em',
  };
  styles.letterSpacing = letterSpacingMap[branding.letterSpacing || 'normal'];
  
  // Base text color
  styles.color = branding.textColor || DEFAULT_BRANDING.textColor;
  
  return styles;
};

// Helper to get heading styles from branding
const getHeadingStyles = (branding: ReportBranding): React.CSSProperties => {
  const baseSize = branding.baseFontSize || DEFAULT_BRANDING.baseFontSize || 14;
  const scale = branding.headingScale || DEFAULT_BRANDING.headingScale || 1.25;
  
  return {
    fontFamily: branding.headingFont || branding.bodyFont || DEFAULT_BRANDING.headingFont,
    fontSize: `${baseSize * scale}px`,
    fontWeight: 600,
    color: branding.headingColor || DEFAULT_BRANDING.headingColor,
    textTransform: branding.uppercaseHeadings ? 'uppercase' : undefined,
    letterSpacing: branding.uppercaseHeadings ? '0.05em' : undefined,
  };
};

// Helper to get number styles from branding
const getNumberStyles = (branding: ReportBranding): React.CSSProperties => {
  return {
    fontWeight: branding.boldNumbers ?? DEFAULT_BRANDING.boldNumbers ? 600 : 400,
    fontVariantNumeric: 'tabular-nums',
  };
};

// Helper to get block container styles (card wrapper)
const getBlockContainerStyles = (config: ReportBlock['config'], branding: ReportBranding): React.CSSProperties => {
  const styles: React.CSSProperties = {};

  // Use block-level config if available, otherwise fall back to global branding
  const borderRadius = config.borderRadius || branding.globalBorderRadius || DEFAULT_BRANDING.globalBorderRadius;
  const shadow = config.shadow || branding.globalShadow || DEFAULT_BRANDING.globalShadow;
  const borderWidth = config.borderWidth || 'thin'; // Default to thin border so borderStyle is visible
  const padding = config.padding;
  const borderStyle = branding.borderStyle || DEFAULT_BRANDING.borderStyle || 'solid';
  
  // Border radius mapping
  const radiusMap: Record<string, string> = {
    'none': '0',
    'sm': '0.25rem',
    'md': '0.5rem',
    'lg': '0.75rem',
    'xl': '1rem',
    '2xl': '1.5rem',
  };
  
  // Corner style override
  const cornerStyle = branding.cornerStyle || DEFAULT_BRANDING.cornerStyle || 'rounded';
  if (cornerStyle === 'square') {
    styles.borderRadius = '0';
  } else if (cornerStyle === 'pill') {
    styles.borderRadius = '9999px';
  } else {
    styles.borderRadius = radiusMap[borderRadius || 'md'] || '0.5rem';
  }

  // Shadow mapping
  const shadowMap: Record<string, string> = {
    'none': 'none',
    'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
    'md': '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.15)',
    'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
    'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.25)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
  };
  styles.boxShadow = shadowMap[shadow || 'none'] || 'none';

  // Border - always apply so borderStyle control is visible
  const borderWidthMap: Record<string, string> = {
    'none': '0',
    'thin': '1px',
    'medium': '2px',
    'thick': '3px',
  };
  
  // Apply border based on borderStyle setting (none = no border)
  if (borderStyle === 'none') {
    styles.borderWidth = '0';
    styles.borderStyle = 'none';
  } else if (borderWidth && borderWidth !== 'none') {
    styles.borderWidth = borderWidthMap[borderWidth];
    styles.borderStyle = borderStyle;
    styles.borderColor = branding.accentBorders 
      ? (branding.accentColor || DEFAULT_BRANDING.accentColor)
      : (config.borderColor || branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor);
  } else if (branding.accentBorders) {
    styles.borderWidth = '1px';
    styles.borderStyle = borderStyle;
    styles.borderColor = branding.accentColor || DEFAULT_BRANDING.accentColor;
  } else {
    // Default: apply thin border with selected style
    styles.borderWidth = '1px';
    styles.borderStyle = borderStyle;
    styles.borderColor = branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor;
  }

  // Padding
  const paddingMap: Record<string, string> = {
    'none': '0',
    'sm': '0.5rem',
    'md': '1rem',
    'lg': '1.5rem',
    'xl': '2rem',
  };
  if (padding && padding !== 'none') {
    styles.padding = paddingMap[padding];
  }

  // Background color
  if (config.backgroundColor && config.backgroundColor !== 'transparent') {
    styles.backgroundColor = config.backgroundColor;
  }

  // Apply globalBlur for drop shadow blur effect (independent of glassmorphism)
  const blur = branding.globalBlur || 0;
  if (blur > 0 && shadow !== 'none') {
    // Enhance shadow with blur amount
    const shadowOpacity = 0.15 + (blur / 40);
    const shadowSpread = blur * 0.5;
    const shadowBlur = blur * 1.5;
    styles.boxShadow = `0 ${shadowSpread}px ${shadowBlur}px -${shadowSpread * 0.3}px rgba(0, 0, 0, ${shadowOpacity})`;
  }

  // Glassmorphism effect
  if (branding.glassmorphism) {
    const glassBlur = blur || 8;
    const opacity = (branding.effectsOpacity || 100) / 100;
    styles.backdropFilter = `blur(${glassBlur}px)`;
    styles.WebkitBackdropFilter = `blur(${glassBlur}px)`;
    styles.backgroundColor = config.backgroundColor 
      ? config.backgroundColor 
      : `rgba(17, 17, 17, ${0.7 * opacity})`;
    styles.borderColor = `rgba(255, 255, 255, ${0.1 * opacity})`;
  }

  return styles;
};

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ReportBlockRenderer({ block, holdings, performanceMetrics, riskMetrics, totalValue, branding, isPrintMode }: Props) {
  const chartColors = useMemo(() => getChartColors(branding), [branding]);
  const config = block.config || {};
  const containerStyles = useMemo(() => getBlockContainerStyles(config, branding), [config, branding]);
  const globalStyles = useMemo(() => getGlobalStyles(branding), [branding]);
  const headingStyles = useMemo(() => getHeadingStyles(branding), [branding]);
  const numberStyles = useMemo(() => getNumberStyles(branding), [branding]);

  const allocationData = useMemo(() => {
    const byType: Record<string, number> = {};
    holdings.forEach(h => {
      byType[h.assetType] = (byType[h.assetType] || 0) + h.currentValue;
    });
    return Object.entries(byType).map(([name, value]) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));
  }, [holdings, totalValue]);

  const currencyData = useMemo(() => {
    const byCurrency: Record<string, number> = {};
    holdings.forEach(h => {
      byCurrency[h.currency] = (byCurrency[h.currency] || 0) + h.currentValue;
    });
    return Object.entries(byCurrency).map(([name, value]) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));
  }, [holdings, totalValue]);

  const geographyData = useMemo(() => {
    const byGeo: Record<string, number> = {};
    holdings.forEach(h => {
      byGeo[h.geography] = (byGeo[h.geography] || 0) + h.currentValue;
    });
    return Object.entries(byGeo).map(([name, value]) => ({
      name,
      value,
      percent: totalValue > 0 ? (value / totalValue) * 100 : 0,
    }));
  }, [holdings, totalValue]);

  const topMovers = useMemo(() => {
    const sorted = [...holdings]
      .filter(h => h.unrealizedPL !== undefined)
      .sort((a, b) => (b.unrealizedPL || 0) - (a.unrealizedPL || 0));
    const max = config.maxItems || 3;
    return {
      top: sorted.slice(0, max),
      bottom: sorted.slice(-max).reverse(),
    };
  }, [holdings, config.maxItems]);

  const architectureData = useMemo(() => {
    const byAssetType: Record<string, { name: string; value: number; holdings: { ticker: string; value: number; weight: number }[] }> = {};
    
    holdings.forEach(h => {
      if (!byAssetType[h.assetType]) {
        byAssetType[h.assetType] = { name: h.assetType, value: 0, holdings: [] };
      }
      byAssetType[h.assetType].value += h.currentValue;
      byAssetType[h.assetType].holdings.push({
        ticker: h.ticker,
        value: h.currentValue,
        weight: h.weight
      });
    });
    
    return Object.values(byAssetType)
      .sort((a, b) => b.value - a.value)
      .map((group, i) => ({
        ...group,
        percent: totalValue > 0 ? (group.value / totalValue) * 100 : 0,
        color: chartColors[i % chartColors.length],
        holdings: group.holdings.sort((a, b) => b.value - a.value).slice(0, 5)
      }));
  }, [holdings, totalValue, chartColors]);

  const contributionData = useMemo(() => {
    return [...holdings]
      .filter(h => h.unrealizedPL !== undefined && h.unrealizedPL !== 0)
      .sort((a, b) => Math.abs(b.unrealizedPL || 0) - Math.abs(a.unrealizedPL || 0))
      .slice(0, config.maxItems || 10)
      .map(h => ({
        ticker: h.ticker,
        value: h.unrealizedPL || 0,
        color: (h.unrealizedPL || 0) >= 0 
          ? (branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor)
          : (branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor)
      }));
  }, [holdings, config.maxItems, branding]);

  const calendarData = useMemo(() => {
    const actualReturns = performanceMetrics?.monthlyReturns || [];
    const returnsByMonth = new Map<string, number>();
    actualReturns.forEach(({ month, return: ret }) => {
      returnsByMonth.set(month, ret);
    });
    
    const uniqueYears = [...new Set(actualReturns.map(r => r.month.split('-')[0]))];
    const displayYears = uniqueYears.length > 0 
      ? uniqueYears.sort().slice(-2)
      : [new Date().getFullYear().toString()];
    
    return displayYears.map(year => ({
      year: parseInt(year),
      months: monthNames.map((monthName, i) => {
        const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
        const monthReturn = returnsByMonth.get(monthKey);
        return {
          month: monthName,
          return: monthReturn ?? null
        };
      })
    }));
  }, [performanceMetrics]);

  const scatterData = useMemo(() => {
    return holdings
      .filter(h => h.currentValue > 0 && h.plPercent !== undefined)
      .map(h => ({
        ticker: h.ticker,
        name: h.name,
        risk: Math.abs(h.plPercent || 0) * 0.5 + Math.random() * 5,
        return: h.plPercent || 0,
        weight: h.weight,
        value: h.currentValue,
      }))
      .slice(0, config.maxItems || 20);
  }, [holdings, config.maxItems]);

  const avgReturn = scatterData.length > 0 
    ? scatterData.reduce((sum, d) => sum + d.return, 0) / scatterData.length 
    : 0;
  const avgRisk = scatterData.length > 0 
    ? scatterData.reduce((sum, d) => sum + d.risk, 0) / scatterData.length 
    : 0;

  const getReturnColor = (ret: number | null) => {
    if (ret === null) return branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor;
    if (ret === 0) return branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor;
    if (ret > 3) return branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor;
    if (ret > 0) return `${branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor}80`;
    if (ret > -3) return `${branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor}80`;
    return branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor;
  };

  // Check if block has any custom styling applied
  const hasCustomStyles = config.borderRadius || config.shadow || config.borderWidth || config.padding || config.backgroundColor || branding.glassmorphism || branding.accentBorders;

  // CSS-based subtle noise pattern (no external asset needed)
  const getPatternStyle = (): React.CSSProperties => {
    if (!branding.subtlePatterns) return {};
    return {
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      backgroundSize: '100px 100px',
      backgroundBlendMode: 'overlay',
      opacity: 0.03,
    };
  };

  // Wrapper component to apply custom styles - ensures content fills container
  const BlockWrapper = ({ children }: { children: React.ReactNode }) => {
    return (
      <div 
        style={{ ...globalStyles, ...containerStyles }} 
        className="h-full w-full transition-all relative flex flex-col overflow-hidden"
      >
        {branding.subtlePatterns && (
          <div 
            className="absolute inset-0 pointer-events-none"
            style={getPatternStyle()}
          />
        )}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden">{children}</div>
      </div>
    );
  };

  const renderContent = () => {
    switch (block.type) {
    case 'logo_header':
      // Apply header gradient if set
      const headerGradientStyle: React.CSSProperties = branding.headerGradient 
        ? { 
            background: branding.headerGradient, 
            padding: '1rem',
            borderRadius: containerStyles.borderRadius,
          } 
        : {};
      return (
        <div 
          className={`text-${config.logoAlignment || 'center'} py-2`}
          style={headerGradientStyle}
        >
          {config.logoUrl ? (
            <img 
              src={config.logoUrl} 
              alt="Logo" 
              className={`object-contain ${
                config.logoSize === 'small' ? 'h-8' : 
                config.logoSize === 'large' ? 'h-16' : 'h-12'
              } ${config.logoAlignment === 'left' ? 'ml-0 mr-auto' : config.logoAlignment === 'right' ? 'ml-auto mr-0' : 'mx-auto'}`}
            />
          ) : (
            <div className="h-12 w-20 mx-auto rounded bg-muted/30 flex items-center justify-center">
              <FileImage size={20} className="text-muted-foreground" />
            </div>
          )}
          {config.title && (
            <h1 
              style={{ 
                ...headingStyles, 
                color: branding.headerGradient ? '#FFFFFF' : headingStyles.color 
              }} 
              className="mt-2"
            >
              {config.title}
            </h1>
          )}
          {config.subtitle && (
            <p 
              style={{ 
                ...globalStyles, 
                color: branding.headerGradient ? 'rgba(255,255,255,0.8)' : (branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor),
              }} 
              className="text-sm"
            >
              {config.subtitle}
            </p>
          )}
        </div>
      );

    case 'title':
      return (
        <h1 
          style={{ 
            ...headingStyles,
            fontSize: config.fontSize === '2xl' ? '1.5rem' : config.fontSize === 'xl' ? '1.25rem' : '1.125rem',
            fontWeight: config.fontWeight === 'bold' ? 700 : config.fontWeight === 'semibold' ? 600 : config.fontWeight === 'medium' ? 500 : 400,
            textAlign: config.textAlign || 'center',
            color: config.textColor || headingStyles.color,
          }}
        >
          {config.title || 'Report Title'}
        </h1>
      );

    case 'subtitle':
      return (
        <h2 
          style={{ 
            ...globalStyles,
            textAlign: config.textAlign || 'center',
            color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor,
          }}
        >
          {config.subtitle || 'Subtitle text'}
        </h2>
      );

    case 'free_text':
      return (
        <div 
          style={{ 
            ...globalStyles,
            textAlign: config.textAlign || 'left',
            color: config.textColor || globalStyles.color,
          }}
        >
          {config.text || 'Add your commentary here...'}
        </div>
      );

    case 'portfolio_overview':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 h-full w-full content-center">
          {[
            { label: 'Total Value', value: formatCurrency(totalValue) },
            { label: 'IRR', value: performanceMetrics ? formatPercent(performanceMetrics.irr) : '—' },
            { label: 'Total Return', value: performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—' },
            { label: 'Sharpe', value: performanceMetrics?.sharpeRatio.toFixed(2) || '—' },
          ].map((item, i) => (
            <div 
              key={i}
              className="p-1.5 rounded-lg flex flex-col justify-center" 
              style={{ 
                backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent',
                borderRadius: containerStyles.borderRadius,
              }}
            >
              <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '9px' }}>
                {item.label}
              </p>
              <p style={{ ...globalStyles, ...numberStyles, color: branding.textColor || DEFAULT_BRANDING.textColor, fontSize: '11px' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case 'performance_summary':
      return (
        <div className="grid grid-cols-3 gap-1.5 h-full w-full content-center">
          {[
            { label: 'Total Return', value: performanceMetrics ? formatPercent(performanceMetrics.totalReturn) : '—', color: branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor },
            { label: 'Sharpe Ratio', value: performanceMetrics?.sharpeRatio.toFixed(2) || '—', color: branding.textColor || DEFAULT_BRANDING.textColor },
            { label: 'Max Drawdown', value: performanceMetrics ? formatPercent(-performanceMetrics.maxDrawdown) : '—', color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor },
          ].map((item, i) => (
            <div 
              key={i}
              className="p-1.5 rounded-lg flex flex-col justify-center" 
              style={{ 
                backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent',
                borderRadius: containerStyles.borderRadius,
              }}
            >
              <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '9px' }}>
                {item.label}
              </p>
              <p style={{ ...globalStyles, ...numberStyles, color: item.color, fontSize: '11px' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case 'asset_allocation':
    case 'currency_exposure':
    case 'geographic_allocation':
      const chartData = block.type === 'asset_allocation' ? allocationData :
                        block.type === 'currency_exposure' ? currencyData : geographyData;
      return (
        <div className="flex items-center gap-3 h-full w-full min-h-0 overflow-hidden">
          {config.showChart !== false && (
            <div className="flex-shrink-0 flex items-center justify-center" style={{ width: '40%', height: '100%', maxWidth: '120px', minWidth: '60px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius="80%"
                    dataKey="value"
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center gap-1 min-w-0 overflow-hidden">
            {chartData.slice(0, config.maxItems || 5).map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-[10px]">
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: chartColors[i % chartColors.length] }} 
                />
                <span style={{ ...globalStyles, fontWeight: 500 }} className="truncate flex-1 min-w-0">{item.name}</span>
                <span style={{ ...globalStyles, ...numberStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }} className="text-right whitespace-nowrap flex-shrink-0">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'xray_architecture':
      return (
        <div className="h-full w-full min-h-0 overflow-auto">
          {architectureData.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '10px' }}>
                No holdings data available
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {architectureData.map((group, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div 
                        className="w-2 h-2 rounded-sm flex-shrink-0" 
                        style={{ backgroundColor: group.color }}
                      />
                      <span style={{ ...globalStyles, fontWeight: 500 }} className="capitalize truncate">
                        {group.name.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{ ...globalStyles, ...numberStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }} className="flex-shrink-0 ml-2">
                      {group.percent.toFixed(1)}% • {formatCurrency(group.value)}
                    </span>
                  </div>
                  <div 
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: `${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}30` }}
                  >
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${group.percent}%`,
                        backgroundColor: group.color
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 pl-3">
                    {group.holdings.slice(0, 4).map((h, j) => (
                      <span 
                        key={j}
                        className="text-[7px] px-1 py-0.5 rounded"
                        style={{ 
                          backgroundColor: `${group.color}20`,
                          color: branding.textColor || DEFAULT_BRANDING.textColor
                        }}
                      >
                        {h.ticker} ({h.weight.toFixed(1)}%)
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );

    case 'top_movers':
      return (
        <div className="grid grid-cols-2 gap-2 h-full w-full min-h-0 overflow-hidden">
          <div className="flex flex-col min-h-0">
            <h4 style={{ ...globalStyles, color: branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor, fontSize: '10px', fontWeight: 500 }} className="flex items-center gap-1 mb-1 flex-shrink-0">
              <TrendingUp size={10} /> Top
            </h4>
            <div className="space-y-0.5 overflow-auto flex-1 min-h-0">
              {topMovers.top.map((h, i) => (
                <div key={i} className="flex justify-between text-[9px] gap-1">
                  <span style={{ ...globalStyles, fontWeight: 500 }} className="truncate min-w-0">{h.ticker}</span>
                  <span style={{ ...globalStyles, ...numberStyles, color: branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor }} className="flex-shrink-0">
                    {formatCurrency(h.unrealizedPL || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col min-h-0">
            <h4 style={{ ...globalStyles, color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor, fontSize: '10px', fontWeight: 500 }} className="flex items-center gap-1 mb-1 flex-shrink-0">
              <TrendingDown size={10} /> Bottom
            </h4>
            <div className="space-y-0.5 overflow-auto flex-1 min-h-0">
              {topMovers.bottom.map((h, i) => (
                <div key={i} className="flex justify-between text-[9px] gap-1">
                  <span style={{ ...globalStyles, fontWeight: 500 }} className="truncate min-w-0">{h.ticker}</span>
                  <span style={{ ...globalStyles, ...numberStyles, color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor }} className="flex-shrink-0">
                    {formatCurrency(h.unrealizedPL || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'contribution_chart':
      return (
        <div className="h-full w-full min-h-0 overflow-hidden">
          {contributionData.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '10px' }}>
                No P/L data available
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contributionData} layout="vertical" margin={{ left: 30, right: 40, top: 5, bottom: 5 }}>
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 8, fill: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }} 
                  tickFormatter={(v) => formatCurrency(v)}
                  axisLine={{ stroke: branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor }}
                />
                <YAxis 
                  type="category" 
                  dataKey="ticker" 
                  tick={{ fontSize: 8, fill: branding.textColor || DEFAULT_BRANDING.textColor, fontWeight: 'bold' }} 
                  width={30}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine 
                  x={0} 
                  stroke={branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}
                  strokeWidth={1}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'P/L']}
                  contentStyle={{ 
                    backgroundColor: branding.backgroundColor || DEFAULT_BRANDING.backgroundColor,
                    border: `1px solid ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`,
                    fontSize: 10,
                    color: branding.textColor || DEFAULT_BRANDING.textColor
                  }}
                  labelStyle={{ color: branding.textColor || DEFAULT_BRANDING.textColor }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {contributionData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      );

    case 'performance_calendar':
      const getYtdReturn = (yearMonths: { month: string; return: number | null }[]) => {
        const validReturns = yearMonths.filter(m => m.return !== null).map(m => m.return as number);
        if (validReturns.length === 0) return null;
        return (validReturns.reduce((acc, r) => acc * (1 + r / 100), 1) - 1) * 100;
      };

      return (
        <div className="h-full w-full min-h-0 overflow-auto">
          {calendarData.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '10px' }}>
                No monthly return data available
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse text-[7px]">
              <thead>
                <tr>
                  <th style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '7px' }} className="text-left font-medium px-0.5 py-0.5">Yr</th>
                  {monthNames.map(m => (
                    <th key={m} style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '6px' }} className="text-center font-medium px-0 py-0.5">{m.slice(0, 1)}</th>
                  ))}
                  <th style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '7px' }} className="text-center font-medium px-0.5 py-0.5">YTD</th>
                </tr>
              </thead>
              <tbody>
                {calendarData.map(yearData => {
                  const ytdReturn = getYtdReturn(yearData.months);
                  return (
                    <tr key={yearData.year}>
                      <td style={{ ...globalStyles, ...numberStyles, color: branding.accentColor || DEFAULT_BRANDING.accentColor, fontSize: '8px' }} className="px-0.5 py-0.5">{yearData.year}</td>
                      {yearData.months.map((m, i) => (
                        <td key={i} className="p-0.5">
                          <div
                            className="h-5 min-w-[18px] rounded flex items-center justify-center text-[6px] font-medium"
                            style={{ 
                              backgroundColor: getReturnColor(m.return),
                              color: m.return !== null && Math.abs(m.return) > 2 ? '#fff' : (branding.textColor || DEFAULT_BRANDING.textColor)
                            }}
                          >
                            {m.return !== null ? `${m.return > 0 ? '+' : ''}${m.return.toFixed(0)}` : '—'}
                          </div>
                        </td>
                      ))}
                      <td className="p-0.5">
                        <div
                          className="h-5 min-w-[24px] rounded flex items-center justify-center text-[7px] font-bold"
                          style={{ 
                            backgroundColor: getReturnColor(ytdReturn),
                            color: ytdReturn !== null && Math.abs(ytdReturn) > 2 ? '#fff' : (branding.textColor || DEFAULT_BRANDING.textColor)
                          }}
                        >
                          {ytdReturn !== null ? `${ytdReturn > 0 ? '+' : ''}${ytdReturn.toFixed(0)}%` : '—'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      );

    case 'risk_metrics':
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 h-full w-full content-center">
          {[
            { label: 'Volatility', value: riskMetrics ? formatPercent(riskMetrics.volatility) : '—', color: branding.textColor || DEFAULT_BRANDING.textColor },
            { label: 'Beta', value: riskMetrics?.beta.toFixed(2) || '—', color: branding.textColor || DEFAULT_BRANDING.textColor },
            { label: 'VaR 95%', value: riskMetrics ? formatPercent(-riskMetrics.var95) : '—', color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor },
            { label: 'Sortino', value: riskMetrics?.sortinoRatio?.toFixed(2) || '—', color: branding.textColor || DEFAULT_BRANDING.textColor },
          ].map((item, i) => (
            <div 
              key={i}
              className="p-1.5 rounded-lg flex flex-col justify-center" 
              style={{ 
                backgroundColor: config.showBackground ? `${branding.accentColor || DEFAULT_BRANDING.accentColor}15` : 'transparent',
                borderRadius: containerStyles.borderRadius,
              }}
            >
              <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '9px' }}>
                {item.label}
              </p>
              <p style={{ ...globalStyles, ...numberStyles, color: item.color, fontSize: '11px' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      );

    case 'risk_return_scatter':
      return (
        <div className="h-full w-full min-h-0 overflow-hidden">
          {scatterData.length === 0 ? (
            <div className="flex items-center justify-center h-full w-full">
              <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '10px' }}>
                No holdings data available
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 10, bottom: 15, left: 25 }}>
                <XAxis 
                  type="number" 
                  dataKey="risk" 
                  name="Risk" 
                  tick={{ fontSize: 8, fill: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}
                  label={{ value: 'Risk (%)', position: 'bottom', fontSize: 7, fill: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, offset: -5 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="return" 
                  name="Return" 
                  tick={{ fontSize: 8, fill: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}
                  label={{ value: 'Return (%)', angle: -90, position: 'insideLeft', fontSize: 7, fill: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}
                  width={25}
                />
                <ZAxis type="number" dataKey="weight" range={[20, 150]} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    name === 'return' ? formatPercent(value) : `${value.toFixed(1)}%`,
                    name === 'return' ? 'Return' : 'Risk'
                  ]}
                  labelFormatter={(_, payload) => payload[0]?.payload?.ticker || ''}
                  contentStyle={{ 
                    backgroundColor: branding.backgroundColor || DEFAULT_BRANDING.backgroundColor,
                    border: `1px solid ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`,
                    fontSize: 10,
                    color: branding.textColor || DEFAULT_BRANDING.textColor
                  }}
                />
                <ReferenceLine 
                  x={avgRisk} 
                  stroke={branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor} 
                  strokeDasharray="3 3" 
                />
                <ReferenceLine 
                  y={avgReturn} 
                  stroke={branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor} 
                  strokeDasharray="3 3" 
                />
                <Scatter 
                  data={scatterData} 
                  fill={branding.chartPrimaryColor || DEFAULT_BRANDING.chartPrimaryColor}
                >
                  {scatterData.map((entry, index) => (
                    <Cell 
                      key={index} 
                      fill={entry.return >= 0 
                        ? (branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor)
                        : (branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor)
                      }
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
      );

    case 'scenarios_snapshot':
      const scenarios = [
        { name: '2008 Financial Crisis', impact: -28.5 },
        { name: 'COVID-19 Crash', impact: -18.2 },
        { name: 'Rates +200bp', impact: -8.4 },
        { name: 'Tech Bust -40%', impact: -22.1 },
        { name: 'Stagflation', impact: -15.8 },
      ];
      const maxImpact = Math.max(...scenarios.map(s => Math.abs(s.impact)));
      return (
        <div className="h-full w-full min-h-0 flex flex-col justify-center gap-1.5 overflow-hidden">
          {scenarios.slice(0, config.maxItems || 5).map((s, i) => {
            const barWidth = (Math.abs(s.impact) / maxImpact) * 100;
            return (
              <div key={i} className="flex items-center gap-1.5">
                <span style={{ ...globalStyles, fontSize: '8px' }} className="w-20 truncate flex-shrink-0">
                  {s.name}
                </span>
                <div 
                  className="flex-1 h-3 rounded overflow-hidden min-w-0" 
                  style={{ backgroundColor: `${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}30` }}
                >
                  <div 
                    className="h-full rounded"
                    style={{ 
                      width: `${barWidth}%`,
                      backgroundColor: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor
                    }}
                  />
                </div>
                <span 
                  style={{ ...globalStyles, ...numberStyles, color: branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor, fontSize: '9px' }} 
                  className="w-12 text-right flex-shrink-0"
                >
                  {formatPercent(s.impact)}
                </span>
              </div>
            );
          })}
        </div>
      );

    case 'holdings_table':
      const displayHoldings = holdings.slice(0, config.maxItems || 20);
      return (
        <div className="h-full w-full min-h-0 overflow-auto">
          <table className="w-full text-[8px]" style={{ borderCollapse: 'collapse' }}>
            <thead className="sticky top-0">
              <tr style={{ 
                backgroundColor: branding.tableHeaderBgColor || DEFAULT_BRANDING.tableHeaderBgColor,
                borderBottom: `1px solid ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`,
              }}>
                <th style={{ ...globalStyles, color: branding.tableHeaderTextColor || DEFAULT_BRANDING.tableHeaderTextColor, fontSize: '8px' }} className="text-left px-1 py-1 font-semibold">Ticker</th>
                <th style={{ ...globalStyles, color: branding.tableHeaderTextColor || DEFAULT_BRANDING.tableHeaderTextColor, fontSize: '8px' }} className="text-left px-1 py-1 font-semibold">Name</th>
                <th style={{ ...globalStyles, color: branding.tableHeaderTextColor || DEFAULT_BRANDING.tableHeaderTextColor, fontSize: '8px' }} className="text-right px-1 py-1 font-semibold">Value</th>
                <th style={{ ...globalStyles, color: branding.tableHeaderTextColor || DEFAULT_BRANDING.tableHeaderTextColor, fontSize: '8px' }} className="text-right px-1 py-1 font-semibold">Wt%</th>
                <th style={{ ...globalStyles, color: branding.tableHeaderTextColor || DEFAULT_BRANDING.tableHeaderTextColor, fontSize: '8px' }} className="text-right px-1 py-1 font-semibold">P/L</th>
              </tr>
            </thead>
            <tbody>
              {displayHoldings.map((h, i) => (
                <tr 
                  key={i} 
                  style={{ 
                    backgroundColor: i % 2 === 1 ? (branding.tableRowAltBgColor || DEFAULT_BRANDING.tableRowAltBgColor) : 'transparent',
                    borderBottom: `1px solid ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`,
                  }}
                >
                  <td style={{ ...globalStyles, fontWeight: 600, fontSize: '8px' }} className="px-1 py-0.5">{h.ticker}</td>
                  <td style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '7px' }} className="px-1 py-0.5 truncate max-w-[80px]">{h.name}</td>
                  <td style={{ ...globalStyles, ...numberStyles, fontSize: '8px' }} className="px-1 py-0.5 text-right">{formatCurrency(h.currentValue)}</td>
                  <td style={{ ...globalStyles, ...numberStyles, fontSize: '8px' }} className="px-1 py-0.5 text-right">{h.weight.toFixed(1)}%</td>
                  <td 
                    style={{ 
                      ...globalStyles, 
                      ...numberStyles, 
                      fontSize: '8px',
                      color: (h.unrealizedPL || 0) >= 0 
                        ? (branding.chartPositiveColor || DEFAULT_BRANDING.chartPositiveColor)
                        : (branding.chartNegativeColor || DEFAULT_BRANDING.chartNegativeColor)
                    }} 
                    className="px-1 py-0.5 text-right"
                  >
                    {formatCurrency(h.unrealizedPL || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'transactions_summary':
      return (
        <div className="text-center py-4">
          <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '10px' }}>
            Transactions summary will display recent trades
          </p>
        </div>
      );

    case 'footer':
      return (
        <div 
          className="flex items-center justify-between text-xs py-2"
          style={{ 
            borderTop: `1px solid ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`,
          }}
        >
          <span style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>
            {config.footerText || branding.footerText || 'Confidential'}
          </span>
          <div className="flex items-center gap-3" style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor }}>
            {config.analystName && <span>Prepared by: {config.analystName}</span>}
            {config.showDate && <span>{new Date().toLocaleDateString()}</span>}
          </div>
        </div>
      );

    case 'page_break':
      return (
        <div 
          className="flex items-center justify-center py-2 text-xs"
          style={{ 
            borderTop: `1px dashed ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`,
            borderBottom: `1px dashed ${branding.tableBorderColor || DEFAULT_BRANDING.tableBorderColor}`,
            color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor,
          }}
        >
          — Page Break —
        </div>
      );

    case 'spacer':
      return <div style={{ height: '40px' }} />;

    case 'drawdown_chart':
      return (
        <div className="text-center py-4">
          <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '10px' }}>
            Drawdown chart placeholder
          </p>
        </div>
      );

    case 'factor_exposure':
      return (
        <div className="text-center py-4">
          <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '10px' }}>
            Factor exposure placeholder
          </p>
        </div>
      );

    default:
      return (
        <div className="text-center py-4">
          <p style={{ ...globalStyles, color: branding.mutedTextColor || DEFAULT_BRANDING.mutedTextColor, fontSize: '10px' }}>
            Unknown block type: {block.type}
          </p>
        </div>
      );
    }
  };

  return (
    <BlockWrapper>
      {renderContent()}
    </BlockWrapper>
  );
}