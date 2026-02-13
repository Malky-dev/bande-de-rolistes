const DiscordOAuth2 = require('discord-oauth2')
const DeviceDetector = require('device-detector-js')

const { hashPassword, encryptSHA256, formatDate } = require('../global')
const { User, Session } = require('../models')

// Configuration Discord OAuth2 depuis les variables d'environnement
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI
const FRONTEND_URL = process.env.FRONTEND_URL

// Validation des variables d'environnement requises
if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI || !FRONTEND_URL) {
  console.error('❌ Variables d\'environnement Discord manquantes !')
  console.error('Veuillez configurer les variables suivantes dans votre fichier .env :')
  console.error('  - DISCORD_CLIENT_ID')
  console.error('  - DISCORD_CLIENT_SECRET')
  console.error('  - DISCORD_REDIRECT_URI')
  console.error('  - FRONTEND_URL')
  process.exit(1)
}

const oauth = new DiscordOAuth2({
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  redirectUri: DISCORD_REDIRECT_URI,
})

// Route d'initiation OAuth - redirige vers Discord
module.exports.init = async function controllerDiscordInit(req, res) {
  try {
    const url = oauth.generateAuthUrl({
        scope: ['identify', 'email'],
        state: req.query.state || 'default',
      })
    res.redirect(url)
  } catch (error) {
    console.error('Erreur lors de l\'initiation Discord OAuth:', error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}

// Route de callback - gère le retour de Discord
module.exports.callback = async function controllerDiscordCallback(req, res) {
  try {
    const { code } = req.query

    if (!code) {
      return res.status(400).json({ code: 'ERROR', message: 'Code Discord manquant' })
    }

    // Échanger le code contre un token d'accès
    const tokenResponse = await oauth.tokenRequest({
      code,
      scope: ['identify', 'email'],
      grantType: 'authorization_code',
    })

    const accessToken = tokenResponse.access_token

    // Récupérer les informations de l'utilisateur Discord
    const discordUser = await oauth.getUser(accessToken)

    if (!discordUser || !discordUser.id) {
      return res.status(400).json({ code: 'ERROR', message: 'Impossible de récupérer les informations Discord' })
    }

    // Chercher un utilisateur existant par discordId ou email
    let user = await User.findOne({
      where: {
        discordId: discordUser.id,
      },
    })

    // Si pas trouvé par discordId, chercher par email
    if (!user && discordUser.email) {
      user = await User.findOne({
        where: {
          email: discordUser.email,
        },
      })

      // Si trouvé par email, mettre à jour avec discordId
      if (user) {
        user.discordId = discordUser.id
        await user.save()
      }
    }

    // Si l'utilisateur n'existe pas, le créer
    if (!user) {
      // Utiliser le username Discord comme nickname par défaut
      const nickname = discordUser.username || `Discord_${discordUser.id.slice(0, 8)}`
      // Générer un mot de passe aléatoire (l'utilisateur ne l'utilisera jamais)
      const randomPassword = Math.random().toString(36) + Date.now().toString()
      const hashedPassword = await hashPassword(randomPassword)

      user = await User.create({
        nickname,
        email: discordUser.email || `${discordUser.id}@discord.local`,
        password: hashedPassword, // Mot de passe factice pour les comptes Discord
        roleID: 5, // guest par défaut
        discordId: discordUser.id,
        isVerified: discordUser.verified || false,
      })
    }

    // Créer une session
    const token = encryptSHA256(user.email + formatDate(new Date()))

    const deviceDetector = new DeviceDetector()
    const userAgent = req.get('User-Agent') || ''
    const device = deviceDetector.parse(userAgent) || {}

    await Session.create({
      userID: user.userID,
      token,
      expiration: new Date(new Date().setDate(new Date().getDate() + 30)),
      device: device.device?.type || null,
      browser: device.client?.name || null,
    })

    // Définir le cookie
    res.cookie('bande_de_rolistes', token, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
    })

    // Rediriger vers le frontend avec le token
    res.redirect(`${FRONTEND_URL}/auth/discord?token=${token}`)
  } catch (error) {
    console.error('Erreur lors du callback Discord:', error)
    res.redirect(`${FRONTEND_URL}/auth/discord?error=${encodeURIComponent(error.message)}`)
  }
}
