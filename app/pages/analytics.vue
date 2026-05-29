<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Аналитика репозиториев
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Анализируйте GitHub-репозитории и сравнивайте их метрики
        </p>
      </div>

      <!-- Инструкция по использованию -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
        <h2 class="text-base font-semibold text-blue-800 dark:text-blue-300 mb-2">
          Как пользоваться
        </h2>
        <ol class="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>Введите URL GitHub-репозитория в поле ввода (например, <span class="font-mono">https://github.com/vuejs/core</span>).</li>
          <li>Нажмите кнопку «Добавить» — система загрузит и отобразит метрики репозитория.</li>
          <li>Добавьте несколько репозиториев для сравнения графиков активности.</li>
          <li>Нажмите × на карточке, чтобы удалить репозиторий из списка.</li>
        </ol>
      </div>

      <ClientOnly>
        <!-- Repository Input Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
              Добавить репозиторий
            </h2>
            <div class="flex items-center gap-3">
              <button
                v-if="store.archivedRepos.length > 0"
                class="flex items-center gap-1.5 text-sm font-medium transition-colors"
                :class="
                  archiveOpen
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400'
                "
                @click="archiveOpen = !archiveOpen"
              >
                История
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold">
                  {{ store.archivedRepos.length }}
                </span>
                <span class="text-xs opacity-60">{{ archiveOpen ? '▴' : '▾' }}</span>
              </button>
              <button
                v-if="store.repositories.length > 0 || store.archivedRepos.length > 0"
                class="text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                @click="store.clearRepositories()"
              >
                Очистить всё
              </button>
            </div>
          </div>

          <!-- Archive panel -->
          <div
            v-if="archiveOpen && store.archivedRepos.length > 0"
            class="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Удалённые репозитории</span>
            </div>
            <div class="divide-y divide-gray-100 dark:divide-gray-700">
              <div
                v-for="repo in store.archivedRepos"
                :key="repo.id"
                class="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-gray-800"
              >
                <div class="flex-1 min-w-0">
                  <span class="text-sm font-mono text-gray-700 dark:text-gray-300 truncate block">
                    {{ repo.owner }}/{{ repo.name }}
                  </span>
                </div>
                <button
                  class="shrink-0 px-3 py-1 text-xs font-medium border border-indigo-300 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                  @click="store.restoreRepository(repo.id)"
                >
                  Восстановить
                </button>
                <button
                  class="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-xs"
                  @click="store.permanentlyDelete(repo.id)"
                >
                  ✕
                </button>
              </div>
            </div>
            <div class="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                class="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                @click="store.clearArchive()"
              >
                Очистить архив
              </button>
            </div>
          </div>

          <div class="flex gap-2 mb-4">
            <div class="relative flex-1">
              <input
                v-model="newRepoUrl"
                type="text"
                placeholder="https://github.com/owner/repo или owner/repo"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autocomplete="off"
                @focus="repoSuggestOpen = true"
                @blur="onRepoBlur"
                @keydown.down.prevent="repoSuggestIdx = Math.min(repoSuggestIdx + 1, repoSuggestions.length - 1)"
                @keydown.up.prevent="repoSuggestIdx = Math.max(repoSuggestIdx - 1, 0)"
                @keydown.enter.prevent="repoSuggestIdx >= 0 ? applyRepoSuggestion(repoSuggestions[repoSuggestIdx]) : addRepository()"
                @keydown.escape="repoSuggestOpen = false"
                @input="repoSuggestIdx = 0"
              >
              <ul
                v-if="repoSuggestOpen && repoSuggestions.length > 0"
                class="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-64 overflow-y-auto"
              >
                <li
                  v-for="(s, i) in repoSuggestions"
                  :key="s.slug"
                  class="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors"
                  :class="
                    i === repoSuggestIdx
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  "
                  @mousedown.prevent="applyRepoSuggestion(s)"
                >
                  <span
                    v-if="s.source === 'archive'"
                    class="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
                  >архив</span>
                  <span
                    v-else
                    class="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  >{{ s.category }}</span>
                  <span class="font-mono">{{ s.slug }}</span>
                  <span
                    v-if="s.description"
                    class="truncate text-gray-400 dark:text-gray-500 text-xs"
                  >— {{ s.description }}</span>
                </li>
              </ul>
            </div>
            <button
              class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shrink-0"
              @click="addRepository"
            >
              Добавить
            </button>
          </div>

          <!-- Error message -->
          <div
            v-if="store.error"
            class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400"
          >
            {{ store.error }}
          </div>
        </div>

        <!-- Repositories Grid -->
        <div
          v-if="store.repositories.length > 0"
          class="flex flex-wrap gap-5 items-stretch"
        >
          <div
            v-for="repo in store.repositories"
            :key="repo.id"
            class="min-w-70 flex-1 flex flex-col self-stretch"
          >
            <AnalyticsRepositoryCard
              class="flex-1 flex flex-col"
              :repository="repo"
              @remove="removeRepository"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="store.repositories.length === 0"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center"
        >
          <div class="text-6xl mb-4">
            📊
          </div>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Репозитории ещё не добавлены
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Добавьте GitHub-репозиторий для просмотра аналитики и метрик
          </p>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { $fetch } from 'ofetch'
import { useAnalyticsStore } from '../stores/analytics'
import type { Repository } from '../stores/analytics'

const store = useAnalyticsStore()
const newRepoUrl = ref('')
const archiveOpen = ref(false)
const repoSuggestOpen = ref(false)
const repoSuggestIdx = ref(0)

interface RepoSuggestion {
  slug: string
  category: string
  description?: string
  source: 'preset' | 'archive'
}

const PRESET_REPOS: RepoSuggestion[] = [
  { slug: 'vuejs/core', category: 'Vue', description: 'Vue 3 core', source: 'preset' },
  { slug: 'nuxt/nuxt', category: 'Vue', description: 'Nuxt framework', source: 'preset' },
  { slug: 'vuejs/vue-router', category: 'Vue', description: 'Official router', source: 'preset' },
  { slug: 'vuejs/pinia', category: 'Vue', description: 'State management', source: 'preset' },
  { slug: 'facebook/react', category: 'React', description: 'React library', source: 'preset' },
  { slug: 'vercel/next.js', category: 'React', description: 'Next.js framework', source: 'preset' },
  { slug: 'remix-run/remix', category: 'React', description: 'Remix framework', source: 'preset' },
  { slug: 'angular/angular', category: 'Angular', description: 'Angular framework', source: 'preset' },
  { slug: 'sveltejs/svelte', category: 'Svelte', description: 'Svelte compiler', source: 'preset' },
  { slug: 'vitejs/vite', category: 'Tooling', description: 'Frontend build tool', source: 'preset' },
  { slug: 'microsoft/TypeScript', category: 'Tooling', description: 'TypeScript language', source: 'preset' },
  { slug: 'expressjs/express', category: 'Node', description: 'Express.js', source: 'preset' },
  { slug: 'fastify/fastify', category: 'Node', description: 'Fast Node framework', source: 'preset' },
  { slug: 'prisma/prisma', category: 'DB', description: 'Next-gen ORM', source: 'preset' },
  { slug: 'django/django', category: 'Python', description: 'Django web framework', source: 'preset' },
  { slug: 'pallets/flask', category: 'Python', description: 'Flask micro-framework', source: 'preset' },
  { slug: 'tiangolo/fastapi', category: 'Python', description: 'FastAPI framework', source: 'preset' },
  { slug: 'pytorch/pytorch', category: 'ML', description: 'PyTorch deep learning', source: 'preset' },
  { slug: 'scikit-learn/scikit-learn', category: 'ML', description: 'ML for Python', source: 'preset' },
  { slug: 'pandas-dev/pandas', category: 'ML', description: 'Data analysis', source: 'preset' }
]

const repoSuggestions = computed<RepoSuggestion[]>(() => {
  const q = newRepoUrl.value.trim().toLowerCase()
  const archiveSuggestions: RepoSuggestion[] = store.archivedRepos.map(r => ({
    slug: `${r.owner}/${r.name}`,
    category: 'архив',
    description: r.description || undefined,
    source: 'archive' as const
  }))
  const all = [...archiveSuggestions, ...PRESET_REPOS]
  if (!q) return all.slice(0, 8)
  return all
    .filter(s => s.slug.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q))
    .slice(0, 10)
})

function applyRepoSuggestion(s: RepoSuggestion) {
  newRepoUrl.value = s.slug
  repoSuggestOpen.value = false
  repoSuggestIdx.value = 0
}

function onRepoBlur() {
  setTimeout(() => {
    repoSuggestOpen.value = false
  }, 150)
}

onMounted(async () => {
  try {
    const defaults = await $fetch<Repository[]>('/api/analytics/repositories')
    for (const repo of defaults) {
      if (!store.repositories.some(r => r.id === repo.id)) {
        store.addRepository(repo)
      }
    }
  } catch {
    // API unavailable
  }
})

function validateUrl(url: string): boolean {
  const trimmed = url.trim()
  const fullUrl = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/
  const shortForm = /^[\w.-]+\/[\w.-]+$/
  return fullUrl.test(trimmed) || shortForm.test(trimmed)
}

function extractRepoInfo(url: string): { owner: string, repo: string } | null {
  const trimmed = url.trim()
  // Try full URL first, then short owner/repo form
  const match = trimmed.match(/github\.com\/([\w.-]+)\/([\w.-]+)/) ?? trimmed.match(/^([\w.-]+)\/([\w.-]+)$/)
  const owner = match?.[1]
  const repo = match?.[2]

  if (owner && repo) {
    return { owner, repo }
  }

  return null
}

async function addRepository() {
  store.setError(null)

  if (!newRepoUrl.value.trim()) {
    store.setError('Please enter a repository URL')
    return
  }

  if (!validateUrl(newRepoUrl.value)) {
    store.setError('Invalid input. Use https://github.com/owner/repo or owner/repo')
    return
  }

  const repoInfo = extractRepoInfo(newRepoUrl.value)
  if (!repoInfo) {
    store.setError('Could not parse repository information')
    return
  }

  try {
    store.isLoading = true
    const newRepo = await $fetch('/api/analytics/repository-live', {
      query: { owner: repoInfo.owner, repo: repoInfo.repo }
    })
    const success = store.addRepository(newRepo)
    if (success) {
      newRepoUrl.value = ''
    }
  } catch {
    store.setError('Failed to fetch repository data')
  } finally {
    store.isLoading = false
  }
}

function removeRepository(repoId: string) {
  store.removeRepository(repoId)
}
</script>
