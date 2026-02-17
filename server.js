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
app.use(helmet())
app.use(compression())

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
app.post('/api/signin', signinController)

// Connexion
app.post('/api/login', loginController)

// Récupération de session
app.get('/api/session', sessionController)

// Discord OAuth
app.get('/api/discord/init', discordController.init)
app.get('/api/discord/callback', discordController.callback)

// Routes admin (protégées par requireAdmin)
app.get('/api/admin/users', requireAdmin, adminUsersController)
app.get('/api/admin/roles', requireAdmin, adminRolesController)
app.put('/api/admin/users/:userID/role', requireAdmin, adminUpdateRoleController)

// Déconnexion
app.post('/api/logout', (req, res) => {
  res.clearCookie('bande_de_rolistes', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  res.json({ success: true })
})


initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API Bande de Rôlistes lancée sur http://localhost:${PORT}`)
  })
})

