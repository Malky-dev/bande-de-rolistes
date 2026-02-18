const Tokens = require('csrf')

// Instance du générateur de tokens CSRF
const tokens = new Tokens()

/**
 * Middleware pour vérifier le token CSRF
 * Vérifie que le token dans le header x-csrf-token correspond au secret dans le cookie csrf-secret
 */
async function verifyCsrf(req, res, next) {
  try {
    const secret = req.cookies['csrf-secret']
    const token = req.headers['x-csrf-token'] || req.body?.csrfToken

    if (!secret) {
      console.log('❌ [CSRF] Secret manquant', {
        cookies: Object.keys(req.cookies || {}),
        path: req.path,
      })
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'Secret CSRF manquant. Veuillez récupérer un token CSRF d\'abord.' 
      })
    }

    if (!token) {
      console.log('❌ [CSRF] Token manquant', {
        headers: Object.keys(req.headers || {}),
        path: req.path,
      })
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'Token CSRF manquant dans le header x-csrf-token' 
      })
    }

    const isValid = tokens.verify(secret, token)
    if (!isValid) {
      console.log('❌ [CSRF] Token invalide', {
        secretLength: secret?.length,
        tokenLength: token?.length,
        secretPrefix: secret?.substring(0, 10),
        tokenPrefix: token?.substring(0, 10),
        path: req.path,
      })
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'Token CSRF invalide' 
      })
    }

    next()
  } catch (err) {
    console.error('Erreur vérification CSRF:', err)
    return res.status(500).json({ 
      code: 'ERROR', 
      message: err.message 
    })
  }
}

/**
 * Génère un token CSRF et le retourne
 * Crée ou réutilise le secret stocké dans le cookie httpOnly csrf-secret
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @returns {string} Le token CSRF à envoyer au client
 */
async function generateCsrfToken(req, res) {
  // Récupérer ou créer le secret CSRF
  let secret = req.cookies['csrf-secret']

  // Si pas de secret, en créer un nouveau
  if (!secret) {
    secret = tokens.secretSync()
    // Stocker le secret dans un cookie httpOnly
    res.cookie('csrf-secret', secret, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 jours
    })
  }

  // Générer le token à partir du secret
  const token = tokens.create(secret)

  return token
}

module.exports = { verifyCsrf, generateCsrfToken }
