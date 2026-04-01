import type { ApiError } from "./errors";

export interface LoginBody {
  email: string;
  password: string;
}

export interface LoginSuccess {
  token: string;
}

export type LoginResponse = LoginSuccess | ApiError;
