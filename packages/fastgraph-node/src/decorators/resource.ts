import 'reflect-metadata'
import { getRegistry } from '../core/registry'
import { ExtResourceRoutes } from '../core/route'

export function defineResource(
  name: string,
  value?: any,
  keywords?: Record<string, any>
): ClassDecorator {
  return (target) => {
    if (name === 'resource') {
      getRegistry().registerResource(target, value)
    }
    Reflect.defineMetadata(name, { value, keywords }, target)
  }
}

export const Resource = (value?: string): ClassDecorator =>
  defineResource('resource', value)

export const Model = (value: string): ClassDecorator =>
  defineResource('model', value)

export const Chart = (
  value: string,
  keywords?: { dimensions?: string[]; options?: any }
): ClassDecorator => defineResource('chart', value, keywords)

export const Matrix = (keywords: {
  row: string
  col: string
  val: string
}): ClassDecorator => defineResource('matrix', undefined, keywords)

export const Permission = (
  value: string | boolean | undefined,
  keywords?: { [key in ExtResourceRoutes]?: string }
): ClassDecorator => defineResource('permission', value, keywords)

export const Middleware = (
  value: string | undefined,
  keywords?: { [key in ExtResourceRoutes]?: string }
): ClassDecorator => defineResource('middleware', value, keywords)

export const LoginRequired = (
  value: boolean = true,
  keywords?: { [key in ExtResourceRoutes]?: boolean }
): ClassDecorator => defineResource('loginRequired', value, keywords)

export const StaffRequired = (
  value: boolean = true,
  keywords?: { [key in ExtResourceRoutes]?: boolean }
): ClassDecorator => defineResource('staffRequired', value, keywords)
