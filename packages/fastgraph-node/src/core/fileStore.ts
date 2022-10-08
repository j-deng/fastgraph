import { FileHandle } from 'fs/promises'
import { getRegistry } from './registry'
import { ResourceField } from './types'

export interface FileStoreAdapter {
  save(
    key: string,
    file: FileHandle,
    opts: { bucket: string; secure?: boolean }
  ): Promise<string>
  remove(bucket: string, key: string, secure: boolean): Promise<boolean>
  getUrl(bucket: string, key: string, secure: boolean): Promise<string>
}

export function buildUploadFieldResolver(field: ResourceField) {
  const { fileStore } = getRegistry()
  const { bucket, secure } = field?.decorators?.upload?.keywords as any
  return async (parent: any, args: any, context: any, info: any) => {
    const key = parent[field.field]
    if (!key) {
      return null
    }
    return {
      name: _removeTimestamp(key),
      url: await fileStore?.getUrl(bucket, key, secure)
    }
  }
}

export function createUploadFieldTransform(field: ResourceField) {
  const { fileStore } = getRegistry()
  // TODO add file size limit
  const { bucket, secure } = field?.decorators?.upload?.keywords as any
  return async (file: Promise<FileHandle>) => {
    const _file = (await file) as any
    if (!_file) {
      return ''
    }
    return await fileStore?.save(_addTimestamp(_file.filename.trim()), _file, {
      bucket,
      secure
    })
  }
}

// add timestamp to ensure file key is unique
function _addTimestamp(filename: string) {
  const items = filename.split('.')
  const suffix = '_' + +new Date()
  items.length === 1
    ? (items[0] += suffix)
    : (items[items.length - 2] += suffix)
  return items.join('.')
}

// remove timestamp to recover filename
function _removeTimestamp(filename: string) {
  const items = filename.split('.')
  items.length === 1
    ? (items[0] = items[0].replace(/_\d{13}/, ''))
    : (items[items.length - 2] = items[items.length - 2].replace(/_\d{13}/, ''))
  return items.join('.')
}
