import { FileHandle } from 'fs/promises'
import { Client } from 'minio'
import { FILE_STORE_EXPIRE_TIME } from '../core/consts'
import { FileStoreAdapter } from '../core/fileStore'

const env = process.env

const config = {
  endPoint: env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(env.MINIO_PORT || '9000'),
  useSSL: env.MINIO_USESSL === 'true',
  accessKey: env.MINIO_ACCESS_KEY || '',
  secretKey: env.MINIO_SECRET_KEY || ''
}

let _minioClient: Client

function getClient() {
  return _minioClient || (_minioClient = new Client(config))
}

const _baseUrl = `${config.useSSL ? 'https' : 'http'}://${config.endPoint}${
  config.port ? ':' + config.port : ''
}`

function getInsecureUrl(bucket: string, key: string) {
  return `${_baseUrl}/${bucket}/${key}`
}

export class MinioStore implements FileStoreAdapter {
  async save(
    key: string,
    file: FileHandle,
    opts: { bucket: string; secure?: boolean }
  ): Promise<string> {
    await getClient().putObject(
      opts.bucket,
      key,
      (file as any).createReadStream()
    )
    return key
  }

  async remove(bucket: string, key: string, secure: boolean): Promise<boolean> {
    return false
  }

  async getUrl(bucket: string, key: string, secure: boolean): Promise<string> {
    if (!secure) {
      return getInsecureUrl(bucket, key)
    }
    return await getClient().presignedUrl(
      'GET',
      bucket,
      key,
      FILE_STORE_EXPIRE_TIME
    )
  }
}
