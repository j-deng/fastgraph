export interface ResourceDecorator {
  value?: any
  keywords?: Record<string, any>
}

export interface ResourceField {
  name: string
  field: string
  decorators: {
    [key: string]: ResourceDecorator
  }
}

export enum ResourceRoute {
  index = 'index',
  detail = 'detail',
  create = 'create',
  update = 'update',
  delete = 'delete'
}

export enum ResourceRouteKind {
  read = 'read',
  write = 'write'
}

export type ResourceRoutes = ResourceRoute
export type ExtResourceRoutes = ResourceRoute | ResourceRouteKind

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

export interface RecordOperationItem {
  name: string
  callback: (record: any) => void
  danger?: boolean
  popconfirm?: string
}
