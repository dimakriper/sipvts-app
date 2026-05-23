<template>
  <div class="space-y-8">
    <!-- ── Frequent Itemsets ──────────────────────────────────────────────────── -->
    <div>
      <div class="flex items-baseline gap-2 mb-1">
        <h3 class="font-semibold text-gray-900 dark:text-white">
          Частые наборы зависимостей
        </h3>
        <span class="text-xs text-gray-400">(поддержка ≥ {{ minSupportPct }}%)</span>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Комбинации библиотек, устойчиво встречающиеся вместе в проектах
      </p>

      <div
        v-if="groupedItemsets.length === 0"
        class="text-sm text-gray-400 dark:text-gray-500"
      >
        Частых наборов не найдено
      </div>

      <div
        v-for="group in groupedItemsets"
        :key="group.size"
        class="mb-5"
      >
        <p class="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
          {{ group.size }}-элементные наборы
        </p>
        <div class="space-y-2">
          <div
            v-for="itemset in group.itemsets"
            :key="itemset.items.join(',')"
            class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
          >
            <div class="flex flex-wrap gap-1.5 flex-1">
              <span
                v-for="item in itemset.items"
                :key="item"
                class="px-2 py-0.5 rounded-full text-xs font-mono font-medium cursor-pointer"
                :style="badgeStyle(item)"
                @click="$emit('selectDep', item)"
              >
                {{ item }}
              </span>
            </div>
            <div class="text-right shrink-0">
              <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {{ Math.round(itemset.support * 100) }}%
              </span>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                {{ itemset.count }} пр.
              </p>
            </div>
            <div class="w-16 shrink-0">
              <div class="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full bg-indigo-400"
                  :style="{ width: (itemset.support * 100) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Association Rules ──────────────────────────────────────────────────── -->
    <div>
      <div class="flex items-baseline gap-2 mb-1">
        <h3 class="font-semibold text-gray-900 dark:text-white">
          Правила ассоциации
        </h3>
        <span class="text-xs text-gray-400">(уверенность ≥ 50%)</span>
      </div>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Если в проекте есть X → вероятно есть Y. Lift > 1 = положительная корреляция.
      </p>

      <div
        v-if="rules.length === 0"
        class="text-sm text-gray-400 dark:text-gray-500"
      >
        Правил ассоциации не найдено
      </div>

      <div class="space-y-2">
        <div
          v-for="rule in rules"
          :key="ruleKey(rule)"
          class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700"
        >
          <!-- Antecedent -->
          <div class="flex flex-wrap gap-1 flex-1">
            <span
              v-for="item in rule.antecedent"
              :key="item"
              class="px-2 py-0.5 rounded-full text-xs font-mono font-medium cursor-pointer"
              :style="badgeStyle(item)"
              @click="$emit('selectDep', item)"
            >
              {{ item }}
            </span>
          </div>

          <!-- Arrow -->
          <span class="text-gray-400 dark:text-gray-500 font-bold shrink-0">→</span>

          <!-- Consequent -->
          <div class="flex flex-wrap gap-1 flex-1">
            <span
              v-for="item in rule.consequent"
              :key="item"
              class="px-2 py-0.5 rounded-full text-xs font-mono font-medium cursor-pointer"
              :style="badgeStyle(item)"
              @click="$emit('selectDep', item)"
            >
              {{ item }}
            </span>
          </div>

          <!-- Metrics -->
          <div class="flex items-center gap-2 shrink-0">
            <span
              class="px-1.5 py-0.5 rounded text-xs font-mono font-semibold"
              :class="liftClass(rule.lift)"
              :title="'lift = ' + rule.lift"
            >
              ×{{ rule.lift.toFixed(1) }}
            </span>
            <span
              class="px-1.5 py-0.5 rounded text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700"
              :title="'confidence = ' + (rule.confidence * 100).toFixed(0) + '%'"
            >
              {{ Math.round(rule.confidence * 100) }}%
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FrequentItemset, AssociationRule, DependencyRank } from '../../stores/stack'

const props = defineProps<{
  frequentItemsets: FrequentItemset[]
  associationRules: AssociationRule[]
  dependencies: DependencyRank[]
}>()

defineEmits<{ selectDep: [name: string] }>()

const depColorMap = computed(() => {
  const map: Record<string, string> = {}
  for (const dep of props.dependencies) {
    map[dep.name] = dep.communityColor
  }
  return map
})

const minSupportPct = computed(() => {
  const min = Math.min(...props.frequentItemsets.map(i => i.support))
  return Math.round(min * 100)
})

const groupedItemsets = computed(() => {
  const groups: Record<number, FrequentItemset[]> = {}
  for (const is of props.frequentItemsets) {
    if (!groups[is.items.length]) groups[is.items.length] = []
    groups[is.items.length]!.push(is)
  }
  return Object.entries(groups)
    .map(([size, itemsets]) => ({ size: Number(size), itemsets }))
    .sort((a, b) => a.size - b.size)
})

const rules = computed(() => props.associationRules)

function badgeStyle(name: string) {
  const color = depColorMap.value[name] ?? '#6b7280'
  return {
    backgroundColor: color + '22',
    color,
    border: `1px solid ${color}55`
  }
}

function liftClass(lift: number): string {
  if (lift >= 2) return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
  if (lift >= 1.5) return 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
  if (lift >= 1) return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
  return 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
}

function ruleKey(rule: AssociationRule): string {
  return rule.antecedent.join(',') + '->' + rule.consequent.join(',')
}
</script>
