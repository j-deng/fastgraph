import dayjs from 'dayjs'
import { GraphQLScalarType, Kind } from 'graphql'

export const dateScalar = new GraphQLScalarType({
  name: 'Date',
  description: 'Date custom scalar type',
  serialize(value: any) {
    return dayjs(value).format('YYYY-MM-DD') // Convert outgoing Date to string for JSON
  },
  parseValue(value: any) {
    return dayjs(value).toDate() // Convert incoming string to Date
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return dayjs(ast.value).toDate() // Convert hard-coded AST string to Date
    }
    return null // Invalid hard-coded value (not an string)
  }
})

export const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value: any) {
    return dayjs(value).format('YYYY-MM-DD HH:mm:ss')
  },
  parseValue(value: any) {
    return dayjs(value).toDate()
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return dayjs(ast.value).toDate()
    }
    return null
  }
})

export const bigIntScalar = new GraphQLScalarType({
  name: 'BigInt',
  description: 'BigInt custom scalar type',
  serialize(value: any) {
    return value.toString()
  },
  parseValue(value: any) {
    return BigInt(value)
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return BigInt(ast.value)
    }
    return null
  }
})

export const scalarResolvers = {
  Date: dateScalar,
  DateTime: dateTimeScalar,
  BigInt: bigIntScalar
}

export function buildScalarTypes() {
  return `\
scalar Date
scalar DateTime
scalar BigInt\
`
}
