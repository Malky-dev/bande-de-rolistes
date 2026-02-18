const DeviceDetector = require('device-detector-js')

const { comparePassword, generateSessionToken } = require('../global')
const { User, Session } = require('../models')

module.exports = async function controllerLogin(req, res) {
  try {
    const { email, password } = req.body || {}

    if (typeof email !== 'string') {
      throw new TypeError('l\'email doit être une chaîne de caractères')
    }
    if (typeof password !== 'string') {
      throw new TypeError('le mot de passe doit être une chaîne de caractères')
    }

    const user = await User.findOne({
      where: {
        email,
      },
    })

    if (!user) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Le nom d\'utilisateur n\'est pas disponible' })
    }

    // Vérifier le mot de passe avec bcrypt
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Le mot de passe est incorrect' })
    }

    const token = generateSessionToken()

    const deviceDetector = new DeviceDetector()
    const userAgent = req.get('User-Agent') || ''
    const device = deviceDetector.parse(userAgent) || {}

    await Session.create({
      userID: user.userID,
      token,
      expiration: new Date(new Date().setDate(new Date().getDate() + 30)),
      device: device.device?.type || null,
      browser: device.client?.name || null,
    })

    res.cookie('bande_de_rolistes', token, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
    res.json(token)
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}

