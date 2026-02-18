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
 * Génère un token aléatoire
 * @returns {string} Un token aléatoire de 32 caractères
 */
function generateToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

function formatDate (date) {
  return String(date.getFullYear()).padStart(4, "0") + "-" +
    String(date.getMonth() + 1).padStart(2, "0") + "-" +
    String(date.getDate()).padStart(2, "0") + " " +
    String(date.getHours()).padStart(2, "0") + ":" +
    String(date.getMinutes()).padStart(2, "0") + ":" +
    String(date.getSeconds()).padStart(2, "0");
}

module.exports = { hashPassword, comparePassword, generateToken, formatDate }