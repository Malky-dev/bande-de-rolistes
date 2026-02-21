import 'express-serve-static-core'

/* ============================
   Role
============================ */
export interface RoleLike {
  roleID: number
  roleLabel: string
}

/* ============================
   User
============================ */
export interface UserLike {
  userID: number
  nickname: string
  Role?: RoleLike
}

/* ============================
   Session
============================ */
export interface SessionLike {
  sessionID: number
  token: string
  expiration: Date
  User?: UserLike
}

/* ============================
   Express augmentation
============================ */
declare module 'express-serve-static-core' {
  interface Request {
    user?: UserLike
    session?: SessionLike
  }
}

export {}