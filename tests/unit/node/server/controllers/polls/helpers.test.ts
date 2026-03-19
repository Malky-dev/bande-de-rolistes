import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";

import type { ApiError } from "@/types/api/errors";
import {
  badRequest,
  canManagePoll,
  canVotePoll,
  forbid,
  getRoleID,
  getUserID,
  hasRole,
  isPollClosed,
  notFound,
  normalizeOptionalString,
  normalizeOptionLabels,
  normalizeString,
  parseIntParam,
  uniqueNumbers,
  unauthorized,
} from "@/server/controllers/polls/helpers";

type ReqForGetRoleID = Parameters<typeof getRoleID>[0];
type ReqForGetUserID = Parameters<typeof getUserID>[0];
type ReqForHasRole = Parameters<typeof hasRole>[0];

const makeRes = () => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const resObj = { status, json } as unknown as Response<ApiError>;
  return { res: resObj, status, json };
};

const reqNoUser = <TReq>(): TReq => ({ user: undefined }) as unknown as TReq;
const reqUser = <TReq>(u: unknown): TReq => ({ user: u }) as unknown as TReq;

describe("helpers polls", () => {
  it("getUserID retourne undefined s'il n'y a pas d'utilisateur ou de userID", () => {
    expect(getUserID(reqNoUser<ReqForGetUserID>())).toBeUndefined();
    expect(getUserID(reqUser<ReqForGetUserID>({}))).toBeUndefined();
  });

  it("getUserID retourne userID s'il est présent", () => {
    const u = { userID: 7, nickname: "Neo" };
    expect(getUserID(reqUser<ReqForGetUserID>(u))).toBe(7);
  });

  it("getRoleID retourne undefined s'il n'y a pas d'utilisateur ou de rôle", () => {
    expect(getRoleID(reqNoUser<ReqForGetRoleID>())).toBeUndefined();
    expect(getRoleID(reqUser<ReqForGetRoleID>({}))).toBeUndefined();
    expect(
      getRoleID(reqUser<ReqForGetRoleID>({ role: undefined })),
    ).toBeUndefined();
    expect(getRoleID(reqUser<ReqForGetRoleID>({ role: {} }))).toBeUndefined();
  });

  it("getRoleID retourne roleID s'il est présent", () => {
    const u = { userID: 7, nickname: "Neo", role: { roleID: 3 } };
    expect(getRoleID(reqUser<ReqForGetRoleID>(u))).toBe(3);
  });

  it("hasRole retourne false si roleID est absent ou n'est pas un nombre", () => {
    expect(hasRole(reqNoUser<ReqForHasRole>(), [1, 2])).toBe(false);
    expect(hasRole(reqUser<ReqForHasRole>({}), [1, 2])).toBe(false);
    expect(hasRole(reqUser<ReqForHasRole>({ role: {} }), [1, 2])).toBe(false);

    const u = { userID: 7, nickname: "Neo", role: { roleID: "2" } };
    expect(hasRole(reqUser<ReqForHasRole>(u), [2])).toBe(false);
  });

  it("hasRole retourne true si roleID est autorisé", () => {
    const u = { userID: 7, nickname: "Neo", role: { roleID: 2 } };
    expect(hasRole(reqUser<ReqForHasRole>(u), [1, 2])).toBe(true);
  });

  it("canManagePoll retourne true pour rôle 1 ou 2", () => {
    expect(canManagePoll(reqUser<ReqForHasRole>({ role: { roleID: 1 } }))).toBe(
      true,
    );
    expect(canManagePoll(reqUser<ReqForHasRole>({ role: { roleID: 2 } }))).toBe(
      true,
    );
  });

  it("canManagePoll retourne false pour les autres rôles", () => {
    expect(canManagePoll(reqNoUser<ReqForHasRole>())).toBe(false);
    expect(canManagePoll(reqUser<ReqForHasRole>({ role: { roleID: 3 } }))).toBe(
      false,
    );
  });

  it("canVotePoll retourne true pour rôle 1 à 5", () => {
    for (let r = 1; r <= 5; r++) {
      expect(canVotePoll(reqUser<ReqForHasRole>({ role: { roleID: r } }))).toBe(
        true,
      );
    }
  });

  it("canVotePoll retourne false pour rôle absent ou hors plage", () => {
    expect(canVotePoll(reqNoUser<ReqForHasRole>())).toBe(false);
    expect(canVotePoll(reqUser<ReqForHasRole>({ role: { roleID: 6 } }))).toBe(
      false,
    );
  });

  it("badRequest retourne 400 avec le payload attendu", () => {
    const { res, status, json } = makeRes();

    badRequest(res, "invalid");

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "invalid",
    });
  });

  it("forbid retourne 403 avec le payload attendu", () => {
    const { res, status, json } = makeRes();

    forbid(res, "nope");

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ code: "FORBIDDEN", message: "nope" });
  });

  it("notFound retourne 404 avec le payload attendu", () => {
    const { res, status, json } = makeRes();

    notFound(res, "missing");

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "missing",
    });
  });

  it("unauthorized retourne 401 avec le payload attendu", () => {
    const { res, status, json } = makeRes();

    unauthorized(res, "auth required");

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "auth required",
    });
  });

  it("parseIntParam retourne null si la valeur n'est pas numérique", () => {
    expect(parseIntParam("")).toBeNull();
    expect(parseIntParam(" 1")).toBeNull();
    expect(parseIntParam("a1")).toBeNull();
    expect(parseIntParam("-1")).toBeNull();
    expect(parseIntParam("1.2")).toBeNull();
  });

  it("parseIntParam retourne un nombre si la valeur ne contient que des chiffres", () => {
    expect(parseIntParam("0")).toBe(0);
    expect(parseIntParam("7")).toBe(7);
    expect(parseIntParam("42")).toBe(42);
  });

  it("parseIntParam retourne null si Number() renvoie une valeur non finie", () => {
    expect(parseIntParam("1".repeat(310))).toBeNull();
  });

  it("normalizeString retourne chaîne vide pour non-string", () => {
    expect(normalizeString(null)).toBe("");
    expect(normalizeString(undefined)).toBe("");
  });

  it("normalizeString trim et retourne la chaîne", () => {
    expect(normalizeString("  hello  ")).toBe("hello");
  });

  it("normalizeOptionalString retourne null pour null/undefined/vide", () => {
    expect(normalizeOptionalString(null)).toBeNull();
    expect(normalizeOptionalString(undefined)).toBeNull();
    expect(normalizeOptionalString("")).toBeNull();
    expect(normalizeOptionalString("   ")).toBeNull();
  });

  it("normalizeOptionalString trim et retourne la chaîne non vide", () => {
    expect(normalizeOptionalString("  hello  ")).toBe("hello");
  });

  it("normalizeOptionLabels retourne tableau vide pour non-array", () => {
    expect(normalizeOptionLabels(undefined)).toEqual([]);
  });

  it("normalizeOptionLabels trim et filtre les vides", () => {
    expect(normalizeOptionLabels(["  a  ", "", " b ", "  ", "c"])).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("uniqueNumbers filtre et déduplique les entiers positifs", () => {
    expect(uniqueNumbers(undefined)).toEqual([]);
    expect(uniqueNumbers([1, 2, 2, 0, -1, 1.5, 3])).toEqual([1, 2, 3]);
  });

  it("isPollClosed retourne true si isClosedManually", () => {
    const poll = {
      endAt: new Date(Date.now() + 1e6),
      isClosedManually: true,
    };
    expect(isPollClosed(poll)).toBe(true);
  });

  it("isPollClosed retourne true si endAt dans le passé", () => {
    const poll = {
      endAt: new Date(Date.now() - 1e6),
      isClosedManually: false,
    };
    expect(isPollClosed(poll)).toBe(true);
  });

  it("isPollClosed retourne false si endAt dans le futur et pas fermé manuellement", () => {
    const poll = {
      endAt: new Date(Date.now() + 1e6),
      isClosedManually: false,
    };
    expect(isPollClosed(poll)).toBe(false);
  });
});
