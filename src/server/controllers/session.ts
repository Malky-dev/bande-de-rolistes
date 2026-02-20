import type { Request, Response } from 'express'
import { Op, type IncludeOptions, type Model } from 'sequelize'
import { Session, User, Role } from '../models'

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

function getCookieValue(cookieHeader: string, name: string): string | undefined {
  const parts = cookieHeader.split(';')

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex)
    const rawValue = trimmed.slice(eqIndex + 1)

    if (key === name) {
      return decodeURIComponent(rawValue)
    }
  }

  return undefined
}

// ---------------------------
// Contrôleur session
// ---------------------------
export default async function controllerSession(req: Request, res: Response): Promise<void> {
  try {
    const cookieHeader = req.get('Cookie')
    const token =
      typeof cookieHeader === 'string'
        ? getCookieValue(cookieHeader, 'bande_de_rolistes')
        : undefined

    if (!token || typeof token !== 'string') {
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
      res.status(401).json({ code: 'SESSION_EXPIRED', message: 'Session expirée ou invalide' })
      return
    }

    const user = session.User
    const role = user.Role

    // ---------------------------
    // Retour des informations utilisateur
    // ---------------------------
    res.json({
      nickname: user.nickname,
      role: role?.roleLabel || 'member',
      isVerified: !!user.isVerified,
    })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    res.status(500).json({ code: 'ERROR', message })
  }
}