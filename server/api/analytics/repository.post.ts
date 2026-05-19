import { analyzeRepository } from '../../services/githubAnalysis'

interface AddRepoBody {
  owner: string
  repo: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AddRepoBody>(event)
  const { owner, repo } = body ?? {}

  if (!owner || !repo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Request body must include owner and repo'
    })
  }

  const identifierPattern = /^[\w.-]+$/
  if (!identifierPattern.test(owner) || !identifierPattern.test(repo)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid owner or repo name'
    })
  }

  return analyzeRepository(owner, repo)
})
