import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Repository {
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

export const useAnalyticsStore = defineStore(
  'analytics',
  () => {
    const repositories = ref<Repository[]>([])
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
      // Check if already exists
      if (repositories.value.some((r) => r.id === repo.id)) {
        error.value = 'This repository is already in the list'
        return false
      }

      repositories.value.push(repo)
      error.value = null
      return true
    }

    // Remove repository
    const removeRepository = (repoId: string) => {
      repositories.value = repositories.value.filter((r) => r.id !== repoId)
    }

    // Clear all repositories
    const clearRepositories = () => {
      repositories.value = []
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
      isLoading,
      error,
      initializeStore,
      addRepository,
      removeRepository,
      clearRepositories,
      updateRepository,
      setError,
      repositoryCount,
      totalStars,
      averageForks,
    }
  },
  {
    persist: [
      {
        key: 'analytics-store',
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        pick: ['repositories']
      }
    ]
  }
)

function generateRandomHistory(
  baseValue: number,
  count: number = 12,
  volatility: number = 0.2
): number[] {
  const history: number[] = []
  let currentValue = baseValue * 0.5

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * volatility * currentValue
    currentValue = Math.max(0, currentValue + change)
    history.push(Math.round(currentValue))
  }

  return history
}

export function generateMockRepo(owner: string, name: string): Repository {
  const id = `${owner}-${name}`
  const stars = Math.floor(Math.random() * 100000) + 100
  const forks = Math.floor(stars * (Math.random() * 0.1 + 0.02))
  const commits = Math.floor(Math.random() * 10000) + 500

  return {
    id,
    url: `https://github.com/${owner}/${name}`,
    name,
    owner,
    description: `A popular ${name} repository with great features and active development.`,
    stars,
    forks,
    watchers: Math.floor(stars * (Math.random() * 0.3 + 0.1)),
    openIssues: Math.floor(Math.random() * 200) + 10,
    pullRequests: Math.floor(Math.random() * 50) + 5,
    language: ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Vue', 'Java'][
      Math.floor(Math.random() * 7)
    ]!,
    lastUpdated: `${Math.floor(Math.random() * 30)} days ago`,
    starsHistory: generateRandomHistory(stars, 12),
    commitsHistory: generateRandomHistory(commits, 12, 0.3),
    issuesHistory: generateRandomHistory(Math.floor(Math.random() * 200) + 10, 12, 0.4),
    prHistory: generateRandomHistory(Math.floor(Math.random() * 50) + 5, 12, 0.5),
    contributorsCount: Math.floor(Math.random() * 500) + 20,
    cyclomatic_complexity: Math.floor(Math.random() * 50) + 5,
    code_duplication: Math.floor(Math.random() * 30) + 5,
    maintainability_index: Math.floor(Math.random() * 40) + 60,
  }
}

function getDefaultRepositories(): Repository[] {
  return [
    {
      id: 'vuejs-core',
      url: 'https://github.com/vuejs/core',
      name: 'core',
      owner: 'vuejs',
      description: 'Vue.js is a JavaScript framework for building user interfaces.',
      stars: 45200,
      forks: 9800,
      watchers: 1200,
      openIssues: 324,
      pullRequests: 48,
      language: 'TypeScript',
      lastUpdated: '2 days ago',
      starsHistory: [
        42000, 42500, 43000, 43800, 44100, 44500, 44800, 45000, 45100, 45150, 45180,
        45200,
      ],
      commitsHistory: [850, 920, 880, 910, 950, 1000, 980, 1050, 1100, 1080, 1120, 1150],
      issuesHistory: [300, 310, 315, 320, 325, 328, 330, 332, 330, 328, 326, 324],
      prHistory: [35, 38, 40, 42, 45, 48, 50, 49, 48, 47, 48, 48],
      contributorsCount: 485,
      cyclomatic_complexity: 12,
      code_duplication: 8,
      maintainability_index: 78,
    },
    {
      id: 'microsoft-vscode',
      url: 'https://github.com/microsoft/vscode',
      name: 'vscode',
      owner: 'microsoft',
      description: 'Visual Studio Code is a code editor redefined and optimized for building.',
      stars: 162000,
      forks: 28400,
      watchers: 4200,
      openIssues: 8950,
      pullRequests: 320,
      language: 'TypeScript',
      lastUpdated: '1 day ago',
      starsHistory: [
        158000, 159000, 160000, 160500, 160800, 161200, 161500, 161700, 161800, 161900,
        161950, 162000,
      ],
      commitsHistory: [2500, 2600, 2700, 2650, 2750, 2800, 2850, 2900, 2950, 3000, 3050, 3100],
      issuesHistory: [
        8500, 8600, 8700, 8800, 8850, 8900, 8920, 8940, 8960, 8950, 8945, 8950,
      ],
      prHistory: [200, 220, 240, 260, 280, 300, 310, 315, 318, 320, 320, 320],
      contributorsCount: 2142,
      cyclomatic_complexity: 18,
      code_duplication: 12,
      maintainability_index: 72,
    },
  ]
}
