<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-2">Analytic Hierarchy Process (AHP+)</h1>
    <p class="text-gray-600 dark:text-gray-300 mb-8">Advanced multi-criteria decision-making analysis with consistency checking</p>

    <ClientOnly>
      <!-- Alerts -->
      <div v-if="errors.length > 0" class="mb-6 space-y-2">
        <div
          v-for="(error, idx) in errors"
          :key="`error-${idx}`"
          class="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg flex items-start gap-3"
        >
        <span class="font-semibold">✕</span>
        <span>{{ error }}</span>
      </div>
    </div>

    <div v-if="warnings.length > 0" class="mb-6 space-y-2">
      <div
        v-for="(warning, idx) in warnings"
        :key="`warning-${idx}`"
        class="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 rounded-lg flex items-start gap-3"
      >
        <span class="font-semibold">⚠</span>
        <span>{{ warning }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <!-- Setup Panel -->
      <div class="lg:col-span-1">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-6">Setup</h2>

          <!-- Criteria Section -->
          <div class="mb-6">
            <h3 class="text-lg font-medium mb-3">Criteria</h3>
            <div class="space-y-2 mb-3">
              <div v-for="(criterion, index) in store.criteria" :key="`crit-${index}`" class="flex gap-2 items-center">
                <input
                  v-model="store.criteria[index]"
                  type="text"
                  placeholder="Criterion name"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  @click="deleteCriterion(index)"
                  class="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition"
                  :disabled="store.criteria.length <= 1"
                >
                  ✕
                </button>
              </div>
            </div>
            <button
              @click="addCriterion"
              class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
            >
              + Add Criterion
            </button>
          </div>

          <!-- Alternatives Section -->
          <div class="mb-6">
            <h3 class="text-lg font-medium mb-3">Alternatives</h3>
            <div class="space-y-2 mb-3">
              <div v-for="(alternative, index) in store.alternatives" :key="`alt-${index}`" class="flex gap-2 items-center">
                <input
                  v-model="store.alternatives[index]"
                  type="text"
                  placeholder="Alternative name"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  @click="deleteAlternative(index)"
                  class="px-2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition"
                  :disabled="store.alternatives.length <= 1"
                >
                  ✕
                </button>
              </div>
            </div>
            <button
              @click="addAlternative"
              class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
            >
              + Add Alternative
            </button>
          </div>

          <!-- Action Buttons -->
          <div class="space-y-2">
            <button
              @click="calculate"
              :disabled="isLoading"
              class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md font-medium transition"
            >
              {{ isLoading ? 'Calculating...' : 'Calculate' }}
            </button>
            <button
              @click="resetForm"
              :disabled="isLoading"
              class="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      <!-- Comparison & Results Panel -->
      <div class="lg:col-span-3">
        <!-- Criteria Comparison Matrix -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 class="text-xl font-semibold mb-4">Criteria Comparison Matrix</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Rate importance of each criterion (1-9, where 1 = equal)</p>

          <div v-if="store.criteria.length > 0" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-gray-700">
                  <th class="text-left p-2 font-semibold">Criteria</th>
                  <th v-for="(criterion, idx) in store.criteria" :key="`header-${idx}`" class="text-center p-2 font-semibold">
                    {{ criterion.substring(0, 8) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(criterion, i) in store.criteria" :key="`row-${i}`" class="border-b border-gray-300 dark:border-gray-700">
                  <td class="p-2 font-medium">{{ criterion }}</td>
                  <td v-for="(criterion2, j) in store.criteria" :key="`cell-${i}-${j}`" class="text-center p-2">
                    <select
                      v-if="i < j"
                      :value="getCriteriaValue(`${i}-${j}`)"
                      @change="handleCriteriaChange(`${i}-${j}`, $event)"
                      class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-xs"
                    >
                      <option v-for="opt in scaleOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                    <span v-else-if="i === j" class="text-gray-500">1</span>
                    <span v-else class="text-gray-500">{{ formatReciprocal(store.criteriaMatrix[`${j}-${i}`] || 1) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Alternative Comparison Matrices -->
        <div v-for="(criterion, cIdx) in store.criteria" :key="`alt-matrix-${cIdx}`" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 class="text-lg font-semibold mb-4">{{ criterion }} - Alternatives Comparison</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Rate alternatives for this criterion (1-9)</p>

          <div v-if="store.alternatives.length > 0" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-300 dark:border-gray-700">
                  <th class="text-left p-2 font-semibold">Alternatives</th>
                  <th v-for="(alt, idx) in store.alternatives" :key="`header-alt-${idx}`" class="text-center p-2 font-semibold">
                    {{ alt.substring(0, 8) }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(alternative, i) in store.alternatives" :key="`alt-row-${i}`" class="border-b border-gray-300 dark:border-gray-700">
                  <td class="p-2 font-medium">{{ alternative }}</td>
                  <td v-for="(alternative2, j) in store.alternatives" :key="`alt-cell-${i}-${j}`" class="text-center p-2">
                    <select
                      v-if="i < j"
                      :value="getAltValue(cIdx, `${i}-${j}`)"
                      @change="handleAltChange(cIdx, `${i}-${j}`, $event)"
                      class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-xs"
                    >
                      <option v-for="opt in scaleOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>
                    <span v-else-if="i === j" class="text-gray-500">1</span>
                    <span v-else class="text-gray-500">{{ formatReciprocal(getAltValue(cIdx, `${j}-${i}`) || 1) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Results Section -->
        <div v-if="results" class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-6">Analysis Results</h2>

          <!-- Consistency Metrics -->
          <div class="grid grid-cols-2 gap-4 mb-8">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
              <p class="text-sm text-gray-600 dark:text-gray-400">Consistency Index (CI)</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ results?.ci?.toFixed(4) ?? '0.0000' }}</p>
            </div>
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded">
              <p class="text-sm text-gray-600 dark:text-gray-400">Consistency Ratio (CR)</p>
              <p class="text-2xl font-bold" :class="(results?.cr ?? 0) <= 0.1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                {{ ((results?.cr ?? 0) * 100).toFixed(2) }}%
              </p>
              <p class="text-xs text-gray-500 mt-1" :class="(results?.cr ?? 0) <= 0.1 ? 'text-green-600' : 'text-red-600'">
                {{ (results?.cr ?? 0) <= 0.1 ? '✓ Consistent' : '✗ Inconsistent' }}
              </p>
            </div>
          </div>

          <!-- Criteria Weights -->
          <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4">Criteria Weights</h3>
            <div class="space-y-3">
              <div
                v-for="(criterion, idx) in store.criteria"
                :key="`weight-${idx}`"
                class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <span class="font-medium">{{ criterion }}</span>
                <div class="flex items-center gap-4">
                  <div class="w-40 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      class="bg-blue-600 h-2 rounded-full"
                      :style="{ width: ((results?.criteriaWeights[idx] ?? 0) * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="font-semibold min-w-max">{{ ((results?.criteriaWeights[idx] ?? 0) * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Final Rankings -->
          <div class="mb-8">
            <h3 class="text-lg font-semibold mb-4">Final Alternative Rankings</h3>
            <div class="space-y-2">
              <div
                v-for="(alt, idx) in results?.rankedAlternatives ?? []"
                :key="`ranked-${idx}`"
                class="flex items-center justify-between p-3 bg-linear-to-r from-gray-50 to-transparent dark:from-gray-700 dark:to-transparent rounded border-l-4"
                :class="[
                  idx === 0 ? 'border-l-yellow-500' : idx === 1 ? 'border-l-gray-400' : idx === 2 ? 'border-l-orange-600' : 'border-l-gray-300'
                ]"
              >
                <div class="flex items-center gap-4">
                  <span v-if="idx < 3" class="text-2xl font-bold text-gray-400">{{ ['🥇', '🥈', '🥉'][idx] }}</span>
                  <span v-else class="text-lg">{{ idx + 1 }}.</span>
                  <span class="font-semibold">{{ alt.name }}</span>
                </div>
                <div class="flex items-center gap-4">
                  <div class="w-48 bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div
                      class="bg-linear-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                      :style="{ width: ((alt.globalScore ?? 0) * 100) + '%' }"
                    ></div>
                  </div>
                  <span class="font-bold min-w-max text-lg">{{ ((alt.globalScore ?? 0) * 100).toFixed(2) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Detailed Report -->
          <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded">
            <h3 class="text-lg font-semibold mb-4">Detailed Report</h3>
            <div class="space-y-3 text-sm">
              <p>
                <strong>Analysis Date:</strong> {{ new Date().toLocaleString() }}
              </p>
              <p>
                <strong>Number of Criteria:</strong> {{ store.criteria.length }}
              </p>
              <p>
                <strong>Number of Alternatives:</strong> {{ store.alternatives.length }}
              </p>
              <p v-if="(results?.cr ?? 0) <= 0.1" class="text-green-700 dark:text-green-300">
                ✓ <strong>The comparison matrices are sufficiently consistent (CR ≤ 0.1)</strong>
              </p>
              <p v-else class="text-red-700 dark:text-red-300">
                ✗ <strong>Warning: The comparison matrices show inconsistency (CR > 0.1). Review your comparisons.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAhpStore, type AhpResults } from '../stores/ahp'

const store = useAhpStore()

// Local refs for non-persistent working data
const results = ref<AhpResults | null>(store.results)
const isLoading = ref(false)
const errors = ref<string[]>([])
const warnings = ref<string[]>([])

watch(
  () => store.results,
  (value) => {
    results.value = value
  }
)

const scaleOptions = [
  { label: '1/9', value: 1/9 },
  { label: '1/8', value: 1/8 },
  { label: '1/7', value: 1/7 },
  { label: '1/6', value: 1/6 },
  { label: '1/5', value: 1/5 },
  { label: '1/4', value: 1/4 },
  { label: '1/3', value: 1/3 },
  { label: '1/2', value: 1/2 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 }
]

const formatReciprocal = (value: number): string => {
  if (!value) return '0'
  const reciprocal = 1 / value
  
  const commonFractions: Record<number, string> = {
    0.125: '1/8',
    0.14285714: '1/7',
    0.16666667: '1/6',
    0.2: '1/5',
    0.25: '1/4',
    0.33333333: '1/3',
    0.5: '1/2'
  }
  
  for (const [num, frac] of Object.entries(commonFractions)) {
    if (Math.abs(parseFloat(num) - reciprocal) < 0.0001) {
      return frac
    }
  }
  
  return reciprocal.toFixed(2)
}

const addCriterion = () => {
  store.addCriterion()
  results.value = null
}

const deleteCriterion = (index: number) => {
  store.deleteCriterion(index)
  results.value = null
}

const addAlternative = () => {
  store.addAlternative()
  results.value = null
}

const deleteAlternative = (index: number) => {
  store.deleteAlternative(index)
  results.value = null
}

type AhpApiResponse = {
  success: boolean
  warnings?: string[]
  results?: AhpResults
  error?: string
}

const calculate = async () => {
  errors.value = []
  warnings.value = []
  isLoading.value = true
  results.value = null

  try {
    const response = await fetch('/api/ahp/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        criteria: store.criteria,
        alternatives: store.alternatives,
        criteriaMatrix: store.criteriaMatrix,
        altMatrices: store.altMatrices
      })
    })

    const data = (await response.json()) as AhpApiResponse

    if (data.success && data.results) {
      if (data.warnings && data.warnings.length > 0) {
        warnings.value = data.warnings
      }
      results.value = data.results
      store.results = data.results
    } else {
      errors.value = [data.error || 'Unknown error']
    }
  } catch (error) {
    errors.value = [
      `Ошибка при подключении к серверу: ${error instanceof Error ? error.message : 'Unknown error'}`
    ]
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  store.resetForm()
  results.value = null
  errors.value = []
  warnings.value = []
}

// Sync store matrices when alternatives/criteria change
watch(
  () => [store.criteria.length, store.alternatives.length],
  () => {
    // Ensure all criteria have alt-matrix objects and default entries
    for (let i = 0; i < store.criteria.length; i++) {
      let matrix = store.altMatrices[i]
    if (!matrix) {
      matrix = {}
      store.altMatrices[i] = matrix
    }
    for (let j = 0; j < store.alternatives.length - 1; j++) {
      const key = `${j}-${j + 1}`
      if (matrix[key] === undefined) {
        matrix[key] = 1
      }
    }
    }
  }
)

// Helper getters/setters to avoid binding to possibly-undefined nested objects
const getCriteriaValue = (key: string) => store.criteriaMatrix[key] ?? 1
const setCriteriaValue = (key: string, value: number) => store.updateCriteriaMatrix(key, Number(value))

const getAltValue = (cIdx: number, key: string) => store.altMatrices[cIdx]?.[key] ?? 1
const setAltValue = (cIdx: number, key: string, value: number) => store.updateAltMatrix(cIdx, key, Number(value))

const handleCriteriaChange = (key: string, event: Event) => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  setCriteriaValue(key, Number(target.value))
}

const handleAltChange = (cIdx: number, key: string, event: Event) => {
  const target = event.target as HTMLSelectElement | null
  if (!target) return
  setAltValue(cIdx, key, Number(target.value))
}
</script>