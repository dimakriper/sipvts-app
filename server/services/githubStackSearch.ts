import { analyzeProjects } from './stackSearch'
import type { StackSearchResult } from './stackSearch'

const GITHUB_API = 'https://api.github.com'
const REPOS_TO_FETCH = 40
const FETCH_CHUNK = 8 // parallel manifest requests per batch

// Map service language names → GitHub language filter values
const GITHUB_LANGUAGE_MAP: Record<string, string> = {
  javascript: 'JavaScript',
  python: 'Python'
}

function makeHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'sipvts-app'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

/** Search GitHub for repos matching the language + free-text query. Returns full_names. */
async function searchRepos(
  language: string,
  query: string,
  headers: Record<string, string>
): Promise<string[]> {
  const ghLang = GITHUB_LANGUAGE_MAP[language.toLowerCase()] ?? language
  const q = query.trim()
    ? `language:${ghLang} ${query.trim()}`
    : `language:${ghLang}`
  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&per_page=${REPOS_TO_FETCH}`
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`GitHub repository search failed: ${res.status} ${res.statusText}`)
  }
  const data = await res.json() as { items: Array<{ full_name: string }> }
  return data.items.map(r => r.full_name)
}

/** Decode base64 content returned by the GitHub Contents API. */
function decodeBase64Content(content: string): string {
  // atob is a global in Node 16+ (Nitro runtime) — no Buffer needed
  return atob(content.replace(/\n/g, ''))
}

/**
 * Fetch and parse `package.json` from a GitHub repo.
 * Returns the combined list of `dependencies` + `devDependencies` keys, or null on failure.
 */
async function fetchPackageJson(fullName: string, headers: Record<string, string>): Promise<string[] | null> {
  const res = await fetch(`${GITHUB_API}/repos/${fullName}/contents/package.json`, { headers })
  if (!res.ok) return null
  const data = await res.json() as { content?: string, encoding?: string }
  if (!data.content || data.encoding !== 'base64') return null
  try {
    const pkg = JSON.parse(decodeBase64Content(data.content)) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const deps = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {})
    ]
    // Strip @scope/ prefix noise — normalise to bare name for co-occurrence
    return deps.length > 0 ? deps : null
  } catch {
    return null
  }
}

/**
 * Fetch and parse `requirements.txt` from a GitHub repo.
 * Strips version specifiers, extras, inline options and comments.
 * Returns null if the file is missing or empty.
 */
async function fetchRequirementsTxt(fullName: string, headers: Record<string, string>): Promise<string[] | null> {
  const res = await fetch(`${GITHUB_API}/repos/${fullName}/contents/requirements.txt`, { headers })
  if (!res.ok) return null
  const data = await res.json() as { content?: string, encoding?: string }
  if (!data.content || data.encoding !== 'base64') return null
  try {
    const text = decodeBase64Content(data.content)
    const deps: string[] = []
    for (const raw of text.split('\n')) {
      const line = raw.trim()
      // Skip comments, blank lines and pip options (-r, --index-url, etc.)
      if (!line || line.startsWith('#') || line.startsWith('-')) continue
      // Skip VCS/URL requirements
      if (line.startsWith('git+') || line.includes('://')) continue
      // Extract bare package name: strip version specifiers (>=, ==, etc.) and extras ([...])
      const name = line.split(/[>=<![\s;@]/)[0]?.trim().toLowerCase()
      if (name) deps.push(name)
    }
    return deps.length > 0 ? deps : null
  } catch {
    return null
  }
}

type ManifestFetcher = (fullName: string, headers: Record<string, string>) => Promise<string[] | null>

const MANIFEST_FETCHERS: Record<string, ManifestFetcher> = {
  javascript: fetchPackageJson,
  python: fetchRequirementsTxt
}

/**
 * Fetches real dependency data for `language` repos from GitHub and runs
 * the same analysis pipeline as the mock search.
 *
 * Requires `NUXT_GITHUB_TOKEN` in the server environment for higher rate limits
 * (10 unauthenticated requests/min for Search API vs. 30 with a token).
 */
export async function searchStackFromGitHub(
  language: string,
  query: string
): Promise<StackSearchResult> {
  const config = useRuntimeConfig()
  // TODO: set NUXT_GITHUB_TOKEN in the server environment
  const token = (config.githubToken as string) ?? ''
  const headers = makeHeaders(token)

  const lang = language.toLowerCase()
  const fetcher = MANIFEST_FETCHERS[lang]
  if (!fetcher) {
    throw new Error(`Unsupported language for GitHub stack search: ${language}`)
  }

  const repoNames = await searchRepos(language, query, headers)

  // Fetch manifests in parallel, in chunks to avoid hammering the API
  const projects: Record<string, string[]> = {}
  for (let i = 0; i < repoNames.length; i += FETCH_CHUNK) {
    const chunk = repoNames.slice(i, i + FETCH_CHUNK)
    const results = await Promise.allSettled(chunk.map(name => fetcher(name, headers)))
    for (let j = 0; j < chunk.length; j++) {
      const result = results[j]
      const name = chunk[j]!
      if (result?.status === 'fulfilled' && result.value && result.value.length > 0) {
        projects[name] = result.value
      }
    }
  }

  if (Object.keys(projects).length === 0) {
    throw new Error('No repositories with parseable manifests found on GitHub')
  }

  // Post-filter: keep only repos that actually use the query as a dependency substring
  const filtered = query.trim()
    ? Object.fromEntries(
        Object.entries(projects).filter(([, deps]) =>
          deps.some(d => d.toLowerCase().includes(query.trim().toLowerCase()))
        )
      )
    : projects

  if (Object.keys(filtered).length === 0) {
    throw new Error(`No repositories found that use "${query}" as a dependency`)
  }

  return analyzeProjects(language, query.trim() ? [query.trim()] : [], filtered)
}
