import { MongoClient, type Db } from 'mongodb'

let client: MongoClient | null = null

export async function getDb(): Promise<Db> {
  if (!client) {
    const config = useRuntimeConfig()
    const uri = config.mongodbUri as string
    if (!uri) {
      throw new Error('MONGODB_URI runtime config is not set')
    }
    client = new MongoClient(uri)
    await client.connect()
  }
  const config = useRuntimeConfig()
  return client.db((config.mongodbDb as string) || 'sipvts')
}
