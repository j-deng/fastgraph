import useTranslation from './composables/translation'
import { ExtResourceRoutes, ResourceField, ResourceItem } from './types'

export function findField(resource: ResourceItem, fieldKey: string) {
  return resource.fields.find((item) => item.field === fieldKey)
}

export function fieldType(field: ResourceField | undefined) {
  return field?.decorators.type?.value
}

export function fieldRef(field: ResourceField | undefined) {
  return field?.decorators.ref?.value
}

export function fieldSoftRef(field: ResourceField | undefined) {
  return field?.decorators.softRef?.value
}

export function fieldSoftRefToField(field: ResourceField | undefined): string {
  return field?.decorators.softRef?.keywords?.to || 'id'
}

export function fieldRefIsList(field: ResourceField | undefined) {
  return field?.decorators.ref?.keywords?.list
}

export function fieldRefField(field: ResourceField | undefined) {
  return (
    field?.decorators.refShowField?.value ||
    field?.decorators.ref?.keywords?.showField ||
    field?.decorators.softRef?.keywords?.showField ||
    'id'
  )
}

export function fieldName(field: ResourceField | undefined) {
  return field?.decorators.field?.value || field?.name
}

export function isSortableField(field: ResourceField | undefined) {
  return !!field?.decorators.sortable || field?.field === 'id'
}

export function sortableFields(resource: ResourceItem) {
  return resource.fields
    .filter((field) => field.decorators.sortable || field.field === 'id') // id is sortable
    .map((field) => field.field)
}

export function filterFields(resource: ResourceItem) {
  return resource.fields.filter((field) => field.decorators.filter)
}

export function isFieldRequired(field: ResourceField | undefined): boolean {
  return !fieldRefIsList(field) && !field?.decorators.optional?.value
}

// @todo
export function isFieldEditable(field: ResourceField | undefined): boolean {
  return !field?.decorators.datetime
}

export interface FieldFilterProps {
  range: boolean
  preload: boolean
  size: number
  select: boolean
}

export function fieldFilter(
  field: ResourceField | undefined
): FieldFilterProps | undefined {
  if (field?.decorators.filter) {
    return (field?.decorators.filter?.keywords || {}) as FieldFilterProps
  }
}

export function fieldEnum(
  field: ResourceField | undefined
): string | undefined {
  return field?.decorators.enum?.value
}

export function fieldUpload(field: ResourceField | undefined) {
  return field?.decorators.upload
}

export function fieldPresent(
  field: ResourceField | undefined,
  record: any
): { component: string; attrs: Record<string, any>; value: any } {
  if (!field) {
    return { component: 'span', attrs: {}, value: '' }
  }

  const fieldKey = field.field
  let component = ''
  let value = record[fieldKey]
  let attrs: Record<string, any> = {}
  const element: string | undefined = field.decorators.present?.value
  const keywords = field?.decorators.present?.keywords

  if (element) {
    let targetElement = element
    if (['link', 'clickable', 'image'].includes(element)) {
      targetElement = 'fg-' + element
    }
    return {
      component: targetElement,
      // present decorator keywords and default values
      attrs: { ...keywords, value, record, fieldKey },
      value
    }
  }

  if (fieldEnum(field)) {
    const { value_t } = useTranslation()
    component = 'fg-enum'
    value = value_t(value)
    return { component, attrs: { value, enumKey: fieldEnum(field) }, value }
  }

  // Show ref model specific field or `id`, join with `,` if is list
  if ((fieldRef(field) || fieldSoftRef(field)) && value) {
    const refField = fieldRefField(field)
    if (fieldRefIsList(field)) {
      component = 'fg-ref'
      value = value.map((item: any) => item[refField])
      attrs = { value }
    } else {
      value = value[refField]
      component = 'span'
      attrs = {}
    }
    return { component, attrs, value }
  }

  if (fieldUpload(field)) {
    component = 'fg-upload'
    attrs = { url: value?.url, image: fieldUpload(field)?.keywords?.image }
    return { component, attrs, value }
  }

  switch (fieldType(field)) {
    case 'Boolean':
      component = 'a-switch'
      attrs = {
        checked: value,
        size: 'small',
        disabled: 'disabled'
      }
      break

    default:
      component = 'span'
      attrs = {}
  }

  return { component, attrs, value }
}

export function fieldForm(
  field: ResourceField | undefined,
  filter: boolean = false
) {
  let attrs: Record<string, any> = {
    disabled: !isFieldEditable(field) && !filter
  }
  let component = field?.decorators.form?.value
  if (component) {
    return {
      component,
      attrs: Object.assign(attrs, field?.decorators.form?.keywords || {})
    }
  }

  if (fieldRef(field) || fieldSoftRef(field)) {
    const keywords =
      field?.decorators.ref?.keywords || field?.decorators.softRef?.keywords
    return {
      component: 'fg-ref-select',
      attrs: {
        ...attrs,
        multiple: filter ? false : fieldRefIsList(field),
        module: fieldRef(field) || fieldSoftRef(field),
        refField: fieldRefField(field),
        take: keywords?.take || 20,
        sortBy: keywords?.sortBy,
        sortOrder: keywords?.sortOrder
      }
    }
  }

  if (fieldEnum(field)) {
    return {
      component: 'fg-enum-select',
      attrs: {
        ...attrs,
        enumKey: fieldEnum(field)
      }
    }
  }

  // id is not editable
  if (field?.field === 'id') {
    return {
      component: 'a-input',
      attrs: {
        ...attrs,
        disabled: !filter,
        style: filter ? '' : 'width: 200px'
      }
    }
  }

  switch (fieldType(field)) {
    case 'Boolean':
      component = filter ? 'fg-bool-select' : 'a-switch'
      break

    case 'Upload':
      component = 'fg-upload-select'
      attrs.name = 'file'
      break

    case 'DateTime':
      attrs.showTime = true
    case 'Date':
      component = 'fg-datetime'
      attrs.style = filter ? 'width: 100%' : 'width: 200px'
      break

    case 'Int':
    case 'Float':
      component = 'a-input-number'
      attrs.style = filter ? 'width: 100%' : 'width: 200px'
      break

    default:
      component = 'a-input'
      break
  }
  return { component, attrs }
}

export function columnWidth(field: ResourceField | undefined) {
  const width = field?.decorators.column?.keywords?.width
  if (width) return width
  if (fieldRef(field) || ['Date', 'DateTime'].includes(fieldType(field)))
    return 108
  return 80
}

export function columnEllipsis(field: ResourceField | undefined) {
  return field?.decorators.column?.keywords?.ellipsis || false
}

export function fieldValidation(field: ResourceField | undefined) {
  return field?.decorators.validation?.keywords || {}
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
