<template>
  <div>
    <div class="flex flex-wrap gap-4 mb-4">
      <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        Порог сходства:
        <input
          v-model.number="threshold"
          type="range"
          min="0"
          max="1"
          step="0.05"
          class="w-28"
        >
        <span class="font-mono w-10">{{ threshold.toFixed(2) }}</span>
      </label>
      <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          v-model="showLabels"
          type="checkbox"
          class="rounded"
        >
        Показать значения
      </label>
    </div>

    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="text-xs border-collapse">
        <thead>
          <tr>
            <th class="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 min-w-[90px]">
              Зависимость
            </th>
            <th
              v-for="dep in names"
              :key="dep"
              class="px-1 py-2 text-center font-mono font-normal text-gray-600 dark:text-gray-400"
              style="min-width: 36px; max-width: 36px; writing-mode: vertical-lr; transform: rotate(180deg); height: 90px; vertical-align: bottom;"
            >
              {{ dep }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in names"
            :key="`row-${row}`"
            class="border-t border-gray-100 dark:border-gray-700"
          >
            <td class="sticky left-0 z-10 bg-white dark:bg-gray-900 px-3 py-1 font-mono font-semibold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700 min-w-[90px]">
              {{ row }}
            </td>
            <td
              v-for="col in names"
              :key="`cell-${row}-${col}`"
              class="p-0 text-center relative group"
              :title="`${row} ↔ ${col}: ${getScore(row, col).toFixed(3)}`"
            >
              <div
                class="w-9 h-8 flex items-center justify-center cursor-default"
                :style="cellStyle(row, col)"
              >
                <span
                  v-if="showLabels && getScore(row, col) >= threshold"
                  class="text-[9px] font-mono select-none"
                  :style="{ color: getScore(row, col) > 0.5 ? '#fff' : '#374151' }"
                >
                  {{ getScore(row, col).toFixed(2) }}
                </span>
              </div>
              <!-- Hover tooltip -->
              <div class="absolute hidden group-hover:flex z-30 bottom-full left-1/2 -translate-x-1/2 mb-1 pointer-events-none">
                <div class="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                  <span class="font-bold">{{ row }}</span> ↔ <span class="font-bold">{{ col }}</span>:
                  {{ getScore(row, col).toFixed(3) }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
      Ячейки с Jaccard &lt; {{ threshold.toFixed(2) }} показаны серым. Диагональ = 1.0.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DependencyRank } from '../../stores/stack'

const props = defineProps<{
  jaccardMatrix: Record<string, Record<string, number>>
  dependencies: DependencyRank[]
}>()

const threshold = ref(0.15)
const showLabels = ref(false)

// Sort deps: cluster together by grouping on cluster name
const names = computed(() =>
  [...props.dependencies]
    .sort((a, b) => a.cluster.localeCompare(b.cluster) || b.count - a.count)
    .map(d => d.name)
)

function getScore(row: string, col: string): number {
  return props.jaccardMatrix[row]?.[col] ?? 0
}

function cellStyle(row: string, col: string) {
  const score = getScore(row, col)
  if (score < threshold.value) {
    return { backgroundColor: 'rgba(200,200,200,0.12)' }
  }
  // Color scale: indigo, intensity driven by score
  const alpha = Math.min(1, score * 1.1)
  return { backgroundColor: `rgba(99,102,241,${alpha})` }
}
</script>
