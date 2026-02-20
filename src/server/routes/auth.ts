// ---------------------------
// auth.ts - Routes Authentification
// ---------------------------

import { Router } from 'express'

import signinController from '../controllers/signin'
import loginController from '../controllers/login'

import { verifyCsrf } from '../middleware/csrf'
import { requestLimiter, authLimiter } from '../middleware/rateLimit'

const router = Router()

// ---------------------------
// Routes Auth
// ---------------------------

router.post(
  '/signin',
  authLimiter,
  verifyCsrf,
  signinController
)

router.post(
  '/login',
  authLimiter,
  verifyCsrf,
  loginController
)

router.post(
  '/logout',
  requestLimiter,
  verifyCsrf,
  (req, res) => {
    res.clearCookie('bande_de_rolistes')
    res.clearCookie('csrf-secret')
    res.json({ success: true })
  }
)

export default router
