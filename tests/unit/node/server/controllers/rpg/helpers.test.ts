import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";

import type { ApiError } from "@/types/api/errors";
import {
  badRequest,
  forbid,
  getRoleID,
  getUserID,
  hasRole,
  notFound,
  parseIntParam,
} from "@/server/controllers/rpg/helpers";

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

describe("helpers rpg", () => {
  it("getRoleID retourne undefined s’il n’y a pas d’utilisateur ou de rôle", () => {
    expect(getRoleID(reqNoUser<ReqForGetRoleID>())).toBeUndefined();
    expect(getRoleID(reqUser<ReqForGetRoleID>({}))).toBeUndefined();
    expect(
      getRoleID(reqUser<ReqForGetRoleID>({ role: undefined })),
    ).toBeUndefined();
    expect(getRoleID(reqUser<ReqForGetRoleID>({ role: {} }))).toBeUndefined();
  });

  it("getRoleID retourne roleID s’il est présent", () => {
    const u = { userID: 7, nickname: "Neo", role: { roleID: 3 } };
    expect(getRoleID(reqUser<ReqForGetRoleID>(u))).toBe(3);
  });

  it("getUserID retourne undefined s’il n’y a pas d’utilisateur ou de userID", () => {
    expect(getUserID(reqNoUser<ReqForGetUserID>())).toBeUndefined();
    expect(getUserID(reqUser<ReqForGetUserID>({}))).toBeUndefined();
  });

  it("getUserID retourne userID s’il est présent", () => {
    const u = { userID: 7, nickname: "Neo" };
    expect(getUserID(reqUser<ReqForGetUserID>(u))).toBe(7);
  });

  it("hasRole retourne false si roleID est absent ou n’est pas un nombre", () => {
    expect(hasRole(reqNoUser<ReqForHasRole>(), [1, 2, 3])).toBe(false);
    expect(hasRole(reqUser<ReqForHasRole>({}), [1, 2, 3])).toBe(false);
    expect(hasRole(reqUser<ReqForHasRole>({ role: {} }), [1, 2, 3])).toBe(
      false,
    );

    const u = { userID: 7, nickname: "Neo", role: { roleID: "2" } };
    expect(hasRole(reqUser<ReqForHasRole>(u), [2])).toBe(false);
  });

  it("hasRole retourne true si roleID est autorisé", () => {
    const u = { userID: 7, nickname: "Neo", role: { roleID: 2 } };
    expect(hasRole(reqUser<ReqForHasRole>(u), [1, 2, 3])).toBe(true);
  });

  it("hasRole retourne false si roleID n’est pas autorisé", () => {
    const u = { userID: 7, nickname: "Neo", role: { roleID: 4 } };
    expect(hasRole(reqUser<ReqForHasRole>(u), [1, 2, 3])).toBe(false);
  });

  it("forbid retourne 403 avec le payload attendu", () => {
    const { res, status, json } = makeRes();

    forbid(res, "nope");

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ code: "FORBIDDEN", message: "nope" });
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

  it("notFound retourne 404 avec le payload attendu", () => {
    const { res, status, json } = makeRes();

    notFound(res, "missing");

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "missing",
    });
  });

  it("parseIntParam retourne null si la valeur n’est pas numérique", () => {
    expect(parseIntParam("")).toBeNull();
    expect(parseIntParam(" 1")).toBeNull();
    expect(parseIntParam("1 ")).toBeNull();
    expect(parseIntParam("01a")).toBeNull();
    expect(parseIntParam("a1")).toBeNull();
    expect(parseIntParam("-1")).toBeNull();
    expect(parseIntParam("+1")).toBeNull();
    expect(parseIntParam("1.2")).toBeNull();
  });

  it("parseIntParam retourne un nombre si la valeur ne contient que des chiffres", () => {
    expect(parseIntParam("0")).toBe(0);
    expect(parseIntParam("7")).toBe(7);
    expect(parseIntParam("007")).toBe(7);
    expect(parseIntParam("42")).toBe(42);
  });

  it("parseIntParam retourne null si Number() renvoie une valeur non finie", () => {
    expect(parseIntParam("1".repeat(400))).toBeNull();
  });
});
