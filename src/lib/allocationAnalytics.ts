// Analytics engine for allocation-only portfolio analysis
// No market data, returns, risk, or performance calculations

import { 
  Position, 
  AllocationGroup, 
  ConcentrationMetrics, 
  DiversificationScore, 
  LiquidityExposure, 
  CurrencyExposure, 
  StructuralInsights,
  SankeyData,
  ASSET_TYPE_LABELS,
  REGION_LABELS,
  LIQUIDITY_LABELS,
  LiquidityBucket,
} from '@/types/allocationBuilder';

/**
 * Calculate total allocation across all positions
 */
export function calculateTotalAllocation(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + p.allocation, 0);
}

/**
 * Validate that total allocation equals 100%
 */
export function validateAllocation(positions: Position[]): { 
  isValid: boolean; 
  total: number; 
  deviation: number;
} {
  const total = calculateTotalAllocation(positions);
  return {
    isValid: Math.abs(total - 100) < 0.01,
    total,
    deviation: total - 100,
  };
}

/**
 * Group positions by a dimension
 */
export function groupPositionsBy(
  positions: Position[], 
  dimension: 'assetType' | 'region' | 'sector' | 'currency' | 'liquidityBucket'
): AllocationGroup[] {
  const groups: Record<string, AllocationGroup> = {};
  
  const getLabel = (key: string, dim: typeof dimension): string => {
    switch (dim) {
      case 'assetType':
        return ASSET_TYPE_LABELS[key as keyof typeof ASSET_TYPE_LABELS] || key;
      case 'region':
        return REGION_LABELS[key as keyof typeof REGION_LABELS] || key;
      case 'liquidityBucket':
        return LIQUIDITY_LABELS[key as keyof typeof LIQUIDITY_LABELS] || key;
      default:
        return key;
    }
  };
  
  for (const position of positions) {
    const key = position[dimension] as string;
    if (!groups[key]) {
      groups[key] = {
        key,
        label: getLabel(key, dimension),
        allocation: 0,
        count: 0,
        positions: [],
      };
    }
    groups[key].allocation += position.allocation;
    groups[key].count += 1;
    groups[key].positions.push(position);
  }
  
  return Object.values(groups).sort((a, b) => b.allocation - a.allocation);
}

/**
 * Calculate Herfindahl-Hirschman Index (HHI) for concentration
 * HHI ranges from 0 (perfect diversification) to 10000 (single position)
 */
function calculateHHI(positions: Position[]): number {
  const total = calculateTotalAllocation(positions);
  if (total === 0) return 0;
  
  return positions.reduce((sum, p) => {
    const share = (p.allocation / total) * 100;
    return sum + share * share;
  }, 0);
}

/**
 * Calculate concentration metrics
 */
export function calculateConcentration(positions: Position[]): ConcentrationMetrics {
  if (positions.length === 0) {
    return {
      herfindahlIndex: 0,
      top3Concentration: 0,
      top5Concentration: 0,
      largestPosition: 0,
      effectivePositions: 0,
    };
  }
  
  const sorted = [...positions].sort((a, b) => b.allocation - a.allocation);
  const total = calculateTotalAllocation(positions);
  
  const hhi = calculateHHI(positions);
  const top3 = sorted.slice(0, 3).reduce((sum, p) => sum + p.allocation, 0);
  const top5 = sorted.slice(0, 5).reduce((sum, p) => sum + p.allocation, 0);
  const largest = sorted[0]?.allocation || 0;
  
  // Effective number of positions = 1 / normalized HHI
  const effectivePositions = hhi > 0 ? 10000 / hhi : 0;
  
  return {
    herfindahlIndex: Math.round(hhi),
    top3Concentration: total > 0 ? (top3 / total) * 100 : 0,
    top5Concentration: total > 0 ? (top5 / total) * 100 : 0,
    largestPosition: total > 0 ? (largest / total) * 100 : 0,
    effectivePositions: Math.round(effectivePositions * 10) / 10,
  };
}

/**
 * Calculate entropy-based diversity score for a dimension
 */
function calculateEntropyDiversity(groups: AllocationGroup[]): number {
  const total = groups.reduce((sum, g) => sum + g.allocation, 0);
  if (total === 0 || groups.length <= 1) return 0;
  
  // Shannon entropy
  let entropy = 0;
  for (const group of groups) {
    if (group.allocation > 0) {
      const p = group.allocation / total;
      entropy -= p * Math.log2(p);
    }
  }
  
  // Normalize to 0-100 based on max possible entropy (log2 of number of groups)
  const maxEntropy = Math.log2(groups.length);
  return maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
}

/**
 * Calculate diversification scores across dimensions
 */
export function calculateDiversification(positions: Position[]): DiversificationScore {
  if (positions.length === 0) {
    return {
      overall: 0,
      assetTypeDiversity: 0,
      geographicDiversity: 0,
      sectorDiversity: 0,
      currencyDiversity: 0,
    };
  }
  
  const assetGroups = groupPositionsBy(positions, 'assetType');
  const regionGroups = groupPositionsBy(positions, 'region');
  const sectorGroups = groupPositionsBy(positions, 'sector');
  const currencyGroups = groupPositionsBy(positions, 'currency');
  
  const assetTypeDiversity = calculateEntropyDiversity(assetGroups);
  const geographicDiversity = calculateEntropyDiversity(regionGroups);
  const sectorDiversity = calculateEntropyDiversity(sectorGroups);
  const currencyDiversity = calculateEntropyDiversity(currencyGroups);
  
  // Overall is weighted average
  const overall = (
    assetTypeDiversity * 0.3 +
    geographicDiversity * 0.25 +
    sectorDiversity * 0.25 +
    currencyDiversity * 0.2
  );
  
  return {
    overall: Math.round(overall),
    assetTypeDiversity: Math.round(assetTypeDiversity),
    geographicDiversity: Math.round(geographicDiversity),
    sectorDiversity: Math.round(sectorDiversity),
    currencyDiversity: Math.round(currencyDiversity),
  };
}

/**
 * Calculate liquidity exposure breakdown
 */
export function calculateLiquidityExposure(positions: Position[]): LiquidityExposure {
  const buckets: LiquidityExposure = {
    highlyLiquid: 0,
    liquid: 0,
    semiLiquid: 0,
    illiquid: 0,
    locked: 0,
    weightedLiquidityScore: 0,
  };
  
  const total = calculateTotalAllocation(positions);
  if (total === 0) return buckets;
  
  const liquidityScores: Record<LiquidityBucket, number> = {
    highly_liquid: 100,
    liquid: 80,
    semi_liquid: 50,
    illiquid: 20,
    locked: 0,
  };
  
  let weightedScore = 0;
  
  for (const position of positions) {
    const pct = (position.allocation / total) * 100;
    
    switch (position.liquidityBucket) {
      case 'highly_liquid':
        buckets.highlyLiquid += pct;
        break;
      case 'liquid':
        buckets.liquid += pct;
        break;
      case 'semi_liquid':
        buckets.semiLiquid += pct;
        break;
      case 'illiquid':
        buckets.illiquid += pct;
        break;
      case 'locked':
        buckets.locked += pct;
        break;
    }
    
    weightedScore += (position.allocation / total) * liquidityScores[position.liquidityBucket];
  }
  
  buckets.weightedLiquidityScore = Math.round(weightedScore);
  
  return buckets;
}

/**
 * Calculate currency exposure
 */
export function calculateCurrencyExposure(positions: Position[]): CurrencyExposure[] {
  const groups = groupPositionsBy(positions, 'currency');
  
  return groups.map(g => ({
    currency: g.key,
    allocation: g.allocation,
    positionCount: g.count,
  }));
}

/**
 * Detect imbalances and generate warnings
 */
export function detectImbalances(positions: Position[]): string[] {
  const warnings: string[] = [];
  const total = calculateTotalAllocation(positions);
  
  if (Math.abs(total - 100) > 0.01) {
    warnings.push(`Total allocation is ${total.toFixed(1)}%, should be 100%`);
  }
  
  const concentration = calculateConcentration(positions);
  
  if (concentration.largestPosition > 25) {
    warnings.push(`Largest position (${concentration.largestPosition.toFixed(1)}%) exceeds 25% threshold`);
  }
  
  if (concentration.top3Concentration > 60) {
    warnings.push(`Top 3 positions (${concentration.top3Concentration.toFixed(1)}%) exceed 60% threshold`);
  }
  
  if (concentration.herfindahlIndex > 2500) {
    warnings.push(`High concentration (HHI: ${concentration.herfindahlIndex}) indicates low diversification`);
  }
  
  const liquidity = calculateLiquidityExposure(positions);
  
  if (liquidity.illiquid + liquidity.locked > 40) {
    warnings.push(`Illiquid exposure (${(liquidity.illiquid + liquidity.locked).toFixed(1)}%) exceeds 40%`);
  }
  
  const currencies = calculateCurrencyExposure(positions);
  const dominantCurrency = currencies[0];
  if (dominantCurrency && dominantCurrency.allocation > 80) {
    warnings.push(`Currency concentration: ${dominantCurrency.currency} is ${dominantCurrency.allocation.toFixed(1)}%`);
  }
  
  // Check for single asset type dominance
  const assetGroups = groupPositionsBy(positions, 'assetType');
  const dominantAsset = assetGroups[0];
  if (dominantAsset && dominantAsset.allocation > 70) {
    warnings.push(`Asset type concentration: ${dominantAsset.label} is ${dominantAsset.allocation.toFixed(1)}%`);
  }
  
  return warnings;
}

/**
 * Generate complete structural insights
 */
export function generateStructuralInsights(positions: Position[]): StructuralInsights {
  return {
    concentration: calculateConcentration(positions),
    diversification: calculateDiversification(positions),
    liquidity: calculateLiquidityExposure(positions),
    currencies: calculateCurrencyExposure(positions),
    imbalances: detectImbalances(positions),
  };
}

/**
 * Generate Sankey diagram data for allocation flow
 * Flow: Total Portfolio → Asset Type → Sector → Position
 */
export function generateSankeyData(positions: Position[]): SankeyData {
  const nodes: SankeyData['nodes'] = [];
  const links: SankeyData['links'] = [];
  const nodeSet = new Set<string>();
  
  // Root node
  nodes.push({ id: 'portfolio', label: 'Portfolio' });
  nodeSet.add('portfolio');
  
  // Group by asset type first
  const assetGroups = groupPositionsBy(positions, 'assetType');
  
  for (const assetGroup of assetGroups) {
    const assetId = `asset_${assetGroup.key}`;
    if (!nodeSet.has(assetId)) {
      nodes.push({ id: assetId, label: assetGroup.label });
      nodeSet.add(assetId);
    }
    
    links.push({
      source: 'portfolio',
      target: assetId,
      value: assetGroup.allocation,
    });
    
    // Group by sector within asset type
    const sectorGroups: Record<string, number> = {};
    for (const pos of assetGroup.positions) {
      if (!sectorGroups[pos.sector]) {
        sectorGroups[pos.sector] = 0;
      }
      sectorGroups[pos.sector] += pos.allocation;
    }
    
    for (const [sector, allocation] of Object.entries(sectorGroups)) {
      const sectorId = `sector_${assetGroup.key}_${sector}`;
      if (!nodeSet.has(sectorId)) {
        nodes.push({ id: sectorId, label: sector });
        nodeSet.add(sectorId);
      }
      
      links.push({
        source: assetId,
        target: sectorId,
        value: allocation,
      });
    }
  }
  
  return { nodes, links };
}

/**
 * Get position size distribution for histogram
 */
export function getPositionSizeDistribution(positions: Position[]): { range: string; count: number }[] {
  const ranges = [
    { min: 0, max: 1, label: '0-1%' },
    { min: 1, max: 3, label: '1-3%' },
    { min: 3, max: 5, label: '3-5%' },
    { min: 5, max: 10, label: '5-10%' },
    { min: 10, max: 20, label: '10-20%' },
    { min: 20, max: 100, label: '20%+' },
  ];
  
  return ranges.map(range => ({
    range: range.label,
    count: positions.filter(p => p.allocation >= range.min && p.allocation < range.max).length,
  }));
}
