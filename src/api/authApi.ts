// src/api/authApi.ts

export type SessionInfo = {
  nickname: string
  role: string
  isVerified: boolean
}

export type Quote = {
  content: string
  author: string
}

export type AdminUser = {
  userID: number
  nickname: string
  email: string
  roleID: number
  roleLabel: string
  isVerified: boolean
}

export type AdminRole = {
  roleID: number
  roleLabel: string
}

// ----------------------------------
// Helpers
// ----------------------------------

type ApiErrorPayload = { message?: string; code?: string }

function isApiErrorPayload(value: object): value is ApiErrorPayload {
  return (
    (!('message' in value) || typeof value.message === 'string') &&
    (!('code' in value) || typeof value.code === 'string')
  )
}

function parseJsonObject(text: string): object {
  // JSON.parse est runtime-only. On contraint immédiatement à `object` + vérifs.
  const parsed = JSON.parse(text) as object

  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid JSON payload')
  }

  return parsed
}

async function readJsonObject(res: Response): Promise<object> {
  const text = await res.text()
  return parseJsonObject(text)
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const obj = await readJsonObject(res)
    if (isApiErrorPayload(obj) && typeof obj.message === 'string' && obj.message.length > 0) {
      return obj.message
    }
    return fallback
  } catch {
    return fallback
  }
}

/**
 * Fonction utilitaire pour récupérer le token CSRF
 * Ne pas mettre en cache car chaque token est unique et lié au secret dans le cookie
 */
function isCsrfTokenResponse(value: object): value is { csrfToken: string } {
  return 'csrfToken' in value && typeof value.csrfToken === 'string' && value.csrfToken.length > 0
}

async function getCsrfToken(): Promise<string> {
  const res = await fetch('/api/csrf-token', {
    credentials: 'include',
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Impossible de récupérer le token CSRF'))
  }

  const obj = await readJsonObject(res)

  if (!isCsrfTokenResponse(obj)) {
    console.error('Token CSRF invalide reçu:', obj)
    throw new Error('Token CSRF invalide reçu du serveur')
  }

  return obj.csrfToken
}

function isSessionInfo(value: object): value is SessionInfo {
  return (
    'nickname' in value &&
    typeof value.nickname === 'string' &&
    'role' in value &&
    typeof value.role === 'string' &&
    'isVerified' in value &&
    typeof value.isVerified === 'boolean'
  )
}

function isQuote(value: object): value is Quote {
  return (
    'content' in value &&
    typeof value.content === 'string' &&
    'author' in value &&
    typeof value.author === 'string'
  )
}

function isAdminRole(value: object): value is AdminRole {
  return (
    'roleID' in value &&
    typeof value.roleID === 'number' &&
    'roleLabel' in value &&
    typeof value.roleLabel === 'string'
  )
}

function isAdminUser(value: object): value is AdminUser {
  return (
    'userID' in value &&
    typeof value.userID === 'number' &&
    'nickname' in value &&
    typeof value.nickname === 'string' &&
    'email' in value &&
    typeof value.email === 'string' &&
    'roleID' in value &&
    typeof value.roleID === 'number' &&
    'roleLabel' in value &&
    typeof value.roleLabel === 'string' &&
    'isVerified' in value &&
    typeof value.isVerified === 'boolean'
  )
}

function isAdminUserArray(value: object): value is AdminUser[] {
  if (!Array.isArray(value)) return false
  return value.every(item => typeof item === 'object' && item !== null && isAdminUser(item as object))
}

function isAdminRoleArray(value: object): value is AdminRole[] {
  if (!Array.isArray(value)) return false
  return value.every(item => typeof item === 'object' && item !== null && isAdminRole(item as object))
}

function isLogoutResponse(value: object): value is { success: boolean } {
  return 'success' in value && typeof value.success === 'boolean'
}

// ----------------------------------
// Auth
// ----------------------------------

export async function apiSignin(
  nickname: string,
  email: string,
  password: string,
  passwordCheck: string
): Promise<void> {
  const csrfToken = await getCsrfToken()

  const res = await fetch('/api/signin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ nickname, email, password, passwordCheck }),
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Erreur lors de la création du compte'))
  }
}

export async function apiLogin(email: string, password: string): Promise<void> {
  const csrfToken = await getCsrfToken()

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Erreur lors de la connexion'))
  }
}

export async function apiSession(): Promise<SessionInfo> {
  const res = await fetch('/api/session', {
    credentials: 'include',
  })

  if (!res.ok) throw new Error(await readErrorMessage(res, 'Not authenticated'))

  const obj = await readJsonObject(res)
  if (!isSessionInfo(obj)) {
    throw new Error('Invalid session payload')
  }
  return obj
}

export async function apiLogout(): Promise<{ success: boolean }> {
  const csrfToken = await getCsrfToken()

  const res = await fetch('/api/logout', {
    method: 'POST',
    headers: {
      'x-csrf-token': csrfToken,
    },
    credentials: 'include',
  })

  if (!res.ok) throw new Error(await readErrorMessage(res, 'Logout failed'))

  const obj = await readJsonObject(res)
  if (!isLogoutResponse(obj)) {
    throw new Error('Invalid logout payload')
  }
  return obj
}

// ----------------------------------
// Quote
// ----------------------------------

export async function apiQuote(): Promise<Quote> {
  const res = await fetch('/api/quote', { credentials: 'include' })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Erreur lors de la récupération de la citation'))
  }

  const obj = await readJsonObject(res)
  if (!isQuote(obj)) {
    throw new Error('Invalid quote payload')
  }
  return obj
}

// ----------------------------------
// Admin
// ----------------------------------

export async function apiAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch('/api/admin/users', {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const msg = await readErrorMessage(res, `Erreur ${res.status}: ${res.statusText}`)
    console.error('Erreur API admin/users:', { status: res.status })
    throw new Error(msg)
  }

  const obj = await readJsonObject(res)
  if (!isAdminUserArray(obj)) {
    throw new Error('Invalid admin users payload')
  }
  return obj
}

export async function apiAdminRoles(): Promise<AdminRole[]> {
  const res = await fetch('/api/admin/roles', {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  if (!res.ok) {
    const msg = await readErrorMessage(res, `Erreur ${res.status}: ${res.statusText}`)
    console.error('Erreur API admin/roles:', { status: res.status })
    throw new Error(msg)
  }

  const obj = await readJsonObject(res)
  if (!isAdminRoleArray(obj)) {
    throw new Error('Invalid admin roles payload')
  }
  return obj
}

export async function apiAdminUpdateRole(userID: number, roleID: number): Promise<AdminUser> {
  const csrfToken = await getCsrfToken()

  const res = await fetch(`/api/admin/users/${userID}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ roleID }),
  })

  if (!res.ok) {
    const msg = await readErrorMessage(res, `Erreur ${res.status}: ${res.statusText}`)
    console.error('Erreur API admin/updateRole:', { status: res.status })
    throw new Error(msg)
  }

  const obj = await readJsonObject(res)
  if (!isAdminUser(obj)) {
    throw new Error('Invalid admin user payload')
  }
  return obj
}