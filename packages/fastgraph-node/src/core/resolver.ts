import { getRegistry } from './registry'
import { applyResolverMiddleware } from './middleware'
import { ResolverMetaGetter, ResourceItem, ResourceStore } from './types'
import { ResourceRoutes } from './route'

export function getResourceRoutes(constructor: Function) {
  const entries = Reflect.ownKeys(constructor.prototype)
    .filter((method) => method !== 'constructor')
    .map((method) => {
      const route = Reflect.getMetadata(
        'route',
        new (constructor as any)(),
        method
      )
      return [route, method]
    })
    .filter(([route, _]) => route)
  return entries.length ? Object.fromEntries(entries) : undefined
}

export function buildResourceResolvers(
  resource: ResourceItem,
  store: ResourceStore
) {
  if (resource.routes) {
    const resolvers: { [key in ResourceRoutes]?: Function } = {}
    Object.entries(resource.routes).forEach(([route, method]) => {
      resolvers[route as ResourceRoutes] = _makeResolver(
        resource.constructor,
        method,
        store,
        resource,
        route as ResourceRoutes
      )
    })
    return resolvers
  }
}

export function buildFreeResolverTypeDefs() {
  const query: string[] = []
  const mutation: string[] = []
  getRegistry().resolvers.forEach((constructor) => {
    Reflect.ownKeys(constructor.prototype)
      .filter((method) => method !== 'constructor')
      .forEach((method) => {
        const queryDef = getMeta('query', constructor, method)
        if (queryDef) {
          query.push(`${method as string}${queryDef}`)
        } else {
          const mutationDef = getMeta('mutation', constructor, method)
          mutationDef && mutation.push(`${method as string}${mutationDef}`)
        }
      })
  })
  return { query, mutation }
}

export function buildFreeResolvers(store: ResourceStore) {
  const query: any = {}
  const mutation: any = {}
  getRegistry().resolvers.forEach((constructor) => {
    Reflect.ownKeys(constructor.prototype)
      .filter((method) => method !== 'constructor')
      .forEach((method) => {
        if (getMeta('query', constructor, method)) {
          query[method] = _makeResolver(constructor, method, store)
        } else if (getMeta('mutation', constructor, method)) {
          mutation[method] = _makeResolver(constructor, method, store)
        }
      })
  })
  return { query, mutation }
}

const getMeta = (name: string, constructor: any, method: any) =>
  Reflect.getMetadata(name, new (constructor as any)(), method)

function _makeResolver(
  constructor: any,
  method: any,
  store: ResourceStore,
  resource?: ResourceItem,
  route?: ResourceRoutes
) {
  const metaGetter: ResolverMetaGetter = (name, defaultValue) => {
    const value = getMeta(name, constructor, method)
    return value === undefined ? defaultValue : value
  }

  const resolver = (parent: any, args: any, context: any, info: any) => {
    return new constructor()[method](parent, args, context, info)
  }

  return applyResolverMiddleware(resolver, {
    store,
    metaGetter,
    resource,
    route
  })
}

export function buildFieldResolver(resource: ResourceItem, field: string) {
  return (parent: any, args: any, context: any, info: any) => {
    return new (resource.constructor as any)()[field](
      parent,
      args,
      context,
      info
    )
  }
}
