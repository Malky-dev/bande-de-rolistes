// server.js - API backend pour Bande de Rôlistes

// Charger les variables d'environnement en premier
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const compression = require('compression')
const rateLimit = require('express-rate-limit');
const { doubleCsrf } = require('csrf-csrf')

const { sequelize } = require('./models')
const signinController = require('./controllers/signin')
const loginController = require('./controllers/login')
const sessionController = require('./controllers/session')
const discordController = require('./controllers/discord')
const requireAdmin = require('./middleware/authAdmin')
const adminUsersController = require('./controllers/admin/users')
const adminUpdateRoleController = require('./controllers/admin/updateRole')
const adminRolesController = require('./controllers/admin/roles')

const PORT = process.env.PORT || 3000
const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(compression())

// Limiter le nombre de tentatives de connexion
const requestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  message: 'Trop de tentatives de connexion, réessayez plus tard.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
});

// Protection CSRF
if (!process.env.CSRF_SECRET) {
  throw new Error('CSRF_SECRET is not defined in environment variables')
}

const {
  generateToken,
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: 'csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
})

// Vérifier / synchroniser la base au démarrage
async function initDatabase() {
  try {
    await sequelize.authenticate()
    console.log('✅ Connexion Sequelize OK à bande_de_rolistes')

    await sequelize.sync()
    console.log('✅ Modèles synchronisés')
  } catch (error) {
    console.error('❌ Erreur d\'initialisation de la base :', error)
  }
}

// Routes d'API

// Inscription
app.post('/api/signin', requestLimiter, doubleCsrfProtection, signinController)

// Connexion
app.post('/api/login', requestLimiter, doubleCsrfProtection, loginController)

// Récupération de session
app.get('/api/session', requestLimiter, sessionController)

// Discord OAuth
app.get('/api/discord/init', requestLimiter, discordController.init)
app.get('/api/discord/callback', requestLimiter, discordController.callback)

// Routes admin (protégées par requireAdmin)
app.get('/api/admin/users', requestLimiter, requireAdmin, adminUsersController)
app.get('/api/admin/roles', requestLimiter, requireAdmin, adminRolesController)
app.put('/api/admin/users/:userID/role', requestLimiter, doubleCsrfProtection, requireAdmin, adminUpdateRoleController)

// Déconnexion
app.post('/api/logout', requestLimiter, doubleCsrfProtection, (req, res) => {
  res.clearCookie('bande_de_rolistes', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  res.json({ success: true })
})

// Récupération du token CSRF
app.get('/api/csrf-token', (req, res) => {
  const token = generateToken(req, res)
  res.json({ csrfToken: token })
})


initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API Bande de Rôlistes lancée sur http://localhost:${PORT}`)
  })
})

