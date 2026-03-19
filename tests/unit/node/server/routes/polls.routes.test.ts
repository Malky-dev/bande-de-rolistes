import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRouterMock } from "./_routerMock";

const router = createRouterMock();

vi.mock("express", async () => {
  const actual = await vi.importActual<typeof import("express")>("express");
  return {
    ...actual,
    Router: () => router,
  };
});

const controllerListPolls = vi.fn();
const controllerGetPoll = vi.fn();
const controllerCreatePoll = vi.fn();
const controllerUpdatePoll = vi.fn();
const controllerDeletePoll = vi.fn();
const controllerCreateOption = vi.fn();
const controllerUpdateOption = vi.fn();
const controllerDeleteOption = vi.fn();
const controllerReplaceVote = vi.fn();
const controllerDeleteVote = vi.fn();

vi.mock("@/server/controllers/polls/listPolls", () => ({
  default: controllerListPolls,
}));
vi.mock("@/server/controllers/polls/getPoll", () => ({
  default: controllerGetPoll,
}));
vi.mock("@/server/controllers/polls/createPoll", () => ({
  default: controllerCreatePoll,
}));
vi.mock("@/server/controllers/polls/updatePoll", () => ({
  default: controllerUpdatePoll,
}));
vi.mock("@/server/controllers/polls/deletePoll", () => ({
  default: controllerDeletePoll,
}));
vi.mock("@/server/controllers/polls/createOption", () => ({
  default: controllerCreateOption,
}));
vi.mock("@/server/controllers/polls/updateOption", () => ({
  default: controllerUpdateOption,
}));
vi.mock("@/server/controllers/polls/deleteOption", () => ({
  default: controllerDeleteOption,
}));
vi.mock("@/server/controllers/polls/replaceVote", () => ({
  default: controllerReplaceVote,
}));
vi.mock("@/server/controllers/polls/deleteVote", () => ({
  default: controllerDeleteVote,
}));

const requestLimiter = vi.fn();
const requireAuth = vi.fn();
const optionalAuth = vi.fn();

const verifyCsrfMw = vi.fn();
const verifyCsrf = vi.fn(() => verifyCsrfMw);

vi.mock("@/server/middleware", () => ({
  requestLimiter,
  requireAuth,
  optionalAuth,
  verifyCsrf,
}));

describe("routes polls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.get.mockClear();
    router.post.mockClear();
    router.patch.mockClear();
    router.delete.mockClear();
    router.put.mockClear();
    router.use.mockClear();
  });

  it("déclare toutes les routes polls avec les middlewares attendus", async () => {
    const mod = await import("@/server/routes/polls");
    expect(mod).toHaveProperty("default");

    expect(router.get).toHaveBeenCalledWith(
      "/polls",
      requestLimiter,
      optionalAuth,
      controllerListPolls,
    );

    expect(router.get).toHaveBeenCalledWith(
      "/polls/:pollID",
      requestLimiter,
      optionalAuth,
      controllerGetPoll,
    );

    expect(router.post).toHaveBeenCalledWith(
      "/polls",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerCreatePoll,
    );

    expect(router.patch).toHaveBeenCalledWith(
      "/polls/:pollID",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerUpdatePoll,
    );

    expect(router.delete).toHaveBeenCalledWith(
      "/polls/:pollID",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerDeletePoll,
    );

    expect(router.post).toHaveBeenCalledWith(
      "/polls/:pollID/options",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerCreateOption,
    );

    expect(router.patch).toHaveBeenCalledWith(
      "/polls/:pollID/options/:optionID",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerUpdateOption,
    );

    expect(router.delete).toHaveBeenCalledWith(
      "/polls/:pollID/options/:optionID",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerDeleteOption,
    );

    expect(router.put).toHaveBeenCalledWith(
      "/polls/:pollID/vote",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerReplaceVote,
    );

    expect(router.delete).toHaveBeenCalledWith(
      "/polls/:pollID/vote",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerDeleteVote,
    );

    expect(verifyCsrf).toHaveBeenCalledTimes(8);
  });
});
