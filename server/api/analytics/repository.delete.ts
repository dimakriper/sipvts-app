import { getReposCollection } from '../../utils/analytics'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const id = query.id as string

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required query parameter: id'
    })
  }

  try {
    const col = await getReposCollection()
    await col.deleteOne({ id })
  } catch {
    // DB unavailable — nothing to delete, treat as success
  }

  return { success: true }
})
