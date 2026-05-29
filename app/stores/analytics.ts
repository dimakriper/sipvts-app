import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type DataPoint = { t: number, v: number }
export interface Repository {
  id: string
  url: string
  name: string
  owner: string
  description: string
  // 1. Basic metadata
  createdAt: string
  pushedAt: string
  size: number
  languages: Record<string, number>
  // 2. Popularity
  stars: number
  forks: number
  watchers: number
  // 3. Development dynamics
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
  // 4. Team & Legal
  contributorsCount: number
  license: string
  // Charts history (12 monthly data points, t = UTC timestamp ms)
  starsHistory: DataPoint[]
  commitsHistory: DataPoint[]
  issuesHistory: DataPoint[]
  prHistory: DataPoint[]
}

export const useAnalyticsStore = defineStore(
  'analytics',
  () => {
    const repositories = ref<Repository[]>([])
    const archivedRepos = ref<Repository[]>([])
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Initialize with default repositories if empty
    const initializeStore = () => {
      if (repositories.value.length === 0) {
        repositories.value = getDefaultRepositories()
      }
    }

    // Add repository
    const addRepository = (repo: Repository) => {
      // Restore from archive if it was archived
      const archivedIdx = archivedRepos.value.findIndex(r => r.id === repo.id)
      if (archivedIdx !== -1) {
        archivedRepos.value.splice(archivedIdx, 1)
      }
      // Check if already active
      if (repositories.value.some((r) => r.id === repo.id)) {
        error.value = 'This repository is already in the list'
        return false
      }

      repositories.value.push(repo)
      error.value = null
      return true
    }

    // Soft-remove: move to archive
    const removeRepository = (repoId: string) => {
      const repo = repositories.value.find(r => r.id === repoId)
      if (repo) {
        archivedRepos.value.unshift(repo)
        repositories.value = repositories.value.filter(r => r.id !== repoId)
      }
    }

    // Restore from archive
    const restoreRepository = (repoId: string) => {
      const repo = archivedRepos.value.find(r => r.id === repoId)
      if (repo) {
        archivedRepos.value = archivedRepos.value.filter(r => r.id !== repoId)
        repositories.value.push(repo)
      }
    }

    // Hard-delete from archive
    const permanentlyDelete = (repoId: string) => {
      archivedRepos.value = archivedRepos.value.filter(r => r.id !== repoId)
    }

    // Clear archive only
    const clearArchive = () => {
      archivedRepos.value = []
    }

    // Clear all (active + archive)
    const clearRepositories = () => {
      repositories.value = []
      archivedRepos.value = []
    }

    // Update repository
    const updateRepository = (repoId: string, updates: Partial<Repository>) => {
      const index = repositories.value.findIndex((r) => r.id === repoId)
      if (index !== -1) {
        repositories.value[index] = Object.assign({}, repositories.value[index], updates) as Repository
      }
    }

    // Computed properties
    const repositoryCount = computed(() => repositories.value.length)

    const totalStars = computed(() =>
      repositories.value.reduce((sum, repo) => sum + repo.stars, 0)
    )

    const averageForks = computed(() => {
      if (repositories.value.length === 0) return 0
      return (
        repositories.value.reduce((sum, repo) => sum + repo.forks, 0) /
        repositories.value.length
      )
    })

    const setError = (message: string | null) => {
      error.value = message
    }

    return {
      repositories,
      archivedRepos,
      isLoading,
      error,
      initializeStore,
      addRepository,
      removeRepository,
      restoreRepository,
      permanentlyDelete,
      clearArchive,
      clearRepositories,
      updateRepository,
      setError,
      repositoryCount,
      totalStars,
      averageForks,
    }
  },
  { persist: { pick: ['repositories', 'archivedRepos'] } }
)

function generateWeeklyHistory(avgCommits: number, anchorMs: number): DataPoint[] {
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000
  const anchor = new Date(anchorMs)
  const dow = anchor.getUTCDay()
  const mondayMs = anchorMs - (dow === 0 ? 6 : dow - 1) * 24 * 60 * 60 * 1000
  const monday = new Date(mondayMs)
  monday.setUTCHours(0, 0, 0, 0)
  return Array.from({ length: 52 }, (_, i) => ({
    t: monday.getTime() - (51 - i) * WEEK_MS,
    v: Math.max(0, Math.round(avgCommits * (0.5 + Math.random())))
  }))
}

/** Cumulative history: value grows from ~65% of currentValue up to currentValue over `count` months. */
function generateCumulativeHistory(currentValue: number, count: number = 12): DataPoint[] {
  const now = Date.now()
  const startFraction = 0.65 + Math.random() * 0.1
  const startValue = Math.round(currentValue * startFraction)
  const gap = currentValue - startValue
  const result: DataPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCMonth(d.getUTCMonth() - i)
    d.setUTCDate(1)
    d.setUTCHours(0, 0, 0, 0)
    const progress = (count - i) / count
    const noise = (Math.random() - 0.4) * 0.05 * gap
    const v = Math.min(currentValue, Math.max(0, Math.round(startValue + gap * progress + noise)))
    result.push({ t: d.getTime(), v })
  }
  if (result.length > 0) result[result.length - 1]!.v = currentValue
  return result
}

/** Per-month increment history based on a given monthly average. */
function generateIncrementalHistory(monthlyBase: number, count: number = 12, volatility: number = 0.4): DataPoint[] {
  const now = Date.now()
  const result: DataPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCMonth(d.getUTCMonth() - i)
    d.setUTCDate(1)
    d.setUTCHours(0, 0, 0, 0)
    const noise = (Math.random() - 0.5) * volatility * monthlyBase
    result.push({ t: d.getTime(), v: Math.max(0, Math.round(monthlyBase + noise)) })
  }
  return result
}

export function generateMockRepo(owner: string, name: string): Repository {
  const id = `${owner}-${name}`
  const now = new Date()
  const ageYears = Math.random() * 8 + 1
  const createdAt = new Date(now.getTime() - ageYears * 365.25 * 24 * 60 * 60 * 1000).toISOString()
  const pushedAt = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
  const stars = Math.floor(Math.random() * 100000) + 100
  const forks = Math.floor(stars * (Math.random() * 0.1 + 0.02))
  const openIssues = Math.floor(Math.random() * 200) + 10
  const closedIssues = Math.floor(openIssues * (Math.random() * 5 + 2))
  const openPRs = Math.floor(Math.random() * 50) + 2
  const mergedPRs = Math.floor(Math.random() * 3000) + 100
  const closedPRs = Math.floor(mergedPRs * (Math.random() * 0.3 + 0.1))
  const totalCommits = Math.floor(Math.random() * 10000) + 500
  const releasesCount = Math.floor(Math.random() * 100) + 5
  const releaseFrequencyPerYear = Math.round(releasesCount / Math.max(1, ageYears))
  const langOptions: [string, number][][] = [
    [['TypeScript', 8000000], ['JavaScript', 500000]],
    [['Python', 6000000], ['Shell', 200000]],
    [['Go', 4000000], ['Shell', 150000]],
    [['Java', 7000000], ['XML', 300000]],
    [['Rust', 5000000], ['C', 1000000]],
    [['Vue', 2000000], ['TypeScript', 3000000], ['CSS', 400000]],
  ]
  const languages = Object.fromEntries(
    langOptions[Math.floor(Math.random() * langOptions.length)] ?? langOptions[0]!
  )
  const licenses = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC', 'None']
  const license = licenses[Math.floor(Math.random() * licenses.length)] ?? 'MIT'
  const avgWeeklyCommits = Math.max(1, Math.round(totalCommits / 52))
  return {
    id,
    url: `https://github.com/${owner}/${name}`,
    name,
    owner,
    description: `A popular ${name} repository with great features and active development.`,
    createdAt,
    pushedAt,
    size: Math.floor(Math.random() * 500000) + 5000,
    languages,
    stars,
    forks,
    watchers: Math.floor(stars * (Math.random() * 0.3 + 0.1)),
    openIssues,
    closedIssues,
    avgIssueCloseDays: Math.floor(Math.random() * 55) + 2,
    openPRs,
    mergedPRs,
    closedPRs,
    releasesCount,
    latestReleaseTag: `v${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}.${Math.floor(Math.random() * 10)}`,
    releaseFrequencyPerYear,
    weeklyCommits: generateWeeklyHistory(avgWeeklyCommits, new Date(pushedAt).getTime()),    contributorsCount: Math.floor(Math.random() * 500) + 20,
    license,
    // starsHistory: cumulative total stars growing to current value
    starsHistory: generateCumulativeHistory(stars),
    // commitsHistory: per-month commit sums (avg weekly * 4 weeks, with noise)
    commitsHistory: generateIncrementalHistory(Math.max(1, avgWeeklyCommits * 4), 12, 0.5),
    // issuesHistory: per-month new issues based on lifetime average rate
    issuesHistory: generateIncrementalHistory(
      Math.max(1, Math.round((openIssues + closedIssues) / Math.max(1, ageYears * 12))), 12, 0.6
    ),
    // prHistory: per-month PRs based on lifetime average rate
    prHistory: generateIncrementalHistory(
      Math.max(1, Math.round((openPRs + mergedPRs + closedPRs) / Math.max(1, ageYears * 12))), 12, 0.6
    ),
  }
}

function getDefaultRepositories(): Repository[] {
  return [
    
  ]
}
