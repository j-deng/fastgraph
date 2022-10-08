import { fieldsMap } from 'graphql-fields-list'
import { RefKeywords } from '../decorators'
import { DEFAULT_PAGE_SIZE } from './consts'
import { createLoader, createRefFieldLoader } from './dataloader'
import {
  fieldFilter,
  fieldRef,
  fieldRefIsList,
  fieldRefType,
  fieldSoftRef,
  fieldUpload,
  idFieldType
} from './field'
import { getRegistry } from './registry'
import { ResourceRoutes } from './route'
import { ResourceItem, ResourceStore, ResourceField } from './types'
import { camelize, generateCustomId, isFieldMutableSimple } from './utils'

const getRepo = (resource: ResourceItem) => {
  const key = resource.decorators.model?.value
  return getRegistry().prisma[camelize(key)]
}

export function buildPrismaResolvers(
  store: ResourceStore,
  resource: ResourceItem
): {
  [key in ResourceRoutes]: Function
} {
  return {
    index: buildListResolver(store, resource),
    detail: buildDetailResolver(store, resource),
    create: buildCreateResolver(store, resource),
    update: buildUpdateResolver(store, resource),
    delete: buildDeleteResolver(store, resource)
  }
}

export function buildListResolver(
  store: ResourceStore,
  resource: ResourceItem
) {
  const repository = getRepo(resource)
  return async (
    parent: any,
    args: Record<string, any>,
    context: any,
    info: any
  ) => {
    let count: any, data: any
    const where = buildListFilters(resource, args.filter)
    const queryFields = fieldsMap(info)
    if ('data' in queryFields) {
      data = await repository.findMany({
        where,
        select: _prismaSelect(store, resource, queryFields.data as MapResult),
        orderBy: args.orderBy,
        skip: args.skip,
        take: args.take || DEFAULT_PAGE_SIZE
      })
    }
    if ('count' in queryFields) {
      count = await repository.count({ where })
    }
    return { data, count }
  }
}

export function buildDetailResolver(
  store: ResourceStore,
  resource: ResourceItem
) {
  const repository = getRepo(resource)
  const idType = idTypeConverter(resource)
  return (parent: any, args: Record<string, any>, context: any, info: any) => {
    return repository.findUnique({
      where: { id: idType(args.id) },
      select: _prismaSelect(store, resource, fieldsMap(info))
    })
  }
}

export function buildCreateResolver(
  store: ResourceStore,
  resource: ResourceItem
) {
  const repository = getRepo(resource)
  const useCustomId = !!resource.fields.find(
    (item) => item.field === 'id' && item.decorators.customId?.value
  )
  const connectConverter = refConnectTypeConverter(resource)
  return (parent: any, args: Record<string, any>, context: any, info: any) => {
    const converted = convertConnect(connectConverter, args)
    return repository.create({
      data: {
        ...args,
        ...converted,
        id: useCustomId ? generateCustomId() : undefined
      },
      select: _prismaSelect(store, resource, fieldsMap(info))
    })
  }
}

export function buildUpdateResolver(
  store: ResourceStore,
  resource: ResourceItem
) {
  const repository = getRepo(resource)
  const idType = idTypeConverter(resource)
  const connectConverter = refConnectTypeConverter(resource)
  return (parent: any, args: Record<string, any>, context: any, info: any) => {
    const converted = convertConnect(connectConverter, args)
    return repository.update({
      where: { id: idType(args.id) },
      data: { ...args, ...converted, id: undefined },
      select: _prismaSelect(store, resource, fieldsMap(info))
    })
  }
}

export function buildDeleteResolver(
  store: ResourceStore,
  resource: ResourceItem
) {
  const repository = getRepo(resource)
  const idType = idTypeConverter(resource)
  return (parent: any, args: Record<string, any>, context: any, info: any) => {
    return repository
      .deleteMany({
        where: {
          id: { in: args.ids.map(idType) }
        }
      })
      .then(() => true)
  }
}

const _idTypeConverters = {
  Int: (id: string) => parseInt(id),
  BigInt: (id: string) => BigInt(id),
  String: (id: string) => id
}

const idTypeConverter = (resource: ResourceItem) => {
  const idType = idFieldType(resource)
  return _idTypeConverters[idType]
}

const refConnectTypeConverter = (
  resource: ResourceItem
): [string, Function][] => {
  return resource.fields
    .filter(
      (field) =>
        isFieldMutableSimple(field) &&
        fieldRef(field) &&
        fieldRefType(field) !== 'String'
    )
    .map((field) => {
      const fieldType = fieldRefType(field)
      const idType = _idTypeConverters[fieldType]
      const isList = fieldRefIsList(field)
      let connectConvert: Function

      if (isList) {
        connectConvert = (val?: {
          connect?: { id: string }[]
          disconnect?: { id: string }[]
        }) => {
          if (val) {
            return {
              connect: val.connect?.map((v) => ({ id: idType(v.id) })),
              disconnect: val.disconnect?.map((v) => ({ id: idType(v.id) }))
            }
          }
        }
      } else {
        connectConvert = (val?: {
          connect?: { id: string | undefined }
          disconnect: boolean
        }) => {
          if (val?.connect?.id) {
            return {
              connect: { id: idType(val.connect.id) }
            }
          }
          return val
        }
      }
      return [field.field, connectConvert]
    })
}

const convertConnect = (
  connectConverter: [field: string, converter: Function][],
  args: Record<string, any>
) => {
  return Object.fromEntries(
    connectConverter.map(([field, converter]) => [
      field,
      converter(args[field])
    ])
  )
}

function buildListFilters(resource: ResourceItem, filter: Object) {
  if (!filter) return {}
  return {
    AND: Object.entries(filter).map(([key, val]) => {
      const field = resource.fields.find((field) => field.field === key)
      if (fieldRef(field)) {
        const fieldType = fieldRefType(field)
        const idType = _idTypeConverters[fieldType]
        val = idType(val)
        if (fieldRefIsList(field)) {
          return { [key]: { some: { id: val } } }
        }
        return { [key]: val ? { id: val } : null }
      }
      if (fieldFilter(field)?.search) {
        return { [key]: { contains: val } }
      }
      if (field?.field === 'id') {
        const idType = idTypeConverter(resource)
        return { [key]: idType(val) }
      }
      return { [key]: val }
    })
  }
}

/**
 * Build Object ref fields resolver.
 *
 * @param resource
 * @param field
 * @returns
 */
export function buildRefFieldResolver(
  resource: ResourceItem,
  field: ResourceField
) {
  return async (parent: any, args: any, context: any, info: any) => {
    // if ref if included in query result, just use it
    // it's useful when we want to hide sensitive fields or reduce query
    if (parent[field.field] !== undefined) {
      return parent[field.field]
    }

    const keywords = field.decorators.ref?.keywords as RefKeywords
    // if field is ref model on id field, use simple dataloader
    // @todo support `to` field not id
    if (!keywords.list && keywords.from && keywords.to === 'id') {
      const id = parent[keywords.from]
      if (id) {
        const model = camelize(fieldRef(field))
        return createLoader(model).load(id)
      }
    }

    let model = resource.decorators.model?.value
    // else use dataloader that prisma select refs
    if (model) {
      model = camelize(model)
      return createRefFieldLoader(model, field.field).load(parent.id)
    }
  }
}

export function buildSoftRefFieldResolver(field: ResourceField) {
  return async (parent: any, args: any, context: any, info: any) => {
    if (parent[field.field] !== undefined) {
      return parent[field.field]
    }

    const keywords = field.decorators.softRef?.keywords as RefKeywords
    // @todo support `to` field not id
    if (keywords.to === 'id') {
      const model = camelize(field.decorators.softRef.value)
      const id = parent[field.field]
      if (id) {
        return createLoader(model).load(id)
      }
    }
  }
}

// from `graphql-fields-list`
type MapResultKey = false | MapResult
type MapResult = { [key: string]: MapResultKey }

type SelectResult = { [key: string]: true | SelectResult }

/**
 * Graphql select to prisma model nested select.
 *
 * Add fields that not custom resolve(without `@resolver`).
 *
 * @param store
 * @param resource
 * @param select
 * @returns
 */
function _prismaSelect(
  store: ResourceStore,
  resource: ResourceItem,
  select: MapResult
): SelectResult {
  const result: SelectResult = {}
  for (const k in select) {
    const field = resource.fields.find((item) => item.field === k)
    if (field && !field.decorators.resolver) {
      if (select[k] === false) {
        result[k] = true
      } else if (fieldUpload(field)) {
        result[k] = true
      } else {
        const _ref = fieldRef(field)
        if (_ref) {
          result[k] = {
            select: _prismaSelect(store, store[_ref], select[k] as MapResult)
          }
        }
        if (fieldSoftRef(field)) {
          result[k] = true
        }
      }
    }
  }
  return result
}
