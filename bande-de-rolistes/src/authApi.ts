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
