import DataLoader from 'dataloader'
import { getRegistry } from './registry'

const _prismaLoaderOptions = { cache: false, maxBatchSize: 100 }
const _prismaLoaders: { [model: string]: DataLoader<number, any> } = {}
const _prismaRefFieldLoaders: {
  [model: string]: {
    [field: string]: DataLoader<number, any>
  }
} = {}

export function createLoader(model: string): DataLoader<number, any> {
  if (!_prismaLoaders[model]) {
    _prismaLoaders[model] = new DataLoader<number, any>(
      (ids: any) =>
        getRegistry()
          .prisma[model].findMany({
            where: { id: { in: ids } }
          })
          .then((results: any[]) =>
            ids.map((id: any) => results.find((item: any) => item.id === id))
          ),
      _prismaLoaderOptions
    )
  }
  return _prismaLoaders[model]
}

export function createRefFieldLoader(
  model: string,
  field: string
): DataLoader<number, any> {
  if (!_prismaRefFieldLoaders[model] || !_prismaRefFieldLoaders[model][field]) {
    _prismaRefFieldLoaders[model] = _prismaRefFieldLoaders[model] || {}
    _prismaRefFieldLoaders[model][field] = new DataLoader<number, any>(
      (ids: any) =>
        getRegistry()
          .prisma[model].findMany({
            where: { id: { in: ids } },
            select: { id: true, [field]: true }
          })
          .then((results: any[]) =>
            ids.map((id: any) => {
              const val = results.find((item: any) => item.id === id)
              return val && val[field]
            })
          ),
      _prismaLoaderOptions
    )
  }
  return _prismaRefFieldLoaders[model][field]
}
