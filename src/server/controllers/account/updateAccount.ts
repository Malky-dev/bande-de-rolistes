import type { RequestHandler } from 'express'
import { User } from '../../models'
import type { ApiError } from '../../../types/api/errors'

type UpdateAccountBody = {
  nickname?: string
}

type AccountMe = {
  userID: number
  nickname: string
  email: string
  discordId: string | null
}

type AccountResponse = AccountMe | ApiError

function normalizeNickname(value: string): string {
  return value.trim()
}

const controllerUpdateAccount: RequestHandler<
  Record<string, never>,
  AccountResponse,
  UpdateAccountBody
> = async (req, res): Promise<void> => {
  try {
    if (!req.user?.userID) {
      res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      return
    }

    const user = await User.findByPk(req.user.userID)

    if (!user) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' })
      return
    }

    if (typeof req.body.nickname === 'string') {
      const nickname = normalizeNickname(req.body.nickname)

      if (nickname.length < 2 || nickname.length > 100) {
        res.status(400).json({
          code: 'BAD_REQUEST',
          message: 'Le pseudo doit faire entre 2 et 100 caractères.',
        })
        return
      }

      user.nickname = nickname
    }

    await user.save()

    const payload: AccountMe = {
      userID: user.userID,
      nickname: user.nickname,
      email: user.email,
      discordId: user.discordId,
    }

    res.json(payload)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const payload: ApiError = { code: 'ERROR', message }
    res.status(500).json(payload)
  }
}

export default controllerUpdateAccount