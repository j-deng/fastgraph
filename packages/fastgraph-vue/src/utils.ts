import { fieldRef, fieldSoftRef, fieldType } from './field'
import {
  ExtResourceRoutes,
  ResourceField,
  ResourceItem,
  ResourceRouteKind,
  ResourceRoutes
} from './types'

export function refFieldToSearchValue(
  field: ResourceField | undefined,
  value: any
) {
  if ((fieldRef(field) || fieldSoftRef(field)) && value) {
    return value.id
  }
  return value
}

export function searchValueToRefField(
  field: ResourceField | undefined,
  value: any
) {
  if ((fieldRef(field) || fieldSoftRef(field)) && value) {
    return { id: value }
  }
  return value
}

export function queryToRealType(field: ResourceField, value: string) {
  switch (fieldType(field)) {
    case 'Int':
      return parseInt(value)

    case 'Float':
      return parseFloat(value)

    case 'Boolean':
      return value === 'true'

    default:
      return value
  }
}

export function getResourcePermissions(
  resource: ResourceItem,
  route: ResourceRoutes
): string[] {
  const conf = getRouteAwareConfig(resource, route, 'permission')
  return conf?.value?.split('|') || []
}

export function getRouteAwareConfig(
  resource: ResourceItem,
  route: ResourceRoutes | undefined,
  name: string
): { value: any } | undefined {
  const decorator = resource.decorators[name]
  if (!decorator) {
    return undefined
  }
  let { value, keywords } = decorator
  if (keywords && route) {
    if (keywords[apiToReadWrite(route)] !== undefined) {
      value = keywords[apiToReadWrite(route)]
    }
    if (keywords[route] !== undefined) {
      value = keywords[route]
    }
  }
  return { value }
}

export const apiToReadWrite = (route: ExtResourceRoutes): ResourceRouteKind =>
  ['index', 'detail', 'read'].includes(route)
    ? ResourceRouteKind.read
    : ResourceRouteKind.write
