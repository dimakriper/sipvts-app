import { FPGrowth } from 'node-fpgrowth'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityInfo {
  id: number
  /** Auto-generated label: "Сообщество 1", "Сообщество 2", … */
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
  /** Relative support: share of projects containing all items (0..1) */
  support: number
  /** Absolute count of projects containing all items */
  count: number
}

export interface AssociationRule {
  antecedent: string[]
  consequent: string[]
  /** Share of all projects containing both antecedent ∪ consequent */
  support: number
  /** P(consequent | antecedent): how often the rule is correct */
  confidence: number
  /** confidence / P(consequent): >1 means positive correlation */
  lift: number
}

export interface StackSearchResult {
  language: string
  keywords: string[]
  reposAnalyzed: number
  dependencies: DependencyRank[]
  /** Raw co-occurrence counts: coOccurrenceMatrix[A][B] = number of projects containing both A and B */
  coOccurrenceMatrix: Record<string, Record<string, number>>
  /** Jaccard similarity: jaccardMatrix[A][B] = coOcc(A,B) / (count(A) + count(B) - coOcc(A,B)) */
  jaccardMatrix: Record<string, Record<string, number>>
  communities: CommunityInfo[]
  graphNodes: GraphNode[]
  graphLinks: GraphLink[]
  frequentItemsets: FrequentItemset[]
  associationRules: AssociationRule[]
}

export const SUPPORTED_LANGUAGES = ['JavaScript', 'Python'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

// ─── Mock raw data ─────────────────────────────────────────────────────────────
// Simulates what a real repository-analysis service returns:
// a map of project_id → list of its dependency names.

const MOCK_PROJECTS: Record<string, Record<string, string[]>> = {
  python: {
    'api-svc-1': ['fastapi', 'pydantic', 'uvicorn', 'sqlalchemy', 'alembic', 'asyncpg', 'python-jose'],
    'api-svc-2': ['fastapi', 'pydantic', 'uvicorn', 'redis', 'celery', 'httpx'],
    'api-svc-3': ['fastapi', 'pydantic', 'uvicorn', 'sqlalchemy', 'pytest', 'httpx'],
    'api-svc-4': ['fastapi', 'pydantic', 'uvicorn', 'asyncpg', 'alembic', 'pytest', 'python-jose'],
    'api-svc-5': ['fastapi', 'pydantic', 'uvicorn', 'sqlalchemy', 'celery', 'redis', 'alembic'],
    'api-svc-6': ['fastapi', 'pydantic', 'uvicorn', 'sqlalchemy', 'httpx', 'pytest'],
    'django-app-1': ['django', 'psycopg2', 'celery', 'redis', 'djangorestframework', 'pytest'],
    'django-app-2': ['django', 'psycopg2', 'djangorestframework', 'celery', 'redis', 'boto3'],
    'django-app-3': ['django', 'psycopg2', 'pytest', 'gunicorn', 'djangorestframework'],
    'django-app-4': ['django', 'psycopg2', 'celery', 'redis', 'pytest', 'pydantic'],
    'flask-app-1': ['flask', 'sqlalchemy', 'marshmallow', 'redis', 'celery', 'pytest'],
    'flask-app-2': ['flask', 'sqlalchemy', 'marshmallow', 'gunicorn', 'pytest'],
    'data-pipe-1': ['pandas', 'numpy', 'scikit-learn', 'matplotlib', 'requests', 'boto3'],
    'data-pipe-2': ['pandas', 'numpy', 'sqlalchemy', 'psycopg2', 'requests', 'pytest'],
    'data-pipe-3': ['pandas', 'numpy', 'scipy', 'matplotlib', 'requests'],
    'data-pipe-4': ['pandas', 'numpy', 'sqlalchemy', 'celery', 'boto3', 'pytest'],
    'ml-project-1': ['torch', 'numpy', 'pandas', 'scikit-learn', 'matplotlib', 'tqdm'],
    'ml-project-2': ['tensorflow', 'numpy', 'pandas', 'scikit-learn', 'matplotlib', 'scipy'],
    'ml-project-3': ['torch', 'numpy', 'transformers', 'pydantic', 'fastapi', 'uvicorn'],
    'worker-1': ['celery', 'redis', 'sqlalchemy', 'pydantic', 'boto3', 'pytest'],
    'worker-2': ['celery', 'redis', 'asyncpg', 'pydantic', 'httpx', 'pytest'],
    'scraper-1': ['requests', 'beautifulsoup4', 'lxml', 'pandas', 'sqlalchemy', 'pytest'],
    'scraper-2': ['httpx', 'pydantic', 'sqlalchemy', 'pytest', 'redis'],
    'util-lib-1': ['pydantic', 'pytest', 'requests', 'httpx', 'black', 'mypy'],
    'cli-tool-1': ['click', 'pydantic', 'requests', 'boto3', 'pytest']
  },
  javascript: {
    'react-app-1': ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand'],
    'react-app-2': ['react', 'react-dom', 'react-router-dom', 'axios', 'redux', 'lodash'],
    'react-app-3': ['react', 'react-dom', 'tailwindcss', 'vite', 'zustand', 'react-query'],
    'react-app-4': ['react', 'react-dom', 'next', 'tailwindcss', 'prisma', 'axios'],
    'next-app-1': ['next', 'react', 'react-dom', 'tailwindcss', 'prisma', 'zod'],
    'next-app-2': ['next', 'react', 'react-dom', 'tailwindcss', 'next-auth', 'prisma'],
    'next-app-3': ['next', 'react', 'react-dom', 'tailwindcss', 'zustand', 'swr'],
    'next-app-4': ['next', 'react', 'react-dom', 'prisma', 'zod', 'jest'],
    'vue-app-1': ['vue', 'vite', 'pinia', 'vue-router', 'axios', 'tailwindcss'],
    'vue-app-2': ['vue', 'vite', 'pinia', 'vue-router', 'zod', 'axios'],
    'nuxt-app-1': ['nuxt', 'vue', 'pinia', 'tailwindcss', 'axios', 'zod'],
    'node-api-1': ['express', 'jsonwebtoken', 'bcrypt', 'mongoose', 'jest', 'dotenv'],
    'node-api-2': ['express', 'jsonwebtoken', 'prisma', 'zod', 'jest', 'axios'],
    'node-api-3': ['express', 'cors', 'mongoose', 'jest', 'lodash', 'dotenv'],
    'node-api-4': ['fastify', 'prisma', 'zod', 'jest', 'dotenv', 'axios'],
    'build-tool-1': ['vite', 'rollup', 'eslint', 'typescript', 'jest', 'prettier'],
    'build-tool-2': ['webpack', 'babel', 'eslint', 'jest', 'prettier', 'typescript'],
    'build-tool-3': ['vite', 'vitest', 'eslint', 'prettier', 'typescript', 'zod'],
    'fullstack-1': ['next', 'react', 'react-dom', 'prisma', 'tailwindcss', 'zod', 'jest'],
    'fullstack-2': ['nuxt', 'vue', 'pinia', 'prisma', 'tailwindcss', 'zod'],
    'test-lib-1': ['jest', 'vitest', 'typescript', 'eslint', 'prettier', 'lodash'],
    'test-lib-2': ['vitest', 'typescript', 'zod', 'eslint', 'prettier'],
    'cli-1': ['commander', 'lodash', 'axios', 'dotenv', 'jest', 'typescript'],
    'cli-2': ['yargs', 'axios', 'lodash', 'dotenv', 'typescript'],
    'mobile-app-1': ['react', 'react-native', 'redux', 'axios', 'lodash']
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const COMMUNITY_PALETTE = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#0ea5e9', // sky
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6' // teal
]

/**
 * Weighted Label Propagation community detection.
 * Each node starts as its own community; iteratively each node adopts the
 * community with the highest total Jaccard weight among its neighbours.
 * Runs deterministically (sorted iteration order) until convergence.
 */
function detectCommunities(
  deps: string[],
  jaccardMatrix: Record<string, Record<string, number>>,
  edgeThreshold: number
): Record<string, number> {
  // Init: each dep is its own community (index-based)
  const community: Record<string, number> = {}
  for (let i = 0; i < deps.length; i++) community[deps[i]!] = i

  const MAX_ITER = 30
  for (let iter = 0; iter < MAX_ITER; iter++) {
    let changed = false
    for (const node of deps) {
      const scores: Record<number, number> = {}
      for (const neighbor of deps) {
        if (neighbor === node) continue
        const w = jaccardMatrix[node]?.[neighbor] ?? 0
        if (w < edgeThreshold) continue
        const c = community[neighbor]!
        scores[c] = (scores[c] ?? 0) + w
      }
      if (Object.keys(scores).length === 0) continue
      let bestComm = community[node]!
      let bestScore = 0
      for (const [c, score] of Object.entries(scores)) {
        if (score > bestScore) {
          bestScore = score
          bestComm = Number(c)
        }
      }
      if (bestComm !== community[node]) {
        community[node] = bestComm
        changed = true
      }
    }
    if (!changed) break
  }

  // Renumber: assign 0, 1, 2, … in order of first appearance (by dep sort order)
  const remap = new Map<number, number>()
  let nextId = 0
  for (const dep of deps) {
    const raw = community[dep]!
    if (!remap.has(raw)) remap.set(raw, nextId++)
    community[dep] = remap.get(raw)!
  }
  return community
}

// ─── Core function ─────────────────────────────────────────────────────────────

// ─── Association rule derivation ──────────────────────────────────────────────

function deriveRules(
  rawItemsets: Array<{ items: string[], support: number }>,
  reposAnalyzed: number,
  minConfidence: number
): AssociationRule[] {
  // Build support lookup by sorted key
  const supMap = new Map<string, number>()
  for (const is of rawItemsets) {
    supMap.set([...is.items].sort().join('\x00'), is.support)
  }

  const rules: AssociationRule[] = []
  for (const itemset of rawItemsets) {
    if (itemset.items.length < 2) continue
    // Single-item consequents only (most interpretable)
    for (const cons of itemset.items) {
      const ant = itemset.items.filter(i => i !== cons)
      const antSup = supMap.get([...ant].sort().join('\x00'))
      const consSup = supMap.get(cons)
      if (!antSup || !consSup) continue
      const confidence = itemset.support / antSup
      if (confidence < minConfidence) continue
      const lift = Math.round((confidence / (consSup / reposAnalyzed)) * 100) / 100
      rules.push({
        antecedent: ant,
        consequent: [cons],
        support: Math.round((itemset.support / reposAnalyzed) * 1000) / 1000,
        confidence: Math.round(confidence * 1000) / 1000,
        lift
      })
    }
  }
  return rules.sort((a, b) => b.lift - a.lift || b.confidence - a.confidence)
}

// ─── Core function ─────────────────────────────────────────────────────────────

export async function analyzeProjects(language: string, keywords: string[], projects: Record<string, string[]>): Promise<StackSearchResult> {
  const reposAnalyzed = Object.keys(projects).length

  // ── 1. Dependency frequency counts ──────────────────────────────────────────
  const countMap: Record<string, number> = {}
  for (const deps of Object.values(projects)) {
    for (const dep of deps) {
      countMap[dep] = (countMap[dep] ?? 0) + 1
    }
  }
  const allDeps = Object.keys(countMap)

  // ── 2. Co-occurrence matrix ──────────────────────────────────────────────────
  // coOccurrenceMatrix[A][A] = count(A); coOccurrenceMatrix[A][B] = projects containing both
  const coOccurrenceMatrix: Record<string, Record<string, number>> = {}
  for (const dep of allDeps) {
    coOccurrenceMatrix[dep] = {}
    for (const dep2 of allDeps) {
      coOccurrenceMatrix[dep]![dep2] = dep === dep2 ? countMap[dep]! : 0
    }
  }
  for (const projectDeps of Object.values(projects)) {
    for (let i = 0; i < projectDeps.length; i++) {
      for (let j = i + 1; j < projectDeps.length; j++) {
        const a = projectDeps[i]!
        const b = projectDeps[j]!
        if (coOccurrenceMatrix[a] && coOccurrenceMatrix[b]) {
          coOccurrenceMatrix[a]![b] = (coOccurrenceMatrix[a]![b] ?? 0) + 1
          coOccurrenceMatrix[b]![a] = (coOccurrenceMatrix[b]![a] ?? 0) + 1
        }
      }
    }
  }

  // ── 3. Jaccard similarity matrix ────────────────────────────────────────────
  const jaccardMatrix: Record<string, Record<string, number>> = {}
  for (const dep1 of allDeps) {
    jaccardMatrix[dep1] = {}
    for (const dep2 of allDeps) {
      if (dep1 === dep2) {
        jaccardMatrix[dep1]![dep2] = 1.0
      } else {
        const coOcc = coOccurrenceMatrix[dep1]![dep2] ?? 0
        const union = countMap[dep1]! + countMap[dep2]! - coOcc
        jaccardMatrix[dep1]![dep2] = union > 0 ? Math.round((coOcc / union) * 1000) / 1000 : 0
      }
    }
  }

  const sortedDeps = [...allDeps].sort((a, b) => countMap[b]! - countMap[a]!)

  const EDGE_THRESHOLD = 0.15
  const graphLinks: GraphLink[] = []
  for (let i = 0; i < sortedDeps.length; i++) {
    for (let j = i + 1; j < sortedDeps.length; j++) {
      const w = jaccardMatrix[sortedDeps[i]!]![sortedDeps[j]!] ?? 0
      if (w >= EDGE_THRESHOLD) {
        graphLinks.push({ source: sortedDeps[i]!, target: sortedDeps[j]!, weight: w })
      }
    }
  }

  // ── 5. Community detection (Label Propagation on Jaccard graph) ──────────────
  const communityMap = detectCommunities(sortedDeps, jaccardMatrix, EDGE_THRESHOLD)
  const numCommunities = new Set(Object.values(communityMap)).size
  const communityColorMap: Record<number, string> = {}
  for (let i = 0; i < numCommunities; i++) {
    communityColorMap[i] = COMMUNITY_PALETTE[i % COMMUNITY_PALETTE.length]!
  }

  // Build CommunityInfo list
  const communityMembers: Record<number, string[]> = {}
  for (const dep of sortedDeps) {
    const cid = communityMap[dep]!
    if (!communityMembers[cid]) communityMembers[cid] = []
    communityMembers[cid]!.push(dep)
  }
  const communities: CommunityInfo[] = Object.entries(communityMembers)
    .map(([id, members]) => ({
      id: Number(id),
      name: `Сообщество ${Number(id) + 1}`,
      color: communityColorMap[Number(id)]!,
      members
    }))
    .sort((a, b) => b.members.length - a.members.length)

  // ── 6. Dependency ranks ──────────────────────────────────────────────────────
  const dependencies: DependencyRank[] = sortedDeps.map((name) => {
    const pct = Math.round((countMap[name]! / reposAnalyzed) * 1000) / 10
    const cid = communityMap[name]!
    const topRelated = sortedDeps
      .filter(d => d !== name)
      .sort((a, b) => (jaccardMatrix[name]![b] ?? 0) - (jaccardMatrix[name]![a] ?? 0))
      .slice(0, 3)
    return {
      name,
      count: countMap[name]!,
      percentage: pct,
      communityId: cid,
      communityColor: communityColorMap[cid]!,
      topRelated
    }
  })

  // ── 7. Graph nodes ───────────────────────────────────────────────────────────
  const graphNodes: GraphNode[] = sortedDeps.map((name) => {
    const pct = Math.round((countMap[name]! / reposAnalyzed) * 1000) / 10
    const cid = communityMap[name]!
    return { id: name, count: countMap[name]!, percentage: pct, communityId: cid, communityColor: communityColorMap[cid]! }
  })

  // ── 8. Frequent itemsets + association rules (FP-Growth) ────────────────────
  const transactions = Object.values(projects)
  // minSupport = at least 2 projects or 15%, whichever is smaller threshold gives more results
  const minSup = Math.max(2 / reposAnalyzed, 0.15)
  const rawItemsets: Array<{ items: string[], support: number }>
    = await new FPGrowth<string>(minSup).exec(transactions)

  const frequentItemsets: FrequentItemset[] = rawItemsets
    .filter(is => is.items.length >= 2)
    .map(is => ({
      items: is.items,
      support: Math.round((is.support / reposAnalyzed) * 1000) / 1000,
      count: is.support
    }))
    .sort((a, b) => b.support - a.support || b.items.length - a.items.length)
    .slice(0, 40)

  const associationRules = deriveRules(rawItemsets, reposAnalyzed, 0.5).slice(0, 30)

  return { language, keywords, reposAnalyzed, dependencies, coOccurrenceMatrix, jaccardMatrix, communities, graphNodes, graphLinks, frequentItemsets, associationRules }
}

export async function searchStack(language: string, keywords: string[]): Promise<StackSearchResult> {
  const lang = language.toLowerCase()
  const allProjects = MOCK_PROJECTS[lang] ?? MOCK_PROJECTS['javascript']!

  const projects = keywords.length > 0
    ? Object.fromEntries(
        Object.entries(allProjects).filter(([, deps]) =>
          keywords.some(kw => deps.some(d => d.toLowerCase().includes(kw.toLowerCase())))
        )
      )
    : allProjects

  return analyzeProjects(language, keywords, projects)
}
