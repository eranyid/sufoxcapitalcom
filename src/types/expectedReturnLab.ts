 /**
  * Types for Expected Return & Optimization Lab
  */
 
 export interface AssetAssumption {
   id: string;
   assetClass: string;
   expectedReturn: number;      // Annual expected return (%)
   expectedVolatility: number;  // Annual volatility (%)
   marketCapWeight: number;     // Market cap weight (%)
   viewConfidence: number;      // Confidence level (0-100)
   correlationGroup?: string;   // Optional grouping
 }
 
 export interface LabParameters {
   riskFreeRate: number;        // % per annum
   investmentHorizon: number;   // Years
   riskAversion: number;        // Lambda (market risk aversion)
   tau: number;                 // Uncertainty scalar
   allowShorts: boolean;        // Allow negative weights
   maxWeightPerAsset: number;   // Maximum weight constraint (%)
 }
 
 export interface OptimizationResult {
   assetClass: string;
   impliedMarketReturn: number;   // Pi from reverse optimization
   posteriorReturn: number;       // BL adjusted return
   inputWeight: number;           // User-provided weight
   optimizedWeight: number;       // BL optimal weight
   riskContribution: number;      // % of total portfolio risk
   marginalRisk: number;          // Marginal contribution to risk
 }
 
 export interface PortfolioMetrics {
   expectedReturn: number;
   expectedVolatility: number;
   sharpeRatio: number;
   diversificationRatio: number;
 }
 
 export const DEFAULT_ASSET_CLASSES: Omit<AssetAssumption, 'id'>[] = [
   { assetClass: 'US Large Cap Equity', expectedReturn: 8.5, expectedVolatility: 16, marketCapWeight: 25, viewConfidence: 70 },
   { assetClass: 'US Small Cap Equity', expectedReturn: 10, expectedVolatility: 22, marketCapWeight: 5, viewConfidence: 60 },
   { assetClass: 'International Developed', expectedReturn: 7.5, expectedVolatility: 18, marketCapWeight: 15, viewConfidence: 65 },
   { assetClass: 'Emerging Markets', expectedReturn: 9.5, expectedVolatility: 24, marketCapWeight: 5, viewConfidence: 50 },
   { assetClass: 'US Investment Grade Bonds', expectedReturn: 4, expectedVolatility: 5, marketCapWeight: 20, viewConfidence: 80 },
   { assetClass: 'US High Yield Bonds', expectedReturn: 6, expectedVolatility: 10, marketCapWeight: 5, viewConfidence: 70 },
   { assetClass: 'International Bonds', expectedReturn: 3.5, expectedVolatility: 6, marketCapWeight: 5, viewConfidence: 75 },
   { assetClass: 'Real Estate (REITs)', expectedReturn: 7, expectedVolatility: 18, marketCapWeight: 5, viewConfidence: 65 },
   { assetClass: 'Commodities', expectedReturn: 5, expectedVolatility: 20, marketCapWeight: 5, viewConfidence: 55 },
   { assetClass: 'Cash & Equivalents', expectedReturn: 2, expectedVolatility: 1, marketCapWeight: 10, viewConfidence: 95 },
 ];
 
 export const DEFAULT_PARAMETERS: LabParameters = {
   riskFreeRate: 4.5,
   investmentHorizon: 10,
   riskAversion: 2.5,
   tau: 0.05,
   allowShorts: false,
   maxWeightPerAsset: 40,
 };
 
 // Simplified correlation matrix for asset classes (symmetric)
 // Order: US LC, US SC, Intl Dev, EM, IG Bonds, HY Bonds, Intl Bonds, REITs, Commodities, Cash
 export const DEFAULT_CORRELATIONS: number[][] = [
   [1.00, 0.85, 0.75, 0.65, 0.10, 0.55, 0.05, 0.60, 0.15, 0.00],
   [0.85, 1.00, 0.70, 0.60, 0.05, 0.50, 0.00, 0.55, 0.10, 0.00],
   [0.75, 0.70, 1.00, 0.75, 0.15, 0.50, 0.20, 0.55, 0.20, 0.00],
   [0.65, 0.60, 0.75, 1.00, 0.10, 0.45, 0.15, 0.50, 0.30, 0.00],
   [0.10, 0.05, 0.15, 0.10, 1.00, 0.55, 0.75, 0.20, 0.05, 0.10],
   [0.55, 0.50, 0.50, 0.45, 0.55, 1.00, 0.45, 0.45, 0.15, 0.00],
   [0.05, 0.00, 0.20, 0.15, 0.75, 0.45, 1.00, 0.15, 0.10, 0.05],
   [0.60, 0.55, 0.55, 0.50, 0.20, 0.45, 0.15, 1.00, 0.20, 0.00],
   [0.15, 0.10, 0.20, 0.30, 0.05, 0.15, 0.10, 0.20, 1.00, 0.00],
   [0.00, 0.00, 0.00, 0.00, 0.10, 0.00, 0.05, 0.00, 0.00, 1.00],
 ];