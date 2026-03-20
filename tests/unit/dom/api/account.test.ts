import { afterEach, describe, expect, it, vi } from "vitest";

import { apiGetAccount, apiUpdateAccount } from "@/api/account";

type FetchResponseShape = {
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
};

function makeResponse(data: {
  ok: boolean;
  text: string;
  status?: number;
  statusText?: string;
}): FetchResponseShape {
  return {
    ok: data.ok,
    status: data.status ?? 200,
    statusText: data.statusText ?? "OK",
    text: vi.fn().mockResolvedValue(data.text),
  };
}

describe("accountApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("apiGetAccount renvoie le compte parsé", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        ok: true,
        text: JSON.stringify({
          userID: 1,
          nickname: "Neo",
          email: "neo@matrix.tld",
          discordId: null,
        }),
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiGetAccount()).resolves.toEqual({
      userID: 1,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: null,
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/account", {
      credentials: "include",
    });
  });

  it("apiGetAccount relance le message de l’API en cas d’erreur", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          text: JSON.stringify({ message: "Denied" }),
        }),
      ),
    );

    await expect(apiGetAccount()).rejects.toThrow("Denied");
  });

  it("apiGetAccount lance une erreur quand la forme de la réponse est invalide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: JSON.stringify({ userID: "1" }),
        }),
      ),
    );

    await expect(apiGetAccount()).rejects.toThrow("Invalid account payload");
  });

  it("apiGetAccount lance une erreur quand la réponse JSON n’est pas un objet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: JSON.stringify(42),
        }),
      ),
    );

    await expect(apiGetAccount()).rejects.toThrow("Invalid JSON payload");
  });

  it("apiUpdateAccount récupère le token CSRF puis envoie la mise à jour", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: JSON.stringify({ csrfToken: "csrf-1" }),
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: JSON.stringify({
            userID: 2,
            nickname: "Trinity",
            email: "trinity@matrix.tld",
            discordId: "disc",
          }),
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiUpdateAccount({ nickname: "Trinity" })).resolves.toEqual({
      userID: 2,
      nickname: "Trinity",
      email: "trinity@matrix.tld",
      discordId: "disc",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/csrf-token", {
      credentials: "include",
      method: "GET",
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/account", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": "csrf-1",
      },
      credentials: "include",
      body: JSON.stringify({ nickname: "Trinity" }),
    });
  });

  it("apiUpdateAccount utilise le message de statut quand le corps d’erreur est invalide", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: JSON.stringify({ csrfToken: "csrf-1" }),
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          status: 500,
          statusText: "Server Error",
          text: "not-json",
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiUpdateAccount({ nickname: "Neo" })).rejects.toThrow(
      "Erreur 500: Server Error",
    );
  });

  it("apiUpdateAccount lance une erreur quand la réponse CSRF est invalide", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: JSON.stringify({ wrong: true }),
        }),
      ),
    );

    await expect(apiUpdateAccount({ nickname: "Neo" })).rejects.toThrow(
      "Token CSRF invalide reçu du serveur",
    );
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("apiUpdateAccount lance le message de secours CSRF quand l’endpoint CSRF échoue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          text: "{}",
        }),
      ),
    );

    await expect(apiUpdateAccount({ nickname: "Neo" })).rejects.toThrow(
      "Impossible de récupérer le token CSRF",
    );
  });

  it("apiUpdateAccount lance une erreur quand la réponse du compte mis à jour est invalide", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: JSON.stringify({ csrfToken: "csrf-1" }),
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: JSON.stringify({ userID: 2 }),
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiUpdateAccount({ nickname: "Neo" })).rejects.toThrow(
      "Invalid account payload",
    );
  });
});
