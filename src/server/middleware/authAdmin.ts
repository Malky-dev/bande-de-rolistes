import type { RequestHandler } from 'express'
import { Op, type IncludeOptions, type Model } from 'sequelize'
import { Role, Session, User } from '../models'

/* =====================================================
   Typage Sequelize minimal (relations incluses)
===================================================== */
interface RoleAttributes {
  roleID: number
  roleLabel: string
}

type RoleInstance = Model<RoleAttributes> & RoleAttributes

interface UserAttributes {
  userID: number
  nickname: string
  Role?: RoleInstance
}

type UserInstance = Model<UserAttributes> & UserAttributes

interface SessionAttributes {
  sessionID: number
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

/* =====================================================
   Middleware requireAdmin
===================================================== */

const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    // ---------------------------
    // Token récupération
    // ---------------------------
    const cookieHeader = req.get('Cookie')
    const tokenFromCookie =
      typeof cookieHeader === 'string'
        ? getCookieValue(cookieHeader, 'bande_de_rolistes')
        : undefined

    const tokenFromHeader =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization.replace(/^Bearer\s+/i, '')
        : undefined

    const token = tokenFromCookie || tokenFromHeader

    if (!token) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Token required' })
      return
    }

    // ---------------------------
    // Include Sequelize sécurisé TS
    // ---------------------------
    const includeUser: IncludeOptions = {
      model: User,
      required: true,
      include: [
        {
          model: Role,
          required: true,
        },
      ],
    }

    // ---------------------------
    // Recherche session valide
    // ---------------------------
    const session = (await Session.findOne({
      where: {
        token,
        expiration: {
          [Op.gt]: new Date(),
        },
      },
      include: [includeUser],
    })) as (SessionInstance & { User?: UserInstance }) | null

    if (!session?.User) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid token' })
      return
    }

    // ---------------------------
    // Vérification rôle admin
    // ---------------------------
    const role = session.User.Role

    if (!role || role.roleLabel !== 'admin') {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' })
      return
    }

    // ---------------------------
    // Injection dans Request
    // (express.d.ts)
    // ---------------------------
    req.user = session.User
    req.session = session

    next()
  } catch (error) {
     
    console.error(error)

    const message = error instanceof Error ? error.message : 'Erreur serveur'

    res.status(500).json({
      code: 'ERROR',
      message,
    })
  }
}

export default requireAdmin