import type { RequestHandler } from 'express'
import { TableRPG } from '../../models'
import type { ApiError } from '../../../types/api/errors'
import { badRequest, forbid, getUserID, hasRole, notFound, parseIntParam } from './helpers'

type Params = { eventID: string }

type Body = {
  eventDate?: string
  location?: string
  game?: string
  comments?: string | null
  maxPlayers?: number
}

type Response =
  | { message: string }
  | ApiError

const ADMIN_OR_ORGA = [1, 2]

const controllerUpdateTable: RequestHandler<Params, Response, Body> = async (req, res): Promise<void> => {
  try {
    const eventID = parseIntParam(req.params.eventID)
    if (eventID === null) {
      badRequest(res, 'eventID invalide')
      return
    }

    const userID = getUserID(req)
    const roleID = req.user?.Role?.roleID
    if (!userID || typeof roleID !== 'number') {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      return
    }

    const table = await TableRPG.findByPk(eventID)
    if (!table) {
      notFound(res, 'Table introuvable')
      return
    }

    const isAdminOrOrga = hasRole(req, ADMIN_OR_ORGA)
    const isOwnerDM = roleID === 3 && table.dungeon_master === userID

    if (!isAdminOrOrga && !isOwnerDM) {
      forbid(res, 'Accès refusé')
      return
    }

    if (typeof req.body.eventDate === 'string') {
      const d = new Date(req.body.eventDate)
      if (Number.isNaN(d.getTime())) {
        badRequest(res, 'eventDate invalide')
        return
      }
      table.eventDate = d
    }

    if (typeof req.body.location === 'string') {
      const v = req.body.location.trim()
      if (v.length < 2) {
        badRequest(res, 'location invalide')
        return
      }
      table.location = v
    }

    if (typeof req.body.game === 'string') {
      const v = req.body.game.trim()
      if (v.length < 2) {
        badRequest(res, 'game invalide')
        return
      }
      table.game = v
    }

    if (typeof req.body.comments === 'string') {
      table.comments = req.body.comments
    } else if (req.body.comments === null) {
      table.comments = null
    }

    if (typeof req.body.maxPlayers === 'number') {
      const mp = Math.floor(req.body.maxPlayers)
      if (mp < 1 || mp > 10) {
        badRequest(res, 'maxPlayers doit être entre 1 et 10')
        return
      }
      table.maxPlayers = mp
    }

    await table.save()

    res.json({ message: 'Table mise à jour' })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    res.status(500).json({ code: 'ERROR', message })
  }
}

export default controllerUpdateTable