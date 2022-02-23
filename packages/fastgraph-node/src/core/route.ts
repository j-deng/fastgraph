import { ResourceItem } from './types'
import { resourceModel } from './utils'

export enum ResourceRoute {
  index = 'index',
  detail = 'detail',
  create = 'create',
  update = 'update',
  delete = 'delete'
}

export enum ResourceRouteKind {
  read = 'read',
  write = 'write'
}

export type ResourceRoutes = ResourceRoute
export type ExtResourceRoutes = ResourceRoute | ResourceRouteKind

export const resourceRouteNames = (resource: ResourceItem) => {
  if (resourceModel(resource)) {
    return {
      detail: `${resource.key}_detail`,
      index: `${resource.key}_list`,
      create: `${resource.key}_create`,
      update: `${resource.key}_update`,
      delete: `${resource.key}_delete`,
      ...resource.routes
    }
  }
  return resource.routes
}

export const apiToReadWrite = (route: ExtResourceRoutes): ResourceRouteKind =>
  ['index', 'detail', 'read'].includes(route)
    ? ResourceRouteKind.read
    : ResourceRouteKind.write
