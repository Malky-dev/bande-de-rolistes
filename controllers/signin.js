const { hashPassword } = require('../global')
const { User } = require('../models')
const { EMAIL_REGEX, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require('../constants')

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

    const normalizedEmail = email.trim().toLowerCase()

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'L\'email n\'est pas valide' })
    }
    
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Le mot de passe doit contenir au moins 12 caractères' })
    }
  
    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Le mot de passe est trop long' })
    }
  
    if (password.toLowerCase() === email.toLowerCase()) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Le mot de passe ne peut pas être identique à l\'email' })
    }

    // Vérifier si le mot de passe est trop simple / répétitions absurdes (aaaaaaaaaaaa)
    if (/^(.)\1+$/.test(password)) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'Mot de passe trop simple' })
    }
    
    const existing = await User.findOne({ where: { email: normalizedEmail } })

    if (existing) {
      return res.status(409).json({ code: 'DUPLICATE', message: 'L\'utilisateur existe déjà' })
    }

    const hashedPassword = await hashPassword(password)

    await User.create({
      nickname,
      email: normalizedEmail,
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

