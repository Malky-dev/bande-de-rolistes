// ---------------------------
// discord.ts - OAuth Discord
// ---------------------------

import { Router } from 'express'

import {
  controllerDiscordInit,
  controllerDiscordCallback,
} from '../controllers/discord'

import { requestLimiter } from '../middleware/rateLimit'

const router = Router()

// ---------------------------
// Discord OAuth
// ---------------------------

router.get(
  '/discord/init',
  requestLimiter,
  controllerDiscordInit
)

router.get(
  '/discord/callback',
  requestLimiter,
  controllerDiscordCallback
)

export default router
