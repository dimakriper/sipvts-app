<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
    <div
      v-for="stack in stacks"
      :key="stack.name"
      class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
    >
      <div class="flex items-start justify-between mb-3">
        <h3 class="font-bold text-gray-900 dark:text-white">
          {{ stack.name }}
        </h3>
        <span class="text-xs font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
          {{ stack.projectCount }} проектов
        </span>
      </div>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="member in stack.members"
          :key="member"
          class="px-2 py-1 rounded-md text-xs font-mono font-medium cursor-pointer transition-colors"
          :style="badgeStyle(member)"
          @click="$emit('selectDep', member)"
        >
          {{ member }}
        </span>
      </div>
      <div class="mt-3">
        <div class="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            class="h-full bg-indigo-500 rounded-full"
            :style="{ width: popularityPercent(stack.projectCount) + '%' }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DetectedStack, DependencyRank } from '../../stores/stack'

const props = defineProps<{
  stacks: DetectedStack[]
  dependencies: DependencyRank[]
}>()

defineEmits<{ selectDep: [name: string] }>()

const depColorMap = computed(() => {
  const map: Record<string, string> = {}
  for (const dep of props.dependencies) {
    map[dep.name] = dep.clusterColor
  }
  return map
})

const maxProjects = computed(() =>
  Math.max(...props.stacks.map(s => s.projectCount), 1)
)

function badgeStyle(member: string) {
  const color = depColorMap.value[member] ?? '#6b7280'
  return {
    backgroundColor: color + '22',
    color,
    border: `1px solid ${color}55`
  }
}

function popularityPercent(count: number) {
  return Math.round((count / maxProjects.value) * 100)
}
</script>
