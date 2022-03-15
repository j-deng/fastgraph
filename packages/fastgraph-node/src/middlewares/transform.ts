import {
  MiddlewareCreator,
  ResourceField,
  ResourceItem,
  TransformFn
} from '../core/types'
import { getRegistry } from '../core/registry'
import { ResourceRoute } from '../core/route'
import { fieldUpload } from '../core/field'
import { createUploadFieldTransform } from '../core/fileStore'

export const TransformMiddleware: MiddlewareCreator = ({
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
    resourceKey = metaGetter && metaGetter('transform')
  }
  if (resourceKey) {
    makeResourceTransform(store[resourceKey])
    return async ({ parent, args, context, info }, next) => {
      return await next(
        parent,
        await doTransform(resourceKey, args),
        context,
        info
      )
    }
  }
  return async ({ parent, args, context, info }, next) => {
    return await next(parent, args, context, info)
  }
}

const _resourceTransformCacheMap: {
  [key: string]: { [field: string]: TransformFn }
} = {}

function makeResourceTransform(resource: ResourceItem) {
  if (!_resourceTransformCacheMap[resource.key]) {
    _resourceTransformCacheMap[resource.key] = Object.fromEntries(
      resource.fields
        .map((field) => [field.field, getFieldTransformer(field)])
        .filter(([_, transformer]) => transformer !== undefined)
    )
  }
  return _resourceTransformCacheMap[resource.key]
}

async function doTransform(resourceKey: string, args: Record<string, any>) {
  const transformers = _resourceTransformCacheMap[resourceKey]
  if (!transformers || Object.keys(transformers).length === 0) {
    return args
  }
  return await Object.entries(transformers).reduce(async (acc, [field, fn]) => {
    // no transform if field is not in args
    if (!(field in args)) {
      return await acc
    }
    return { ...(await acc), [field]: await fn(args[field]) }
  }, Promise.resolve(args))
}

function getFieldTransformer(field: ResourceField) {
  const transformName = field.decorators.transform?.value
  if (transformName) {
    return getRegistry().transforms[transformName]
  }

  // upload file will add fileStore save transform by default
  if (fieldUpload(field)) {
    return createUploadFieldTransform(field)
  }
}
