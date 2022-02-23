import { getRegistry } from './registry'
import { ResourceRoute, ResourceRoutes } from './route'
import {
  ResourceStore,
  ResourceItem,
  MiddlewareFn,
  ResolverContext
} from './types'
import { getRouteAwareConfig } from './utils'

export function getMiddlewareFn(
  name: string,
  context: ResolverContext
): MiddlewareFn {
  const middlewareCreator = getRegistry().middlewares[name]
  if (!middlewareCreator) {
    throw new Error(`Middleware ${name} is not registered`)
  }
  return middlewareCreator(context)
}

export function getResourceMiddlewareFns(
  context: ResolverContext
): MiddlewareFn[] {
  const { resource, route, metaGetter } = context
  let middlewares: string[] = []

  // if resource/route then get from resource decorators
  if (resource) {
    middlewares =
      getRouteAwareConfig(resource, route, 'middleware')?.value || []
  }

  // if with meta getter then get from resolver method meta data
  if (metaGetter) {
    const value = metaGetter('middleware')
    if (value) {
      middlewares = [...middlewares, ...value.split('|')]
    }
  }

  middlewares = [...new Set(middlewares)]
  return middlewares.map((name: string) => getMiddlewareFn(name, context)) || []
}

export function getGlobalMiddlewareFns(context: ResolverContext) {
  return getRegistry().globalMiddlewares.map((name) =>
    getMiddlewareFn(name, context)
  )
}

export function applyMiddleware(
  resource: ResourceItem,
  resolvers: {
    [key in ResourceRoutes]?: Function
  },
  store: ResourceStore
) {
  return Object.fromEntries(
    Object.entries(resolvers).map(([route, resolver]) => [
      route,
      applyResolverMiddleware(resolver, {
        store,
        resource,
        route: route as ResourceRoute
      })
    ])
  )
}

export function applyResolverMiddleware(
  resolver: Function,
  context: ResolverContext
) {
  return _apply(
    getGlobalMiddlewareFns(context)
      .concat(getResourceMiddlewareFns(context))
      .reverse(),
    resolver
  )
}

function _apply(middlewares: Function[], next: Function): Function {
  return async (
    parent: any,
    args: Record<string, any>,
    context: any,
    info: any
  ) => {
    return middlewares.reduce(
      (acc, middleware) =>
        async (
          parent: any,
          args: Record<string, any>,
          context: any,
          info: any
        ) =>
          await middleware({ parent, args, context, info }, acc),
      next
    )(parent, args, context, info)
  }
}
