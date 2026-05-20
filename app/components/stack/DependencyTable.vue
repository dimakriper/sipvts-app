<template>
  <div>
    <!-- Search + Sort controls -->
    <div class="flex flex-wrap gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Поиск зависимости..."
        class="flex-1 min-w-[180px] px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
      >
      <select
        v-model="sortKey"
        class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="count">
          По популярности
        </option>
        <option value="name">
          По названию
        </option>
        <option value="cluster">
          По кластеру
        </option>
      </select>
      <button
        class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
        @click="toggleSortDir"
      >
        {{ sortDir === 'asc' ? '↑' : '↓' }}
      </button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
              #
            </th>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
              Зависимость
            </th>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
              Кластер
            </th>
            <th class="text-right px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
              Проектов
            </th>
            <th class="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
              Популярность
            </th>
            <th class="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
              Связанные
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(dep, i) in filtered"
            :key="dep.name"
            class="border-t border-gray-100 dark:border-gray-700 cursor-pointer transition-colors"
            :class="
              selectedDep === dep.name
                ? 'bg-indigo-50 dark:bg-indigo-900/30'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            "
            @click="$emit('selectDep', dep.name)"
          >
            <td class="px-4 py-3 text-gray-400 dark:text-gray-500 font-mono text-xs">
              {{ i + 1 }}
            </td>
            <td class="px-4 py-3">
              <span class="font-semibold text-gray-900 dark:text-white font-mono">{{ dep.name }}</span>
            </td>
            <td class="px-4 py-3">
              <span
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-medium"
                :style="{ backgroundColor: dep.clusterColor }"
              >
                {{ dep.cluster }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
              {{ dep.count }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden min-w-[60px]">
                  <div
                    class="h-full rounded-full"
                    :style="{ width: dep.percentage + '%', backgroundColor: dep.clusterColor }"
                  />
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 min-w-[36px] text-right">{{ dep.percentage }}%</span>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="flex flex-wrap gap-1">
                <span
                  v-for="rel in dep.topRelated"
                  :key="rel"
                  class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs font-mono"
                >
                  {{ rel }}
                </span>
              </div>
            </td>
          </tr>
          <tr v-if="filtered.length === 0">
            <td
              colspan="6"
              class="px-4 py-8 text-center text-gray-400 dark:text-gray-500"
            >
              Ничего не найдено
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DependencyRank } from '../../stores/stack'

const props = defineProps<{
  dependencies: DependencyRank[]
  selectedDep: string | null
}>()

defineEmits<{ selectDep: [name: string] }>()

const search = ref('')
const sortKey = ref<'count' | 'name' | 'cluster'>('count')
const sortDir = ref<'asc' | 'desc'>('desc')

function toggleSortDir() {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}

const filtered = computed(() => {
  let list = props.dependencies.filter(d =>
    d.name.toLowerCase().includes(search.value.toLowerCase())
    || d.cluster.toLowerCase().includes(search.value.toLowerCase())
  )
  list = [...list].sort((a, b) => {
    let cmp = 0
    if (sortKey.value === 'count') cmp = a.count - b.count
    else if (sortKey.value === 'name') cmp = a.name.localeCompare(b.name)
    else cmp = a.cluster.localeCompare(b.cluster)
    return sortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})
</script>
