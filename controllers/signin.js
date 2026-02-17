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

    res.status(201).json({ code: 'SUCCESS', message: 'L\'utilisateur a été créé avec succès' })
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error)
    
    // Gestion spécifique des erreurs Sequelize
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        code: 'VALIDATION_ERROR', 
        message: error.errors.map(e => e.message).join(', ') 
      })
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        code: 'DUPLICATE', 
        message: 'Cet email ou ce pseudo est déjà utilisé' 
      })
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        code: 'FOREIGN_KEY_ERROR', 
        message: 'Le rôle spécifié n\'existe pas. Veuillez contacter l\'administrateur.' 
      })
    }
    
    res.status(500).json({ code: 'ERROR', message: error.message || 'Une erreur est survenue lors de la création du compte' })
  }
}

