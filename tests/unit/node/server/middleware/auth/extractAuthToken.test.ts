import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/utils/cookies", () => ({
  getCookieValue: vi.fn(),
}));

import { getCookieValue } from "@/server/utils/cookies";
import { extractAuthToken } from "@/server/middleware/auth/token";

type ReqLike = {
  get: (name: string) => unknown;
  headers: { authorization?: unknown };
};

describe("extractAuthToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prend le token depuis le cookie en priorité", () => {
    (getCookieValue as any).mockReturnValue("cookie-token");

    const req: ReqLike = {
      get: () => "bande_de_rolistes=cookie-token",
      headers: { authorization: "Bearer header-token" },
    };

    expect(extractAuthToken(req as any)).toBe("cookie-token");
    expect(getCookieValue).toHaveBeenCalledWith(
      "bande_de_rolistes=cookie-token",
      "bande_de_rolistes",
    );
  });

  it("prend le token depuis Authorization si pas de cookie", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => "other=1",
      headers: { authorization: "Bearer header-token" },
    };

    expect(extractAuthToken(req as any)).toBe("header-token");
  });

  it("gère Bearer avec casse/espaces", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => undefined,
      headers: { authorization: "bEaReR    tok" },
    };

    expect(extractAuthToken(req as any)).toBe("tok");
  });

  it("si Authorization n'a pas Bearer, renvoie la valeur telle quelle", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => undefined,
      headers: { authorization: "token-direct" },
    };

    expect(extractAuthToken(req as any)).toBe("token-direct");
  });

  it("renvoie null si rien n'est présent", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => undefined,
      headers: {},
    };

    expect(extractAuthToken(req as any)).toBeNull();
  });

  it("ignore Cookie header si req.get('Cookie') ne renvoie pas une string", () => {
    (getCookieValue as any).mockReturnValue("cookie-token"); // ne doit pas être utilisé

    const req: ReqLike = {
      get: () => 12345,
      headers: { authorization: "Bearer header-token" },
    };

    expect(extractAuthToken(req as any)).toBe("header-token");
    expect(getCookieValue).not.toHaveBeenCalled();
  });

  it("ignore authorization si ce n'est pas une string", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => undefined,
      headers: { authorization: 42 },
    };

    expect(extractAuthToken(req as any)).toBeNull();
  });
});
