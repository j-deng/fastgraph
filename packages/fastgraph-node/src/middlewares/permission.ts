import { AuthenticationError, ForbiddenError } from 'apollo-server'
import { ResourceRoutes } from '../core/route'
import { MiddlewareCreator, ResourceItem, UserContext } from '../core/types'
import { getRouteAwareConfig } from '../core/utils'

export function getResourcePermissions(
  resource: ResourceItem,
  route: ResourceRoutes
): string[] {
  const conf = getRouteAwareConfig(resource, route, 'permission')
  return conf?.value?.split('|') || []
}

export function isResourceAuthRequired(
  resource: ResourceItem,
  route: ResourceRoutes
): boolean {
  const conf = getRouteAwareConfig(resource, route, 'loginRequired')
  return conf?.value !== false
}

export function isResourceStaffRequired(
  resource: ResourceItem,
  route: ResourceRoutes
): boolean {
  const conf = getRouteAwareConfig(resource, route, 'staffRequired')
  return !!conf && conf.value !== false
}

export function checkPermission(
  permissions: string[],
  userPermissions: string[]
): boolean {
  return (
    permissions.length === 0 ||
    permissions.filter((item) => userPermissions.includes(item)).length > 0
  )
}

export const PermissionCheckMiddleware: MiddlewareCreator = ({
  resource,
  route,
  metaGetter
}) => {
  let permissions: string[] = []
  let authRequired = true
  let staffRequired = false
  if (resource && route) {
    permissions = getResourcePermissions(resource, route)
    authRequired = isResourceAuthRequired(resource, route)
    staffRequired = isResourceStaffRequired(resource, route)
  }
  if (metaGetter) {
    const value = metaGetter('permission')
    if (value) {
      permissions = [...permissions, ...value.split('|')]
    }
    authRequired = metaGetter('loginRequired', authRequired)
    staffRequired = metaGetter('staffRequired', staffRequired)
  }
  return async ({ parent, args, context, info }, next) => {
    if (authRequired) {
      const user = context.user as UserContext
      if (!user) {
        throw new AuthenticationError('Login required')
      }
      if (staffRequired && !user.isStaff) {
        throw new AuthenticationError('User is not staff')
      }
      if (
        !user.isActive ||
        (!user.isSuperuser && !checkPermission(permissions, user.permissions))
      ) {
        throw new ForbiddenError('Permission denied')
      }
    }
    return await next(parent, args, context, info)
  }
}
