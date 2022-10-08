import { FileHandle } from 'fs/promises'
import OSS from 'ali-oss'
import { FILE_STORE_EXPIRE_TIME } from '../core/consts'
import { FileStoreAdapter } from '../core/fileStore'

export interface AliossStoreOptions {
  region: string
  accessKeyId: string
  accessKeySecret: string
  endpoint?: string
  baseUrl: string
}

export class AliossStore implements FileStoreAdapter {
  opts: AliossStoreOptions
  bucketPrefix: string
  clients: Record<string, OSS> = {}

  /**
   * AliossStore constructor
   * @param opts AliossStoreOptions
   * @param bucketPrefix the prefix of buckets,
   *  useful when deployed to multi environments or with multi instances
   */
  constructor(opts?: AliossStoreOptions, bucketPrefix = '') {
    const env = process.env
    // @ts-ignore
    this.opts = opts || {
      region: env.ALIOSS_REGION,
      accessKeyId: env.ALIOSS_ACCESS_KEY_ID,
      accessKeySecret: env.ALIOSS_ACCESS_KEY_SECRET,
      endpoint: env.ALIOSS_ENDPOINT,
      baseUrl: env.ALIOSS_BASE_URL
    }
    this.bucketPrefix = bucketPrefix || env.BUCKET_PREFIX || ''
  }

  async save(
    key: string,
    file: FileHandle,
    opts: { bucket: string; secure?: boolean }
  ): Promise<string> {
    const {
      res: { status }
    } = await this.getClient(opts.bucket).put(key, file.createReadStream())
    if (status !== 200) {
      throw new Error('Upload to alioss failed')
    }
    return key
  }

  async remove(bucket: string, key: string, secure: boolean): Promise<boolean> {
    return false
  }

  async getUrl(bucket: string, key: string, secure: boolean): Promise<string> {
    if (!secure) {
      return this.getClient(bucket).generateObjectUrl(key, this.opts.baseUrl)
    }
    return this.getClient(bucket).signatureUrl(key, {
      expires: FILE_STORE_EXPIRE_TIME
    })
  }

  getClient(bucket: string) {
    if (!this.clients[bucket]) {
      const config = {
        ...this.opts,
        baseUrl: undefined,
        bucket: this.bucketPrefix + bucket
      }
      this.clients[bucket] = new OSS(config)
    }
    return this.clients[bucket]
  }
}
