import { FieldFilterProps } from '../decorators'
import { prismaModelIdType } from './fieldTypes'
import { IDTypes, ResourceField, ResourceItem } from './types'

export function idFieldType(resource: ResourceItem): IDTypes {
  return prismaModelIdType(resource.key)
}

export function fieldName(field: ResourceField | undefined) {
  return field?.decorators.field?.value || field?.name
}

export function fieldRef(field: ResourceField | undefined) {
  return field?.decorators.ref?.value
}

export function fieldRefType(field: ResourceField | undefined): IDTypes {
  return prismaModelIdType(fieldRef(field))
}

export function fieldSoftRef(field: ResourceField | undefined) {
  return field?.decorators.softRef?.value
}

export function fieldRefIsList(field: ResourceField | undefined) {
  return field?.decorators.ref?.keywords?.list
}

export function fieldFilter(
  field: ResourceField | undefined
): FieldFilterProps | undefined {
  return field?.decorators.filter?.keywords
}

export function isFieldRequired(field: ResourceField): boolean {
  return !fieldRefIsList(field) && !field.decorators.optional?.value
}

export function sortableFields(resource: ResourceItem) {
  return resource.fields.filter(
    (field) => field.decorators.sortable || field.field === 'id'
  ) // id is sortable
}

export function filterFields(resource: ResourceItem) {
  return resource.fields.filter((field) => field.decorators.filter)
}

export function fieldUpload(field: ResourceField) {
  return field.decorators.upload
}
