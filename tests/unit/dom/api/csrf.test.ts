import { afterEach, describe, expect, it, vi } from "vitest";

import { getCsrfToken, isCsrfTokenResponse } from "@/api/csrf";

type FetchResponseShape = {
  ok: boolean;
  text: () => Promise<string>;
};

function makeResponse(data: { ok: boolean; text: string }): FetchResponseShape {
  return {
    ok: data.ok,
    text: vi.fn().mockResolvedValue(data.text),
  };
}

describe("csrf", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("valide le type guard de réponse CSRF", () => {
    expect(isCsrfTokenResponse({ csrfToken: "abc" })).toBe(true);
    expect(isCsrfTokenResponse({ csrfToken: "" })).toBe(false);
    expect(isCsrfTokenResponse({ wrong: "value" })).toBe(false);
  });

  it("renvoie le token quand la réponse est valide", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        ok: true,
        text: '{"csrfToken":"abc"}',
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(getCsrfToken()).resolves.toBe("abc");
    expect(fetchMock).toHaveBeenCalledWith("/api/csrf-token", {
      credentials: "include",
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  });

  it("lance le message de secours quand l’endpoint renvoie une erreur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: "{}",
        }),
      ),
    );

    await expect(getCsrfToken()).rejects.toThrow(
      "Impossible de récupérer le token CSRF",
    );
  });

  it("relance le message backend quand la réponse d’erreur le contient", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: '{"message":"CSRF failed"}',
        }),
      ),
    );

    await expect(getCsrfToken()).rejects.toThrow("CSRF failed");
  });

  it("lance une erreur quand la réponse ne contient pas de token", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '{"wrong":"value"}',
        }),
      ),
    );

    await expect(getCsrfToken()).rejects.toThrow(
      "Token CSRF invalide reçu du serveur",
    );
    expect(errorSpy).toHaveBeenCalled();
  });

  it("lance une erreur quand le token est vide", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '{"csrfToken":""}',
        }),
      ),
    );

    await expect(getCsrfToken()).rejects.toThrow(
      "Token CSRF invalide reçu du serveur",
    );
    expect(errorSpy).toHaveBeenCalled();
  });
});
