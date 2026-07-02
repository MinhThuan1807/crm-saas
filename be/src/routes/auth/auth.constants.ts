import envConfig from 'src/common/config'

const isProduction = envConfig.NODE_ENV === 'production'

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
  domain: isProduction ? '.codelaicuocdoi.io.vn' : undefined
}