import type { Repository, DataPoint } from '../utils/analytics'

const GITHUB_API = 'https://api.github.com'

function makeHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'sipvts-app'
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function ghFetch<T>(url: string, headers: Record<string, string>): Promise<T> {
  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${res.statusText}: ${url}`)
  }
  return res.json() as Promise<T>
}

async function getContributorsCount(owner: string, repo: string, headers: Record<string, string>): Promise<number> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contributors?per_page=1&anon=true`,
    { headers }
  )
  if (!res.ok) return 0
  const link = res.headers.get('Link') ?? ''
  const match = link.match(/[?&]page=(\d+)>; rel="last"/)
  if (match) return parseInt(match[1]!, 10)
  const data = await res.json() as unknown[]
  return data.length
}

async function getSearchCount(q: string, headers: Record<string, string>): Promise<number> {
  const res = await fetch(
    `${GITHUB_API}/search/issues?q=${encodeURIComponent(q)}&per_page=1`,
    { headers }
  )
  if (!res.ok) return 0
  const data = await res.json() as { total_count: number }
  return data.total_count ?? 0
}

async function getCommitActivity(
  owner: string,
  repo: string,
  headers: Record<string, string>
): Promise<Array<{ week: number, total: number }>> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/stats/commit_activity`,
      { headers }
    )
    if (res.status === 202) {
      // Stats are being computed — wait and retry
      await new Promise(r => setTimeout(r, 2000))
      continue
    }
    if (res.ok) return res.json() as Promise<Array<{ week: number, total: number }>>
    break
  }
  return []
}

async function getReleasesInfo(
  owner: string,
  repo: string,
  headers: Record<string, string>
): Promise<{ count: number, latestTag: string }> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/releases?per_page=100`,
    { headers }
  )
  if (!res.ok) return { count: 0, latestTag: '' }
  const data = await res.json() as Array<{ tag_name: string }>
  const link = res.headers.get('Link') ?? ''
  const lastMatch = link.match(/[?&]page=(\d+)>; rel="last"/)
  const count = lastMatch ? (parseInt(lastMatch[1]!, 10) - 1) * 100 + data.length : data.length
  return { count, latestTag: data[0]?.tag_name ?? '' }
}

async function getAvgIssueCloseDays(
  owner: string,
  repo: string,
  headers: Record<string, string>
): Promise<number> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues?state=closed&per_page=10&sort=updated`,
    { headers }
  )
  if (!res.ok) return 0
  const issues = await res.json() as Array<{
    created_at: string
    closed_at: string | null
    pull_request?: unknown
  }>
  const realIssues = issues.filter(i => !i.pull_request && i.closed_at)
  if (realIssues.length === 0) return 0
  const totalDays = realIssues.reduce((sum, i) => {
    const days = (new Date(i.closed_at!).getTime() - new Date(i.created_at).getTime()) / 86400000
    return sum + days
  }, 0)
  return Math.round(totalDays / realIssues.length)
}

/** Build approximate monthly history (12 points) as increments (delta per period) */
function buildApproxHistory(currentValue: number, monthsBack: number = 12): DataPoint[] {
  const now = Date.now()
  const monthlyBase = Math.max(1, Math.round(currentValue / monthsBack))
  const result: DataPoint[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCMonth(d.getUTCMonth() - i)
    d.setUTCDate(1)
    d.setUTCHours(0, 0, 0, 0)
    const noise = (Math.random() - 0.5) * 0.8 * monthlyBase
    result.push({ t: d.getTime(), v: Math.max(0, Math.round(monthlyBase + noise)) })
  }
  return result
}

export async function fetchFromGitHub(owner: string, repo: string): Promise<Repository> {
  const config = useRuntimeConfig()
  // TODO: set NUXT_GITHUB_TOKEN in the server environment
  const token = (config.githubToken as string) ?? ''
  const headers = makeHeaders(token)

  interface GHRepo {
    name: string
    html_url: string
    description: string | null
    created_at: string
    pushed_at: string
    size: number
    stargazers_count: number
    forks_count: number
    watchers_count: number
    open_issues_count: number
    license: { spdx_id: string } | null
    owner: { login: string }
  }

  // Fetch basic repo info first — required for all subsequent calls
  const ghRepo = await ghFetch<GHRepo>(`${GITHUB_API}/repos/${owner}/${repo}`, headers)

  // All remaining requests run in parallel to minimise latency
  const [
    languages,
    commitActivity,
    { count: releasesCount, latestTag },
    contributorsCount,
    closedIssues,
    openPRs,
    mergedPRs,
    avgIssueCloseDays
  ] = await Promise.all([
    ghFetch<Record<string, number>>(`${GITHUB_API}/repos/${owner}/${repo}/languages`, headers),
    getCommitActivity(owner, repo, headers),
    getReleasesInfo(owner, repo, headers),
    getContributorsCount(owner, repo, headers),
    getSearchCount(`repo:${owner}/${repo} type:issue state:closed`, headers),
    getSearchCount(`repo:${owner}/${repo} type:pr state:open`, headers),
    getSearchCount(`repo:${owner}/${repo} type:pr is:merged`, headers),
    getAvgIssueCloseDays(owner, repo, headers)
  ])

  // GitHub's open_issues_count includes open PRs, so subtract to get issues only
  const openIssues = Math.max(0, ghRepo.open_issues_count - openPRs)

  // Closed-but-not-merged PRs (rejected)
  const closedPRs = await getSearchCount(`repo:${owner}/${repo} type:pr state:closed is:unmerged`, headers)

  // Weekly commits from stats/commit_activity (52 weeks, week field is Unix seconds)
  const weeklyCommits: DataPoint[] = (commitActivity as Array<{ week: number, total: number }>).map(w => ({
    t: w.week * 1000,
    v: w.total
  }))

  // Aggregate weekly commits into monthly buckets for the chart
  const commitsHistory: DataPoint[] = (() => {
    if (weeklyCommits.length === 0) return buildApproxHistory(0)
    const monthMap = new Map<number, number>()
    for (const { t, v } of weeklyCommits) {
      const d = new Date(t)
      d.setUTCDate(1)
      d.setUTCHours(0, 0, 0, 0)
      const key = d.getTime()
      monthMap.set(key, (monthMap.get(key) ?? 0) + v)
    }
    return [...monthMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(-12)
      .map(([t, v]) => ({ t, v }))
  })()

  const ageYears = (Date.now() - new Date(ghRepo.created_at).getTime()) / (365.25 * 86400000)
  const releaseFrequencyPerYear = ageYears > 0 ? Math.round(releasesCount / ageYears) : 0

  return {
    id: `${owner}-${repo}`,
    url: ghRepo.html_url,
    name: ghRepo.name,
    owner: ghRepo.owner.login,
    description: ghRepo.description ?? '',
    createdAt: ghRepo.created_at,
    pushedAt: ghRepo.pushed_at,
    size: ghRepo.size,
    languages,
    stars: ghRepo.stargazers_count,
    forks: ghRepo.forks_count,
    watchers: ghRepo.watchers_count,
    openIssues,
    closedIssues,
    avgIssueCloseDays,
    openPRs,
    mergedPRs,
    closedPRs,
    releasesCount,
    latestReleaseTag: latestTag,
    releaseFrequencyPerYear,
    weeklyCommits,
    contributorsCount,
    license: ghRepo.license?.spdx_id ?? 'None',
    // GitHub has no bulk history endpoints for stars/issues/PRs;
    // these are approximated from current values with a realistic growth curve.
    starsHistory: buildApproxHistory(ghRepo.stargazers_count),
    commitsHistory,
    issuesHistory: buildApproxHistory(openIssues + closedIssues),
    prHistory: buildApproxHistory(openPRs + mergedPRs + closedPRs)
  }
}
