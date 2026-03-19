import { fetchCsrfToken } from "./securityApi";
import type {
  CreatePollBody,
  CreatePollOptionBody,
  PollAuthorView,
  PollDetails,
  PollListItem,
  PollOptionView,
  PollVoterView,
  ReplacePollVoteBody,
  UpdatePollBody,
  UpdatePollOptionBody,
} from "../types/api/polls";

type JsonPrimitive = boolean | number | string | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type ApiErrorPayload = {
  message?: string;
  code?: string;
};

type ApiMessagePayload = {
  message: string;
};

type ApiCreatePollPayload = {
  pollID: number;
  message: string;
};

function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(text: string): JsonValue {
  return JSON.parse(text) as JsonValue;
}

async function readJson(res: Response): Promise<JsonValue> {
  const text = await res.text();
  return parseJson(text);
}

function isApiErrorPayload(value: JsonValue): value is ApiErrorPayload {
  if (!isJsonObject(value)) {
    return false;
  }

  const message = value.message;
  const code = value.code;

  const isMessageValid =
    typeof message === "string" || typeof message === "undefined";
  const isCodeValid = typeof code === "string" || typeof code === "undefined";

  return isMessageValid && isCodeValid;
}

async function readErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const value = await readJson(res);

    if (isApiErrorPayload(value) && typeof value.message === "string") {
      if (value.message.length > 0) {
        return value.message;
      }
    }

    return fallback;
  } catch {
    return fallback;
  }
}

function isPollAuthorView(value: JsonValue): value is PollAuthorView {
  if (!isJsonObject(value)) {
    return false;
  }

  return typeof value.userID === "number" && typeof value.nickname === "string";
}

function isPollVoterView(value: JsonValue): value is PollVoterView {
  if (!isJsonObject(value)) {
    return false;
  }

  return typeof value.userID === "number" && typeof value.nickname === "string";
}

function isPollOptionView(value: JsonValue): value is PollOptionView {
  if (!isJsonObject(value)) {
    return false;
  }

  const voters = value.voters;

  return (
    typeof value.optionID === "number" &&
    typeof value.label === "string" &&
    typeof value.displayOrder === "number" &&
    typeof value.voteCount === "number" &&
    Array.isArray(voters) &&
    voters.every(isPollVoterView)
  );
}

function isPollListItem(value: JsonValue): value is PollListItem {
  if (!isJsonObject(value)) {
    return false;
  }

  const description = value.description;

  return (
    typeof value.pollID === "number" &&
    typeof value.title === "string" &&
    (typeof description === "string" || description === null) &&
    typeof value.endAt === "string" &&
    typeof value.createdAt === "string" &&
    isPollAuthorView(value.createdBy) &&
    typeof value.maxSelections === "number" &&
    typeof value.totalVoters === "number" &&
    typeof value.totalVotes === "number" &&
    typeof value.isClosed === "boolean" &&
    typeof value.canManage === "boolean"
  );
}

function isPollDetails(value: JsonValue): value is PollDetails {
  if (!isJsonObject(value)) {
    return false;
  }

  const description = value.description;
  const myVote = value.myVote;
  const options = value.options;

  return (
    typeof value.pollID === "number" &&
    typeof value.title === "string" &&
    (typeof description === "string" || description === null) &&
    typeof value.endAt === "string" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    isPollAuthorView(value.createdBy) &&
    typeof value.maxSelections === "number" &&
    typeof value.isClosed === "boolean" &&
    typeof value.canVote === "boolean" &&
    typeof value.canManage === "boolean" &&
    Array.isArray(myVote) &&
    myVote.every((entry) => typeof entry === "number") &&
    Array.isArray(options) &&
    options.every(isPollOptionView)
  );
}

function isPollList(value: JsonValue): value is PollListItem[] {
  return Array.isArray(value) && value.every(isPollListItem);
}

function isCreatePollPayload(value: JsonValue): value is ApiCreatePollPayload {
  if (!isJsonObject(value)) {
    return false;
  }

  return typeof value.pollID === "number" && typeof value.message === "string";
}

function isMessagePayload(value: JsonValue): value is ApiMessagePayload {
  if (!isJsonObject(value)) {
    return false;
  }

  return typeof value.message === "string";
}

export async function apiListPolls(): Promise<PollListItem[]> {
  const res = await fetch("/api/polls", {
    credentials: "include",
  });

  if (!res.ok) {
    const backendMessage = await readErrorMessage(
      res,
      `Impossible de charger les sondages (HTTP ${res.status}).`,
    );
    throw new Error(backendMessage);
  }

  const text = await res.text();

  let value: JsonValue;
  try {
    value = parseJson(text);
  } catch {
    throw new Error(`Réponse JSON invalide pour /api/polls : ${text}`);
  }

  if (!isPollList(value)) {
    throw new Error(
      `Payload inattendu pour /api/polls : ${JSON.stringify(value)}`,
    );
  }

  return value;
}

export async function apiGetPoll(pollID: number): Promise<PollDetails> {
  const res = await fetch(`/api/polls/${pollID}`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Impossible de charger le sondage."),
    );
  }

  const value = await readJson(res);

  if (!isPollDetails(value)) {
    throw new Error("Invalid poll payload");
  }

  return value;
}

export async function apiCreatePoll(
  body: CreatePollBody,
): Promise<{ pollID: number; message: string }> {
  const csrfToken = await fetchCsrfToken();

  const res = await fetch("/api/polls", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Création du sondage impossible."),
    );
  }

  const value = await readJson(res);

  if (!isCreatePollPayload(value)) {
    throw new Error("Invalid create poll payload");
  }

  return value;
}

export async function apiUpdatePoll(
  pollID: number,
  body: UpdatePollBody,
): Promise<string> {
  const csrfToken = await fetchCsrfToken();

  const res = await fetch(`/api/polls/${pollID}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Mise à jour du sondage impossible."),
    );
  }

  const value = await readJson(res);
  if (!isMessagePayload(value)) {
    throw new Error("Invalid update poll payload");
  }

  return value.message;
}

export async function apiDeletePoll(pollID: number): Promise<string> {
  const csrfToken = await fetchCsrfToken();

  const res = await fetch(`/api/polls/${pollID}`, {
    method: "DELETE",
    headers: {
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Suppression du sondage impossible."),
    );
  }

  const value = await readJson(res);

  if (!isMessagePayload(value)) {
    throw new Error("Invalid delete poll payload");
  }

  return value.message;
}

export async function apiCreatePollOption(
  pollID: number,
  body: CreatePollOptionBody,
): Promise<string> {
  const csrfToken = await fetchCsrfToken();

  const res = await fetch(`/api/polls/${pollID}/options`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Création de l'option impossible."),
    );
  }

  const value = await readJson(res);

  if (!isMessagePayload(value)) {
    throw new Error("Invalid create option payload");
  }

  return value.message;
}

export async function apiUpdatePollOption(
  pollID: number,
  optionID: number,
  body: UpdatePollOptionBody,
): Promise<string> {
  const csrfToken = await fetchCsrfToken();

  const res = await fetch(`/api/polls/${pollID}/options/${optionID}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Mise à jour de l'option impossible."),
    );
  }

  const value = await readJson(res);
  if (!isMessagePayload(value)) {
    throw new Error("Invalid update option payload");
  }

  return value.message;
}

export async function apiDeletePollOption(
  pollID: number,
  optionID: number,
): Promise<string> {
  const csrfToken = await fetchCsrfToken();

  const res = await fetch(`/api/polls/${pollID}/options/${optionID}`, {
    method: "DELETE",
    headers: {
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Suppression de l'option impossible."),
    );
  }

  const value = await readJson(res);

  if (!isMessagePayload(value)) {
    throw new Error("Invalid delete option payload");
  }

  return value.message;
}

export async function apiReplacePollVote(
  pollID: number,
  body: ReplacePollVoteBody,
): Promise<string> {
  const csrfToken = await fetchCsrfToken();

  const res = await fetch(`/api/polls/${pollID}/vote`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res, "Vote impossible."));
  }

  const value = await readJson(res);

  if (!isMessagePayload(value)) {
    throw new Error("Invalid vote payload");
  }

  return value.message;
}

export async function apiDeletePollVote(pollID: number): Promise<string> {
  const csrfToken = await fetchCsrfToken();

  const res = await fetch(`/api/polls/${pollID}/vote`, {
    method: "DELETE",
    headers: {
      "x-csrf-token": csrfToken,
    },
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Suppression du vote impossible."),
    );
  }

  const value = await readJson(res);

  if (!isMessagePayload(value)) {
    throw new Error("Invalid delete vote payload");
  }

  return value.message;
}
