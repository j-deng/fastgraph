import {
  PermissionCheckMiddleware,
  ValidationMiddleware,
  TransformMiddleware
} from '../middlewares'
import { MiddlewareCreator, ResourceEnums, TransformFn } from './types'

type FieldType = { field: string; name: string }

type ResourceType = {
  constructor: Function
  name: string
  fields: FieldType[]
}

interface RegistryCreateOptions {
  prisma: any
  middlewares?: MiddlewareCreator[]
  globalMiddlewares?: MiddlewareCreator[]
  transfroms?: TransformFn[]
  enums?: ResourceEnums
}

export class MetaRegistry {
  prisma: any
  resources: { [key: string]: ResourceType } = {}
  fields: { [resourceKey: string]: FieldType[] } = {}
  resolvers: Function[] = []
  enums: ResourceEnums = {}
  middlewares: { [key: string]: MiddlewareCreator } = {}
  globalMiddlewares: string[] = []
  transforms: { [key: string]: TransformFn } = {}

  constructor(opts?: RegistryCreateOptions) {
    if (opts?.prisma) {
      this.registerPrismaClient(opts.prisma)
    }
    if (opts?.middlewares) {
      opts.middlewares.map(this.registerMiddleware.bind(this))
    }
    if (opts?.transfroms) {
      opts.transfroms.map(this.registerTransform.bind(this))
    }
    if (opts?.enums) {
      this.registerEnums(opts.enums)
    }
    const globalMiddlewares = opts?.globalMiddlewares || [
      PermissionCheckMiddleware,
      ValidationMiddleware,
      TransformMiddleware
    ]
    this.setGlobalMiddlewares(globalMiddlewares)
  }

  registerPrismaClient(prisma: any) {
    this.prisma = prisma
  }

  registerResource(constructor: Function, name?: string) {
    const key = constructor.name
    if (key in this.resources) {
      throw new Error(`Resource name [${key}] has been defined.`)
    }
    // field's prop decorator run before class decorator
    const fields = this.fields[key]
    if (!fields) {
      throw new Error(`Resource [${key}] has not fields.`)
    }
    this.resources[key] = {
      name: name || key,
      constructor,
      fields
    }
  }

  registerField(resource: string, field: string, name: string) {
    if (!this.fields[resource]) {
      this.fields[resource] = []
    }
    this.fields[resource].push({ field, name })
  }

  registerResolver(target: Function) {
    this.resolvers.push(target)
  }

  registerEnums(enums: ResourceEnums) {
    Object.assign(this.enums, enums)
  }

  registerMiddleware(fn: MiddlewareCreator) {
    this.middlewares[fn.name] = fn
  }

  setGlobalMiddlewares(list: MiddlewareCreator[]) {
    this.globalMiddlewares = []
    list.map(this.registerGlobalMiddleware.bind(this))
  }

  registerGlobalMiddleware(fn: MiddlewareCreator) {
    this.middlewares[fn.name] = fn
    if (!this.globalMiddlewares.includes(fn.name)) {
      this.globalMiddlewares.push(fn.name)
    }
  }

  registerTransform(fn: TransformFn) {
    this.transforms[fn.name] = fn
  }
}

let _registry: MetaRegistry

export function makeRegistry(opts?: RegistryCreateOptions) {
  _registry = new MetaRegistry(opts)
  return _registry
}

export function getRegistry(): MetaRegistry {
  if (!_registry) {
    throw new Error(
      'Please call `makeRegistry(opts)` before resource definition and buildSchema'
    )
  }
  return _registry
}
