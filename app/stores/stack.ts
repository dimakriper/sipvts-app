import { defineStore } from 'pinia'
import { ref } from 'vue'
import { $fetch } from 'ofetch'

export interface CommunityInfo {
  id: number
  name: string
  color: string
  members: string[]
}

export interface DependencyRank {
  name: string
  count: number
  percentage: number
  communityId: number
  communityColor: string
  topRelated: string[]
}

export interface GraphNode {
  id: string
  count: number
  percentage: number
  communityId: number
  communityColor: string
}

export interface GraphLink {
  source: string
  target: string
  weight: number
}

export interface FrequentItemset {
  items: string[]
  support: number
  count: number
}

export interface AssociationRule {
  antecedent: string[]
  consequent: string[]
  support: number
  confidence: number
  lift: number
}

export interface StackSearchResult {
  language: string
  keywords: string[]
  reposAnalyzed: number
  dependencies: DependencyRank[]
  coOccurrenceMatrix: Record<string, Record<string, number>>
  jaccardMatrix: Record<string, Record<string, number>>
  communities: CommunityInfo[]
  graphNodes: GraphNode[]
  graphLinks: GraphLink[]
  frequentItemsets: FrequentItemset[]
  associationRules: AssociationRule[]
}

export const SUPPORTED_LANGUAGES = [
  'JavaScript',
  'Python'
] as const

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

export const useStackStore = defineStore('stack', () => {
  const language = ref<string>('')
  const query = ref<string>('')
  const result = ref<StackSearchResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // UI state
  const selectedDep = ref<string | null>(null)
  const activeTab = ref<'matrix' | 'table' | 'stacks'>('table')
  const activeCommunities = ref<Set<number>>(new Set())
  const jaccardThreshold = ref(0.2)

  async function search() {
    if (!language.value.trim()) {
      error.value = 'Выберите язык программирования'
      return
    }
    loading.value = true
    error.value = null
    selectedDep.value = null
    try {
      const params = new URLSearchParams({ language: language.value })
      const q = query.value.trim()
      if (q) params.set('keywords', q)
      result.value = await $fetch<StackSearchResult>(`/api/stack/search-live?${params.toString()}`)
      activeCommunities.value = new Set(result.value.communities.map(c => c.id))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка при выполнении запроса'
    } finally {
      loading.value = false
    }
  }

  function reset() {
    language.value = ''
    query.value = ''
    result.value = null
    error.value = null
    selectedDep.value = null
  }

  function selectDep(name: string | null) {
    selectedDep.value = selectedDep.value === name ? null : name
  }

  function toggleCommunity(id: number) {
    if (activeCommunities.value.has(id)) {
      activeCommunities.value.delete(id)
    } else {
      activeCommunities.value.add(id)
    }
  }

  return {
    language,
    query,
    result,
    loading,
    error,
    selectedDep,
    activeTab,
    activeCommunities,
    jaccardThreshold,
    search,
    reset,
    selectDep,
    toggleCommunity
  }
})

