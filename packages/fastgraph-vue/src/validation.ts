import Joi from 'joi'
import { fieldType, isFieldRequired } from './field'
import { ResourceField, ResourceItem } from './types'

export type LanguageMessages = {
  [locale: string]: Record<string, string>
}

let _joiMessages: LanguageMessages = {}

export const registerJoiMessages = (messages: LanguageMessages) => {
  _joiMessages = messages
}

export function buildValidationRules(
  resource: ResourceItem,
  locale: string,
  allow: boolean
) {
  return Object.fromEntries(
    resource.fields.map((field) => {
      const rules: any[] = []
      if (allow) {
        if (isFieldRequired(field)) {
          rules.push({
            required: true,
            validator: () => Promise.resolve(undefined)
          })
        }
        rules.push({
          validator: async (rule: any, value: any) => {
            // required is checked above
            if (value !== undefined && value !== null) {
              const { error } = getJoiValidator(
                field,
                fieldType(field)
              ).validate(value, {
                messages: _joiMessages[locale],
                errors: {
                  label: false
                }
              })
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
    const type = (validation.value || getJoiType(fieldType)) as
      | 'number'
      | 'string'
      | 'date'
    return Object.entries(validation.keywords || {}).reduce((acc, [k, v]) => {
      let options = v === true ? undefined : v
      // fix `Built-in TLD list disabled` issue
      options = k === 'email' && !options ? { tlds: { allow: false } } : options
      return (acc as any)[k](options)
    }, Joi[type]())
  }
  return Joi.any()
}

function getJoiType(type: string) {
  if (type === 'Date' || type === 'DateTime') return 'date'
  if (type === 'Int' || type === 'Float') return 'number'
  return 'string'
}
