import type { Request, Response } from 'express'

import { hashPassword } from '../global'
import { User } from '../models'
import { EMAIL_REGEX, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '../constants'

// ---------------------------
// Typage du body de l'inscription
// ---------------------------
interface SigninBody {
  nickname: string
  email: string
  password: string
  passwordCheck: string
}

// ---------------------------
// Contrôleur Signin
// ---------------------------
export default async function controllerSignin(
  req: Request<Record<string, never>, unknown, SigninBody>,
  res: Response
): Promise<void> {
  try {
    const { nickname, email, password, passwordCheck } = req.body

    // ---------------------------
    // Vérification des types
    // ---------------------------
    if (typeof nickname !== 'string') throw new TypeError('Le pseudo doit être une chaîne de caractères')
    if (typeof email !== 'string') throw new TypeError("L'email doit être une chaîne de caractères")
    if (typeof password !== 'string') throw new TypeError('Le mot de passe doit être une chaîne de caractères')

    if (password !== passwordCheck) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'Les mots de passe ne correspondent pas' })
      return
    }

    const normalizedEmail = email.trim().toLowerCase()

    // ---------------------------
    // Vérification du format email
    // ---------------------------
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      res.status(400).json({ code: 'BAD_REQUEST', message: "L'email n'est pas valide" })
      return
    }

    // ---------------------------
    // Vérification du mot de passe
    // ---------------------------
    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ code: 'BAD_REQUEST', message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères` })
      return
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'Le mot de passe est trop long' })
      return
    }

    if (password.toLowerCase() === normalizedEmail) {
      res.status(400).json({ code: 'BAD_REQUEST', message: "Le mot de passe ne peut pas être identique à l'email" })
      return
    }

    if (/^(.)\1+$/.test(password)) {
      res.status(400).json({ code: 'BAD_REQUEST', message: 'Mot de passe trop simple' })
      return
    }

    // ---------------------------
    // Vérification de l'existence de l'utilisateur
    // ---------------------------
    const existing = await User.findOne({ where: { email: normalizedEmail } })
    if (existing) {
      res.status(409).json({ code: 'DUPLICATE', message: "L'utilisateur existe déjà" })
      return
    }

    // ---------------------------
    // Hash du mot de passe et création de l'utilisateur
    // ---------------------------
    const hashedPassword = await hashPassword(password)

    await User.create({
      nickname,
      email: normalizedEmail,
      password: hashedPassword,
      roleID: 5, // guest par défaut
    })

    // ---------------------------
    // Retour succès
    // ---------------------------
    res.status(201).json({ code: 'SUCCESS', message: "L'utilisateur a été créé avec succès" })
  } catch (error) {
    console.error(error)
  
    const err = error as { name?: string; errors?: Array<{ message?: string }>; message?: string }
  
    if (err.name === 'SequelizeValidationError') {
      res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: Array.isArray(err.errors)
          ? err.errors.map(e => e.message ?? '').filter(Boolean).join(', ')
          : 'Validation error',
      })
      return
    }
  
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ code: 'DUPLICATE', message: 'Cet email ou ce pseudo est déjà utilisé' })
      return
    }
  
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(400).json({
        code: 'FOREIGN_KEY_ERROR',
        message: "Le rôle spécifié n'existe pas. Veuillez contacter l'administrateur.",
      })
      return
    }
  
    res.status(500).json({
      code: 'ERROR',
      message: err.message || 'Une erreur est survenue lors de la création du compte',
    })
  }
}
