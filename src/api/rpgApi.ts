import { fetchCsrfToken } from './securityApi'

export type RpgTableListItem = {
  eventID: number
  eventDate: string
  dungeonMaster: { userID: number; nickname: string }
  location: string
  game: string
  comments: string | null
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  maxPlayers: number
}

export type RpgSignupItem = {
  userID: number
  nickname: string
  created_at: string
}

export type RpgTableDetails = {
  eventID: number
  eventDate: string
  dungeonMaster: { userID: number; nickname: string }
  location: string
  game: string
  comments: string | null
  status: 'OPEN' | 'CLOSED' | 'CANCELLED'
  maxPlayers: number
  confirmedCap: number
  confirmed: RpgSignupItem[]
  waitlist: RpgSignupItem[]
}

export type RpgCreateTableBody = {
  eventDate: string
  dungeonMasterUserID?: number
  location: string
  game: string
  comments?: string | null
  maxPlayers?: number
}

type ApiErrorPayload = { message?: string; code?: string }

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (!isRecord(value)) {
    return false
  }

  const messageUnknown = value.message
  const codeUnknown = value.code

  const messageOk = typeof messageUnknown === 'string' || typeof messageUnknown === 'undefined'
  const codeOk = typeof codeUnknown === 'string' || typeof codeUnknown === 'undefined'

  return messageOk && codeOk
}

function parseJsonUnknown(text: string): unknown {
  const parsed: unknown = JSON.parse(text)
  return parsed
}

async function readJsonUnknown(res: Response): Promise<unknown> {
  const text = await res.text()
  return parseJsonUnknown(text)
}

async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const value = await readJsonUnknown(res)
    if (isApiErrorPayload(value) && typeof value.message === 'string' && value.message.length > 0) {
      return value.message
    }
    return fallback
  } catch {
    return fallback
  }
}

function isRpgTableListItem(value: unknown): value is RpgTableListItem {
  if (!isRecord(value)) {
    return false
  }

  const eventID = value.eventID
  const eventDate = value.eventDate
  const dungeonMaster = value.dungeonMaster
  const location = value.location
  const game = value.game
  const comments = value.comments
  const status = value.status
  const maxPlayers = value.maxPlayers

  if (typeof eventID !== 'number') {
    return false
  }

  if (typeof eventDate !== 'string') {
    return false
  }

  if (!isRecord(dungeonMaster)) {
    return false
  }

  const dmUserID = dungeonMaster.userID
  const dmNickname = dungeonMaster.nickname

  if (typeof dmUserID !== 'number') {
    return false
  }

  if (typeof dmNickname !== 'string') {
    return false
  }

  if (typeof location !== 'string') {
    return false
  }

  if (typeof game !== 'string') {
    return false
  }

  const commentsOk = typeof comments === 'string' || comments === null || typeof comments === 'undefined'
  if (!commentsOk) {
    return false
  }

  const statusOk = status === 'OPEN' || status === 'CLOSED' || status === 'CANCELLED'
  if (!statusOk) {
    return false
  }

  if (typeof maxPlayers !== 'number') {
    return false
  }

  return true
}

function hasRpgTableBaseFields(value: unknown): boolean {
  if (!isRecord(value)) {
    return false
  }

  const eventID = value.eventID
  const eventDate = value.eventDate
  const dungeonMaster = value.dungeonMaster
  const location = value.location
  const game = value.game
  const status = value.status
  const maxPlayers = value.maxPlayers

  if (typeof eventID !== 'number') {
    return false
  }

  if (typeof eventDate !== 'string') {
    return false
  }

  if (!isRecord(dungeonMaster)) {
    return false
  }

  const dmUserID = dungeonMaster.userID
  const dmNickname = dungeonMaster.nickname

  if (typeof dmUserID !== 'number') {
    return false
  }

  if (typeof dmNickname !== 'string') {
    return false
  }

  if (typeof location !== 'string') {
    return false
  }

  if (typeof game !== 'string') {
    return false
  }

  const statusOk = status === 'OPEN' || status === 'CLOSED' || status === 'CANCELLED'
  if (!statusOk) {
    return false
  }

  if (typeof maxPlayers !== 'number') {
    return false
  }

  return true
}

function isRpgTableList(value: unknown): value is RpgTableListItem[] {
  return Array.isArray(value) && value.every(isRpgTableListItem)
}

function isSignupItem(value: unknown): value is RpgSignupItem {
  if (!isRecord(value)) {
    return false
  }

  const userID = value.userID
  const nickname = value.nickname
  const createdAt = value.created_at

  return typeof userID === 'number' && typeof nickname === 'string' && typeof createdAt === 'string'
}

function isRpgTableDetails(value: unknown): value is RpgTableDetails {
  if (!hasRpgTableBaseFields(value)) {
    return false
  }

  if (!isRecord(value)) {
    return false
  }

  const comments = value.comments
  const commentsOk = typeof comments === 'string' || comments === null || typeof comments === 'undefined'
  if (!commentsOk) {
    return false
  }

  const confirmedCap = value.confirmedCap
  const confirmed = value.confirmed
  const waitlist = value.waitlist

  if (typeof confirmedCap !== 'number') {
    return false
  }

  if (!Array.isArray(confirmed) || !confirmed.every(isSignupItem)) {
    return false
  }

  if (!Array.isArray(waitlist) || !waitlist.every(isSignupItem)) {
    return false
  }

  return true
}

export async function apiListRpgTables(): Promise<RpgTableListItem[]> {
  const res = await fetch('/api/rpg/tables', { credentials: 'include' })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Impossible de charger les tables JDR'))
  }

  const value: unknown = await readJsonUnknown(res)
  if (!isRpgTableList(value)) {
    throw new Error('Invalid tables payload')
  }

  return value
}

export async function apiGetRpgTable(eventID: number): Promise<RpgTableDetails> {
  const res = await fetch(`/api/rpg/tables/${eventID}`, { credentials: 'include' })
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Impossible de charger la table'))
  }

  const value: unknown = await readJsonUnknown(res)
  if (!isRpgTableDetails(value)) {
    throw new Error('Invalid table payload')
  }

  return value
}

export async function apiSignupRpg(eventID: number): Promise<void> {
  const csrfToken = await fetchCsrfToken()
  const res = await fetch(`/api/rpg/tables/${eventID}/signup`, {
    method: 'POST',
    headers: { 'x-csrf-token': csrfToken },
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Inscription impossible'))
  }
}

export async function apiUnsignupRpg(eventID: number): Promise<void> {
  const csrfToken = await fetchCsrfToken()
  const res = await fetch(`/api/rpg/tables/${eventID}/signup`, {
    method: 'DELETE',
    headers: { 'x-csrf-token': csrfToken },
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Désinscription impossible'))
  }
}

export async function apiCreateRpgTable(body: RpgCreateTableBody): Promise<{ eventID: number; message: string }> {
  const csrfToken = await fetchCsrfToken()
  const res = await fetch('/api/rpg/tables', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-csrf-token': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, 'Création impossible'))
  }

  const value: unknown = await readJsonUnknown(res)

  if (!isRecord(value)) {
    throw new Error('Invalid create payload')
  }

  const eventID = value.eventID
  const message = value.message

  if (typeof eventID !== 'number' || typeof message !== 'string') {
    throw new Error('Invalid create payload')
  }

  return { eventID, message }
}