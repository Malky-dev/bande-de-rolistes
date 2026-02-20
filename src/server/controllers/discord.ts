import type { RequestHandler } from 'express'
import DiscordOAuth2, { type TokenRequestResult } from 'discord-oauth2'
import DeviceDetector from 'device-detector-js'
import { hashPassword, generateSessionToken } from '../global'
import { User, Session } from '../models'
import { Model } from 'sequelize'
import type { ApiError } from '../../types/api/errors'

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
// Types minimaux (libs externes)
// ---------------------------
type DiscordUser = {
  id?: string
  email?: string
  username?: string
  verified?: boolean
}

type DeviceParseResult = {
  device?: { type?: string }
  client?: { name?: string }
}

// ---------------------------
// Helpers
// ---------------------------
function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

// ---------------------------
// Configuration Discord OAuth2
// ---------------------------
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI
const FRONTEND_URL = process.env.FRONTEND_URL

invariant(DISCORD_CLIENT_ID, "Variables d'environnement Discord manquantes (DISCORD_CLIENT_ID)")
invariant(DISCORD_CLIENT_SECRET, "Variables d'environnement Discord manquantes (DISCORD_CLIENT_SECRET)")
invariant(DISCORD_REDIRECT_URI, "Variables d'environnement Discord manquantes (DISCORD_REDIRECT_URI)")
invariant(FRONTEND_URL, "Variables d'environnement Discord manquantes (FRONTEND_URL)")

const oauth = new DiscordOAuth2({
  clientId: DISCORD_CLIENT_ID,
  clientSecret: DISCORD_CLIENT_SECRET,
  redirectUri: DISCORD_REDIRECT_URI,
})

// ---------------------------
// Init OAuth - redirige vers Discord
// ---------------------------
export const controllerDiscordInit: RequestHandler = (req, res): void => {
  try {
    const state = typeof req.query.state === 'string' ? req.query.state : 'default'

    const url = oauth.generateAuthUrl({
      scope: ['identify', 'email'],
      state,
    })

    res.redirect(url)
  } catch (error) {
    console.error("Erreur lors de l'initiation Discord OAuth:", error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const payload: ApiError = { code: 'ERROR', message }
    res.status(500).json(payload)
  }
}

// ---------------------------
// Callback OAuth - traitement retour Discord
// ---------------------------
export const controllerDiscordCallback: RequestHandler = async (req, res): Promise<void> => {
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

    // Récupérer les infos utilisateur Discord (shape minimale)
    const discordUser = (await oauth.getUser(accessToken)) as DiscordUser

    if (!discordUser.id) {
      res.status(400).json({ code: 'ERROR', message: 'Impossible de récupérer les informations Discord' })
      return
    }

    // ---------------------------
    // Recherche utilisateur existant
    // ---------------------------
    let user = (await User.findOne({ where: { discordId: discordUser.id } })) as UserInstance | null

    if (!user && discordUser.email) {
      user = (await User.findOne({ where: { email: discordUser.email } })) as UserInstance | null

      if (user) {
        // Mise à jour discordId si trouvé par email
        user.discordId = discordUser.id
        await user.save()
      }
    }

    // ---------------------------
    // Création de l'utilisateur si inexistant
    // ---------------------------
    if (!user) {
      const nickname = discordUser.username ?? `Discord_${discordUser.id.slice(0, 8)}`
      const randomPassword = Math.random().toString(36) + Date.now().toString()
      const hashedPassword = await hashPassword(randomPassword)

      user = (await User.create({
        nickname,
        email: discordUser.email ?? `${discordUser.id}@discord.local`,
        password: hashedPassword,
        roleID: 5, // guest par défaut
        discordId: discordUser.id,
        isVerified: discordUser.verified ?? false,
      })) as UserInstance
    }

    // ---------------------------
    // Création de la session
    // ---------------------------
    const token = generateSessionToken()
    const deviceDetector = new DeviceDetector()
    const userAgent = req.get('User-Agent') ?? ''
    const parsed = deviceDetector.parse(userAgent) as DeviceParseResult

    await Session.create({
      userID: user.userID,
      token,
      expiration: new Date(new Date().setDate(new Date().getDate() + 30)),
      device: parsed.device?.type ?? null,
      browser: parsed.client?.name ?? null,
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
    res.redirect(FRONTEND_URL)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const payload: ApiError = { code: 'ERROR', message }
    res.status(500).json(payload)
  }
}