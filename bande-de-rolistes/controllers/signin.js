const { encryptSHA256 } = require('../global')
const { User } = require('../models')

module.exports = async function controllerSignin(req, res) {
  try {
    const { nickname, email, password } = req.body || {}

    if (typeof nickname !== 'string') {
      throw new TypeError('nickname type error')
    }
    if (typeof email !== 'string') {
      throw new TypeError('email type error')
    }
    if (typeof password !== 'string') {
      throw new TypeError('password type error')
    }

    const existing = await User.findOne({ where: { email } })

    if (existing) {
      return res.status(500).json({ code: 'DUPLICATE', message: 'User already exists' })
    }

    await User.create({
      nickname,
      email,
      password: encryptSHA256(password),
      roleID: 5, // guest par défaut
    })

    res.status(201).json('User successfully inserted')
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}

