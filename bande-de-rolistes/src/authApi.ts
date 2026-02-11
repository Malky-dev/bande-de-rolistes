export type SessionInfo = {
  nickname: string
  role: string
  isVerified: boolean
}

const API_BASE = 'http://localhost:3000/api'

export async function apiSignin(nickname: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nickname, email, password }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Erreur lors de la création du compte')
  }
}

export async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Identifiants invalides')
  }

  const token = await res.json()
  if (typeof token !== 'string') {
    throw new Error('Réponse serveur inattendue')
  }
  return token
}

export async function apiSession(token: string): Promise<SessionInfo> {
  const res = await fetch(`${API_BASE}/session/${token}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || 'Session invalide')
  }
  return res.json()
}

export function apiDiscordInit() {
  // Redirige vers l'endpoint d'initiation Discord OAuth
  window.location.href = `${API_BASE}/discord/init`
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

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('bdr_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiAdminUsers(): Promise<User[]> {
  const token = localStorage.getItem('bdr_token')
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.')
  }
  
  // Encoder le token pour l'URL
  const encodedToken = encodeURIComponent(token)
  const res = await fetch(`${API_BASE}/admin/users?token=${encodedToken}`, {
    headers: getAuthHeaders(),
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
  const token = localStorage.getItem('bdr_token')
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.')
  }
  
  const encodedToken = encodeURIComponent(token)
  const res = await fetch(`${API_BASE}/admin/roles?token=${encodedToken}`, {
    headers: getAuthHeaders(),
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
  const token = localStorage.getItem('bdr_token')
  if (!token) {
    throw new Error('Token manquant. Veuillez vous reconnecter.')
  }
  
  const encodedToken = encodeURIComponent(token)
  const res = await fetch(`${API_BASE}/admin/users/${userID}/role?token=${encodedToken}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ roleID }),
    credentials: 'include',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const errorMessage = data.message || `Erreur ${res.status}: ${res.statusText}`
    console.error('Erreur API admin/updateRole:', { status: res.status, data })
    throw new Error(errorMessage)
  }
  return res.json()
}