import type { RequestHandler } from 'express-serve-static-core'

declare module 'cookie-parser' {
  export interface CookieParseOptions {
    decode?(val: string): string
  }

  export interface Cookies {
    [key: string]: string
  }

  export interface SignedCookies {
    [key: string]: string
  }

  export default function cookieParser(
    secret?: string | string[],
    options?: CookieParseOptions
  ): RequestHandler
}

declare module 'express-serve-static-core' {
  interface Request {
    cookies?: import('cookie-parser').Cookies
    signedCookies?: import('cookie-parser').SignedCookies
  }
}

export {}