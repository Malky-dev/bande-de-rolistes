// src/api/accountApi.ts

export type AccountMe = {
    userID: number
    nickname: string
    email: string
    discordId: string | null
  }
  
  export type UpdateAccountBody = {
    nickname: string
  }
  
  type ApiErrorPayload = { message?: string; code?: string }
  
  function isApiErrorPayload(value: object): value is ApiErrorPayload {
    return (
      (!('message' in value) || typeof value.message === 'string') &&
      (!('code' in value) || typeof value.code === 'string')
    )
  }
  
  function parseJsonObject(text: string): object {
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
  
  function isAccountMe(value: object): value is AccountMe {
    return (
      'userID' in value &&
      typeof value.userID === 'number' &&
      'nickname' in value &&
      typeof value.nickname === 'string' &&
      'email' in value &&
      typeof value.email === 'string' &&
      'discordId' in value &&
      (typeof (value as { discordId: unknown }).discordId === 'string' ||
        (value as { discordId: unknown }).discordId === null)
    )
  }
  
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
  
  // ----------------------------------
  // Account
  // ----------------------------------
  
  export async function apiGetAccount(): Promise<AccountMe> {
    const res = await fetch('/api/account', {
      credentials: 'include',
    })
  
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, `Erreur ${res.status}: ${res.statusText}`))
    }
  
    const obj = await readJsonObject(res)
    if (!isAccountMe(obj)) {
      throw new Error('Invalid account payload')
    }
  
    return obj
  }
  
  export async function apiUpdateAccount(body: UpdateAccountBody): Promise<AccountMe> {
    const csrfToken = await getCsrfToken()
  
    const res = await fetch('/api/account', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })
  
    if (!res.ok) {
      throw new Error(await readErrorMessage(res, `Erreur ${res.status}: ${res.statusText}`))
    }
  
    const obj = await readJsonObject(res)
    if (!isAccountMe(obj)) {
      throw new Error('Invalid account payload')
    }
  
    return obj
  }