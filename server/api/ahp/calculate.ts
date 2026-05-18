import {
  normalizeMatrix,
  calculateWeights,
  buildMatrix,
  calculateLambdaMax,
  calculateCI,
  calculateCR,
  calculateGlobalPrioritiesWeightedGeometricMean
} from '../../utils/ahp'

interface AHPRequest {
  criteria: string[]
  alternatives: string[]
  criteriaMatrix: Record<string, number>
  altMatrices: Record<number, Record<string, number>>
}

interface AHPResponse {
  success: boolean
  error?: string
  warnings?: string[]
  results?: {
    criteriaWeights: number[]
    rankedAlternatives: Array<{ name: string; globalScore: number }>
    ci: number
    cr: number
  }
}

export default defineEventHandler(async (event): Promise<AHPResponse> => {
  try {
    const body = await readBody<AHPRequest>(event)

    // Validation
    const validCriteria = body.criteria.filter(c => c.trim() !== '')
    const validAlternatives = body.alternatives.filter(a => a.trim() !== '')

    if (validAlternatives.length === 0) {
      return {
        success: false,
        error: 'Нет альтернатив для анализа'
      }
    }

    if (validCriteria.length === 0) {
      return {
        success: false,
        error: 'Нет критериев для анализа'
      }
    }

    if (Object.keys(body.criteriaMatrix).length === 0 && validCriteria.length > 1) {
      return {
        success: false,
        error: 'Матрица критериев отсутствует или не заполнена'
      }
    }

    // Validate criteria matrix values are in valid AHP range (1/9 to 9)
    for (const [key, value] of Object.entries(body.criteriaMatrix)) {
      if (typeof value !== 'number' || value < 1/9 || value > 9) {
        return {
          success: false,
          error: `Все значения в матрице критериев должны быть в диапазоне от 1/9 до 9. Получено: ${value}`
        }
      }
    }

    // Validate alternative matrices values are in valid AHP range (1/9 to 9)
    for (const [cIdx, matrix] of Object.entries(body.altMatrices)) {
      for (const [key, value] of Object.entries(matrix)) {
        if (typeof value !== 'number' || value < 1/9 || value > 9) {
          return {
            success: false,
            error: `Все значения в матрице альтернатив должны быть в диапазоне от 1/9 до 9. Получено: ${value}`
          }
        }
      }
    }

    const warnings: string[] = []
    const n = validCriteria.length
    const m = validAlternatives.length

    // Step 1: Build and normalize criteria matrix
    const critMatrix = buildMatrix(body.criteriaMatrix, n)
    const normalizedCritMatrix = normalizeMatrix(critMatrix)

    // Step 2: Calculate criteria weights
    const critWeights = calculateWeights(normalizedCritMatrix)

    // Step 3: Calculate CI and CR for criteria matrix
    const lambdaMaxCrit = calculateLambdaMax(critMatrix, critWeights)
    const ci = calculateCI(lambdaMaxCrit, n)
    const cr = calculateCR(ci, n)

    // Step 4: Check consistency
    if (cr > 0.1) {
      warnings.push(
        `Матрица сравнений недостаточно согласована (CR = ${(cr * 100).toFixed(2)}%). Пожалуйста, пересмотрите сравнения.`
      )
    }

    // Step 5: Calculate local priorities for each alternative under each criterion
    const localPriorities: number[][] = []
    for (let c = 0; c < n; c++) {
      const altMatrix = buildMatrix(body.altMatrices[c] || {}, m)
      const normalizedAltMatrix = normalizeMatrix(altMatrix)
      const altWeights = calculateWeights(normalizedAltMatrix)
      localPriorities.push(altWeights)
    }

    // Step 6: Calculate global priorities using weighted geometric mean aggregation
    // Formula: globalScore = ∏(localPriority_i ^ critWeight_i)
    const globalScores = calculateGlobalPrioritiesWeightedGeometricMean(
      localPriorities,
      critWeights,
      validAlternatives
    )

    return {
      success: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      results: {
        criteriaWeights: critWeights,
        rankedAlternatives: globalScores,
        ci: ci,
        cr: cr
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Ошибка при расчете AHP: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
})
