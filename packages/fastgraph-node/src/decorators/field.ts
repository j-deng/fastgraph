import 'reflect-metadata'
import Joi from 'joi'
import { getRegistry } from '../core/registry'
import { ExtResourceRoutes } from '../core/route'

export function defineField(
  name: string,
  value?: any,
  keywords?: Record<string, any>
): PropertyDecorator {
  return (target, key) => {
    Reflect.defineMetadata(name, { value, keywords }, target, key)
    if (name === 'field') {
      getRegistry().registerField(target.constructor.name, key as string, value)
    }
  }
}

export const Field =
  (
    value?: string,
    keywords?: { nullable?: boolean; unique?: boolean; default?: boolean }
  ): any =>
  (target: Object, key: string | symbol, descriptor?: any) => {
    if (!descriptor) {
      // PropertyDecorator
      defineField('field', value, keywords)(target, key)
    } else {
      // MethodDecorator for field resolver
      defineField('field', value, { ...keywords, isResolver: true })(
        target,
        key
      )
    }
  }

export const Readonly = (value: boolean = true): PropertyDecorator =>
  defineField('readonly', value)

export const Optional = (value: boolean = true): PropertyDecorator =>
  defineField('optional', value)

export const Sortable = (value?: boolean): PropertyDecorator =>
  defineField('sortable', value)

export const Omit = (keywords?: {
  [key in ExtResourceRoutes]?: boolean
}): PropertyDecorator => defineField('omit', true, keywords)

export const EnumValue = (value: string): PropertyDecorator =>
  defineField('enumValue', value)

export interface RefKeywords {
  list?: boolean
  showField?: String
  from?: string | undefined
  to?: string | undefined
  // for ref filter
  take?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const Ref = (value: string, keywords?: RefKeywords): PropertyDecorator =>
  defineField('ref', value, keywords)

export const RefShowField = (value: string): PropertyDecorator =>
  defineField('refShowField', value)

export const SoftRef = (
  value: string,
  keywords?: RefKeywords
): PropertyDecorator => defineField('softRef', value, keywords)

export const Type = (value: string): PropertyDecorator =>
  defineField('type', value)

export const Form = (
  value?: string,
  keywords?: Record<string, any>
): PropertyDecorator => {
  return defineField('form', value, keywords)
}

export const Present = (
  value: string,
  keywords?: Record<string, any>
): PropertyDecorator => {
  return defineField('present', value, keywords)
}

export interface FieldFilterProps {
  preload?: boolean
  range?: boolean
  select?: boolean
  search?: boolean
  size?: number
}

export const Filter = (
  value: boolean = true,
  keywords: FieldFilterProps = {}
): PropertyDecorator => {
  return defineField('filter', value, keywords)
}

export interface JoiValidationKeywords {
  // Joi.number
  integer?: true
  multiple?: number
  negative?: true
  port?: true
  positive?: true
  precision?: number
  unsafe?: true

  // Joi.string
  alphanum?: true
  base64?: Joi.Base64Options | true
  creditCard?: true
  dataUri?: Joi.DataUriOptions | true
  domain?: Joi.DomainOptions | true
  email?: Joi.EmailOptions | true
  guid?: Joi.GuidOptions | true
  hex?: Joi.HexOptions | true
  hostname?: true
  insensitive?: true
  ip?: Joi.IpOptions | true
  isoDate?: true
  isoDuration?: true
  length?: number
  lowercase?: true
  normalize?: 'NFC' | 'NFD' | 'NFKC' | 'NFKD' | true
  pattern?: RegExp
  regex?: RegExp
  token?: true
  trim?: true
  truncate?: true
  uppercase?: true
  uri?: Joi.UriOptions | true
  uuid?: Joi.GuidOptions | true

  // Joi.date
  iso?: true
  timestamp?: 'javascript' | 'unix' | true

  // Shared by number, string and date
  greater?: 'now' | Date | number | string
  less?: 'now' | Date | number | string
  min?: 'now' | Date | number | string
  max?: 'now' | Date | number | string
}

export function Validation(keywords: JoiValidationKeywords): PropertyDecorator
export function Validation(
  value: 'string' | 'number' | 'date' | undefined | JoiValidationKeywords,
  keywords?: JoiValidationKeywords
): PropertyDecorator {
  if (value && typeof value !== 'string') {
    keywords = value
    value = undefined
  }
  keywords = keywords || {}
  return defineField('validation', value, keywords)
}

export function Upload(keywords: {
  bucket: string
  secure?: boolean
  image?: boolean
}) {
  return defineField('upload', undefined, keywords)
}

export function Column(keywords: { width?: number; ellipsis?: boolean }) {
  return defineField('column', undefined, keywords)
}

export function Transform(value: string) {
  return defineField('transform', value)
}
