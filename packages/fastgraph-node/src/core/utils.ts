import { Snowflake } from 'nodejs-snowflake'
import { ExtResourceRoutes, ResourceRoute, apiToReadWrite } from './route'
import { ResourceField, ResourceItem } from './types'

export const SNOWFLAKE_CUSTOM_EPOCH = parseInt(
  process.env.SNOWFLAKE_CUSTOM_EPOCH || `${+new Date('2022-02-02')}`
)
export const SNOWFLAKE_INSTANCE_ID = parseInt(
  process.env.SNOWFLAKE_INSTANCE_ID || '1'
)

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function camelize(string: string) {
  return string.charAt(0).toLocaleLowerCase() + string.slice(1)
}

export function getRouteAwareConfig(
  resource: ResourceItem,
  route: ResourceRoute | undefined,
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

export function parseOmit(field: ResourceField):
  | {
      [key in ExtResourceRoutes]?: any
    }
  | undefined {
  const keywords = field.decorators.omit?.keywords
  if (!keywords) return
  const { read, write, index, detail, create, update } = keywords
  return {
    read: read || (index && detail),
    write: write || (create && update),
    index: index || read,
    detail: detail || read,
    create: create || write,
    update: update || write
  }
}

export function isOmit(
  field: ResourceField,
  route: ExtResourceRoutes | ExtResourceRoutes[]
) {
  const omit = parseOmit(field)
  if (omit) {
    if (typeof route === 'string') return omit[route]
    for (let item of route) {
      if (omit[item]) return true
    }
  }
}

export function isFieldMutable(field: ResourceField, create: boolean = false) {
  // filter omit
  if (create && isOmit(field, ResourceRoute.create)) {
    return false
  } else if (
    !create &&
    isOmit(field, [ResourceRoute.detail, ResourceRoute.update])
  ) {
    return false
  }
  // hide id in create
  if (create && field.field === 'id') {
    return false
  }
  return true
}

export const resourceModel = (resource: ResourceItem) =>
  resource.decorators.model?.value

const uid = new Snowflake({
  custom_epoch: SNOWFLAKE_CUSTOM_EPOCH,
  instance_id: SNOWFLAKE_INSTANCE_ID
})

// @todo generateCustomId may be configable
export const generateCustomId = () => {
  return uid.getUniqueID().toString()
}
