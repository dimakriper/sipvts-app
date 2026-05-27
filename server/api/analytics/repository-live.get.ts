import { fetchFromGitHub } from '../../services/githubAnalysis'

/**
 * GET /api/analytics/repository-live?owner=<owner>&repo=<repo>
 *
 * Returns real repository analytics fetched from the GitHub API.
 * Requires NUXT_GITHUB_TOKEN to be set in the server environment for higher rate limits.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const owner = query.owner as string
  const repo = query.repo as string

  if (!owner || !repo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required query parameters: owner, repo'
    })
  }

  const identifierPattern = /^[\w.-]+$/
  if (!identifierPattern.test(owner) || !identifierPattern.test(repo)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid owner or repo name'
    })
  }

  try {
    return await fetchFromGitHub(owner, repo)
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch from GitHub: ${String(err)}`
    })
  }
})
