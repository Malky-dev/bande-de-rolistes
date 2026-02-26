import type { RequestHandler } from 'express'
import { TableRPG, TableRPGPlayer } from '../../models'
import type { ApiError } from '../../../types/api/errors'
import { badRequest, forbid, getUserID, hasRole, notFound, parseIntParam } from './helpers'

type Params = { eventID: string }
type Response = { message: string } | ApiError

const ALLOWED_PLAYER = [1, 2, 3, 4, 5]

const controllerSignup: RequestHandler<Params, Response, Record<string, never>> = async (req, res): Promise<void> => {
  try {
    if (!hasRole(req, ALLOWED_PLAYER)) {
      forbid(res, 'Accès refusé')
      return
    }

    const userID = getUserID(req)
    if (!userID) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      return
    }

    const eventID = parseIntParam(req.params.eventID)
    if (eventID === null) {
      badRequest(res, 'eventID invalide')
      return
    }

    const table = await TableRPG.findByPk(eventID)
    if (!table) {
      notFound(res, 'Table introuvable')
      return
    }

    if (table.status !== 'OPEN') {
      res.status(403).json({ code: 'FORBIDDEN', message: 'Inscriptions fermées' })
      return
    }

    if (table.dungeon_master === userID) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'Le MJ ne peut pas être joueur sur sa table' })
      return
    }

    await TableRPGPlayer.create({ eventID, userID })

    res.status(201).json({ message: 'Inscription enregistrée' })
  } catch (error) {
    console.error(error)

    const err = error instanceof Error ? error : new Error('Erreur serveur')

    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ code: 'DUPLICATE', message: 'Déjà inscrit' })
      return
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({ code: 'FOREIGN_KEY_ERROR', message: 'Référence invalide' })
      return
    }

    res.status(500).json({ code: 'ERROR', message: err.message })
  }
}

export default controllerSignup