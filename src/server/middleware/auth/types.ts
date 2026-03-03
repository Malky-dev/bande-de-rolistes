import type { Model } from "sequelize";

export interface RoleAttributes {
  roleID: number;
  roleLabel: string;
}
export type RoleInstance = Model<RoleAttributes> & RoleAttributes;

export interface UserAttributes {
  userID: number;
  nickname: string;
  Role?: RoleInstance;
}
export type UserInstance = Model<UserAttributes> & UserAttributes;

export interface SessionAttributes {
  sessionID: number;
  token: string;
  expiration: Date;
  User?: UserInstance;
}
export type SessionInstance = Model<SessionAttributes> & SessionAttributes;
