import { seedIfEmpty, getReposCollection, toRepository, seedData } from '../../utils/analytics'

export default defineEventHandler(async () => {
  try {
    await seedIfEmpty()
    const col = await getReposCollection()
    const docs = await col.find({}).toArray()
    return docs.map(toRepository)
  } catch {
    return seedData
  }
})
