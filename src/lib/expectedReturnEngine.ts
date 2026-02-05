 /**
  * Expected Return & Optimization Engine
  * 
  * This module provides forward-looking portfolio optimization using:
  * - User-defined expected returns and volatilities
  * - Black-Litterman framework for combining views with market equilibrium
  * - Mean-variance optimization for optimal weights
  */
 
 import * as math from 'mathjs';
 import { 
   AssetAssumption, 
   LabParameters, 
   OptimizationResult, 
   PortfolioMetrics,
   DEFAULT_CORRELATIONS
 } from '@/types/expectedReturnLab';
 
 const REGULARIZATION_EPSILON = 1e-8;
 
 // ============= Utility Functions =============
 
 function isValidNumber(val: number): boolean {
   return typeof val === 'number' && isFinite(val) && !isNaN(val);
 }
 
 function regularizeMatrix(matrix: number[][]): number[][] {
   const n = matrix.length;
   const result = matrix.map(row => [...row]);
   for (let i = 0; i < n; i++) {
     result[i][i] += REGULARIZATION_EPSILON;
   }
   return result;
 }
 
 function safeInverse(matrix: number[][]): number[][] | null {
   try {
     return math.inv(matrix) as number[][];
   } catch {
     try {
       const regularized = regularizeMatrix(matrix);
       return math.inv(regularized) as number[][];
     } catch {
       console.error('Matrix inversion failed');
       return null;
     }
   }
 }
 
 /**
  * Project vector onto probability simplex (non-negative, sum = 1)
  */
 function projectToSimplex(v: number[], allowNegative = false): number[] {
   if (allowNegative) {
     const sum = v.reduce((a, b) => a + b, 0);
     return sum > 0 ? v.map(w => w / sum) : new Array(v.length).fill(1 / v.length);
   }
   
   const n = v.length;
   const sorted = [...v].sort((a, b) => b - a);
   let cumSum = 0;
   let rho = 0;
   
   for (let j = 0; j < n; j++) {
     cumSum += sorted[j];
     if (sorted[j] + (1 - cumSum) / (j + 1) > 0) {
       rho = j + 1;
     }
   }
   
   const theta = (sorted.slice(0, rho).reduce((a, b) => a + b, 0) - 1) / rho;
   const projected = v.map(vi => Math.max(0, vi - theta));
   const sum = projected.reduce((a, b) => a + b, 0);
   
   return sum > 0 ? projected.map(w => w / sum) : new Array(n).fill(1 / n);
 }
 
 // ============= Core Functions =============
 
 /**
  * Build covariance matrix from volatilities and correlation matrix
  */
 export function buildCovarianceFromVolatility(
   assets: AssetAssumption[],
   correlations: number[][]
 ): number[][] {
   const n = assets.length;
   const vols = assets.map(a => a.expectedVolatility / 100); // Convert to decimal
   
   const covMatrix: number[][] = [];
   for (let i = 0; i < n; i++) {
     covMatrix[i] = [];
     for (let j = 0; j < n; j++) {
       // Use identity if correlations don't match size
       const corr = (correlations[i] && correlations[i][j] !== undefined) 
         ? correlations[i][j] 
         : (i === j ? 1 : 0);
       covMatrix[i][j] = vols[i] * vols[j] * corr;
     }
   }
   
   return covMatrix;
 }
 
 /**
  * Calculate implied equilibrium returns using reverse optimization
  * Pi = delta * Sigma * w_mkt
  */
 export function calculateImpliedReturns(
   covMatrix: number[][],
   marketWeights: number[],
   riskAversion: number
 ): number[] {
   const sigmaW = math.multiply(covMatrix, marketWeights) as number[];
   return sigmaW.map(v => {
     const val = v * riskAversion;
     return isValidNumber(val) ? val * 100 : 0; // Convert to percentage
   });
 }
 
 /**
  * Calculate expected portfolio return
  */
 export function calculateExpectedPortfolioReturn(
   weights: number[],
   returns: number[]
 ): number {
   let sum = 0;
   for (let i = 0; i < weights.length; i++) {
     sum += (weights[i] / 100) * returns[i];
   }
   return sum;
 }
 
 /**
  * Calculate portfolio volatility using variance-covariance
  */
 export function calculatePortfolioVolatility(
   weights: number[],
   covMatrix: number[][]
 ): number {
   const w = weights.map(x => x / 100); // Convert to decimal
   
   // w' * Sigma * w
   const sigmaW = math.multiply(covMatrix, w) as number[];
   const variance = math.dot(w, sigmaW) as number;
   
   return Math.sqrt(variance) * 100; // Convert to percentage
 }
 
 /**
  * Build Omega matrix for Black-Litterman (view uncertainty)
  */
 function buildOmegaMatrix(
   assets: AssetAssumption[],
   covMatrix: number[][],
   tau: number
 ): number[][] {
   const n = assets.length;
   const Omega: number[][] = [];
   
   for (let i = 0; i < n; i++) {
     Omega[i] = new Array(n).fill(0);
     const confidence = Math.max(0.05, Math.min(0.95, assets[i].viewConfidence / 100));
     const uncertaintyFactor = (1 - confidence) / confidence;
     const viewVariance = tau * covMatrix[i][i];
     Omega[i][i] = uncertaintyFactor * Math.abs(viewVariance) + REGULARIZATION_EPSILON;
   }
   
   return Omega;
 }
 
 /**
  * Run Black-Litterman optimization
  */
 export function runBlackLittermanOptimization(
   assets: AssetAssumption[],
   params: LabParameters,
   correlations: number[][] = DEFAULT_CORRELATIONS
 ): { results: OptimizationResult[]; metrics: { input: PortfolioMetrics; optimized: PortfolioMetrics } } {
   const n = assets.length;
   
   // Build covariance matrix
   const covMatrix = buildCovarianceFromVolatility(assets, correlations);
   
   // Normalize market weights
   const totalWeight = assets.reduce((sum, a) => sum + a.marketCapWeight, 0);
   const marketWeights = assets.map(a => a.marketCapWeight / totalWeight);
   
   // Step 1: Calculate implied equilibrium returns (Pi)
   const impliedReturns = calculateImpliedReturns(covMatrix, marketWeights, params.riskAversion);
   
   // Step 2: User views as Q vector (expected returns in decimal)
   const Q = assets.map(a => a.expectedReturn / 100);
   
   // Step 3: P matrix (identity for absolute views on all assets)
   const P: number[][] = [];
   for (let i = 0; i < n; i++) {
     P[i] = new Array(n).fill(0);
     P[i][i] = 1;
   }
   
   // Step 4: Build Omega matrix
   const Omega = buildOmegaMatrix(assets, covMatrix, params.tau);
   
   // Step 5: Solve Black-Litterman equation
   let posteriorReturns: number[];
   
   try {
     const tauSigma = math.multiply(params.tau, covMatrix) as number[][];
     const invTauSigma = safeInverse(regularizeMatrix(tauSigma));
     const invOmega = safeInverse(Omega);
     
     if (!invTauSigma || !invOmega) {
       // Fallback to simple weighted average
       posteriorReturns = assets.map((a, i) => {
         const conf = a.viewConfidence / 100;
         return conf * a.expectedReturn + (1 - conf) * impliedReturns[i];
       });
     } else {
       const Pt = math.transpose(P) as number[][];
       const PtInvOmega = math.multiply(Pt, invOmega) as number[][];
       const PtInvOmegaP = math.multiply(PtInvOmega, P) as number[][];
       const leftMatrix = math.add(invTauSigma, PtInvOmegaP) as number[][];
       const leftInv = safeInverse(leftMatrix);
       
       if (!leftInv) {
         posteriorReturns = assets.map(a => a.expectedReturn);
       } else {
         const piDecimal = impliedReturns.map(r => r / 100);
         const invTauSigmaPi = math.multiply(invTauSigma, piDecimal) as number[];
         const PtInvOmegaQ = math.multiply(math.multiply(Pt, invOmega), Q) as number[];
         const rightVector = math.add(invTauSigmaPi, PtInvOmegaQ) as number[];
         const blReturnsDecimal = math.multiply(leftInv, rightVector) as number[];
         
         posteriorReturns = blReturnsDecimal.map(r => {
           if (!isValidNumber(r)) return 0;
           return Math.max(-50, Math.min(100, r * 100)); // Clamp to reasonable range
         });
       }
     }
   } catch (error) {
     console.error('BL optimization error:', error);
     posteriorReturns = assets.map(a => a.expectedReturn);
   }
   
   // Step 6: Calculate optimal weights
   let optimalWeights: number[];
   
   try {
     const invSigma = safeInverse(regularizeMatrix(covMatrix));
     if (!invSigma) {
       optimalWeights = marketWeights;
     } else {
       const blDecimal = posteriorReturns.map(r => r / 100);
       const rawWeights = math.multiply(invSigma, blDecimal) as number[];
       const scaledWeights = rawWeights.map(w => w / params.riskAversion);
       
       // Apply constraints
       let projected = projectToSimplex(scaledWeights, params.allowShorts);
       
       // Apply max weight constraint
       const maxWeight = params.maxWeightPerAsset / 100;
       let iterations = 0;
       while (iterations < 10) {
         const excess = projected.filter(w => w > maxWeight);
         if (excess.length === 0) break;
         
         projected = projected.map(w => Math.min(w, maxWeight));
         const sum = projected.reduce((a, b) => a + b, 0);
         projected = projected.map(w => w / sum);
         iterations++;
       }
       
       optimalWeights = projected;
     }
   } catch {
     optimalWeights = marketWeights;
   }
   
   // Step 7: Calculate risk contributions
   const portfolioVol = calculatePortfolioVolatility(
     optimalWeights.map(w => w * 100), 
     covMatrix
   );
   
   const riskContributions: number[] = [];
   for (let i = 0; i < n; i++) {
     const w = optimalWeights.map(x => x);
     const sigmaW = math.multiply(covMatrix, w) as number[];
     const marginalRisk = sigmaW[i] / (portfolioVol / 100);
     const contribution = w[i] * marginalRisk;
     riskContributions.push(contribution);
   }
   
   const totalRiskContrib = riskContributions.reduce((a, b) => a + Math.abs(b), 0);
   
   // Build results
   const results: OptimizationResult[] = assets.map((asset, i) => ({
     assetClass: asset.assetClass,
     impliedMarketReturn: impliedReturns[i],
     posteriorReturn: posteriorReturns[i],
     inputWeight: asset.marketCapWeight,
     optimizedWeight: optimalWeights[i] * 100,
     riskContribution: totalRiskContrib > 0 ? (Math.abs(riskContributions[i]) / totalRiskContrib) * 100 : 0,
     marginalRisk: (math.multiply(covMatrix, optimalWeights) as number[])[i] * 100,
   }));
   
   // Calculate portfolio metrics for both input and optimized
   const inputWeights = assets.map(a => a.marketCapWeight);
   const inputReturns = assets.map(a => a.expectedReturn);
   
   const inputMetrics: PortfolioMetrics = {
     expectedReturn: calculateExpectedPortfolioReturn(inputWeights, inputReturns),
     expectedVolatility: calculatePortfolioVolatility(inputWeights, covMatrix),
     sharpeRatio: 0,
     diversificationRatio: 0,
   };
   inputMetrics.sharpeRatio = (inputMetrics.expectedReturn - params.riskFreeRate) / inputMetrics.expectedVolatility;
   
   const optimizedMetrics: PortfolioMetrics = {
     expectedReturn: calculateExpectedPortfolioReturn(optimalWeights.map(w => w * 100), posteriorReturns),
     expectedVolatility: portfolioVol,
     sharpeRatio: 0,
     diversificationRatio: 0,
   };
   optimizedMetrics.sharpeRatio = (optimizedMetrics.expectedReturn - params.riskFreeRate) / optimizedMetrics.expectedVolatility;
   
   // Diversification ratio
   const weightedVol = assets.reduce((sum, a, i) => sum + (optimalWeights[i] * a.expectedVolatility), 0);
   optimizedMetrics.diversificationRatio = weightedVol / optimizedMetrics.expectedVolatility;
   
   const inputWeightedVol = assets.reduce((sum, a) => sum + ((a.marketCapWeight / 100) * a.expectedVolatility), 0);
   inputMetrics.diversificationRatio = inputWeightedVol / inputMetrics.expectedVolatility;
   
   return { results, metrics: { input: inputMetrics, optimized: optimizedMetrics } };
 }
 
 /**
  * Generate efficient frontier points
  */
 export function generateEfficientFrontier(
   assets: AssetAssumption[],
   params: LabParameters,
   correlations: number[][] = DEFAULT_CORRELATIONS,
   numPoints: number = 50
 ): { risk: number; return: number; weights: number[] }[] {
   const covMatrix = buildCovarianceFromVolatility(assets, correlations);
   const returns = assets.map(a => a.expectedReturn / 100);
   
   const minReturn = Math.min(...returns) * 100;
   const maxReturn = Math.max(...returns) * 100;
   
   const points: { risk: number; return: number; weights: number[] }[] = [];
   
   for (let i = 0; i < numPoints; i++) {
     const targetReturn = minReturn + (i / (numPoints - 1)) * (maxReturn - minReturn);
     
     // Simple approach: interpolate weights based on target return
     // For a more accurate solution, would need quadratic programming
     const weights = assets.map((a, idx) => {
       const distanceToTarget = 1 / (Math.abs(a.expectedReturn - targetReturn) + 0.1);
       return distanceToTarget;
     });
     
     const totalWeight = weights.reduce((a, b) => a + b, 0);
     const normalizedWeights = projectToSimplex(weights.map(w => w / totalWeight), false);
     
     const portfolioReturn = normalizedWeights.reduce((sum, w, i) => sum + w * assets[i].expectedReturn, 0);
     const portfolioRisk = calculatePortfolioVolatility(normalizedWeights.map(w => w * 100), covMatrix);
     
     points.push({
       risk: portfolioRisk,
       return: portfolioReturn,
       weights: normalizedWeights.map(w => w * 100)
     });
   }
   
   // Sort by risk and remove dominated points
   points.sort((a, b) => a.risk - b.risk);
   
   const frontier: typeof points = [];
   let maxReturnSeen = -Infinity;
   
   for (const point of points) {
     if (point.return >= maxReturnSeen) {
       frontier.push(point);
       maxReturnSeen = point.return;
     }
   }
   
   return frontier;
 }