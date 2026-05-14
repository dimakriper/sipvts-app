import {
  normalizeMatrix,
  calculateWeights,
  buildMatrix,
  calculateLambdaMax,
  calculateCI,
  calculateCR
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

    // Validate criteria matrix contains only integers 1-9
    for (const [key, value] of Object.entries(body.criteriaMatrix)) {
      if (!Number.isInteger(value) || value < 1 || value > 9) {
        return {
          success: false,
          error: `Все значения в матрице критериев должны быть целыми числами от 1 до 9. Получено: ${value}`
        }
      }
    }

    // Validate alternative matrices contain only integers 1-9
    for (const [cIdx, matrix] of Object.entries(body.altMatrices)) {
      for (const [key, value] of Object.entries(matrix)) {
        if (!Number.isInteger(value) || value < 1 || value > 9) {
          return {
            success: false,
            error: `Все значения в матрице альтернатив должны быть целыми числами от 1 до 9. Получено: ${value}`
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

    // Step 6: Calculate global priorities
    const globalScores = validAlternatives.map((alt, altIdx) => {
      let globalScore = 0
      for (let c = 0; c < n; c++) {
        const altPriorities = localPriorities[c]
        const critWeight = critWeights[c]
        if (altPriorities && critWeight !== undefined) {
          const altPriority = altPriorities[altIdx]
          if (altPriority !== undefined) {
            globalScore += altPriority * critWeight
          }
        }
      }
      return {
        name: alt,
        globalScore: globalScore
      }
    })

    // Step 7: Sort by score
    globalScores.sort((a, b) => b.globalScore - a.globalScore)

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
