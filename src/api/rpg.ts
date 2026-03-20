import { getCsrfToken } from "./csrf";
import { readErrorMessage, readJsonObject } from "./http";
import type { RpgTableStatus } from "../shared/constants";

import type {
  RpgTableListItem,
  RpgTableDetails,
  RpgSignupItem,
  RpgCreateTableBody,
  RpgUpdateTableBody,
} from "../types/api/rpg";

type ApiCreateRpgTablePayload = {
  eventID: number;
  message: string;
};

export function isRpgTableStatus(value: string): value is RpgTableStatus {
  return value === "OPEN" || value === "CLOSED" || value === "CANCELLED";
}

export function isRpgTableStatusList(value: object): value is RpgTableStatus[] {
  return (
    Array.isArray(value) &&
    value.every((entry) => typeof entry === "string" && isRpgTableStatus(entry))
  );
}

function isDungeonMaster(
  value: object,
): value is { userID: number; nickname: string } {
  return (
    "userID" in value &&
    typeof value.userID === "number" &&
    "nickname" in value &&
    typeof value.nickname === "string"
  );
}

export function isRpgTableListItem(value: object): value is RpgTableListItem {
  const record = value as Record<
    string,
    string | number | boolean | object | object[] | null
  >;

  const comments = record.comments;
  const dungeonMaster = record.dungeonMaster;
  const status = record.status;

  return (
    "eventID" in value &&
    typeof value.eventID === "number" &&
    "eventDate" in value &&
    typeof value.eventDate === "string" &&
    typeof dungeonMaster === "object" &&
    dungeonMaster !== null &&
    isDungeonMaster(dungeonMaster as object) &&
    "location" in value &&
    typeof value.location === "string" &&
    "game" in value &&
    typeof value.game === "string" &&
    (typeof comments === "string" ||
      comments === null ||
      typeof comments === "undefined") &&
    typeof status === "string" &&
    isRpgTableStatus(status) &&
    "maxPlayers" in value &&
    typeof value.maxPlayers === "number"
  );
}

export function hasRpgTableBaseFields(value: object): boolean {
  const record = value as Record<
    string,
    string | number | boolean | object | object[] | null
  >;

  const dungeonMaster = record.dungeonMaster;
  const status = record.status;

  return (
    "eventID" in value &&
    typeof value.eventID === "number" &&
    "eventDate" in value &&
    typeof value.eventDate === "string" &&
    typeof dungeonMaster === "object" &&
    dungeonMaster !== null &&
    isDungeonMaster(dungeonMaster as object) &&
    "location" in value &&
    typeof value.location === "string" &&
    "game" in value &&
    typeof value.game === "string" &&
    typeof status === "string" &&
    isRpgTableStatus(status) &&
    "maxPlayers" in value &&
    typeof value.maxPlayers === "number"
  );
}

export function isRpgTableList(value: object): value is RpgTableListItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        isRpgTableListItem(entry as object),
    )
  );
}

export function isSignupItem(value: object): value is RpgSignupItem {
  return (
    "userID" in value &&
    typeof value.userID === "number" &&
    "nickname" in value &&
    typeof value.nickname === "string" &&
    "created_at" in value &&
    typeof (value as Record<string, string | number>).created_at === "string"
  );
}

export function isRpgTableDetails(value: object): value is RpgTableDetails {
  if (!hasRpgTableBaseFields(value)) {
    return false;
  }

  const record = value as Record<
    string,
    string | number | boolean | object | object[] | null
  >;

  const comments = record.comments;
  const confirmed = record.confirmed;
  const waitlist = record.waitlist;
  const confirmedCap = record.confirmedCap;

  return (
    (typeof comments === "string" ||
      comments === null ||
      typeof comments === "undefined") &&
    typeof confirmedCap === "number" &&
    Array.isArray(confirmed) &&
    confirmed.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        isSignupItem(entry as object),
    ) &&
    Array.isArray(waitlist) &&
    waitlist.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        isSignupItem(entry as object),
    )
  );
}

function isCreateRpgTablePayload(
  value: object,
): value is ApiCreateRpgTablePayload {
  return (
    "eventID" in value &&
    typeof value.eventID === "number" &&
    "message" in value &&
    typeof value.message === "string"
  );
}

export async function apiListRpgTables(): Promise<RpgTableListItem[]> {
  const res = await fetch("/api/rpg/tables", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Impossible de charger les tables JDR"),
    );
  }

  const obj = await readJsonObject(res);

  if (!isRpgTableList(obj)) {
    throw new Error("Invalid tables payload");
  }

  return obj;
}

export async function apiGetRpgTable(
  eventID: number,
): Promise<RpgTableDetails> {
  const res = await fetch(`/api/rpg/tables/${eventID}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Impossible de charger la table"),
    );
  }

  const obj = await readJsonObject(res);

  if (!isRpgTableDetails(obj)) {
    throw new Error("Invalid table payload");
  }

  return obj;
}

export async function apiSignupRpg(eventID: number): Promise<void> {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`/api/rpg/tables/${eventID}/signup`, {
    method: "POST",
    headers: {
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Inscription impossible"));
  }
}

export async function apiUnsignupRpg(eventID: number): Promise<void> {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`/api/rpg/tables/${eventID}/signup`, {
    method: "DELETE",
    headers: {
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Désinscription impossible"));
  }
}

export async function apiCreateRpgTable(
  body: RpgCreateTableBody,
): Promise<{ eventID: number; message: string }> {
  const csrfToken = await getCsrfToken();

  const res = await fetch("/api/rpg/tables", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Création impossible"));
  }

  const obj = await readJsonObject(res);

  if (!isCreateRpgTablePayload(obj)) {
    throw new Error("Invalid create payload");
  }

  return obj;
}

export async function apiUpdateRpgTable(
  eventID: number,
  body: RpgUpdateTableBody,
): Promise<void> {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`/api/rpg/tables/${eventID}`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Mise à jour impossible"));
  }
}

export async function apiUpdateRpgTableStatus(
  eventID: number,
  status: RpgTableStatus,
): Promise<void> {
  const csrfToken = await getCsrfToken();

  const res = await fetch(`/api/rpg/tables/${eventID}/status`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Mise à jour du statut impossible"),
    );
  }
}

export async function apiListRpgStatuses(): Promise<RpgTableStatus[]> {
  const res = await fetch("/api/rpg/tables/statuses", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Impossible de charger les statuts"),
    );
  }

  const obj = await readJsonObject(res);

  if (!isRpgTableStatusList(obj)) {
    throw new Error("Invalid statuses payload");
  }

  return obj;
}
