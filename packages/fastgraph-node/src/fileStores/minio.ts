import { FileHandle } from 'fs/promises'
import { Client } from 'minio'
import { FILE_STORE_EXPIRE_TIME } from '../core/consts'
import { FileStoreAdapter } from '../core/fileStore'

export interface MinioStoreOptions {
  endPoint: string
  port: string
  useSSL: boolean
  accessKey: string
  secretKey: string
}

export class MinioStore implements FileStoreAdapter {
  client: Client
  private baseUrl: string

  constructor(opts?: MinioStoreOptions) {
    const env = process.env
    const config = opts || {
      endPoint: env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(env.MINIO_PORT || '9000'),
      useSSL: env.MINIO_USESSL === 'true',
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY
    }
    // @ts-ignore
    this.client = new Client(config)
    this.baseUrl = `${config.useSSL ? 'https' : 'http'}://${config.endPoint}${
      config.port ? ':' + config.port : ''
    }`
  }

  async save(
    key: string,
    file: FileHandle,
    opts: { bucket: string; secure?: boolean }
  ): Promise<string> {
    await this.client.putObject(
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
      return this.getInsecureUrl(bucket, key)
    }
    return await this.client.presignedUrl(
      'GET',
      bucket,
      key,
      FILE_STORE_EXPIRE_TIME
    )
  }

  getInsecureUrl(bucket: string, key: string) {
    return `${this.baseUrl}/${bucket}/${key}`
  }
}
