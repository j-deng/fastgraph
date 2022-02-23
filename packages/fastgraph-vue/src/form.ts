import Joi from 'joi'
import { fieldType, isFieldRequired } from './field'
import { ResourceField, ResourceItem } from './types'

export function buildValidationRules(resource: ResourceItem, allow: boolean) {
  return Object.fromEntries(
    resource.fields.map((field) => {
      const rules: any[] = []
      if (allow) {
        if (isFieldRequired(field)) {
          rules.push({ required: true })
        }
        rules.push({
          validator: async (rule: any, value: any) => {
            // required is checked above
            if (value) {
              const { error } = getJoiValidator(
                field,
                fieldType(field)
              ).validate(value)
              if (error) {
                throw error
              }
            }
            return value
          }
        })
      }
      return [field.field, rules]
    })
  )
}

function getJoiValidator(field: ResourceField, fieldType: string) {
  const validation = field.decorators.validation
  if (validation) {
    const type = validation.value || getJoiType(fieldType)
    return Object.entries(validation.keywords || {}).reduce((acc, [k, v]) => {
      let options = v === true ? undefined : v
      // fix `Built-in TLD list disabled` issue
      options = k === 'email' && !options ? { tlds: { allow: false } } : options
      return (acc as any)[k](options)
    }, Joi[type as 'number' | 'string' | 'date']())
  }
  return Joi.any()
}

function getJoiType(type: string) {
  if (type === 'Date' || type === 'DateTime') return 'date'
  if (type === 'Int' || type === 'Float') return 'number'
  return 'string'
}
