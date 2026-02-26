import type { RequestHandler } from 'express'
import { Op } from 'sequelize'
import { TableRPG, User } from '../../models'
import type { ApiError } from '../../../types/api/errors'

type TableListItem = {
  eventID: number
  eventDate: string
  dungeonMaster: { userID: number; nickname: string }
  location: string
  game: string
  comments: string | null
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  maxPlayers: number
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isTableStatus = (value: unknown): value is TableListItem['status'] => {
  return value === 'OPEN' || value === 'CLOSED' || value === 'CANCELLED'
}

const parseDateToIso = (value: unknown): string | null => {
  if (value instanceof Date) {
    const ts = value.getTime()
    if (Number.isNaN(ts)) {
      return null
    }
    return value.toISOString()
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) {
      return null
    }
    return d.toISOString()
  }

  return null
}

const controllerListTables: RequestHandler<
  Record<string, never>,
  TableListItem[] | ApiError,
  Record<string, never>
> = async (req, res): Promise<void> => {
  try {
    const now = new Date()

    const rows = await TableRPG.findAll({
      where: {
        eventDate: {
          [Op.gte]: now,
        },
      },
      include: [
        {
          model: User,
          as: 'dungeonMaster',
          attributes: ['userID', 'nickname'],
          required: true,
        },
      ],
      order: [['eventDate', 'ASC']],
    })

    const payload: TableListItem[] = rows.map((row) => {
      const jsonUnknown: unknown = row.toJSON()

      if (!isRecord(jsonUnknown)) {
        throw new Error('TableRPG invalide')
      }

      const eventIDUnknown = jsonUnknown['eventID']
      const eventDateUnknown = jsonUnknown['eventDate']
      const locationUnknown = jsonUnknown['location']
      const gameUnknown = jsonUnknown['game']
      const commentsUnknown = jsonUnknown['comments']
      const statusUnknown = jsonUnknown['status']
      const maxPlayersUnknown = jsonUnknown['maxPlayers']
      const dungeonMasterUnknown = jsonUnknown['dungeonMaster']

      if (typeof eventIDUnknown !== 'number') {
        throw new Error('eventID invalide')
      }

      const eventDateIso = parseDateToIso(eventDateUnknown)
      if (eventDateIso === null) {
        throw new Error('eventDate invalide')
      }

      if (typeof locationUnknown !== 'string') {
        throw new Error('location invalide')
      }

      if (typeof gameUnknown !== 'string') {
        throw new Error('game invalide')
      }

      if (!isTableStatus(statusUnknown)) {
        throw new Error('status invalide')
      }

      if (typeof maxPlayersUnknown !== 'number' || !Number.isFinite(maxPlayersUnknown)) {
        throw new Error('maxPlayers invalide')
      }

      if (!isRecord(dungeonMasterUnknown)) {
        throw new Error('dungeonMaster invalide')
      }

      const dmUserIDUnknown = dungeonMasterUnknown['userID']
      const dmNicknameUnknown = dungeonMasterUnknown['nickname']

      if (typeof dmUserIDUnknown !== 'number') {
        throw new Error('dungeonMaster.userID invalide')
      }

      if (typeof dmNicknameUnknown !== 'string') {
        throw new Error('dungeonMaster.nickname invalide')
      }

      const comments =
        typeof commentsUnknown === 'string' ? commentsUnknown : commentsUnknown === null ? null : null

      return {
        eventID: eventIDUnknown,
        eventDate: eventDateIso,
        dungeonMaster: {
          userID: dmUserIDUnknown,
          nickname: dmNicknameUnknown,
        },
        location: locationUnknown,
        game: gameUnknown,
        comments,
        status: statusUnknown,
        maxPlayers: Math.floor(maxPlayersUnknown),
      }
    })

    res.json(payload)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const payload: ApiError = { code: 'ERROR', message }
    res.status(500).json(payload)
  }
}

export default controllerListTables