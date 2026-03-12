import { describe, expect, it, vi, afterEach } from "vitest";

import { fetchCsrfToken } from "@/api/securityApi";

type FetchResponseShape = {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

function makeResponse(data: {
  ok: boolean;
  status?: number;
  text: string;
}): FetchResponseShape {
  return {
    ok: data.ok,
    status: data.status ?? 200,
    text: vi.fn().mockResolvedValue(data.text),
  };
}

describe("fetchCsrfToken", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renvoie le token quand la réponse est valide", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        ok: true,
        text: '{"csrfToken":"abc"}',
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchCsrfToken()).resolves.toBe("abc");
    expect(fetchMock).toHaveBeenCalledWith("/api/csrf-token", {
      credentials: "include",
    });
  });

  it("lance une erreur quand l’endpoint renvoie un statut en erreur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          status: 403,
          text: '{"csrfToken":"abc"}',
        }),
      ),
    );

    await expect(fetchCsrfToken()).rejects.toThrow("CSRF endpoint error: 403");
  });

  it("lance une erreur quand la réponse ne contient pas de token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '{"wrong":"value"}',
        }),
      ),
    );

    await expect(fetchCsrfToken()).rejects.toThrow("Invalid CSRF response");
  });

  it("lance une erreur quand le token est vide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '{"csrfToken":""}',
        }),
      ),
    );

    await expect(fetchCsrfToken()).rejects.toThrow("Invalid CSRF response");
  });
});
