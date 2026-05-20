export interface DependencyRank {
  name: string
  count: number
  percentage: number
  cluster: string
  clusterColor: string
  topRelated: string[]
}

export interface ClusterInfo {
  id: string
  name: string
  color: string
  members: string[]
}

export interface DetectedStack {
  name: string
  members: string[]
  projectCount: number
}

export interface GraphNode {
  id: string
  count: number
  percentage: number
  cluster: string
  clusterColor: string
}

export interface GraphLink {
  source: string
  target: string
  weight: number
}

export interface StackSearchResult {
  language: string
  keywords: string[]
  reposAnalyzed: number
  dependencies: DependencyRank[]
  coOccurrenceMatrix: Record<string, Record<string, number>>
  jaccardMatrix: Record<string, Record<string, number>>
  clusters: ClusterInfo[]
  stacks: DetectedStack[]
  graphNodes: GraphNode[]
  graphLinks: GraphLink[]
}

export const SUPPORTED_LANGUAGES = ['JavaScript', 'Python'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

const ECOSYSTEM_DEPS: Record<string, string[]> = {
  javascript: [
    'react', 'express', 'axios', 'lodash', 'jest', 'webpack', 'eslint',
    'prettier', 'next', 'tailwindcss', 'redux', 'zustand', 'vite', 'vitest', 'dayjs'
  ],
  python: [
    'django', 'flask', 'fastapi', 'requests', 'numpy', 'pandas', 'sqlalchemy',
    'pytest', 'pydantic', 'celery', 'redis', 'boto3', 'uvicorn', 'httpx', 'alembic'
  ]
}

const CLUSTER_DEFS: Record<string, ClusterInfo[]> = {
  javascript: [
    { id: 'frontend', name: 'Frontend', color: '#6366f1', members: ['react', 'next', 'tailwindcss', 'redux', 'zustand'] },
    { id: 'tooling', name: 'Tooling & Test', color: '#10b981', members: ['webpack', 'vite', 'eslint', 'prettier', 'jest', 'vitest'] },
    { id: 'backend', name: 'Backend & Utils', color: '#f59e0b', members: ['express', 'axios', 'lodash', 'dayjs'] }
  ],
  python: [
    { id: 'web', name: 'Web Frameworks', color: '#6366f1', members: ['django', 'flask', 'fastapi', 'uvicorn'] },
    { id: 'data', name: 'Data & ML', color: '#10b981', members: ['numpy', 'pandas', 'boto3'] },
    { id: 'db', name: 'Database & Cache', color: '#f59e0b', members: ['sqlalchemy', 'alembic', 'redis'] },
    { id: 'utils', name: 'Utils & Testing', color: '#ef4444', members: ['pytest', 'pydantic', 'requests', 'celery', 'httpx'] }
  ]
}

const STACK_DEFS: Record<string, DetectedStack[]> = {
  javascript: [
    { name: 'React SPA', members: ['react', 'redux', 'axios', 'jest', 'webpack'], projectCount: 45 },
    { name: 'Next.js Full-Stack', members: ['next', 'react', 'tailwindcss', 'zustand', 'vite'], projectCount: 38 },
    { name: 'Node.js API', members: ['express', 'axios', 'jest', 'eslint', 'prettier'], projectCount: 30 }
  ],
  python: [
    { name: 'FastAPI Async', members: ['fastapi', 'pydantic', 'uvicorn', 'sqlalchemy', 'alembic'], projectCount: 25 },
    { name: 'Django Web', members: ['django', 'sqlalchemy', 'celery', 'redis', 'pytest'], projectCount: 20 },
    { name: 'Data Pipeline', members: ['pandas', 'numpy', 'requests', 'boto3', 'httpx'], projectCount: 18 }
  ]
}

function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

export function searchStack(language: string, keywords: string[]): StackSearchResult {
  const lang = language.toLowerCase().replace(/\s+/g, '')
  const deps = ECOSYSTEM_DEPS[lang] ?? ECOSYSTEM_DEPS['javascript']!
  const clusters = CLUSTER_DEFS[lang] ?? []
  const stacks = STACK_DEFS[lang] ?? []
  const seed = hashSeed(lang + keywords.join(','))
  const reposAnalyzed = 100 + (seed % 100)

  // Build cluster lookup
  const clusterByDep: Record<string, ClusterInfo> = {}
  for (const cluster of clusters) {
    for (const member of cluster.members) {
      clusterByDep[member] = cluster
    }
  }
  const defaultCluster: ClusterInfo = { id: 'other', name: 'Other', color: '#6b7280', members: [] }

  // Generate per-dep counts (power-law decline)
  const countMap: Record<string, number> = {}
  for (let i = 0; i < deps.length; i++) {
    const name = deps[i]!
    const depSeed = hashSeed(name + lang)
    const base = Math.round(reposAnalyzed * Math.exp(-i * 0.22))
    const jitter = seededRandom(depSeed) * 0.2 - 0.1
    countMap[name] = Math.max(1, Math.round(base * (1 + jitter)))
  }

  // Co-occurrence matrix — same-cluster pairs co-occur more often
  const coOccurrenceMatrix: Record<string, Record<string, number>> = {}
  for (const dep1 of deps) {
    coOccurrenceMatrix[dep1] = {}
    for (const dep2 of deps) {
      if (dep1 === dep2) {
        coOccurrenceMatrix[dep1]![dep2] = countMap[dep1]!
      } else {
        const pairKey = [dep1, dep2].sort().join('|')
        const pairSeed = hashSeed(pairKey + lang)
        const sameCluster = clusterByDep[dep1]?.id === clusterByDep[dep2]?.id && clusterByDep[dep1] !== undefined
        const base = sameCluster ? 0.4 : 0.1
        const ratio = base + seededRandom(pairSeed) * 0.4
        coOccurrenceMatrix[dep1]![dep2] = Math.round(Math.min(countMap[dep1]!, countMap[dep2]!) * ratio)
      }
    }
  }

  // Jaccard similarity matrix: J(A,B) = coOcc(A,B) / (count(A) + count(B) - coOcc(A,B))
  const jaccardMatrix: Record<string, Record<string, number>> = {}
  for (const dep1 of deps) {
    jaccardMatrix[dep1] = {}
    for (const dep2 of deps) {
      if (dep1 === dep2) {
        jaccardMatrix[dep1]![dep2] = 1.0
      } else {
        const coOcc = coOccurrenceMatrix[dep1]![dep2]!
        const union = countMap[dep1]! + countMap[dep2]! - coOcc
        jaccardMatrix[dep1]![dep2] = union > 0 ? Math.round((coOcc / union) * 1000) / 1000 : 0
      }
    }
  }

  // Build dependency ranks with top related (by Jaccard)
  const sortedDeps = [...deps].sort((a, b) => countMap[b]! - countMap[a]!)
  const dependencies: DependencyRank[] = sortedDeps.map((name) => {
    const cInfo = clusterByDep[name] ?? defaultCluster
    const topRelated = deps
      .filter(d => d !== name)
      .sort((a, b) => (jaccardMatrix[name]![b] ?? 0) - (jaccardMatrix[name]![a] ?? 0))
      .slice(0, 3)
    return {
      name,
      count: countMap[name]!,
      percentage: Math.round((countMap[name]! / reposAnalyzed) * 1000) / 10,
      cluster: cInfo.name,
      clusterColor: cInfo.color,
      topRelated
    }
  })

  // Graph nodes
  const graphNodes: GraphNode[] = sortedDeps.map((name) => {
    const cInfo = clusterByDep[name] ?? defaultCluster
    return {
      id: name,
      count: countMap[name]!,
      percentage: Math.round((countMap[name]! / reposAnalyzed) * 1000) / 10,
      cluster: cInfo.name,
      clusterColor: cInfo.color
    }
  })

  // Graph links — only edges above similarity threshold
  const EDGE_THRESHOLD = 0.2
  const graphLinks: GraphLink[] = []
  for (let i = 0; i < deps.length; i++) {
    for (let j = i + 1; j < deps.length; j++) {
      const w = jaccardMatrix[deps[i]!]![deps[j]!] ?? 0
      if (w >= EDGE_THRESHOLD) {
        graphLinks.push({ source: deps[i]!, target: deps[j]!, weight: w })
      }
    }
  }

  return { language, keywords, reposAnalyzed, dependencies, coOccurrenceMatrix, jaccardMatrix, clusters, stacks, graphNodes, graphLinks }
}
