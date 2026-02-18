const rateLimit = require('express-rate-limit')
const { WINDOWMS, RATELIMIT } = require('../constants')

/**
 * Rate limiter général pour les routes sensibles
 */
const requestLimiter = rateLimit({
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
const authLimiter = rateLimit({
  windowMs: WINDOWMS,
  max: RATELIMIT,
  message: 'Trop de tentatives de connexion, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
})

module.exports = { requestLimiter, authLimiter }
