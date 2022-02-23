import {
  fieldRef,
  filterFields,
  isFieldRequired,
  sortableFields
} from './field'
import { applyMiddleware } from './middleware'
import {
  buildPrismaResolvers,
  buildRefFieldResolver,
  buildSoftRefFieldResolver
} from './prisma'
import {
  buildFieldResolver,
  buildFreeResolvers,
  buildFreeResolverTypeDefs,
  buildResourceResolvers
} from './resolver'
import { buildScalarTypes, scalarResolvers } from './scalars'
import { fieldType } from './fieldTypes'
import { capitalize, isOmit, isFieldMutable, resourceModel } from './utils'
import { ResourceEnums, ResourceItem, ResourceStore } from './types'
import { ResourceRouteKind, resourceRouteNames, ResourceRoutes } from './route'
import { getRegistry } from './registry'

const resourceFilterInputName = (key: string) => `${capitalize(key)}FilterInput`
const resourceOrderByInputName = (key: string) =>
  `${capitalize(key)}OrderByInput`

export function buildTypes(store: ResourceStore): string {
  let schema: string = ''
  let query: string[] = []
  let mutation: string[] = []
  const enums = getRegistry().enums

  for (const key in store) {
    const resource = store[key]
    const fieldTypes = resource.fields
      .filter((item) => !isOmit(item, ResourceRouteKind.read))
      .map((item) => `${item.field}: ${fieldType(item, key)}`)
    schema += `
type ${key} {
  ${fieldTypes.join('\n  ')}
}
`
    const routes = resourceRouteNames(resource)
    if (routes) {
      _buildResolverTypes(resource, routes, query, mutation)
      if (routes.index) {
        schema += `
type ${key}Index {
  data: [${key}]
  count: Int
}
${buildFilterInput(resource)}\
${buildOrderByInput(resource)}\
`
      }
    }
  }

  const freeTypes = buildFreeResolverTypeDefs()
  query = query.concat(freeTypes.query)
  mutation = mutation.concat(freeTypes.mutation)

  schema = `\
${schema}
type Query {
  ${query.join('\n  ')}
}

type Mutation {
  ${mutation.join('\n  ')}
}

${buildScalarTypes()}

${_buildRefIdInput()}

${_buildSortEnum()}

${buildEnumTypes(enums)}
`
  return schema
}

function _buildResolverTypes(
  resource: ResourceItem,
  routes: { [key in ResourceRoutes]: string },
  query: string[],
  mutation: string[]
) {
  const key = resource.key

  if (routes.index) {
    const _sortFields = sortableFields(resource)
    const _filterFields = filterFields(resource)
    query.push(
      `${routes.index}(skip: Int, take: Int${
        _filterFields.length ? ', filter: ' + resourceFilterInputName(key) : ''
      }${
        _sortFields.length ? ', orderBy: ' + resourceOrderByInputName(key) : ''
      }): ${key}Index`
    )
  }

  if (routes.detail) {
    query.push(`${routes.detail}(id: ID!): ${key}`)
  }

  if (routes.create) {
    mutation.push(`${routes.create}(${buildMutationFields(resource)}): ${key}`)
  }

  if (routes.update) {
    mutation.push(
      `${routes.update}(${buildMutationFields(resource, false)}): ${key}`
    )
  }

  if (routes.delete) {
    mutation.push(`${routes.delete}(ids: [ID]!): Boolean`)
  }
}

function buildEnumTypes(enums: ResourceEnums) {
  return Object.keys(enums)
    .map(
      (key) => `enum ${key} {
  ${Object.keys(enums[key]).join('\n  ')}
}`
    )
    .join('\n')
}

function buildFilterInput(resource: ResourceItem) {
  const fields = filterFields(resource).map((field) => {
    const type = fieldRef(field) ? 'ID' : fieldType(field, resource.key, false)
    return `${field.field}: ${type}`
  })

  if (fields.length === 0) {
    return ''
  }
  return `
input ${resourceFilterInputName(resource.key)} {
  ${fields.join('\n  ')}
}
`
}

function buildOrderByInput(resource: ResourceItem) {
  const fields = sortableFields(resource).map((field) => `${field.field}: Sort`)
  if (fields.length === 0) {
    return ''
  }
  return `
input ${resourceOrderByInputName(resource.key)} {
  ${fields.join('\n  ')}
}
`
}

function _buildSortEnum() {
  return `\
enum Sort {
  asc
  desc
}`
}

function _buildRefIdInput(): string {
  return `\
input RefIdItem {
  id: ID!
}

input RefIdInput {
  connect: RefIdItem
}

input RefIdListInput {
  connect: [RefIdItem]
  disconnect: [RefIdItem]
}\
`
}

/**
 * Build default resolvers for all resources.
 *
 * 1. Use prisma client if `@model` is set
 * 2. Use custom resolver if `@resolver` is set
 * 3. If field has custom resolver, define object resolver for that field
 *
 * @param store
 * @returns
 */
export function buildResolvers(store: ResourceStore) {
  const query: Record<string, Function> = {}
  const mutation: Record<string, Function> = {}
  const objetResolvers: Record<string, Object> = {}

  for (const key in store) {
    const resource = store[key]
    const model = resourceModel(resource)

    const objetResolver = _buildObjectResolver(resource)
    if (objetResolver) {
      objetResolvers[key] = objetResolver
    }

    let resolvers: {
      [key in ResourceRoutes]?: Function
    } = {}

    if (model) {
      // Add prisma default resolvers
      resolvers = buildPrismaResolvers(store, resource)
      // Apply resource middlewares
      resolvers = applyMiddleware(resource, resolvers, store)
    }
    if (resource.routes) {
      // Add resource class method with @Route as resolvers
      resolvers = { ...resolvers, ...buildResourceResolvers(resource, store) }
    }

    const routes = resourceRouteNames(resource)
    routes?.index && (query[routes.index] = resolvers.index as any)
    routes?.detail && (query[routes.detail] = resolvers.detail as any)
    routes?.create && (mutation[routes.create] = resolvers.create as any)
    routes?.update && (mutation[routes.update] = resolvers.update as any)
    routes?.delete && (mutation[routes.delete] = resolvers.delete as any)
  }

  const freeResolvers = buildFreeResolvers(store)

  return {
    ...scalarResolvers,
    ...objetResolvers,
    Query: { ...query, ...freeResolvers.query },
    Mutation: { ...mutation, ...freeResolvers.mutation }
  }
}

function _buildObjectResolver(resource: ResourceItem) {
  const objectResolver = resource.fields.reduce((acc, field) => {
    const { ref, softRef } = field.decorators
    const isResolver = field.decorators.field?.keywords?.isResolver
    if (isResolver) {
      acc[field.field] = buildFieldResolver(resource, field.field)
    } else if (ref) {
      acc[field.field] = buildRefFieldResolver(resource, field)
    } else if (softRef) {
      acc[field.field] = buildSoftRefFieldResolver(field)
    } else if (
      field.field === 'id' &&
      field.decorators.type?.value === 'BigInt'
    ) {
      // BigInt to ID
      acc[field.field] = (parent: any, args: any, context: any, info: any) =>
        parent.id.toString()
    }
    return acc
  }, {} as any)
  return Object.keys(objectResolver).length === 0 ? undefined : objectResolver
}

function buildMutationFields(
  resource: ResourceItem,
  create: boolean = true
): string {
  return resource.fields
    .filter((item) => isFieldMutable(item, create))
    .map((item) => {
      let type: string
      const _ref = item.decorators.ref
      if (_ref) {
        type = _ref.keywords?.list ? 'RefIdListInput' : 'RefIdInput'
      } else {
        type = fieldType(item, resource.key, false)
      }
      const isRequired =
        (create && isFieldRequired(item)) || (!create && item.field === 'id')
      return `${item.field}: ${type}${isRequired ? '!' : ''}`
    })
    .join(', ')
}
