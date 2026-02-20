import bcrypt from 'bcrypt'
import crypto from 'crypto'

const SALT_ROUNDS = 12

/**
 * Hache un mot de passe avec bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare un mot de passe en clair avec un hash bcrypt
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Génère un token de session sécurisé
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex')
}
