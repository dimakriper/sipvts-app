<template>
  <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 ">
    <!-- Remove button -->
    <button
      @click="$emit('remove', repository.id)"
      class="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      title="Удалить репозиторий"
    >
      <svg
        class="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Header -->
    <div class="mb-4 pr-8">
      <a
        :href="`https://github.com/${repository.owner}/${repository.name}`"
        target="_blank"
        rel="noopener noreferrer"
        class="text-lg font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        {{ repository.owner }}/{{ repository.name }}
      </a>
      <p class="text-gray-600 dark:text-gray-400 text-sm mt-1">
        {{ repository.description }}
      </p>
    </div>

    <!-- 1. Basic metadata -->
    <div class="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
      <span>📅 Создан: {{ formatDate(repository.createdAt) }}</span>
      <span>🕐 Обновлён: {{ formatDate(repository.pushedAt) }}</span>
      <span>💾 Размер: {{ formatSize(repository.size) }}</span>
    </div>

    <!-- 2. Languages -->
    <div class="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
      <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Языки программирования
      </p>
      <div class="flex rounded-full overflow-hidden h-2 mb-2 bg-gray-200 dark:bg-gray-700">
        <div
          v-for="[lang, bytes] in topLanguages"
          :key="lang"
          :style="{ width: langPercent(bytes) + '%', backgroundColor: getLanguageColor(lang) }"
          :title="`${lang}: ${langPercent(bytes)}%`"
        />
      </div>
      <div class="flex flex-wrap gap-x-3 gap-y-1">
        <span
          v-for="[lang, bytes] in topLanguages"
          :key="lang"
          class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400"
        >
          <span
            class="w-2 h-2 rounded-full inline-block flex-shrink-0"
            :style="{ backgroundColor: getLanguageColor(lang) }"
          />
          {{ lang }}
          <span class="text-gray-400 dark:text-gray-500">{{ langPercent(bytes) }}%</span>
        </span>
      </div>
    </div>

    <!-- 3. Popularity -->
    <div class="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
      <div class="text-center">
        <div class="text-xl mb-0.5">⭐</div>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.stars) }}</p>
        <p class="text-gray-500 dark:text-gray-400 text-xs">Звёзды</p>
      </div>
      <div class="text-center">
        <div class="text-xl mb-0.5">🔀</div>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.forks) }}</p>
        <p class="text-gray-500 dark:text-gray-400 text-xs">Форки</p>
      </div>
      <div class="text-center">
        <div class="text-xl mb-0.5">👁️</div>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.watchers) }}</p>
        <p class="text-gray-500 dark:text-gray-400 text-xs">Подписчики</p>
      </div>
    </div>

    <!-- 4. Issues -->
    <div class="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
      <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Задачи (Issues)
      </p>
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <p class="text-base font-semibold text-yellow-600 dark:text-yellow-400">{{ formatNumber(repository.openIssues) }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">Открытые</p>
        </div>
        <div class="text-center">
          <p class="text-base font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.closedIssues) }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">Закрытые</p>
        </div>
        <div class="text-center">
          <p class="text-base font-semibold text-gray-900 dark:text-white">{{ repository.avgIssueCloseDays }} дн.</p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">Среднее закрытие</p>
        </div>
      </div>
    </div>

    <!-- 5. Pull Requests -->
    <div class="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
      <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Pull Requests
      </p>
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <p class="text-base font-semibold text-yellow-600 dark:text-yellow-400">{{ formatNumber(repository.openPRs) }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">Открытые</p>
        </div>
        <div class="text-center">
          <p class="text-base font-semibold text-green-600 dark:text-green-400">{{ formatNumber(repository.mergedPRs) }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">Принятые</p>
        </div>
        <div class="text-center">
          <p class="text-base font-semibold text-red-500 dark:text-red-400">{{ formatNumber(repository.closedPRs) }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">Отклонённые</p>
        </div>
      </div>
    </div>

    <!-- 6. Releases -->
    <div class="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
      <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Релизы
      </p>
      <div class="grid grid-cols-3 gap-3">
        <div class="text-center">
          <p class="text-base font-semibold text-gray-900 dark:text-white">{{ repository.releasesCount }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">Всего</p>
        </div>
        <div class="text-center">
          <p class="text-base font-semibold text-indigo-600 dark:text-indigo-400 font-mono">{{ repository.latestReleaseTag }}</p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">Последний</p>
        </div>
        <div class="text-center">
          <p class="text-base font-semibold text-gray-900 dark:text-white">{{ repository.releaseFrequencyPerYear }}/год</p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">Частота</p>
        </div>
      </div>
    </div>

    <!-- 7. Commit activity sparkline (52 weeks) -->
    <div class="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
      <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Активность коммитов (52 нед.)
      </p>
      <div class="flex items-end gap-px h-10">
        <div
          v-for="(commit, i) in repository.weeklyCommits"
          :key="i"
          class="flex-1 bg-indigo-400 dark:bg-indigo-500 rounded-sm"
          :style="{ height: weeklyCommitHeight(commit.v) + '%' }"
          :title="`${formatWeekDate(commit.t)}: ${commit.v} коммитов`"
        />
      </div>
    </div>

    <!-- 8. Charts: monthly history -->
    <div class="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
      <div class="grid grid-cols-2 gap-4">
        <AnalyticsMetricsChart
          title="Рост звёзд"
          :repositories="[repository]"
          metric-key="starsHistory"
          type="line"
        />
        <AnalyticsMetricsChart
          title="Коммиты по месяцам"
          :repositories="[repository]"
          metric-key="commitsHistory"
          type="bar"
          :delta="true"
        />
        <AnalyticsMetricsChart
          title="Рост задач"
          :repositories="[repository]"
          metric-key="issuesHistory"
          type="line"
        />
        <AnalyticsMetricsChart
          title="Pull Request'ы по месяцам"
          :repositories="[repository]"
          metric-key="prHistory"
          type="bar"
        />
      </div>
    </div>

    <!-- 9. Contributors & License -->
    <div class="flex justify-between items-center text-sm">
      <span class="text-gray-600 dark:text-gray-400">
        👥 <span class="font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.contributorsCount) }}</span> контрибьюторов
      </span>
      <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-mono text-xs">
        {{ repository.license }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataPoint } from '../../stores/analytics'

interface Repository {
  id: string
  url: string
  name: string
  owner: string
  description: string
  createdAt: string
  pushedAt: string
  size: number
  languages: Record<string, number>
  stars: number
  forks: number
  watchers: number
  openIssues: number
  closedIssues: number
  avgIssueCloseDays: number
  openPRs: number
  mergedPRs: number
  closedPRs: number
  releasesCount: number
  latestReleaseTag: string
  releaseFrequencyPerYear: number
  weeklyCommits: DataPoint[]
  contributorsCount: number
  license: string
  starsHistory: DataPoint[]
  commitsHistory: DataPoint[]
  issuesHistory: DataPoint[]
  prHistory: DataPoint[]
}

const props = defineProps<{
  repository: Repository
}>()

defineEmits<{
  remove: [id: string]
}>()

const languageColors: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#ce422b',
  Vue: '#42b983',
  React: '#61dafb',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#239120',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Shell: '#89e051',
  Ruby: '#701516',
  XML: '#f60',
  C: '#555555',
}

function getLanguageColor(language: string): string {
  return languageColors[language] ?? '#858585'
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short', day: 'numeric' })
}

function formatSize(kb: number): string {
  if (kb >= 1024 * 1024) return (kb / 1024 / 1024).toFixed(1) + ' ГБ'
  if (kb >= 1024) return (kb / 1024).toFixed(1) + ' МБ'
  return kb + ' КБ'
}

const totalBytes = computed(() =>
  Object.values(props.repository.languages).reduce((a, b) => a + b, 0)
)

const topLanguages = computed(() =>
  (Object.entries(props.repository.languages ?? {}) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
)

function langPercent(bytes: number): number {
  return totalBytes.value > 0 ? Math.round((bytes / totalBytes.value) * 100) : 0
}

const maxWeeklyCommits = computed(() =>
  Math.max(...props.repository.weeklyCommits.map(p => p.v), 1)
)

function weeklyCommitHeight(v: number): number {
  return Math.max(5, Math.round((v / maxWeeklyCommits.value) * 100))
}

function formatWeekDate(ts: number): string {
  const d = new Date(ts)
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const yyyy = d.getUTCFullYear()
  return `${dd}.${mm}.${yyyy}`
}
</script>
