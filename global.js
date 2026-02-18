"use strict";

const bcrypt = require('bcrypt')

const SALT_ROUNDS = 12

/**
 * Hache un mot de passe avec bcrypt (pour les mots de passe utilisateur)
 * @param {string} password - Le mot de passe en clair
 * @returns {Promise<string>} Le mot de passe haché
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Compare un mot de passe en clair avec un hash bcrypt
 * @param {string} password - Le mot de passe en clair
 * @param {string} hash - Le hash bcrypt stocké
 * @returns {Promise<boolean>} true si le mot de passe correspond
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash)
}

/**
 * Génère un token de session aléatoire et sécurisé
 * Utilisé pour identifier la session de l'utilisateur (différent du token CSRF)
 * @returns {string} Un token de session aléatoire
 */
function generateSessionToken() {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

module.exports = { hashPassword, comparePassword, generateSessionToken }