import { afterEach, describe, expect, it, vi } from "vitest";

import { apiGetAccount, apiUpdateAccount } from "@/api/accountApi";

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

  it("apiGetAccount returns the parsed account", async () => {
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

  it("apiGetAccount throws the API message on error", async () => {
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

  it("apiGetAccount throws when the payload shape is invalid", async () => {
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

  it("apiGetAccount throws when the JSON payload is not an object", async () => {
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

  it("apiUpdateAccount fetches the csrf token and sends the update payload", async () => {
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

  it("apiUpdateAccount falls back to the status message when the error body is invalid", async () => {
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

  it("apiUpdateAccount throws when the csrf payload is invalid", async () => {
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
      "Token CSRF invalide re\u00e7u du serveur",
    );
    expect(errorSpy).toHaveBeenCalled();

    errorSpy.mockRestore();
  });

  it("apiUpdateAccount throws the csrf fallback message when the csrf endpoint fails", async () => {
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
      "Impossible de r\u00e9cup\u00e9rer le token CSRF",
    );
  });

  it("apiUpdateAccount throws when the updated account payload is invalid", async () => {
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
