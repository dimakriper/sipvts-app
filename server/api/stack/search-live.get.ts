import { searchStackFromGitHub } from '../../services/githubStackSearch'
import { SUPPORTED_LANGUAGES } from '../../services/stackSearch'

/**
 * GET /api/stack/search-live?language=JavaScript&keywords=react,prisma
 *
 * Returns real stack analytics by fetching repositories from GitHub,
 * parsing their dependency manifests, and running the same analysis
 * pipeline (co-occurrence, Jaccard, communities, FP-Growth) as the mock endpoint.
 *
 * Requires NUXT_GITHUB_TOKEN for higher rate limits.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const language = (query.language as string | undefined)?.trim() ?? ''
  const searchQuery = (query.keywords as string | undefined)?.trim() ?? ''

  if (!language) {
    throw createError({ statusCode: 400, statusMessage: 'Параметр "language" обязателен' })
  }

  if (!SUPPORTED_LANGUAGES.includes(language as typeof SUPPORTED_LANGUAGES[number])) {
    throw createError({
      statusCode: 400,
      statusMessage: `Язык "${language}" не поддерживается. Допустимые значения: ${SUPPORTED_LANGUAGES.join(', ')}`
    })
  }

  try {
    return await searchStackFromGitHub(language, searchQuery)
  } catch (err) {
    throw createError({
      statusCode: 502,
      statusMessage: `Failed to fetch stack data from GitHub: ${String(err)}`
    })
  }
})
