import { generateMockRepo } from '../../utils/analytics'

export default defineEventHandler((event) => {
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

  return generateMockRepo(owner, repo)
})
