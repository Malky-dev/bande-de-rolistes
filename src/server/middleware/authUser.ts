import type { RequestHandler } from 'express'
import { Op, type IncludeOptions, type Model } from 'sequelize'
import { Role, Session, User } from '../models'
import { getCookieValue } from '../utils/cookies'

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
  email: string
  discordId: string | null
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

/* =====================================================
   Middleware requireUser
===================================================== */

const requireUser: RequestHandler = async (req, res, next) => {
  try {
    const cookieHeader = req.get('Cookie') ?? undefined
    const tokenFromCookie = getCookieValue(cookieHeader, 'bande_de_rolistes')

    const tokenFromHeader =
      typeof req.headers.authorization === 'string'
        ? req.headers.authorization.replace(/^Bearer\s+/i, '')
        : undefined

    const token = tokenFromCookie || tokenFromHeader

    if (!token) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Token required' })
      return
    }

    const includeUser: IncludeOptions = {
      model: User,
      required: true,
      include: [
        {
          model: Role,
          required: false,
        },
      ],
    }

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

export default requireUser