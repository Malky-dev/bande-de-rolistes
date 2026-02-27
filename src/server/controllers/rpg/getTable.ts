import type { RequestHandler } from 'express'
import { TableRPG, TableRPGPlayer, User } from '../../models'
import type { ApiError } from '../../../types/api/errors'
import { notFound, parseIntParam } from './helpers'

type GetTableParams = { eventID: string }

type SignupItem = {
  userID: number
  nickname: string
  created_at: string
}

type TableStatus = 'OPEN' | 'CLOSED' | 'CANCELLED'

type GetTableSuccess = {
  eventID: number
  eventDate: string
  dungeonMaster: { userID: number; nickname: string }
  location: string
  game: string
  comments: string | null
  status: TableStatus
  maxPlayers: number
  confirmedCap: number
  confirmed: SignupItem[]
  waitlist: SignupItem[]
}

type GetTableResponse = GetTableSuccess | ApiError

const HARD_CAP = 6

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const isTableStatus = (value: unknown): value is TableStatus => {
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

const controllerGetTable: RequestHandler<GetTableParams, GetTableResponse, Record<string, never>> = async (
  req,
  res
): Promise<void> => {
  try {
    const eventID = parseIntParam(req.params.eventID)
    if (eventID === null) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'eventID invalide' })
      return
    }

    const table = await TableRPG.findByPk(eventID, {
      include: [
        {
          model: User,
          as: 'dungeonMaster',
          attributes: ['userID', 'nickname'],
          required: true,
        },
      ],
    })

    if (!table) {
      notFound(res, 'Table introuvable')
      return
    }

    const tableJsonUnknown: unknown = table.toJSON()
    if (!isRecord(tableJsonUnknown)) {
      res.status(500).json({ code: 'ERROR', message: 'Table invalide' })
      return
    }

    const dmUnknown = tableJsonUnknown['dungeonMaster']
    if (!isRecord(dmUnknown)) {
      res.status(500).json({ code: 'ERROR', message: 'MJ invalide' })
      return
    }

    const dmUserIDUnknown = dmUnknown['userID']
    const dmNicknameUnknown = dmUnknown['nickname']

    if (typeof dmUserIDUnknown !== 'number' || typeof dmNicknameUnknown !== 'string') {
      res.status(500).json({ code: 'ERROR', message: 'MJ invalide' })
      return
    }

    const eventDateIso = parseDateToIso(tableJsonUnknown['eventDate'])
    if (eventDateIso === null) {
      res.status(500).json({ code: 'ERROR', message: 'eventDate invalide' })
      return
    }

    const locationUnknown = tableJsonUnknown['location']
    const gameUnknown = tableJsonUnknown['game']
    const commentsUnknown = tableJsonUnknown['comments']
    const statusUnknown = tableJsonUnknown['status']
    const maxPlayersUnknown = tableJsonUnknown['maxPlayers']
    const eventIDUnknown = tableJsonUnknown['eventID']

    if (typeof eventIDUnknown !== 'number') {
      res.status(500).json({ code: 'ERROR', message: 'eventID invalide' })
      return
    }

    if (typeof locationUnknown !== 'string' || typeof gameUnknown !== 'string') {
      res.status(500).json({ code: 'ERROR', message: 'Table invalide' })
      return
    }

    if (!isTableStatus(statusUnknown)) {
      res.status(500).json({ code: 'ERROR', message: 'status invalide' })
      return
    }

    if (typeof maxPlayersUnknown !== 'number' || !Number.isFinite(maxPlayersUnknown)) {
      res.status(500).json({ code: 'ERROR', message: 'maxPlayers invalide' })
      return
    }

    const comments =
      typeof commentsUnknown === 'string' ? commentsUnknown : commentsUnknown === null ? null : null

    const signups = await TableRPGPlayer.findAll({
      where: { eventID },
      include: [{ model: User, attributes: ['userID', 'nickname'], required: true }],
      order: [['created_at', 'ASC']],
    })

    const mapped: SignupItem[] = []

    for (const signup of signups) {
      const signupJsonUnknown: unknown = signup.toJSON()
      if (!isRecord(signupJsonUnknown)) {
        continue
      }

      const userUnknown = signupJsonUnknown['User']
      if (!isRecord(userUnknown)) {
        continue
      }

      const suUserIDUnknown = userUnknown['userID']
      const suNicknameUnknown = userUnknown['nickname']
      const createdAtIso = parseDateToIso(signupJsonUnknown['created_at'])

      if (typeof suUserIDUnknown !== 'number' || typeof suNicknameUnknown !== 'string') {
        continue
      }

      if (createdAtIso === null) {
        continue
      }

      mapped.push({
        userID: suUserIDUnknown,
        nickname: suNicknameUnknown,
        created_at: createdAtIso,
      })
    }

    const cap = Math.min(Math.floor(maxPlayersUnknown), HARD_CAP)

    const payload: GetTableSuccess = {
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
      confirmedCap: cap,
      confirmed: mapped.slice(0, cap),
      waitlist: mapped.slice(cap),
    }

    res.json(payload)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    res.status(500).json({ code: 'ERROR', message })
  }
}

export default controllerGetTable