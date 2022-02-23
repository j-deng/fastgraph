import { DMMF } from '@prisma/client/runtime'
import { getRegistry } from './registry'
import { Interpreter, Parser } from './interpreter'
import { parsePrismaType } from './fieldTypes'
import { camelize } from './utils'
import { getResourceRoutes } from './resolver'
import { ResourceDecoratorMap, ResourceEnums, ResourceStore } from './types'

export function buildStore(): ResourceStore {
  return {
    ...buildStoreFromPrisma(),
    ...buildStoreFromRegistry()
  }
}

export function buildStoreFromRegistry(): ResourceStore {
  const store: ResourceStore = {}
  const resources = getRegistry().resources
  for (const key in resources) {
    const { name, constructor, fields } = resources[key]
    store[key] = {
      key,
      name,
      constructor,
      routes: getResourceRoutes(constructor),
      decorators: _makeResourceDecorators(constructor),
      fields: fields.map(({ field, name }) => ({
        name,
        field,
        decorators: _makeFieldDecorators(constructor, field)
      }))
    }
  }
  return store
}

export function buildStoreFromPrisma(): ResourceStore {
  const store: ResourceStore = {}
  const prisma = getRegistry().prisma
  if (!prisma) {
    return store
  }

  // @ts-ignore
  const models = (prisma._dmmf.datamodel as DMMF.Datamodel).models
  models.forEach((model) => {
    const { name, documentation, fields } = model
    const relationFromFields: string[] = []
    store[name] = {
      name,
      key: name,
      // Automatic set `model` decorator to resource
      decorators: {
        ...interpret(documentation),
        model: { value: name }
      },
      fields: fields
        .map((field) => ({
          name: field.name,
          field: field.name,
          // Automatic set `type` or `ref` decorator to field
          decorators: {
            ...buildDecoratorFromPrismaField(field),
            ...interpret(field.documentation)
          }
        }))
        .map((field) => {
          const from = field.decorators.ref?.keywords?.from
          if (from) relationFromFields.push(from)
          return field
        })
        .filter((field) => {
          if (
            field.decorators.omit &&
            Object.keys(field.decorators.omit.keywords || {}).length === 0
          ) {
            // Remove omit read/write field
            return false
          }
          // Remove field that is omit or relationFromField
          return !relationFromFields.includes(field.field)
        })
    }
  })
  return store
}

function buildDecoratorFromPrismaField(field: DMMF.Field) {
  const result: ResourceDecoratorMap = {
    ...parsePrismaType(field)
  }
  if (field.type === 'DateTime') {
    if (field.isUpdatedAt) {
      result['datetime'] = {
        keywords: {
          isUpdatedAt: field.isUpdatedAt
        }
      }
    } else if (field.hasDefaultValue) {
      result['datetime'] = {
        keywords: {
          isCreatedAt: field.hasDefaultValue
        }
      }
    }
  }
  if (!field.isRequired || field.hasDefaultValue || field.name === 'id') {
    result['optional'] = {
      value: true
    }
  }
  if (field.isUnique) {
    result['unique'] = {
      value: true
    }
  }
  if (field.kind === 'enum') {
    result['enum'] = {
      value: field.type
    }
  }
  if (field.name === 'id' && !field.hasDefaultValue && !field.isGenerated) {
    result['customId'] = {
      value: true
    }
  }
  return result
}

function _makeResourceDecorators(constructor: Function) {
  const result: ResourceDecoratorMap = {}
  for (const key of Reflect.getMetadataKeys(constructor)) {
    result[key] = Reflect.getMetadata(key, constructor)
  }
  return result
}

function _makeFieldDecorators(constructor: Function, field: string) {
  // @ts-ignore
  const instance = new constructor()
  const result: ResourceDecoratorMap = {}

  for (const key of Reflect.getMetadataKeys(instance, field)) {
    if (key === 'design:type') {
      // Get type and default value from class props
      result['__type'] = {
        value: (Reflect.getMetadata(key, instance, field) as Function).name
      }
      if (instance[field] !== undefined) {
        result['__default'] = instance[field]
      }
    } else {
      result[key] = Reflect.getMetadata(key, instance, field)
    }
  }
  return result
}

export function parsePrismaEnums(): ResourceEnums {
  const prisma = getRegistry().prisma
  if (!prisma) {
    return {}
  }

  // @ts-ignore
  const enums = (prisma._dmmf.datamodel as DMMF.Datamodel).enums
  return Object.fromEntries(
    enums.map((item) => [
      item.name,
      {
        ...Object.fromEntries(item.values.map((val) => [val.name])),
        ...interpret(item.documentation).enum.keywords
      }
    ])
  )
}

function interpret(doc: string | undefined): ResourceDecoratorMap {
  if (!doc) return {}
  const decorators = new Interpreter(
    new Parser(doc.split('\\n').join('\n')).parse()
  ).interpret()
  return decorators.reduce((acc, cur) => {
    acc[camelize(cur.decorator)] = cur.params
    return acc
  }, {} as ResourceDecoratorMap)
}
