import type { RequestHandler } from 'express'
import Tokens from 'csrf'
import type { ApiError } from '../../types/api/errors'
import { getCookieValue } from '../utils/cookies'

// ---------------------------
// Instance CSRF (pillarjs/csrf)
// ---------------------------
const tokens = new Tokens()

type CookieSameSite = 'lax' | 'strict' | 'none'

type CookieOptions = {
  httpOnly?: boolean
  sameSite?: CookieSameSite
  secure?: boolean
  maxAge?: number
}

type CookieSetter = (name: string, value: string, options: CookieOptions) => void

type ReqWithCookieHeader = {
  headers: {
    cookie?: string
  }
}

type ResWithCookieSetter = {
  cookie: CookieSetter
}

// ---------------------------
// Middleware de vérification CSRF
// ---------------------------
export const verifyCsrf: RequestHandler<
  Record<string, never>,
  ApiError,
  { csrfToken?: string }
> = (req, res, next) => {
  try {
    const secret = getCookieValue(req.headers.cookie, 'csrf-secret')

    const headerToken = req.headers['x-csrf-token']
    const tokenFromHeader = Array.isArray(headerToken) ? headerToken[0] : headerToken
    const tokenFromBody = typeof req.body.csrfToken === 'string' ? req.body.csrfToken : undefined
    const token = tokenFromHeader || tokenFromBody

    if (!secret) {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: "Secret CSRF manquant. Veuillez récupérer un token CSRF d'abord.",
      })
      return
    }

    if (!token || typeof token !== 'string') {
      res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Token CSRF manquant (header x-csrf-token ou body csrfToken).',
      })
      return
    }

    if (!tokens.verify(secret, token)) {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Token CSRF invalide' })
      return
    }

    next()
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    res.status(500).json({ code: 'ERROR', message })
  }
}

// ---------------------------
// Génération d'un token CSRF
// ---------------------------
export function generateCsrfToken(req: ReqWithCookieHeader, res: ResWithCookieSetter): string {
  let secret = getCookieValue(req.headers.cookie, 'csrf-secret')

  // Si pas de secret, en créer un et le stocker en cookie httpOnly
  if (!secret) {
    secret = tokens.secretSync()

    res.cookie('csrf-secret', secret, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    })
  }

  // Générer le token à partir du secret
  return tokens.create(secret)
}