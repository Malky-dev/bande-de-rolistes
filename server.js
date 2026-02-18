// server.js - API backend pour Bande de Rôlistes

// Charger les variables d'environnement en premier
require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const compression = require('compression')

const { sequelize } = require('./models')
const signinController = require('./controllers/signin')
const loginController = require('./controllers/login')
const sessionController = require('./controllers/session')
const discordController = require('./controllers/discord')
const requireAdmin = require('./middleware/authAdmin')
const { verifyCsrf, generateCsrfToken } = require('./middleware/csrf')
const { requestLimiter, authLimiter } = require('./middleware/rateLimit')
const adminUsersController = require('./controllers/admin/users')
const adminUpdateRoleController = require('./controllers/admin/updateRole')
const adminRolesController = require('./controllers/admin/roles')

const PORT = process.env.PORT || 3000
const app = express()

// -------------------
// Middlewares globaux
// -------------------

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
app.use(compression())


// -------------------
// Routes CSRF
// -------------------

// Route pour récupérer un token CSRF
app.get('/api/csrf-token', async (req, res) => {
  try {
    // Empêcher le cache du navigateur pour garantir un token frais à chaque requête
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
    })
    
    const token = await generateCsrfToken(req, res)
    
    // Validation : s'assurer que le token est bien une chaîne
    if (typeof token !== 'string' || !token) {
      throw new Error('Le token CSRF généré n\'est pas valide')
    }
    
    res.json({ csrfToken: token })
  } catch (error) {
    console.error('Erreur génération token CSRF:', error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
})

// -------------------
// Routes Auth
// -------------------

app.post('/api/signin', authLimiter, verifyCsrf, signinController)
app.post('/api/login', authLimiter, verifyCsrf, loginController)
app.post('/api/logout', requestLimiter, verifyCsrf, (req, res) => {
  res.clearCookie('bande_de_rolistes')
  res.clearCookie('csrf-secret')
  res.json({ success: true })
})

// -------------------
// Session
// -------------------

app.get('/api/session', requestLimiter, sessionController)

// -------------------
// Discord OAuth
// -------------------

app.get('/api/discord/init', requestLimiter, discordController.init)
app.get('/api/discord/callback', requestLimiter, discordController.callback)

// -------------------
// Routes Admin
// -------------------

app.get('/api/admin/users', requestLimiter, requireAdmin, adminUsersController)
app.get('/api/admin/roles', requestLimiter, requireAdmin, adminRolesController)
app.put(
  '/api/admin/users/:userID/role',
  requestLimiter,
  verifyCsrf,
  requireAdmin,
  adminUpdateRoleController
)

// -------------------
// Base de données & lancement serveur
// -------------------

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

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API Bande de Rôlistes lancée sur http://localhost:${PORT}`)
  })
})