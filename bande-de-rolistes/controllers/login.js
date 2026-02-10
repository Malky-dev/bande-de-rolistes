const DeviceDetector = require('device-detector-js')

const { encryptSHA256, formatDate } = require('../global')
const { User, Session } = require('../models')

module.exports = async function controllerLogin(req, res) {
  try {
    const { email, password } = req.body || {}

    if (typeof email !== 'string') {
      throw new TypeError('email type error')
    }
    if (typeof password !== 'string') {
      throw new TypeError('password type error')
    }

    const user = await User.findOne({
      where: {
        email,
        password: encryptSHA256(password),
      },
    })

    if (!user) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'User not available' })
    }

    const token = encryptSHA256(email + formatDate(new Date()))

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
    })
    res.json(token)
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}

