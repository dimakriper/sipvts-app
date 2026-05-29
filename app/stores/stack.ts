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

export interface HistoryEntry {
  id: string
  language: string
  keywords: string
  timestamp: number
  result: StackSearchResult
}

export const useStackStore = defineStore('stack', () => {
  const language = ref<string>('')
  const query = ref<string>('')
  const result = ref<StackSearchResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Search history (persisted)
  const history = ref<HistoryEntry[]>([])

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
    error.value = null
    selectedDep.value = null

    // Return cached result if history has an exact match
    const cached = history.value.find(
      h => h.language === language.value && h.keywords === query.value.trim()
    )
    if (cached) {
      result.value = cached.result
      activeCommunities.value = new Set(cached.result.communities.map(c => c.id))
      // Move to front
      history.value = [cached, ...history.value.filter(h => h.id !== cached.id)]
      return
    }

    loading.value = true
    try {
      const params = new URLSearchParams({ language: language.value })
      const q = query.value.trim()
      if (q) params.set('keywords', q)
      result.value = await $fetch<StackSearchResult>(`/api/stack/search-live?${params.toString()}`)
      activeCommunities.value = new Set(result.value.communities.map(c => c.id))
      // Push to history (keep last 15)
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        language: language.value,
        keywords: query.value.trim(),
        timestamp: Date.now(),
        result: result.value
      }
      history.value.unshift(entry)
      if (history.value.length > 15) history.value = history.value.slice(0, 15)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка при выполнении запроса'
    } finally {
      loading.value = false
    }
  }

  async function loadDefaultData() {
    loading.value = true
    error.value = null
    try {
      result.value = await $fetch<StackSearchResult>('/api/stack/search?language=JavaScript')
      language.value = 'JavaScript'
      query.value = ''
      activeCommunities.value = new Set(result.value.communities.map(c => c.id))
    } catch {
      // silent fail
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

  function deleteHistoryEntry(id: string) {
    history.value = history.value.filter(h => h.id !== id)
  }

  function loadFromHistory(entry: HistoryEntry) {
    language.value = entry.language
    query.value = entry.keywords
    result.value = entry.result
    activeCommunities.value = new Set(entry.result.communities.map(c => c.id))
    error.value = null
    selectedDep.value = null
  }

  function clearHistory() {
    history.value = []
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
    history,
    selectedDep,
    activeTab,
    activeCommunities,
    jaccardThreshold,
    search,
    loadDefaultData,
    reset,
    loadFromHistory,
    deleteHistoryEntry,
    clearHistory,
    selectDep,
    toggleCommunity
  }
}, { persist: { pick: ['history'] } })

