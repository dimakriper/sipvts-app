import { getReposCollection, toRepository } from '../../utils/analytics'
import { analyzeRepository } from '../../services/githubAnalysis'

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
    const col = await getReposCollection()
    const id = `${owner}-${repo}`
    const doc = await col.findOne({ id })
    if (doc) return toRepository(doc)
  } catch {
    // DB unavailable — fall through to service
  }

  return analyzeRepository(owner, repo)
})
