// src/api/account.ts

import { getCsrfToken } from "./csrf";
import { readErrorMessage, readJsonObject } from "./http";

type AccountMe = {
  userID: number;
  nickname: string;
  email: string;
  discordId: string | null;
};

type UpdateAccountBody = {
  nickname: string;
};

function isAccountMe(value: object): value is AccountMe {
  const record = value as Record<string, string | number | null>;

  const discordId = record.discordId;

  return (
    "userID" in value &&
    typeof value.userID === "number" &&
    "nickname" in value &&
    typeof value.nickname === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "discordId" in value &&
    (typeof discordId === "string" || discordId === null)
  );
}

export async function apiGetAccount(): Promise<AccountMe> {
  const res = await fetch("/api/account", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `Erreur ${res.status}: ${res.statusText}`),
    );
  }

  const obj = await readJsonObject(res);

  if (!isAccountMe(obj)) {
    throw new Error("Invalid account payload");
  }

  return obj;
}

export async function apiUpdateAccount(
  body: UpdateAccountBody,
): Promise<AccountMe> {
  const csrfToken = await getCsrfToken();

  const res = await fetch("/api/account", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, `Erreur ${res.status}: ${res.statusText}`),
    );
  }

  const obj = await readJsonObject(res);

  if (!isAccountMe(obj)) {
    throw new Error("Invalid account payload");
  }

  return obj;
}
