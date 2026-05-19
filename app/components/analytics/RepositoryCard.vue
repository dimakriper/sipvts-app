<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative">
    <!-- Remove button -->
    <button
      @click="$emit('remove', repository.id)"
      class="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      title="Remove repository"
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

    <!-- Language and last updated -->
    <div class="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
      <span class="flex items-center gap-1">
        <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: getLanguageColor(repository.language) }"></span>
        {{ repository.language }}
      </span>
      <span>Updated {{ repository.lastUpdated }}</span>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="text-center">
        <div class="text-2xl mb-1">⭐</div>
        <p class="text-gray-600 dark:text-gray-400 text-xs">Stars</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.stars) }}</p>
      </div>
      <div class="text-center">
        <div class="text-2xl mb-1">🔀</div>
        <p class="text-gray-600 dark:text-gray-400 text-xs">Forks</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.forks) }}</p>
      </div>
      <div class="text-center">
        <div class="text-2xl mb-1">📋</div>
        <p class="text-gray-600 dark:text-gray-400 text-xs">Open Issues</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.openIssues) }}</p>
      </div>
      <div class="text-center">
        <div class="text-2xl mb-1">🔄</div>
        <p class="text-gray-600 dark:text-gray-400 text-xs">Pull Requests</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.pullRequests) }}</p>
      </div>
      <div class="text-center">
        <div class="text-2xl mb-1">👥</div>
        <p class="text-gray-600 dark:text-gray-400 text-xs">Contributors</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.contributorsCount) }}</p>
      </div>
      <div class="text-center">
        <div class="text-2xl mb-1">👁️</div>
        <p class="text-gray-600 dark:text-gray-400 text-xs">Watchers</p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">{{ formatNumber(repository.watchers) }}</p>
      </div>
    </div>

    <!-- Code Quality Metrics -->
    <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Code Quality
      </h3>
      <div class="space-y-3">
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-gray-600 dark:text-gray-400">Maintainability Index</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ repository.maintainability_index }} / 100</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div class="bg-blue-500 h-full rounded-full transition-all" :style="{ width: repository.maintainability_index + '%' }"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-gray-600 dark:text-gray-400">Cyclomatic Complexity</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ repository.cyclomatic_complexity }} / 50</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div class="bg-yellow-500 h-full rounded-full transition-all" :style="{ width: (repository.cyclomatic_complexity / 50) * 100 + '%' }"></div>
          </div>
        </div>
        <div>
          <div class="flex justify-between text-xs mb-1">
            <span class="text-gray-600 dark:text-gray-400">Code Duplication</span>
            <span class="font-semibold text-gray-900 dark:text-white">{{ repository.code_duplication }} / 100</span>
          </div>
          <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div class="bg-red-500 h-full rounded-full transition-all" :style="{ width: repository.code_duplication + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Repository {
  id: string
  url: string
  name: string
  owner: string
  description: string
  stars: number
  forks: number
  watchers: number
  openIssues: number
  pullRequests: number
  language: string
  lastUpdated: string
  starsHistory: number[]
  commitsHistory: number[]
  issuesHistory: number[]
  prHistory: number[]
  contributorsCount: number
  cyclomatic_complexity: number
  code_duplication: number
  maintainability_index: number
}

defineProps<{
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
}

function getLanguageColor(language: string): string {
  return languageColors[language] || '#858585'
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
</script>
