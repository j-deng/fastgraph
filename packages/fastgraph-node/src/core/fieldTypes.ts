import { DMMF } from '@prisma/client/runtime'
import { getRegistry } from '..'
import { ResourceField, ResourceDecoratorMap, IDTypes } from './types'

// JS types to gql scalar types
export const jsToGraphqlTypeMap: { [key: string]: string } = {
  String: 'String',
  Number: 'Float',
  BigInt: 'BigInt',
  Boolean: 'Boolean',
  Date: 'DateTime'
}

// Prisma types to gql scalar types
export const prismaToGraphqlTypeMap: { [key: string]: string } = {
  String: 'String',
  Int: 'Int',
  BigInt: 'BigInt',
  Decimal: 'String',
  Boolean: 'Boolean',
  DateTime: 'DateTime',
  // @todo
  Json: 'String'
}

/**
 * Get field's type of resource.
 *
 * 1. Get enum type defined by `@enumValue` or resource type defined by `@ref`
 * 2. Get prop design:type by default
 *
 * @param field
 * @param resourceKey
 * @returns
 */
export function fieldType(
  field: ResourceField,
  resourceKey: string,
  useSoftRef: boolean = true
): string {
  if (field.field === 'id') {
    return 'ID'
  }
  const { ref, type, softRef } = field.decorators
  if (ref) {
    return ref.keywords?.list ? `[${ref.value}]` : ref.value
  }
  if (softRef && useSoftRef) {
    return softRef.value
  }
  if (type) {
    return type.keywords?.list ? `[${type.value}]` : type.value
  }

  const __type = field.decorators.__type.value
  const gqlType: string = jsToGraphqlTypeMap[__type]

  if (!gqlType) {
    if (type === 'Array') {
      throw new Error(
        `Field ${resourceKey}.${field} -- Array type should use with @ref decorator`
      )
    }
    throw new Error(`Field ${resourceKey}.${field} -- Unexpected type ${type}`)
  }

  return gqlType
}

export function parsePrismaType(field: DMMF.Field): ResourceDecoratorMap {
  if (field.kind === 'object' && field.relationName) {
    // multi-field-relations is not support
    // https://www.prisma.io/docs/concepts/components/prisma-schema/relations/one-to-one-relations#multi-field-relations-in-relational-databases
    const from =
      field.relationFromFields?.length === 1
        ? field.relationFromFields[0]
        : undefined
    const to =
      field.relationToFields?.length === 1
        ? field.relationToFields[0]
        : undefined
    return {
      ref: {
        value: field.type,
        keywords: {
          from,
          to,
          list: field.isList
        }
      }
    }
  }
  const fieldType = _prismaToGraphqlType(field.type)
  if (fieldType) {
    return {
      type: {
        value: fieldType
      }
    }
  }
  throw new Error(`Unknown type of ${field.type}`)
}

function _prismaToGraphqlType(fieldType: any) {
  if (fieldType && typeof fieldType === 'string') {
    return prismaToGraphqlTypeMap[fieldType] || fieldType
  }
}

export function prismaModelIdType(modelName: string) {
  const refModel = (
    getRegistry().prisma._dmmf.datamodel as DMMF.Datamodel
  ).models.find((model) => model.name === modelName)
  const idType = refModel?.fields.find((field) => field.name === 'id')?.type
  if (
    typeof idType !== 'string' ||
    !['String', 'Int', 'BigInt'].includes(idType)
  ) {
    throw new Error(
      `${modelName} id type is not one of 'String', 'Int' and 'BigInt'`
    )
  }
  return idType as IDTypes
}
