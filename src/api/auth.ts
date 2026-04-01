import type { SessionInfo } from "../types/api/session";
import { getCsrfToken } from "./csrf";
import { readErrorMessage, readJsonObject } from "./http";

export type Quote = {
  content: string;
  author: string;
};

export type QuoteAdmin = {
  quoteID: number;
  content: string;
  author: string;
  created_at?: string;
};

type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

type AdminUser = {
  userID: number;
  nickname: string;
  email: string;
  roleID: number;
  roleLabel: string;
  isVerified: boolean;
};

type AdminRole = {
  roleID: number;
  roleLabel: string;
};

function isSessionInfo(value: object): value is SessionInfo {
  return (
    "userID" in value &&
    typeof value.userID === "number" &&
    "nickname" in value &&
    typeof value.nickname === "string" &&
    "roleID" in value &&
    typeof value.roleID === "number" &&
    "role" in value &&
    typeof value.role === "string" &&
    "isVerified" in value &&
    typeof value.isVerified === "boolean"
  );
}

function isQuote(value: object): value is Quote {
  return (
    "content" in value &&
    typeof value.content === "string" &&
    "author" in value &&
    typeof value.author === "string"
  );
}

function isAdminRole(value: object): value is AdminRole {
  return (
    "roleID" in value &&
    typeof value.roleID === "number" &&
    "roleLabel" in value &&
    typeof value.roleLabel === "string"
  );
}

function isAdminUser(value: object): value is AdminUser {
  return (
    "userID" in value &&
    typeof value.userID === "number" &&
    "nickname" in value &&
    typeof value.nickname === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "roleID" in value &&
    typeof value.roleID === "number" &&
    "roleLabel" in value &&
    typeof value.roleLabel === "string" &&
    "isVerified" in value &&
    typeof value.isVerified === "boolean"
  );
}

function isAdminUserArray(value: object): value is AdminUser[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === "object" && item !== null && isAdminUser(item as object),
  );
}

function isAdminRoleArray(value: object): value is AdminRole[] {
  if (!Array.isArray(value)) return false;
  return value.every(
    (item) =>
      typeof item === "object" && item !== null && isAdminRole(item as object),
  );
}

function isLogoutResponse(value: object): value is { success: boolean } {
  return "success" in value && typeof value.success === "boolean";
}

function isQuoteAdminArray(value: object): value is QuoteAdmin[] {
  if (!Array.isArray(value)) return false;
  return value.every((v) => {
    if (typeof v !== "object" || v === null) return false;
    const o = v as Record<string, string | number | undefined>;
    return (
      typeof o.quoteID === "number" &&
      typeof o.content === "string" &&
      typeof o.author === "string"
    );
  });
}

function isQuoteAdmin(value: object): value is QuoteAdmin {
  const record = value as Record<string, string | number | undefined>;

  const createdAt = record.created_at;

  return (
    "quoteID" in value &&
    typeof value.quoteID === "number" &&
    "content" in value &&
    typeof value.content === "string" &&
    "author" in value &&
    typeof value.author === "string" &&
    (typeof createdAt === "string" || typeof createdAt === "undefined")
  );
}

function isPaginatedQuoteAdmin(value: object): value is Paginated<QuoteAdmin> {
  const record = value as Record<
    string,
    string | number | boolean | object | object[] | null
  >;

  const items = record.items;
  const page = record.page;
  const limit = record.limit;
  const totalItems = record.totalItems;
  const totalPages = record.totalPages;

  return (
    Array.isArray(items) &&
    isQuoteAdminArray(items as object) &&
    typeof page === "number" &&
    typeof limit === "number" &&
    typeof totalItems === "number" &&
    typeof totalPages === "number"
  );
}

export async function apiSignin(
  nickname: string,
  email: string,
  password: string,
  passwordCheck: string,
): Promise<void> {
  const csrfToken = await getCsrfToken();

  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify({ nickname, email, password, passwordCheck }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Erreur lors de la création du compte"),
    );
  }
}

export async function apiLogin(email: string, password: string): Promise<void> {
  const csrfToken = await getCsrfToken();

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Erreur lors de la connexion"));
  }
}

export async function apiSession(): Promise<SessionInfo> {
  const res = await fetch("/api/session", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Not authenticated"));
  }

  const obj = await readJsonObject(res);
  if (!isSessionInfo(obj)) {
    throw new Error("Invalid session payload");
  }

  return obj;
}

export async function apiLogout(): Promise<{ success: boolean }> {
  const csrfToken = await getCsrfToken();

  const res = await fetch("/api/logout", {
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Logout failed"));
  }

  const obj = await readJsonObject(res);
  if (!isLogoutResponse(obj)) {
    throw new Error("Invalid logout payload");
  }

  return obj;
}

export async function apiQuote(): Promise<Quote> {
  const res = await fetch("/api/quote", { credentials: "include" });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(
        res,
        "Erreur lors de la récupération de la citation",
      ),
    );
  }

  const obj = await readJsonObject(res);
  if (!isQuote(obj)) {
    throw new Error("Invalid quote payload");
  }

  return obj;
}

export async function apiQuotesList(
  page = 1,
  limit = 10,
  q = "",
): Promise<Paginated<QuoteAdmin>> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (q.trim().length > 0) params.set("q", q.trim());

  const res = await fetch(`/api/quotes?${params.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Erreur lors du chargement des citations"),
    );
  }

  const obj = await readJsonObject(res);
  if (!isPaginatedQuoteAdmin(obj)) {
    throw new Error("Invalid quotes payload");
  }

  return obj;
}

export async function apiQuotesCreate(payload: {
  content: string;
  author?: string;
}): Promise<QuoteAdmin> {
  const csrfToken = await getCsrfToken();

  const res = await fetch("/api/quotes", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Erreur lors de l'ajout de la citation"),
    );
  }

  const obj = await readJsonObject(res);
  if (!isQuoteAdmin(obj)) {
    throw new Error("Invalid quote payload");
  }

  return obj;
}

export async function apiQuotesUpdate(
  quoteID: number,
  payload: { content: string; author?: string },
): Promise<QuoteAdmin> {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`/api/quotes/${quoteID}`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Erreur lors de la mise à jour"),
    );
  }

  const obj = await readJsonObject(res);
  if (!isQuoteAdmin(obj)) {
    throw new Error("Invalid quote payload");
  }

  return obj;
}

export async function apiQuotesDelete(quoteID: number): Promise<void> {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`/api/quotes/${quoteID}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "x-csrf-token": csrfToken,
    },
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Erreur lors de la suppression"),
    );
  }
}

export async function apiAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/admin/users", {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const msg = await readErrorMessage(
      res,
      `Erreur ${res.status}: ${res.statusText}`,
    );
    console.error("Erreur API admin/users:", { status: res.status });
    throw new Error(msg);
  }

  const obj = await readJsonObject(res);
  if (!isAdminUserArray(obj)) {
    throw new Error("Invalid admin users payload");
  }

  return obj;
}

export async function apiAdminRoles(): Promise<AdminRole[]> {
  const res = await fetch("/api/admin/roles", {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const msg = await readErrorMessage(
      res,
      `Erreur ${res.status}: ${res.statusText}`,
    );
    console.error("Erreur API admin/roles:", { status: res.status });
    throw new Error(msg);
  }

  const obj = await readJsonObject(res);
  if (!isAdminRoleArray(obj)) {
    throw new Error("Invalid admin roles payload");
  }

  return obj;
}

export async function apiAdminUpdateRole(
  userID: number,
  roleID: number,
): Promise<AdminUser> {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`/api/admin/users/${userID}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify({ roleID }),
  });

  if (!res.ok) {
    const msg = await readErrorMessage(
      res,
      `Erreur ${res.status}: ${res.statusText}`,
    );
    console.error("Erreur API admin/updateRole:", { status: res.status });
    throw new Error(msg);
  }

  const obj = await readJsonObject(res);
  if (!isAdminUser(obj)) {
    throw new Error("Invalid admin user payload");
  }

  return obj;
}
