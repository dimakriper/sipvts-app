import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface AhpResults {
  ci: number
  cr: number
  criteriaWeights: number[]
  rankedAlternatives: Array<{ name: string; globalScore: number }>
}

export const useAhpStore = defineStore(
  'ahp',
  () => {
    const criteria = ref<string[]>(['Quality', 'Cost', 'Speed'])
    const alternatives = ref<string[]>(['Option A', 'Option B', 'Option C'])
    const criteriaMatrix = ref<Record<string, number>>({
      '0-1': 3,
      '0-2': 2,
      '1-2': 1,
    })
    const altMatrices = ref<Record<number, Record<string, number>>>({
      0: { '0-1': 2, '0-2': 3, '1-2': 2 },
      1: { '0-1': 1, '0-2': 1, '1-2': 1 },
      2: { '0-1': 2, '0-2': 3, '1-2': 2 },
    })
    const errors = ref<string[]>([])
    const warnings = ref<string[]>([])
    const results = ref<AhpResults | null>(null)
    const isLoading = ref(false)

    // Add criterion
    const addCriterion = () => {
      const newIndex = criteria.value.length
      criteria.value.push(`Criterion ${newIndex + 1}`)

      for (let i = 0; i < newIndex; i++) {
        criteriaMatrix.value[`${i}-${newIndex}`] = 1
      }

      altMatrices.value[newIndex] = {}
      for (let i = 0; i < alternatives.value.length - 1; i++) {
        altMatrices.value[newIndex][`${i}-${i + 1}`] = 1
      }
    }

    // Delete criterion
    const deleteCriterion = (index: number) => {
      if (criteria.value.length <= 1) return

      criteria.value.splice(index, 1)

      const newCriteriaMatrix: Record<string, number> = {}
      const newAltMatrices: Record<number, Record<string, number>> = {}

      for (const [key, value] of Object.entries(criteriaMatrix.value)) {
        const [i, j] = key.split('-').map(Number)
        if (i === index || j === index) continue
        const newI = i > index ? i - 1 : i
        const newJ = j > index ? j - 1 : j
        newCriteriaMatrix[`${newI}-${newJ}`] = value
      }
      criteriaMatrix.value = newCriteriaMatrix

      for (let i = 0; i < criteria.value.length; i++) {
        const oldIdx = i < index ? i : i + 1
        newAltMatrices[i] = altMatrices.value[oldIdx] ? { ...altMatrices.value[oldIdx] } : {}
      }
      altMatrices.value = newAltMatrices
    }

    // Add alternative
    const addAlternative = () => {
      const newIndex = alternatives.value.length
      alternatives.value.push(`Alternative ${newIndex + 1}`)

      for (let c = 0; c < criteria.value.length; c++) {
        if (!altMatrices.value[c]) {
          altMatrices.value[c] = {}
        }
        for (let i = 0; i < newIndex; i++) {
          altMatrices.value[c][`${i}-${newIndex}`] = 1
        }
      }
    }

    // Delete alternative
    const deleteAlternative = (index: number) => {
      if (alternatives.value.length <= 1) return
      alternatives.value.splice(index, 1)

      const newAltMatrices: Record<number, Record<string, number>> = {}
      for (let c = 0; c < criteria.value.length; c++) {
        const oldMatrix = altMatrices.value[c] || {}
        const updatedMatrix: Record<string, number> = {}

        for (const [key, value] of Object.entries(oldMatrix)) {
          const [i, j] = key.split('-').map(Number)
          if (i === index || j === index) continue
          const newI = i > index ? i - 1 : i
          const newJ = j > index ? j - 1 : j
          updatedMatrix[`${newI}-${newJ}`] = value
        }

        newAltMatrices[c] = updatedMatrix
      }
      altMatrices.value = newAltMatrices
    }

    // Reset form
    const resetForm = () => {
      criteria.value = ['Quality', 'Cost', 'Speed']
      alternatives.value = ['Option A', 'Option B', 'Option C']
      criteriaMatrix.value = {
        '0-1': 3,
        '0-2': 2,
        '1-2': 1,
      }
      altMatrices.value = {
        0: { '0-1': 2, '0-2': 3, '1-2': 2 },
        1: { '0-1': 1, '0-2': 1, '1-2': 1 },
        2: { '0-1': 2, '0-2': 3, '1-2': 2 },
      }
      errors.value = []
      warnings.value = []
      results.value = null
    }

    // Calculate AHP
    const calculate = async () => {
      errors.value = []
      warnings.value = []
      isLoading.value = true

      try {
        const response = await fetch('/api/ahp/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            criteria: criteria.value,
            alternatives: alternatives.value,
            criteriaMatrix: criteriaMatrix.value,
            altMatrices: altMatrices.value,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to calculate AHP')
        }

        results.value = await response.json()
      } catch (error) {
        errors.value.push(
          error instanceof Error ? error.message : 'An error occurred during calculation'
        )
      } finally {
        isLoading.value = false
      }
    }

    // Update criteria
    const updateCriterion = (index: number, value: string) => {
      criteria.value[index] = value
    }

    // Update alternative
    const updateAlternative = (index: number, value: string) => {
      alternatives.value[index] = value
    }

    // Update criteria matrix
    const updateCriteriaMatrix = (key: string, value: number) => {
      criteriaMatrix.value[key] = value
    }

    // Update alt matrix
    const updateAltMatrix = (criterionIdx: number, key: string, value: number) => {
      if (!altMatrices.value[criterionIdx]) {
        altMatrices.value[criterionIdx] = {}
      }
      altMatrices.value[criterionIdx][key] = value
    }

    return {
      criteria,
      alternatives,
      criteriaMatrix,
      altMatrices,
      errors,
      warnings,
      results,
      isLoading,
      addCriterion,
      deleteCriterion,
      addAlternative,
      deleteAlternative,
      resetForm,
      calculate,
      updateCriterion,
      updateAlternative,
      updateCriteriaMatrix,
      updateAltMatrix,
    }
  },
  {
    persist: {
      enabled: true,
      strategies: [
        {
          key: 'ahp-store',
          storage: typeof window !== 'undefined' ? localStorage : undefined,
          paths: ['criteria', 'alternatives', 'criteriaMatrix', 'altMatrices', 'results'],
        },
      ],
    },
  }
)
