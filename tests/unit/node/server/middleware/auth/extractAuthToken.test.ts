import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("retourne en priorité le token provenant du cookie", () => {
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

  it("retourne le token provenant de Authorization s’il n’y a pas de cookie", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => "other=1",
      headers: { authorization: "Bearer header-token" },
    };

    expect(extractAuthToken(req as any)).toBe("header-token");
  });

  it("gère un préfixe Bearer avec casse et espaces variables", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => undefined,
      headers: { authorization: "bEaReR    tok" },
    };

    expect(extractAuthToken(req as any)).toBe("tok");
  });

  it("retourne la valeur Authorization telle quelle si elle ne commence pas par Bearer", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => undefined,
      headers: { authorization: "token-direct" },
    };

    expect(extractAuthToken(req as any)).toBe("token-direct");
  });

  it("retourne null si aucun token n’est présent", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => undefined,
      headers: {},
    };

    expect(extractAuthToken(req as any)).toBeNull();
  });

  it("ignore l’en-tête Cookie si req.get('Cookie') ne renvoie pas une chaîne", () => {
    (getCookieValue as any).mockReturnValue("cookie-token");

    const req: ReqLike = {
      get: () => 12345,
      headers: { authorization: "Bearer header-token" },
    };

    expect(extractAuthToken(req as any)).toBe("header-token");
    expect(getCookieValue).not.toHaveBeenCalled();
  });

  it("ignore authorization si ce n’est pas une chaîne", () => {
    (getCookieValue as any).mockReturnValue(undefined);

    const req: ReqLike = {
      get: () => undefined,
      headers: { authorization: 42 },
    };

    expect(extractAuthToken(req as any)).toBeNull();
  });
});
