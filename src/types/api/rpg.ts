import type { RpgTableStatus } from '../../shared/constants'

export type RpgTableListItem = {
  eventID: number
  eventDate: string
  dungeonMaster: { userID: number; nickname: string }
  location: string
  game: string
  comments: string | null
  status: RpgTableStatus
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
  status: RpgTableStatus
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

export type RpgUpdateTableBody = {
  eventDate?: string
  location?: string
  game?: string
  comments?: string | null
  maxPlayers?: number
}