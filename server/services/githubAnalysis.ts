import { generateMockRepo, getReposCollection, toRepository } from '../utils/analytics'
import type { Repository } from '../utils/analytics'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Fetch repository analytics from GitHub.
 * Currently returns mocked data — replace this function body with real GitHub API calls.
 */
async function fetchFromGitHub(owner: string, repo: string): Promise<Repository> {
  // TODO: replace with real GitHub API integration
  return generateMockRepo(owner, repo)
}

/**
 * Returns analytics for a GitHub repository using the following strategy:
 *  1. If MongoDB has fresh data (< 1 week old) → return it directly.
 *  2. Otherwise, fetch from GitHub (currently mocked).
 *  3. If MongoDB is available → upsert the fresh data and return it.
 *  4. If MongoDB is unavailable → return the fresh data without persisting.
 */
export async function analyzeRepository(owner: string, repo: string): Promise<Repository> {
  const id = `${owner}-${repo}`

  try {
    const col = await getReposCollection()
    const doc = await col.findOne({ id })

    if (doc) {
      const age = doc.fetchedAt ? Date.now() - new Date(doc.fetchedAt).getTime() : Infinity
      if (age < ONE_WEEK_MS) {
        return toRepository(doc)
      }
    }

    // Stale or missing — fetch fresh data
    const fresh = await fetchFromGitHub(owner, repo)

    await col.updateOne(
      { _id: id },
      { $set: { ...fresh, fetchedAt: new Date() } },
      { upsert: true }
    )

    return fresh
  } catch {
    // MongoDB unavailable — return fresh data without persisting
    return fetchFromGitHub(owner, repo)
  }
}
