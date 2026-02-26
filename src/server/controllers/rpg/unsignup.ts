import type { RequestHandler } from 'express'
import { TableRPGPlayer } from '../../models'
import type { ApiError } from '../../../types/api/errors'
import { badRequest, forbid, getUserID, hasRole, parseIntParam } from './helpers'

type Params = { eventID: string }
type Response = { message: string } | ApiError

const ALLOWED_PLAYER = [1, 2, 3, 4, 5]

const controllerUnsignup: RequestHandler<Params, Response, Record<string, never>> = async (req, res): Promise<void> => {
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

    await TableRPGPlayer.destroy({
      where: { eventID, userID },
    })

    res.json({ message: 'Désinscription effectuée' })
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    res.status(500).json({ code: 'ERROR', message })
  }
}

export default controllerUnsignup