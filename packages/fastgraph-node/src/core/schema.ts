import crypto from 'crypto'
import { getRegistry } from './registry'
import { buildTypes, buildResolvers } from './paser'
import { buildStore, parsePrismaEnums } from './store'

export function buildSchema() {
  getRegistry().registerEnums(parsePrismaEnums())

  const store = buildStore()
  const typeDefs = buildTypes(store)
  const resolvers = buildResolvers(store)

  const md5 = crypto.createHash('md5')
  const schemaVersion = md5.update(JSON.stringify(store)).digest('hex')

  return { store, typeDefs, resolvers, schemaVersion }
}
