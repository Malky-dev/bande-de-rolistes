import type { RequestHandler } from 'express'
import { Op, type IncludeOptions, type Model } from 'sequelize'
import { Session, User, Role } from '../models'
import { getCookieValue } from '../utils/cookies'
import type { ApiError } from '../../types/api/errors'

// ---------------------------
// Typage Sequelize pour Role
// ---------------------------
interface RoleAttributes {
  roleID: number
  roleLabel: string
}

type RoleInstance = Model<RoleAttributes> & RoleAttributes

// ---------------------------
// Typage Sequelize pour User
// ---------------------------
interface UserAttributes {
  userID: number
  nickname: string
  isVerified: boolean
  Role?: RoleInstance
}

type UserInstance = Model<UserAttributes> & UserAttributes

// ---------------------------
// Typage Sequelize pour Session
// ---------------------------
interface SessionAttributes {
  sessionID: number
  userID: number
  token: string
  expiration: Date
  User?: UserInstance
}

type SessionInstance = Model<SessionAttributes> & SessionAttributes

type SessionSuccess = {
  nickname: string
  role: string
  isVerified: boolean
}

type SessionResponse = SessionSuccess | ApiError

// ---------------------------
// Contrôleur session
// ---------------------------
const controllerSession: RequestHandler<
  Record<string, never>,
  SessionResponse,
  Record<string, never>
> = async (req, res): Promise<void> => {
  try {
    const cookieHeader = req.get('Cookie') ?? undefined
    const token =
      typeof cookieHeader === 'string' ? getCookieValue(cookieHeader, 'bande_de_rolistes') : undefined

    if (!token) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Session non trouvée' })
      return
    }

    // ---------------------------
    // Définition de l'include pour l'utilisateur et son rôle
    // ---------------------------
    const includeUser: IncludeOptions = {
      model: User,
      required: true,
      include: [
        {
          model: Role,
          required: false, // Role optionnel
        },
      ],
    }

    // ---------------------------
    // Recherche de la session active (non expirée)
    // ---------------------------
    const session = (await Session.findOne({
      where: {
        token,
        expiration: { [Op.gt]: new Date() }, // Vérifie l'expiration
      },
      include: [includeUser], // Must be array pour TypeScript
    })) as SessionInstance | null

    if (!session || !session.User) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Session expirée ou invalide' })
      return
    }

    const user = session.User
    const role = user.Role

    const payload: SessionSuccess = {
      nickname: user.nickname,
      role: role?.roleLabel ?? 'member',
      isVerified: Boolean(user.isVerified),
    }

    res.json(payload)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const payload: ApiError = { code: 'ERROR', message }
    res.status(500).json(payload)
  }
}

export default controllerSession