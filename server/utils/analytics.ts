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

function generateTimestampedHistory(
  baseValue: number,
  anchorMs: number,
  count: number = 12,
  volatility: number = 0.4
): DataPoint[] {
  // Each point is a monthly increment (delta), not a cumulative total.
  const monthlyBase = Math.max(1, Math.round(baseValue / count))
  const result: DataPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(anchorMs)
    d.setUTCMonth(d.getUTCMonth() - i)
    d.setUTCDate(1)
    d.setUTCHours(0, 0, 0, 0)
    const noise = (Math.random() - 0.5) * 2 * volatility * monthlyBase
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
    [['Vue', 2000000], ['TypeScript', 3000000], ['CSS', 400000]]
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
    weeklyCommits: generateWeeklyHistory(avgWeeklyCommits, new Date(pushedAt).getTime()),
    contributorsCount: Math.floor(Math.random() * 500) + 20,
    license,
    starsHistory: generateTimestampedHistory(stars, new Date(pushedAt).getTime(), 12),
    commitsHistory: generateTimestampedHistory(totalCommits, new Date(pushedAt).getTime(), 12, 0.3),
    issuesHistory: generateTimestampedHistory(openIssues, new Date(pushedAt).getTime(), 12, 0.4),
    prHistory: generateTimestampedHistory(openPRs + mergedPRs, new Date(pushedAt).getTime(), 12, 0.5)
  }
}

export const seedData: Repository[] = [
  {
    id: 'vuejs-core',
    url: 'https://github.com/vuejs/core',
    name: 'core',
    owner: 'vuejs',
    description: 'Vue.js is a JavaScript framework for building user interfaces.',
    createdAt: '2021-01-16T00:00:00Z',
    pushedAt: '2024-05-20T12:34:00Z',
    size: 28500,
    languages: { TypeScript: 8200000, JavaScript: 420000, HTML: 15000, CSS: 8000 },
    stars: 45200,
    forks: 9800,
    watchers: 1200,
    openIssues: 324,
    closedIssues: 2800,
    avgIssueCloseDays: 12,
    openPRs: 48,
    mergedPRs: 4200,
    closedPRs: 320,
    releasesCount: 82,
    latestReleaseTag: 'v3.4.27',
    releaseFrequencyPerYear: 18,
    weeklyCommits: [12, 18, 14, 22, 9, 16, 20, 11, 25, 18, 14, 8, 21, 17, 23, 15, 12, 19, 28, 13, 16, 22, 10, 18, 24, 15, 17, 20, 14, 11, 26, 19, 16, 13, 21, 18, 15, 22, 8, 17, 24, 12, 19, 16, 14, 23, 18, 11, 20, 15, 17, 14].map((v, i) => ({ t: Date.UTC(2024, 4, 20) - (51 - i) * 7 * 24 * 60 * 60 * 1000, v })),
    contributorsCount: 485,
    license: 'MIT',
    starsHistory: [500, 500, 500, 800, 300, 400, 300, 200, 100, 50, 30, 20].map((v, i) => ({ t: Date.UTC(2023, i, 1), v })),
    commitsHistory: [850, 920, 880, 910, 950, 1000, 980, 1050, 1100, 1080, 1120, 1150].map((v, i) => ({ t: Date.UTC(2023, i, 1), v })),
    issuesHistory: [10, 10, 5, 5, 5, 3, 2, 2, -2, -2, -2, -2].map((v, i) => ({ t: Date.UTC(2023, i, 1), v })),
    prHistory: [3, 3, 2, 2, 3, 3, 2, -1, -1, -1, 1, 0].map((v, i) => ({ t: Date.UTC(2023, i, 1), v }))
  },
  {
    id: 'microsoft-vscode',
    url: 'https://github.com/microsoft/vscode',
    name: 'vscode',
    owner: 'microsoft',
    description: 'Visual Studio Code is a code editor redefined and optimized for building modern apps.',
    createdAt: '2015-09-03T00:00:00Z',
    pushedAt: '2024-05-22T10:15:00Z',
    size: 652000,
    languages: { TypeScript: 52000000, JavaScript: 3200000, CSS: 800000, HTML: 200000 },
    stars: 162000,
    forks: 28400,
    watchers: 4200,
    openIssues: 8950,
    closedIssues: 180000,
    avgIssueCloseDays: 45,
    openPRs: 320,
    mergedPRs: 22000,
    closedPRs: 5500,
    releasesCount: 210,
    latestReleaseTag: 'v1.89.1',
    releaseFrequencyPerYear: 12,
    weeklyCommits: [72, 85, 91, 78, 65, 88, 95, 82, 70, 88, 92, 79, 68, 86, 90, 76, 83, 91, 74, 87, 93, 80, 71, 89, 84, 77, 92, 88, 75, 82, 90, 73, 87, 94, 78, 85, 91, 79, 66, 88, 83, 76, 90, 87, 74, 82, 88, 70, 85, 91, 79, 83].map((v, i) => ({ t: Date.UTC(2024, 4, 20) - (51 - i) * 7 * 24 * 60 * 60 * 1000, v })),
    contributorsCount: 2142,
    license: 'MIT',
    starsHistory: [1000, 1000, 1000, 500, 300, 400, 300, 200, 100, 100, 50, 50].map((v, i) => ({ t: Date.UTC(2023, i, 1), v })),
    commitsHistory: [2500, 2600, 2700, 2650, 2750, 2800, 2850, 2900, 2950, 3000, 3050, 3100].map((v, i) => ({ t: Date.UTC(2023, i, 1), v })),
    issuesHistory: [100, 100, 100, 100, 50, 50, 20, 20, 20, -10, -5, 5].map((v, i) => ({ t: Date.UTC(2023, i, 1), v })),
    prHistory: [20, 20, 20, 20, 20, 20, 10, 5, 3, 2, 0, 0].map((v, i) => ({ t: Date.UTC(2023, i, 1), v }))
  }
]


