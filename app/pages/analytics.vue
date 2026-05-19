<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Repository Analytics
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Analyze GitHub repositories and compare their metrics
        </p>
      </div>

      <ClientOnly>
        <!-- Repository Input Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Analyze Repository
          </h2>

          <div class="flex gap-2 mb-4">
            <input
              v-model="newRepoUrl"
              type="text"
              placeholder="Enter GitHub repository URL (e.g., https://github.com/owner/repo)"
              class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @keyup.enter="addRepository"
            >
            <button
              class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              @click="addRepository"
            >
              Add Repository
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
          class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <AnalyticsRepositoryCard
            v-for="repo in store.repositories"
            :key="repo.id"
            :repository="repo"
            @remove="removeRepository"
          />
        </div>

        <!-- Comparison Section -->
        <div
          v-if="store.repositories.length > 1"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Repository Comparison
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsMetricsChart
              title="Stars Growth"
              :repositories="store.repositories"
              metric-key="starsHistory"
              type="line"
            />
            <AnalyticsMetricsChart
              title="Commits by Month"
              :repositories="store.repositories"
              metric-key="commitsHistory"
              type="bar"
            />
            <AnalyticsMetricsChart
              title="Issues Growth"
              :repositories="store.repositories"
              metric-key="issuesHistory"
              type="line"
            />
            <AnalyticsMetricsChart
              title="Pull Requests by Month"
              :repositories="store.repositories"
              metric-key="prHistory"
              type="bar"
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
            No repositories added yet
          </h3>
          <p class="text-gray-600 dark:text-gray-400">
            Add a GitHub repository to see analytics and metrics
          </p>
        </div>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { $fetch } from 'ofetch'
import { useAnalyticsStore } from '../stores/analytics'
import type { Repository } from '../stores/analytics'

const store = useAnalyticsStore()
const newRepoUrl = ref('')

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
  const githubUrlPattern = /^https:\/\/github\.com\/[\w-]+\/[\w-]+\/?$/
  return githubUrlPattern.test(url.trim())
}

function extractRepoInfo(url: string): { owner: string, repo: string } | null {
  const match = url.trim().match(/github\.com\/([\w-]+)\/([\w-]+)/)
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
    store.setError('Invalid GitHub URL. Please use format: https://github.com/owner/repo')
    return
  }

  const repoInfo = extractRepoInfo(newRepoUrl.value)
  if (!repoInfo) {
    store.setError('Could not parse repository information')
    return
  }

  try {
    store.isLoading = true
    const newRepo = await $fetch('/api/analytics/repository', {
      method: 'POST',
      body: { owner: repoInfo.owner, repo: repoInfo.repo }
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

async function removeRepository(repoId: string) {
  try {
    await $fetch('/api/analytics/repository', {
      method: 'DELETE',
      query: { id: repoId }
    })
  } catch {
    // Ignore delete errors — remove from local store regardless
  }
  store.removeRepository(repoId)
}
</script>
