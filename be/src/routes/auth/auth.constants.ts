import envConfig from 'src/common/config'

const isProduction = envConfig.NODE_ENV === 'production'

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  path: '/',
}
