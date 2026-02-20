import type { Request, Response } from 'express'
import DiscordOAuth2, { type TokenRequestResult } from 'discord-oauth2'
import DeviceDetector from 'device-detector-js'
import { hashPassword, generateSessionToken } from '../global'
import { User, Session } from '../models'
import { Model } from 'sequelize'

// ---------------------------
// Typage Sequelize pour User
// ---------------------------
interface UserAttributes {
  userID: number
  nickname: string
  email: string
  password: string
  roleID: number
  discordId?: string
  isVerified: boolean
}

type UserInstance = Model<UserAttributes> & UserAttributes

// ---------------------------
// Configuration Discord OAuth2
// ---------------------------
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI
const FRONTEND_URL = process.env.FRONTEND_URL

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET || !DISCORD_REDIRECT_URI || !FRONTEND_URL) {
  console.error('❌ Variables d\'environnement Discord manquantes !')
  process.exit(1)
}

const oauth = new DiscordOAuth2({
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  redirectUri: DISCORD_REDIRECT_URI,
})

// ---------------------------
// Init OAuth - redirige vers Discord
// ---------------------------
export function controllerDiscordInit(req: Request, res: Response): void {
  try {
    const url = oauth.generateAuthUrl({
      scope: ['identify', 'email'],
      state: typeof req.query.state === 'string' ? req.query.state : 'default',
    })
    res.redirect(url)
  } catch (error: unknown) {
    console.error("Erreur lors de l'initiation Discord OAuth:", error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    res.status(500).json({ code: 'ERROR', message })
  }
}

// ---------------------------
// Callback OAuth - traitement retour Discord
// ---------------------------
export async function controllerDiscordCallback(req: Request, res: Response): Promise<void> {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : undefined

    if (!code) {
      res.status(400).json({ code: 'ERROR', message: 'Code Discord manquant' })
      return
    }

    // Échange du code contre un token d'accès
    const tokenResponse: TokenRequestResult = await oauth.tokenRequest({
      code,
      scope: ['identify', 'email'],
      grantType: 'authorization_code',
    })

    const accessToken = tokenResponse.access_token

    // Récupérer les infos utilisateur Discord
    const discordUser = await oauth.getUser(accessToken)

    if (!discordUser?.id) {
      res.status(400).json({ code: 'ERROR', message: 'Impossible de récupérer les informations Discord' })
      return
    }

    // ---------------------------
    // Recherche utilisateur existant
    // ---------------------------
    let user = await User.findOne({ where: { discordId: discordUser.id } }) as UserInstance | null

    if (!user && discordUser.email) {
      user = await User.findOne({ where: { email: discordUser.email } }) as UserInstance | null

      if (user) { // Mise à jour discordId si trouvé par email
        user.discordId = discordUser.id
        await user.save()
      }
    }

    // ---------------------------
    // Création de l'utilisateur si inexistant
    // ---------------------------
    if (!user) {
      const nickname = discordUser.username || `Discord_${discordUser.id.slice(0, 8)}`
      const randomPassword = Math.random().toString(36) + Date.now().toString()
      const hashedPassword = await hashPassword(randomPassword)

      user = await User.create({
        nickname,
        email: discordUser.email || `${discordUser.id}@discord.local`,
        password: hashedPassword,
        roleID: 5, // guest par défaut
        discordId: discordUser.id,
        isVerified: discordUser.verified || false,
      }) as UserInstance
    }

    // ---------------------------
    // Création de la session
    // ---------------------------
    const token = generateSessionToken()
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

    // ---------------------------
    // Cookie de session
    // ---------------------------
    res.cookie('bande_de_rolistes', token, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    // Redirection frontend
    res.redirect(FRONTEND_URL!)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? (error).message : 'Erreur inconnue'
    res.status(500).json({ code: 'ERROR', message: message })
  }
}
