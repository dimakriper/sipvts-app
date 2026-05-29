<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- ── Search bar ── -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-wrap gap-3 items-end">
          <div>
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Язык
            </label>
            <select
              v-model="store.language"
              class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option
                value=""
                disabled
              >
                Выберите язык
              </option>
              <option
                v-for="lang in SUPPORTED_LANGUAGES"
                :key="lang"
                :value="lang"
              >
                {{ lang }}
              </option>
            </select>
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
              Поисковый запрос
            </label>
            <div class="relative">
              <input
                v-model="store.query"
                type="text"
                placeholder="api, rest, async..."
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autocomplete="off"
                @focus="querySuggestOpen = true"
                @blur="onQueryBlur"
                @keydown.down.prevent="querySuggestIdx = Math.min(querySuggestIdx + 1, querySuggestions.length - 1)"
                @keydown.up.prevent="querySuggestIdx = Math.max(querySuggestIdx - 1, 0)"
                @keydown.enter.prevent="querySuggestIdx >= 0 && querySuggestions.length > 0 ? applyQuerySuggestion(querySuggestions[querySuggestIdx]) : (querySuggestOpen = false, store.search())"
                @keydown.escape="querySuggestOpen = false"
                @input="querySuggestIdx = 0"
              >
              <ul
                v-if="querySuggestOpen && querySuggestions.length > 0"
                class="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto"
              >
                <li
                  v-for="(s, i) in querySuggestions"
                  :key="s.value"
                  class="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors"
                  :class="
                    i === querySuggestIdx
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  @mousedown.prevent="applyQuerySuggestion(s)"
                >
                  <span
                    class="text-xs px-1.5 py-0.5 rounded shrink-0"
                    :class="s.source === 'history' ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'"
                  >{{ s.source === 'history' ? 'ист.' : s.tag }}</span>
                  <span class="font-mono">{{ s.value }}</span>
                </li>
              </ul>
            </div>
          </div>
          <button
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
            :disabled="store.loading"
            @click="store.search"
          >
            {{ store.loading ? 'Поиск...' : 'Анализировать' }}
          </button>
          <button
            v-if="store.result"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
            @click="store.reset"
          >
            Сбросить
          </button>
          <button
            v-if="store.history.length > 0"
            class="px-4 py-2 border rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            :class="
              historyOpen
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            "
            @click="historyOpen = !historyOpen"
          >
            История
            <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold">{{ store.history.length }}</span>
            <span class="text-xs opacity-60">{{ historyOpen ? '▴' : '▾' }}</span>
          </button>
        </div>
        <p
          v-if="store.error"
          class="mt-2 text-sm text-red-600 dark:text-red-400"
        >
          {{ store.error }}
        </p>
      </div>
    </div>

    <!-- ── History panel ── -->
    <div
      v-if="historyOpen && store.history.length > 0"
      class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="divide-y divide-gray-100 dark:divide-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            v-for="entry in store.history"
            :key="entry.id"
            class="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
            :class="
              store.result === entry.result
                ? 'bg-indigo-50 dark:bg-indigo-900/20'
                : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            "
            @click="store.loadFromHistory(entry); historyOpen = false"
          >
            <span
              class="shrink-0 px-2 py-0.5 rounded text-xs font-semibold text-white"
              :class="entry.language === 'Python' ? 'bg-yellow-500' : 'bg-blue-500'"
            >
              {{ entry.language }}
            </span>
            <span class="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">
              {{ entry.keywords || '(без фильтра)' }}
            </span>
            <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">
              {{ entry.result.reposAnalyzed }} репоз.
            </span>
            <span class="shrink-0 text-xs text-gray-400 dark:text-gray-500">
              {{ formatHistoryDate(entry.timestamp) }}
            </span>
            <button
              class="shrink-0 w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs"
              @click.stop="store.deleteHistoryEntry(entry.id)"
            >
              ✕
            </button>
          </div>
        </div>
        <div class="flex justify-end mt-3">
          <button
            class="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            @click="store.clearHistory(); store.reset(); historyOpen = false"
          >
            Очистить всё
          </button>
        </div>
      </div>
    </div>

    <!-- ── Empty / initial state ── -->
    <div
      v-if="!store.result && !store.loading"
      class="flex flex-col items-center justify-center py-24 text-center px-4"
    >
      <div class="text-7xl mb-6">
        🔍
      </div>
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Поиск технологического стека
      </h2>
      <p class="text-gray-500 dark:text-gray-400 max-w-lg mb-8">
        Выберите язык программирования и введите ключевые слова. Система проанализирует манифесты публичных репозиториев и покажет популярные зависимости, их связи и типичные стеки.
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl w-full">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div class="text-2xl mb-2">
            📊
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
            Рейтинг зависимостей
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Частота использования в проектах
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div class="text-2xl mb-2">
            🕸️
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
            Граф связей
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Интерактивный форс-граф совместной встречаемости
          </p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div class="text-2xl mb-2">
            🧩
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
            Детекция стеков
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Автоматическое выявление типичных стеков
          </p>
        </div>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div
      v-else-if="store.loading"
      class="flex items-center justify-center py-24"
    >
      <div class="text-center">
        <div class="inline-block w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p class="text-gray-500 dark:text-gray-400">
          Анализируем репозитории...
        </p>
      </div>
    </div>

    <!-- ── Results layout ── -->
    <div
      v-else-if="store.result"
      class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      <!-- Stats strip -->
      <div class="flex flex-wrap gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-xl px-5 py-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ store.result.reposAnalyzed }}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            репозиториев проанализировано
          </span>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl px-5 py-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ store.result.dependencies.length }}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            зависимостей найдено
          </span>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-xl px-5 py-3 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{{ store.result.graphLinks.length }}</span>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            значимых связей
          </span>
        </div>
      </div>

      <!-- Main 3-column layout -->
      <div class="flex gap-6 items-start">
        <!-- LEFT SIDEBAR -->
        <aside class="w-56 shrink-0 space-y-4 sticky top-4">
          <!-- Jaccard threshold -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
              Порог Jaccard
            </h3>
            <input
              v-model.number="store.jaccardThreshold"
              type="range"
              min="0"
              max="0.9"
              step="0.05"
              class="w-full"
            >
            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Все связи</span>
              <span class="font-mono font-semibold text-gray-700 dark:text-gray-200">{{ store.jaccardThreshold.toFixed(2) }}</span>
              <span>Сильные</span>
            </div>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Видимых рёбер: {{ visibleLinks }}
            </p>
          </div>

          <!-- Community toggles -->
          <div
            v-if="store.result"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <h3 class="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
              Сообщества
            </h3>
            <div class="space-y-2">
              <label
                v-for="c in store.result.communities"
                :key="c.id"
                class="flex items-center gap-2 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  :checked="store.activeCommunities.has(c.id)"
                  class="rounded"
                  @change="store.toggleCommunity(c.id)"
                >
                <span
                  class="w-2.5 h-2.5 rounded-full shrink-0"
                  :style="{ backgroundColor: c.color }"
                />
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ c.name }}</span>
                <span class="text-xs text-gray-400">({{ c.members.length }})</span>
              </label>
            </div>
          </div>

          <!-- Selected dep quick info -->
          <div
            v-if="selectedDepInfo"
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Выбрано
              </h3>
              <button
                class="text-xs text-gray-400 hover:text-gray-600"
                @click="store.selectDep(null)"
              >
                ✕
              </button>
            </div>
            <p class="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
              {{ selectedDepInfo.name }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ selectedDepInfo.count }} проектов ({{ selectedDepInfo.percentage }}%)
            </p>
            <span
              class="inline-block mt-2 px-2 py-0.5 rounded-full text-white text-xs"
              :style="{ backgroundColor: selectedDepInfo.communityColor }"
            >
              {{ communityLabel(selectedDepInfo.communityId) }}
            </span>
          </div>
        </aside>

        <!-- CENTER: Graph + Tabs -->
        <div class="flex-1 min-w-0 space-y-4">
          <!-- Graph -->
          <div
            class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style="height: 520px"
          >
            <ClientOnly>
              <StackForceGraph
                :nodes="store.result.graphNodes"
                :links="store.result.graphLinks"
                :selected-dep="store.selectedDep"
                :jaccard-threshold="store.jaccardThreshold"
                :communities="store.result.communities"
                :active-communities="store.activeCommunities"
                @select-dep="store.selectDep"
              />
              <template #fallback>
                <div class="w-full h-full flex items-center justify-center text-gray-400">
                  Загрузка графа...
                </div>
              </template>
            </ClientOnly>
          </div>

          <!-- Bottom Tabs -->
          <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div class="flex border-b border-gray-200 dark:border-gray-700">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                class="px-5 py-3 text-sm font-medium transition-colors"
                :class="
                  store.activeTab === tab.id
                    ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                "
                @click="setActiveTab(tab.id)"
              >
                {{ tab.label }}
              </button>
            </div>
            <div class="p-5">
              <StackDependencyTable
                v-if="store.activeTab === 'table'"
                :dependencies="store.result.dependencies"
                :selected-dep="store.selectedDep"
                @select-dep="store.selectDep"
              />
              <StackFrequentItemsets
                v-else-if="store.activeTab === 'stacks'"
                :frequent-itemsets="store.result.frequentItemsets"
                :association-rules="store.result.associationRules"
                :dependencies="store.result.dependencies"
                @select-dep="store.selectDep"
              />
              <StackCoOccurrenceMatrix
                v-else-if="store.activeTab === 'matrix'"
                :co-occurrence-matrix="store.result.coOccurrenceMatrix"
                :jaccard-matrix="store.result.jaccardMatrix"
                :dependencies="store.result.dependencies"
              />
            </div>
          </div>
        </div>

        <!-- RIGHT PANEL: Dep details -->
        <aside
          v-if="selectedDepInfo"
          class="w-64 shrink-0 sticky top-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-5"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-gray-900 dark:text-white font-mono">
              {{ selectedDepInfo.name }}
            </h3>
            <button
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              @click="store.selectDep(null)"
            >
              ✕
            </button>
          </div>

          <!-- Stats -->
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {{ selectedDepInfo.count }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                проектов
              </p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
              <p class="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {{ selectedDepInfo.percentage }}%
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                охват
              </p>
            </div>
          </div>

          <!-- Community -->
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
              Сообщество
            </p>
            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-medium"
              :style="{ backgroundColor: selectedDepInfo.communityColor }"
            >
              {{ communityLabel(selectedDepInfo.communityId) }}
            </span>
          </div>

          <!-- Top related -->
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
              Связанные зависимости
            </p>
            <div class="space-y-2">
              <div
                v-for="rel in detailedRelated"
                :key="rel.name"
                class="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded p-1 -mx-1 transition-colors"
                @click="store.selectDep(rel.name)"
              >
                <span class="font-mono text-sm text-gray-800 dark:text-gray-200">{{ rel.name }}</span>
                <span class="text-xs font-semibold text-indigo-500">{{ rel.jaccard.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Jaccard scores bar chart -->
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
              Top Jaccard
            </p>
            <div class="space-y-1.5">
              <div
                v-for="item in topJaccardScores"
                :key="item.name"
                class="flex items-center gap-2 text-xs"
              >
                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-indigo-500"
                    :style="{ width: (item.score * 100) + '%' }"
                  />
                </div>
                <span class="font-mono text-gray-500 dark:text-gray-400 min-w-[60px] text-right">{{ item.name }}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStackStore, SUPPORTED_LANGUAGES } from '../stores/stack'

const store = useStackStore()
const historyOpen = ref(false)
const querySuggestOpen = ref(false)
const querySuggestIdx = ref(0)

interface QuerySuggestion { value: string, tag: string, source: 'preset' | 'history' }

const PRESET_KEYWORDS: Record<string, QuerySuggestion[]> = {
  JavaScript: [
    { value: 'react', tag: 'UI', source: 'preset' },
    { value: 'vue', tag: 'UI', source: 'preset' },
    { value: 'angular', tag: 'UI', source: 'preset' },
    { value: 'next', tag: 'SSR', source: 'preset' },
    { value: 'nuxt', tag: 'SSR', source: 'preset' },
    { value: 'svelte', tag: 'UI', source: 'preset' },
    { value: 'express', tag: 'API', source: 'preset' },
    { value: 'fastify', tag: 'API', source: 'preset' },
    { value: 'graphql', tag: 'API', source: 'preset' },
    { value: 'prisma', tag: 'DB', source: 'preset' },
    { value: 'mongoose', tag: 'DB', source: 'preset' },
    { value: 'jest', tag: 'Тест', source: 'preset' },
    { value: 'vitest', tag: 'Тест', source: 'preset' },
    { value: 'vite', tag: 'Build', source: 'preset' },
    { value: 'webpack', tag: 'Build', source: 'preset' },
    { value: 'tailwindcss', tag: 'CSS', source: 'preset' },
    { value: 'typescript', tag: 'Lang', source: 'preset' },
    { value: 'zustand', tag: 'State', source: 'preset' },
    { value: 'redux', tag: 'State', source: 'preset' },
    { value: 'zod', tag: 'Valid', source: 'preset' },
  ],
  Python: [
    { value: 'fastapi', tag: 'API', source: 'preset' },
    { value: 'django', tag: 'Web', source: 'preset' },
    { value: 'flask', tag: 'Web', source: 'preset' },
    { value: 'sqlalchemy', tag: 'DB', source: 'preset' },
    { value: 'pydantic', tag: 'Valid', source: 'preset' },
    { value: 'celery', tag: 'Worker', source: 'preset' },
    { value: 'redis', tag: 'Cache', source: 'preset' },
    { value: 'pytest', tag: 'Тест', source: 'preset' },
    { value: 'pandas', tag: 'Data', source: 'preset' },
    { value: 'numpy', tag: 'Data', source: 'preset' },
    { value: 'torch', tag: 'ML', source: 'preset' },
    { value: 'tensorflow', tag: 'ML', source: 'preset' },
    { value: 'scikit-learn', tag: 'ML', source: 'preset' },
    { value: 'requests', tag: 'HTTP', source: 'preset' },
    { value: 'httpx', tag: 'HTTP', source: 'preset' },
    { value: 'boto3', tag: 'AWS', source: 'preset' },
    { value: 'asyncpg', tag: 'DB', source: 'preset' },
    { value: 'alembic', tag: 'DB', source: 'preset' },
  ]
}

const querySuggestions = computed<QuerySuggestion[]>(() => {
  const q = store.query.trim().toLowerCase()
  const lang = store.language || 'JavaScript'
  const historySuggestions: QuerySuggestion[] = store.history
    .filter(h => h.keywords && h.language === lang)
    .map(h => ({ value: h.keywords, tag: 'ист.', source: 'history' as const }))
    .filter((s, i, arr) => arr.findIndex(x => x.value === s.value) === i)
  const presets = PRESET_KEYWORDS[lang] ?? PRESET_KEYWORDS['JavaScript']!
  const all = [...historySuggestions, ...presets]
  if (!q) return all.slice(0, 10)
  return all.filter(s => s.value.toLowerCase().includes(q)).slice(0, 10)
})

function applyQuerySuggestion(s: QuerySuggestion) {
  store.query = s.value
  querySuggestOpen.value = false
  querySuggestIdx.value = 0
}

function onQueryBlur() {
  setTimeout(() => { querySuggestOpen.value = false }, 150)
}

onMounted(() => {
  if (!store.result) {
    if (store.history.length > 0) {
      store.loadFromHistory(store.history[0]!)
    } else {
      store.loadDefaultData()
    }
  }
})

function formatHistoryDate(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) + ' ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function setActiveTab(id: string) {
  store.activeTab = id as typeof store.activeTab
}

const tabs = [
  { id: 'table', label: '📋 Рейтинг' },
  { id: 'stacks', label: '🧩 Стеки' },
  { id: 'matrix', label: '🔗 Матрица совместности' }
]

function communityLabel(id: number): string {
  return store.result?.communities.find(c => c.id === id)?.name ?? `Сообщество ${id + 1}`
}

const selectedDepInfo = computed(() =>
  store.selectedDep
    ? store.result?.dependencies.find(d => d.name === store.selectedDep) ?? null
    : null
)

const visibleLinks = computed(() =>
  store.result?.graphLinks.filter(l => l.weight >= store.jaccardThreshold).length ?? 0
)

const detailedRelated = computed(() => {
  if (!selectedDepInfo.value || !store.result) return []
  const row = store.result.jaccardMatrix[selectedDepInfo.value.name] ?? {}
  return Object.entries(row)
    .filter(([name]) => name !== selectedDepInfo.value!.name)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 6)
    .map(([name, jaccard]) => ({ name, jaccard }))
})

const topJaccardScores = computed(() => {
  if (!selectedDepInfo.value || !store.result) return []
  const row = store.result.jaccardMatrix[selectedDepInfo.value.name] ?? {}
  return Object.entries(row)
    .filter(([name]) => name !== selectedDepInfo.value!.name)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 8)
    .map(([name, score]) => ({ name, score }))
})
</script>
