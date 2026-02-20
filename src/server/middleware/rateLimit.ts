import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit'
import { WINDOWMS, RATELIMIT } from '../constants'

/**
 * Rate limiter général pour les routes sensibles
 */
export const requestLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: WINDOWMS,
  max: RATELIMIT,
  message: 'Trop de tentatives, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
})

/**
 * Rate limiter strict pour les routes d'authentification
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: WINDOWMS,
  max: RATELIMIT,
  message: 'Trop de tentatives de connexion, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
})

module.exports = { requestLimiter, authLimiter }
