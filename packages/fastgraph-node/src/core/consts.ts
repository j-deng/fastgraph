const env = process.env

export const DEFAULT_PAGE_SIZE = parseInt(env.DEFAULT_PAGE_SIZE || '10')

export const FILE_STORE_EXPIRE_TIME = parseInt(
  env.FILE_STORE_EXPIRE_TIME || `${24 * 60 * 60}`
)
