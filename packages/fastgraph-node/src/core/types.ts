import { ResourceRoute, ResourceRoutes } from './route'

export interface ResourceDecorator {
  value?: any
  keywords?: Record<string, any>
}

export interface ResourceDecoratorMap {
  [key: string]: ResourceDecorator
}

export interface ResourceField {
  name: string
  field: string
  decorators: {
    [key: string]: ResourceDecorator
  }
}

export interface ResourceItem {
  key: string
  name: string
  constructor: Function
  decorators: {
    [key: string]: ResourceDecorator
  }
  fields: ResourceField[]
  routes?: { [key in ResourceRoutes]: string }
}

export interface ResourceStore {
  [key: string]: ResourceItem
}

export interface ResourceEnums {
  [key: string]: {
    [key: string]: string | undefined
  }
}

export type IDTypes = 'Int' | 'BigInt' | 'String'

export type TransformFn<T = any> = (args: T) => Promise<T>

export type MiddlewareFn<T = any> = (
  _: {
    parent: any
    args: any
    context: any
    info: any
  },
  next: (parent: any, args: any, context: any, info: any) => Promise<any>
) => Promise<T>

export type ResolverMetaGetter = (metaName: string, defaultValue?: any) => any

export interface ResolverContext {
  store: ResourceStore
  metaGetter?: ResolverMetaGetter
  resource?: ResourceItem
  route?: ResourceRoute
}

export type MiddlewareCreator = (context: ResolverContext) => MiddlewareFn

export interface UserContext {
  id: string | number
  username: string
  isStaff: boolean
  isActive: boolean
  isSuperuser: boolean
  permissions: string[]
  [key: string]: any
}
