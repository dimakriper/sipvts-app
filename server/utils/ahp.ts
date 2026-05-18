/**
 * AHP (Analytic Hierarchy Process) Utilities
 * Contains core mathematical functions for AHP calculations
 */

// Random Index values for Consistency Ratio calculation
export const RI = [0, 0, 0.58, 0.9, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49]

/**
 * Normalize matrix columns (divide each element by column sum)
 * AHP requires column normalization, not row normalization
 */
export function normalizeMatrix(matrix: number[][]): number[][] {
  const n = matrix.length
  const normalized = matrix.map(row => [...row])
  
  // Normalize by column sum
  for (let j = 0; j < n; j++) {
    let colSum = 0
    for (let i = 0; i < n; i++) {
      colSum += matrix[i][j]
    }
    for (let i = 0; i < n; i++) {
      normalized[i][j] /= colSum
    }
  }
  
  return normalized
}

/**
 * Calculate weights using geometric mean method
 * More resistant to rank inversion than arithmetic mean
 */
export function calculateWeights(normalizedMatrix: number[][]): number[] {
  const n = normalizedMatrix.length
  const weights = normalizedMatrix.map(row => {
    // Calculate geometric mean: nth root of product
    const product = row.reduce((a, b) => a * b, 1)
    return Math.pow(product, 1 / n)
  })
  
  // Normalize to sum to 1
  const sum = weights.reduce((a, b) => a + b, 0)
  return weights.map(w => w / sum)
}

/**
 * Build reciprocal comparison matrix from pairwise comparisons
 */
export function buildMatrix(data: Record<string, number>, n: number): number[][] {
  const matrix: number[][] = Array(n)
    .fill(null)
    .map(() => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    const row = matrix[i]
    if (row) {
      row[i] = 1
      for (let j = i + 1; j < n; j++) {
        const val = data[`${i}-${j}`] || 1
        row[j] = val
        const jRow = matrix[j]
        if (jRow) {
          jRow[i] = 1 / val
        }
      }
    }
  }

  return matrix
}

/**
 * Calculate maximum eigenvalue (λmax) of the matrix
 */
export function calculateLambdaMax(matrix: number[][], weights: number[]): number {
  const n = matrix.length
  let sum = 0

  for (let i = 0; i < n; i++) {
    const row = matrix[i]
    const weight = weights[i]
    if (row && weight) {
      let weightedSum = 0
      for (let j = 0; j < n; j++) {
        const cellValue = row[j]
        const columnWeight = weights[j]
        if (cellValue !== undefined && columnWeight !== undefined) {
          weightedSum += cellValue * columnWeight
        }
      }
      sum += weightedSum / weight
    }
  }

  return sum / n
}

/**
 * Calculate Consistency Index (CI)
 * CI = (λmax - n) / (n - 1)
 */
export function calculateCI(lambdaMax: number, n: number): number {
  if (n <= 1) return 0
  return (lambdaMax - n) / (n - 1)
}

/**
 * Calculate Consistency Ratio (CR)
 * CR = CI / RI(n)
 * If CR ≤ 0.1, the comparison matrix is sufficiently consistent
 */
export function calculateCR(ci: number, n: number): number {
  if (n <= 1 || n > 10) return 0
  const riValue = RI[n]
  if (riValue === undefined) return 0
  return ci / riValue
}

/**
 * Calculate global priorities using weighted geometric mean aggregation
 * Formula: globalScore = ∏(localPriority_i ^ critWeight_i)
 * Each local priority is raised to the power of its criterion weight
 * More suitable for multiplicative preference models
 */
export function calculateGlobalPrioritiesWeightedGeometricMean(
  localPriorities: number[][],
  critWeights: number[],
  alternatives: string[]
): Array<{ name: string; globalScore: number }> {
  const globalScores = alternatives.map((alt, altIdx) => {
    let globalScore = 1

    for (let c = 0; c < localPriorities.length; c++) {
      const altPriority = localPriorities[c][altIdx]
      const critWeight = critWeights[c]

      if (altPriority !== undefined && critWeight !== undefined && altPriority > 0) {
        // Weighted geometric mean: multiply altPriority^critWeight
        globalScore *= Math.pow(altPriority, critWeight)
      }
    }

    return {
      name: alt,
      globalScore
    }
  })

  // Sort by score descending
  return globalScores.sort((a, b) => b.globalScore - a.globalScore)
}

/**
 * Calculate global priorities using simple multiplicative aggregation
 * Formula: globalScore = ∏(localPriority_i)
 * Note: Doesn't account for criterion weights explicitly (treats all as equal)
 * Less suitable for weighted AHP but useful for comparison
 */
export function calculateGlobalPrioritiesMultiplicative(
  localPriorities: number[][],
  alternatives: string[]
): Array<{ name: string; globalScore: number }> {
  const globalScores = alternatives.map((alt, altIdx) => {
    let globalScore = 1

    for (let c = 0; c < localPriorities.length; c++) {
      const altPriority = localPriorities[c][altIdx]
      if (altPriority !== undefined && altPriority > 0) {
        globalScore *= altPriority
      }
    }

    return {
      name: alt,
      globalScore
    }
  })

  return globalScores.sort((a, b) => b.globalScore - a.globalScore)
}
