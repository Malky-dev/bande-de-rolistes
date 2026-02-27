import type { RequestHandler } from 'express'
import { Op, type IncludeOptions } from 'sequelize'
import { Session, User, Role } from '../models'
import { getCookieValue } from '../utils/cookies'
import type { ApiError } from '../../types/api/errors'
import type { SessionInfo } from '../../types/api/session'

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

type SessionResponse = SessionInfo | ApiError

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

    const session = await Session.findOne({
      where: {
        token,
        expiration: { [Op.gt]: new Date() },
      },
      include: [includeUser],
    })

    if (!session) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Session expirée ou invalide' })
      return
    }

    const sessionJsonUnknown: unknown = session.toJSON()

    if (!isRecord(sessionJsonUnknown)) {
      res.status(500).json({ code: 'ERROR', message: 'Session invalide' })
      return
    }

    const userUnknown = sessionJsonUnknown['User']

    if (!isRecord(userUnknown)) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Session expirée ou invalide' })
      return
    }

    const userIDUnknown = userUnknown['userID']
    const nicknameUnknown = userUnknown['nickname']
    const isVerifiedUnknown = userUnknown['isVerified']

    if (typeof userIDUnknown !== 'number') {
      res.status(500).json({ code: 'ERROR', message: 'Session invalide' })
      return
    }

    if (typeof nicknameUnknown !== 'string') {
      res.status(500).json({ code: 'ERROR', message: 'Session invalide' })
      return
    }

    const roleUnknown = userUnknown['Role']
    let roleLabel = 'member'
    let roleID = 5
    
    if (isRecord(roleUnknown)) {
      const roleLabelUnknown = roleUnknown['roleLabel']
      if (typeof roleLabelUnknown === 'string') {
        roleLabel = roleLabelUnknown
      }
    
      const roleIDUnknown = roleUnknown['roleID']
      if (typeof roleIDUnknown === 'number') {
        roleID = roleIDUnknown
      }
    }
    
    const payload: SessionInfo = {
      userID: userIDUnknown,
      nickname: nicknameUnknown,
      roleID,
      role: roleLabel,
      isVerified: Boolean(isVerifiedUnknown),
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