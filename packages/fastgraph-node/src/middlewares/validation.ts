import Joi from 'joi'
import { fieldType } from '../core/fieldTypes'
import { isFieldRequired } from '../core/field'
import { MiddlewareCreator, ResourceField, ResourceItem } from '../core/types'
import { ResourceRoute } from '../core/route'

export const ValidationMiddleware: MiddlewareCreator = ({
  store,
  resource,
  route,
  metaGetter
}) => {
  let resourceKey: string = ''
  if (resource) {
    if (route === ResourceRoute.create || route === ResourceRoute.update) {
      resourceKey = resource.key
    }
  } else {
    resourceKey = metaGetter && metaGetter('validation')
  }
  if (resourceKey) {
    makeResourceValidator(store[resourceKey])
    return async ({ parent, args, context, info }, next) => {
      validate(resourceKey, args)
      return await next(parent, args, context, info)
    }
  }
  return async ({ parent, args, context, info }, next) => {
    return await next(parent, args, context, info)
  }
}

const _joiValidatorCacheMap: { [key: string]: Joi.ObjectSchema } = {}

function makeResourceValidator(resource: ResourceItem) {
  if (!_joiValidatorCacheMap[resource.key]) {
    _joiValidatorCacheMap[resource.key] = Joi.object(
      Object.fromEntries(
        resource.fields.map((field) => [
          field.field,
          getJoiValidator(field, fieldType(field, resource.key, false))
        ])
      )
    )
  }
  return _joiValidatorCacheMap[resource.key]
}

function validate(resourceKey: string, args: any) {
  if (!_joiValidatorCacheMap[resourceKey]) {
    throw new Error(`No validator for resource ${resourceKey}`)
  }
  const result = _joiValidatorCacheMap[resourceKey].validate(args)
  if (result.error) {
    throw result.error
  }
}

function getJoiValidator(field: ResourceField, fieldType: string) {
  const validation = field.decorators.validation
  if (validation) {
    const type = validation.value || getJoiType(fieldType)
    const joiObj = Object.entries(validation.keywords || {}).reduce(
      (acc, [k, v]) => (acc as any)[k](v === true ? undefined : v),
      Joi[type as 'number' | 'string' | 'date']()
    )
    if (!isFieldRequired(field)) {
      if (type === 'string') {
        return joiObj.allow(null).allow('')
      }
      return joiObj.allow(null)
    }
    return joiObj
  }
  return Joi.any()
}

function getJoiType(type: string) {
  if (type === 'Date' || type === 'DateTime') return 'date'
  if (type === 'Int' || type === 'Float') return 'number'
  return 'string'
}
