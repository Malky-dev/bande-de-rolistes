export type SessionInfo = {
  nickname: string
  role: string
  isVerified: boolean
}

const API_BASE = 'http://localhost:3000/api'

// Fonction utilitaire pour récupérer le token CSRF
let csrfTokenCache: string | null = null

async function getCsrfToken(): Promise<string> {
  if (csrfTokenCache) {
    return csrfTokenCache
  }
  
  const res = await fetch('/api/csrf-token', {
    credentials: 'include',
  })
  
  if (!res.ok) {
    throw new Error('Impossible de récupérer le token CSRF')
  }
  
  const data = await res.json()
  csrfTokenCache = data.csrfToken
  return csrfTokenCache as string
}

export async function apiSignin(nickname: string, email: string, password: string, passwordCheck: string) {
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
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Erreur lors de la création du compte')
  }
}

export async function apiLogin(email: string, password: string) {
  const csrfToken = await getCsrfToken()
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    credentials: 'include', // important
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Erreur lors de la connexion')
  }
}


export async function apiSession() {
  const res = await fetch('/api/session', {
    credentials: 'include',
  })

  if (!res.ok) throw new Error('Not authenticated')
  return res.json()
}

export async function apiLogout() {
  const csrfToken = await getCsrfToken()
  const res = await fetch('/api/logout', {
    method: 'POST',
    headers: {
      'x-csrf-token': csrfToken,
    },
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Logout failed')
  return res.json()
}

export type Quote = {
  content: string
  author: string
}

export async function apiQuote(): Promise<Quote> {
  const res = await fetch(`${API_BASE}/quote`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Erreur lors de la récupération de la citation')
  }
  return res.json()
}

// Admin API functions
export type User = {
  userID: number
  nickname: string
  email: string
  roleID: number
  roleLabel: string
  isVerified: boolean
}

export type Role = {
  roleID: number
  roleLabel: string
}

export async function apiAdminUsers(): Promise<User[]> {
  const res = await fetch('/api/admin/users', {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const errorMessage = data.message || `Erreur ${res.status}: ${res.statusText}`
    console.error('Erreur API admin/users:', { status: res.status, data })
    throw new Error(errorMessage)
  }
  return res.json()
}

export async function apiAdminRoles(): Promise<Role[]> {
  const res = await fetch('/api/admin/roles', {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const errorMessage = data.message || `Erreur ${res.status}: ${res.statusText}`
    console.error('Erreur API admin/roles:', { status: res.status, data })
    throw new Error(errorMessage)
  }
  return res.json()
}

export async function apiAdminUpdateRole(userID: number, roleID: number): Promise<User> {
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
    const data = await res.json().catch(() => ({}))
    const errorMessage = data.message || `Erreur ${res.status}: ${res.statusText}`
    console.error('Erreur API admin/updateRole:', { status: res.status, data })
    throw new Error(errorMessage)
  }
  return res.json()
}