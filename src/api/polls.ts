import { getCsrfToken } from "./csrf";
import { readErrorMessage, readJsonObject } from "./http";
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

type ApiMessagePayload = {
  message: string;
};

type ApiCreatePollPayload = {
  pollID: number;
  message: string;
};

function isPollAuthorView(value: object): value is PollAuthorView {
  return (
    "userID" in value &&
    typeof value.userID === "number" &&
    "nickname" in value &&
    typeof value.nickname === "string"
  );
}

function isPollVoterView(value: object): value is PollVoterView {
  return (
    "userID" in value &&
    typeof value.userID === "number" &&
    "nickname" in value &&
    typeof value.nickname === "string"
  );
}

function isPollOptionView(value: object): value is PollOptionView {
  const record = value as Record<
    string,
    string | number | boolean | object | object[] | null
  >;

  const voters = record.voters;

  return (
    "optionID" in value &&
    typeof value.optionID === "number" &&
    "label" in value &&
    typeof value.label === "string" &&
    "displayOrder" in value &&
    typeof value.displayOrder === "number" &&
    "voteCount" in value &&
    typeof value.voteCount === "number" &&
    Array.isArray(voters) &&
    voters.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        isPollVoterView(entry as object),
    )
  );
}

function isPollListItem(value: object): value is PollListItem {
  const record = value as Record<
    string,
    string | number | boolean | object | number[] | object[] | null
  >;

  const description = record.description;

  return (
    "pollID" in value &&
    typeof value.pollID === "number" &&
    "title" in value &&
    typeof value.title === "string" &&
    (typeof description === "string" || description === null) &&
    "endAt" in value &&
    typeof value.endAt === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "createdBy" in value &&
    typeof value.createdBy === "object" &&
    value.createdBy !== null &&
    isPollAuthorView(value.createdBy) &&
    "maxSelections" in value &&
    typeof value.maxSelections === "number" &&
    "totalVoters" in value &&
    typeof value.totalVoters === "number" &&
    "totalVotes" in value &&
    typeof value.totalVotes === "number" &&
    "isClosed" in value &&
    typeof value.isClosed === "boolean" &&
    "canManage" in value &&
    typeof value.canManage === "boolean"
  );
}

function isPollDetails(value: object): value is PollDetails {
  const record = value as Record<
    string,
    string | number | boolean | object | number[] | object[] | null
  >;

  const description = record.description;
  const myVote = record.myVote;
  const options = record.options;

  return (
    "pollID" in value &&
    typeof value.pollID === "number" &&
    "title" in value &&
    typeof value.title === "string" &&
    (typeof description === "string" || description === null) &&
    "endAt" in value &&
    typeof value.endAt === "string" &&
    "createdAt" in value &&
    typeof value.createdAt === "string" &&
    "updatedAt" in value &&
    typeof value.updatedAt === "string" &&
    "createdBy" in value &&
    typeof value.createdBy === "object" &&
    value.createdBy !== null &&
    isPollAuthorView(value.createdBy) &&
    "maxSelections" in value &&
    typeof value.maxSelections === "number" &&
    "isClosed" in value &&
    typeof value.isClosed === "boolean" &&
    "canVote" in value &&
    typeof value.canVote === "boolean" &&
    "canManage" in value &&
    typeof value.canManage === "boolean" &&
    Array.isArray(myVote) &&
    myVote.every((entry) => typeof entry === "number") &&
    Array.isArray(options) &&
    options.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        isPollOptionView(entry as object),
    )
  );
}

function isPollList(value: object): value is PollListItem[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        isPollListItem(entry as object),
    )
  );
}

function isCreatePollPayload(value: object): value is ApiCreatePollPayload {
  return (
    "pollID" in value &&
    typeof value.pollID === "number" &&
    "message" in value &&
    typeof value.message === "string"
  );
}

function isMessagePayload(value: object): value is ApiMessagePayload {
  return "message" in value && typeof value.message === "string";
}

export async function apiListPolls(): Promise<PollListItem[]> {
  const res = await fetch("/api/polls", {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(
        res,
        `Impossible de charger les sondages (HTTP ${res.status}).`,
      ),
    );
  }

  const obj = await readJsonObject(res);

  if (!isPollList(obj)) {
    throw new Error("Invalid polls payload");
  }

  return obj;
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

  const obj = await readJsonObject(res);

  if (!isPollDetails(obj)) {
    throw new Error("Invalid poll payload");
  }

  return obj;
}

export async function apiCreatePoll(
  body: CreatePollBody,
): Promise<{ pollID: number; message: string }> {
  const csrfToken = await getCsrfToken();

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

  const obj = await readJsonObject(res);

  if (!isCreatePollPayload(obj)) {
    throw new Error("Invalid create poll payload");
  }

  return obj;
}

export async function apiUpdatePoll(
  pollID: number,
  body: UpdatePollBody,
): Promise<string> {
  const csrfToken = await getCsrfToken();

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

  const obj = await readJsonObject(res);

  if (!isMessagePayload(obj)) {
    throw new Error("Invalid update poll payload");
  }

  return obj.message;
}

export async function apiDeletePoll(pollID: number): Promise<string> {
  const csrfToken = await getCsrfToken();

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

  const obj = await readJsonObject(res);

  if (!isMessagePayload(obj)) {
    throw new Error("Invalid delete poll payload");
  }

  return obj.message;
}

export async function apiCreatePollOption(
  pollID: number,
  body: CreatePollOptionBody,
): Promise<string> {
  const csrfToken = await getCsrfToken();

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

  const obj = await readJsonObject(res);

  if (!isMessagePayload(obj)) {
    throw new Error("Invalid create option payload");
  }

  return obj.message;
}

export async function apiUpdatePollOption(
  pollID: number,
  optionID: number,
  body: UpdatePollOptionBody,
): Promise<string> {
  const csrfToken = await getCsrfToken();

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

  const obj = await readJsonObject(res);

  if (!isMessagePayload(obj)) {
    throw new Error("Invalid update option payload");
  }

  return obj.message;
}

export async function apiDeletePollOption(
  pollID: number,
  optionID: number,
): Promise<string> {
  const csrfToken = await getCsrfToken();

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

  const obj = await readJsonObject(res);

  if (!isMessagePayload(obj)) {
    throw new Error("Invalid delete option payload");
  }

  return obj.message;
}

export async function apiReplacePollVote(
  pollID: number,
  body: ReplacePollVoteBody,
): Promise<string> {
  const csrfToken = await getCsrfToken();

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

  const obj = await readJsonObject(res);

  if (!isMessagePayload(obj)) {
    throw new Error("Invalid vote payload");
  }

  return obj.message;
}

export async function apiDeletePollVote(pollID: number): Promise<string> {
  const csrfToken = await getCsrfToken();

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

  const obj = await readJsonObject(res);

  if (!isMessagePayload(obj)) {
    throw new Error("Invalid delete vote payload");
  }

  return obj.message;
}
