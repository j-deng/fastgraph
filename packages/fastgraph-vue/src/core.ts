import gql from 'graphql-tag'
import { ResourceField, ResourceItem, ResourceRoute } from './types'
import {
  fieldRef,
  fieldRefField,
  fieldRefIsList,
  fieldSoftRef,
  fieldSoftRefToField,
  fieldType,
  fieldUpload,
  filterFields,
  isFieldRequired,
  isOmit,
  sortableFields
} from './field'
import { DocumentNode } from 'graphql'

export function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

export function camelize(string: string) {
  return string.charAt(0).toLocaleLowerCase() + string.slice(1)
}

const resourceFilterInputName = (key: string) => `${capitalize(key)}FilterInput`
const resourceOrderByInputName = (key: string) =>
  `${capitalize(key)}OrderByInput`

function _mapResolveField(field: ResourceField) {
  if (fieldRef(field) || fieldSoftRef(field)) {
    const selected = ['id'].concat(fieldRefField(field).split(',') || [])
    return `${field.field} { ${selected.join(',')} }`
  }
  if (fieldUpload(field)) {
    return `${field.field} { url, name }`
  }
  return `${field.field}`
}

export const noneQuery = gql`
  query {
    none
  }
`

export const isNoneQuery = (query: DocumentNode) => noneQuery === query

export function makeListQuery(resource: ResourceItem | undefined) {
  if (!resource) {
    return noneQuery
  }
  const fields = resource.fields
    .filter((item) => !isOmit(item, ResourceRoute.index))
    .map(_mapResolveField)

  return gql`\
query (${buildListQueryParams(resource)}) {
  ${resourceRouteNames(resource)?.index}(${buildListQueryVars(resource)}) {
    data {
      ${fields.join('\n    ')}
    }
    count
  }
}`
}

export function makeDetailQuery(resource: ResourceItem | undefined) {
  if (!resource) {
    return noneQuery
  }
  const fields = resource.fields
    .filter((item) => !isOmit(item, ResourceRoute.detail))
    .map(_mapResolveField)

  return gql`\
query ($id: ID!) {
  ${resourceRouteNames(resource)?.detail}(id: $id) {
    ${fields.join('\n    ')}
  }
}`
}

export function makeCreateMutation(resource: ResourceItem) {
  return gql`\
mutation (${buildMutationFields(resource)}) {
  ${resourceRouteNames(resource)?.create}(${buildVarFields(resource)}) {
    id
  }
}`
}

export function makeUpdateMutation(
  resource: ResourceItem,
  updateFields: string[]
) {
  return gql`\
mutation (${buildMutationFields(resource, false, updateFields)}) {
  ${resourceRouteNames(resource)?.update}(${buildVarFields(
    resource,
    false,
    updateFields
  )}) {
    id
  }
}`
}

export function makeDeleteMutation(resource: ResourceItem) {
  return gql`\
mutation ($ids: [ID]!) {
  ${resourceRouteNames(resource)?.delete}(ids: $ids)
}`
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

function buildMutationFields(
  resource: ResourceItem,
  create: boolean = true,
  updateFields?: string[]
): string {
  return resource.fields
    .filter(
      (item) =>
        isFieldMutable(item, create) &&
        (!updateFields || updateFields.includes(item.field))
    )
    .map((item) => {
      let type: string
      // @todo fix softref and ref not to id field
      if (fieldRef(item)) {
        type = fieldRefIsList(item) ? 'RefIdListInput' : 'RefIdInput'
      } else {
        type = fieldType(item)
      }
      const isRequired =
        (create && isFieldRequired(item)) || (!create && item.field === 'id')
      return `$${item.field}: ${type}${isRequired ? '!' : ''}`
    })
    .join(', ')
}

function buildVarFields(
  resource: ResourceItem,
  create: boolean = true,
  updateFields?: string[]
): string {
  return resource.fields
    .filter(
      (item) =>
        isFieldMutable(item, create) &&
        (!updateFields || updateFields.includes(item.field))
    )
    .map((item) => `${item.field}: $${item.field}`)
    .join(', ')
}

function buildListQueryParams(resource: ResourceItem): string {
  const _filterFields = filterFields(resource)
  const _sortFields = sortableFields(resource)
  return `$skip: Int, $take: Int\
${
  _filterFields.length
    ? ', $filter: ' + resourceFilterInputName(resource.key)
    : ''
}\
${
  _sortFields.length
    ? ', $orderBy: ' + resourceOrderByInputName(resource.key)
    : ''
}`
}

function buildListQueryVars(resource: ResourceItem): string {
  const _filterFields = filterFields(resource)
  const _sortFields = sortableFields(resource)
  return `skip: $skip, take: $take
${_filterFields.length ? ', filter: $filter' : ''}\
${_sortFields.length ? ', orderBy: $orderBy' : ''}`
}

/**
 * The ref field InputType is:
 *
 * input RefIdItem {
 *   id: ID!
 * }
 * input RefIdInput {
 *   connect: [RefIdItem]
 *   disconnect: [RefIdItem]
 * }
 *
 * @param field
 * @param value
 * @param record
 * @returns
 */
export function refFieldToInputType(
  field: ResourceField | undefined,
  value: any,
  record: any
) {
  if (!field) return value

  if (fieldRefIsList(field) && value) {
    // if ref is list, empty value is []
    const connects = value.map((item: { id: any }) => item.id)
    const disconnects =
      (record && record[field.field])
        ?.map((item: { id: any }) => item.id)
        .filter((id: any) => !connects.includes(id)) || []
    const input: any = {}
    if (connects.length) {
      input.connect = connects.map((id: any) => ({ id }))
    }
    if (disconnects.length) {
      input.disconnect = disconnects.map((id: any) => ({ id }))
    }
    return input
  }

  if (fieldRef(field)) {
    if (value) {
      return { connect: { id: value.id } }
    } else if (record && record[field.field]) {
      return { disconnect: true }
    }
  }

  if (fieldSoftRef(field) && value) {
    return value[fieldSoftRefToField(field)]
  }

  return value
}

export const resourceModel = (resource: ResourceItem) =>
  resource.decorators.model?.value

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
