import 'reflect-metadata'
import { getRegistry } from '../core/registry'

export const Resolver = (): ClassDecorator => (target) => {
  getRegistry().registerResolver(target)
}

export const Route =
  (route: string): MethodDecorator =>
  (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('route', route, target, propertyKey)
  }

export const ApplyMiddleware =
  (middleware: string): MethodDecorator =>
  (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('middleware', middleware, target, propertyKey)
  }

export const ApplyPermission =
  (permission: string): MethodDecorator =>
  (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('permission', permission, target, propertyKey)
  }

export const ApplyLoginRequired =
  (isRequired: boolean = true): MethodDecorator =>
  (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('loginRequired', isRequired, target, propertyKey)
  }

export const ApplyStaffRequired =
  (isRequired: boolean = true): MethodDecorator =>
  (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('staffRequired', isRequired, target, propertyKey)
  }

export const ApplyValidation =
  (validation: string): MethodDecorator =>
  (target, propertyKey, descriptor) => {
    Reflect.defineMetadata('validation', validation, target, propertyKey)
  }

export interface ResolverTypeDef {
  type: string
  args?: { [key: string]: string }
}

const _buildResolverType = (typeDef: string | ResolverTypeDef) => {
  if (typeof typeDef == 'string') {
    return typeDef
  }
  const argsDef = `${Object.entries(typeDef.args || {})
    .map(([field, t]) => `${field}: ${t}`)
    .join(',')}`
  return `${argsDef ? '(' + argsDef + ')' : ''}: ${typeDef.type}`
}

/**
 * Define a query resolver.
 *
 * Examples:
 *  * @Query(`(id: Int!): User`)
 *  * @Query({ type: 'User', args: { id: 'Int!' } })
 *
 * @param typeDef string | ResolverTypeDef
 * @returns
 */
export const Query =
  (typeDef: string | ResolverTypeDef): MethodDecorator =>
  (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      'query',
      _buildResolverType(typeDef),
      target,
      propertyKey
    )
  }

/**
 * Define a mutation resolver.
 *
 * @param typeDef string | ResolverTypeDef
 * @returns
 */
export const Mutation =
  (typeDef: string | ResolverTypeDef): MethodDecorator =>
  (target, propertyKey, descriptor) => {
    Reflect.defineMetadata(
      'mutation',
      _buildResolverType(typeDef),
      target,
      propertyKey
    )
  }
