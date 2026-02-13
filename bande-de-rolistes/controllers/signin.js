const { hashPassword } = require('../global')
const { User } = require('../models')

module.exports = async function controllerSignin(req, res) {
  try {
    const { nickname, email, password, passwordCheck } = req.body || {}

    if (typeof nickname !== 'string') {
      throw new TypeError('le pseudo doit être une chaîne de caractères')
    }
    if (typeof email !== 'string') {
      throw new TypeError('l\'email doit être une chaîne de caractères')
    }
    if (typeof password !== 'string') {
      throw new TypeError('le mot de passe doit être une chaîne de caractères')
    }
    if (typeof passwordCheck !== 'string') {
      throw new TypeError('la vérification du mot de passe doit être une chaîne de caractères')
    } 
    if (password !== passwordCheck) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Les mots de passe ne correspondent pas' })
    }

    const existing = await User.findOne({ where: { email } })

    if (existing) {
      return res.status(500).json({ code: 'DUPLICATE', message: 'L\'utilisateur existe déjà' })
    }

    const hashedPassword = await hashPassword(password)

    await User.create({
      nickname,
      email,
      password: hashedPassword,
      roleID: 5, // guest par défaut
    })

    res.status(201).json('L\'utilisateur a été créé avec succès')
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}

