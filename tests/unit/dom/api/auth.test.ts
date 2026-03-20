import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiAdminRoles,
  apiAdminUpdateRole,
  apiAdminUsers,
  apiLogin,
  apiLogout,
  apiQuote,
  isPaginatedQuoteAdmin,
  apiQuotesCreate,
  apiQuotesDelete,
  apiQuotesList,
  apiQuotesUpdate,
  apiSession,
  apiSignin,
} from "@/api/auth";

import {
  isApiErrorPayload,
  parseJsonObject,
  readErrorMessage,
} from "@/api/http";

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

describe("auth", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("valide les helpers authApi et utilise le message de secours pour les erreurs mal formées", async () => {
    expect(isApiErrorPayload({})).toBe(true);
    expect(isApiErrorPayload({ message: 1 })).toBe(false);

    expect(() => parseJsonObject("null")).toThrow("Invalid JSON payload");

    expect(
      isPaginatedQuoteAdmin({
        items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      }),
    ).toBe(true);
    expect(
      isPaginatedQuoteAdmin({
        items: [{ quoteID: 1, content: "Hello" }],
        page: 1,
        limit: 10,
        totalItems: 1,
        totalPages: 1,
      }),
    ).toBe(false);

    await expect(
      readErrorMessage(
        makeResponse({ ok: false, text: "not-json" }) as unknown as Response,
        "fallback",
      ),
    ).resolves.toBe("fallback");
  });

  it("apiSignin envoie les données d’inscription avec un token CSRF", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(makeResponse({ ok: true, text: "{}" }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiSignin("Neo", "neo@matrix.tld", "Password12345", "Password12345"),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": "csrf-1",
      },
      credentials: "include",
      body: JSON.stringify({
        nickname: "Neo",
        email: "neo@matrix.tld",
        password: "Password12345",
        passwordCheck: "Password12345",
      }),
    });
  });

  it("apiSignin relance le message de la réponse en cas d’échec", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          text: '{"message":"Signup failed"}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiSignin("Neo", "neo@matrix.tld", "Password12345", "Password12345"),
    ).rejects.toThrow("Signup failed");
  });

  it("apiSignin lance une erreur quand la réponse CSRF est invalide", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: true, text: "{}" })),
    );

    await expect(
      apiSignin("Neo", "neo@matrix.tld", "Password12345", "Password12345"),
    ).rejects.toThrow("Token CSRF invalide reçu du serveur");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("apiLogin envoie les données de connexion", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(makeResponse({ ok: true, text: "{}" }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiLogin("neo@matrix.tld", "Password12345"),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": "csrf-1",
      },
      credentials: "include",
      body: JSON.stringify({
        email: "neo@matrix.tld",
        password: "Password12345",
      }),
    });
  });

  it("apiLogin utilise le message générique quand la réponse d’erreur est invalide", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(makeResponse({ ok: false, text: "not-json" }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiLogin("neo@matrix.tld", "Password12345")).rejects.toThrow(
      "Erreur lors de la connexion",
    );
  });

  it("apiSession utilise le message non authentifié par défaut quand le corps d’erreur est mal formé", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: false, text: "not-json" })),
    );

    await expect(apiSession()).rejects.toThrow("Not authenticated");
  });

  it("apiSession renvoie la session parsée", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: JSON.stringify({
            userID: 1,
            nickname: "Neo",
            roleID: 1,
            role: "admin",
            isVerified: true,
          }),
        }),
      ),
    );

    await expect(apiSession()).resolves.toEqual({
      userID: 1,
      nickname: "Neo",
      roleID: 1,
      role: "admin",
      isVerified: true,
    });
  });

  it("apiSession lance une erreur quand la réponse de session est invalide", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeResponse({ ok: true, text: '{"userID":"1"}' })),
    );

    await expect(apiSession()).rejects.toThrow("Invalid session payload");
  });

  it("apiSession relance l’erreur backend pour une réponse non authentifiée", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          makeResponse({ ok: false, text: '{"message":"No session"}' }),
        ),
    );

    await expect(apiSession()).rejects.toThrow("No session");
  });

  it("apiLogout renvoie la réponse parsée", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"success":true}' }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiLogout()).resolves.toEqual({ success: true });
  });

  it("apiLogout lance une erreur quand la réponse de déconnexion est invalide", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(makeResponse({ ok: true, text: "{}" }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiLogout()).rejects.toThrow("Invalid logout payload");
  });

  it("apiLogout lance le message de secours CSRF quand l’endpoint CSRF échoue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          status: 500,
          statusText: "Server Error",
          text: "{}",
        }),
      ),
    );

    await expect(apiLogout()).rejects.toThrow(
      "Impossible de récupérer le token CSRF",
    );
  });

  it("apiQuote renvoie la citation parsée", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '{"content":"Hello","author":"Morpheus"}',
        }),
      ),
    );

    await expect(apiQuote()).resolves.toEqual({
      content: "Hello",
      author: "Morpheus",
    });
  });

  it("apiQuote lance une erreur quand la réponse est invalide", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeResponse({ ok: true, text: '{"content":1}' })),
    );

    await expect(apiQuote()).rejects.toThrow("Invalid quote payload");
  });

  it("apiQuote lance une erreur quand la réponse n’est pas un objet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: true, text: '"hello"' })),
    );

    await expect(apiQuote()).rejects.toThrow("Invalid JSON payload");
  });

  it("apiQuote utilise l’erreur par défaut quand le corps est mal formé", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: "not-json",
        }),
      ),
    );

    await expect(apiQuote()).rejects.toThrow(
      "Erreur lors de la récupération de la citation",
    );
  });

  it("apiQuotesList construit la requête et renvoie la page parsée", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        ok: true,
        text: JSON.stringify({
          items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
          page: 2,
          limit: 10,
          totalItems: 11,
          totalPages: 2,
        }),
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiQuotesList(2, 10, "  neo  ")).resolves.toEqual({
      items: [{ quoteID: 1, content: "Hello", author: "Morpheus" }],
      page: 2,
      limit: 10,
      totalItems: 11,
      totalPages: 2,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/quotes?page=2&limit=10&q=neo",
      {
        credentials: "include",
      },
    );
  });

  it("apiQuotesList lance une erreur quand la réponse paginée est invalide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '{"items":[{"quoteID":1,"content":"Hello","author":"Morpheus"}],"limit":10,"totalItems":1,"totalPages":1}',
        }),
      ),
    );

    await expect(apiQuotesList()).rejects.toThrow("Invalid quotes payload");
  });

  it("apiQuotesCreate envoie la charge utile et renvoie la citation créée", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '{"quoteID":1,"content":"Hello","author":"Morpheus"}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiQuotesCreate({ content: "Hello" })).resolves.toEqual({
      quoteID: 1,
      content: "Hello",
      author: "Morpheus",
    });
  });

  it("apiQuotesCreate lance une erreur quand la citation créée est invalide", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '{"quoteID":1,"content":"Hello"}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiQuotesCreate({ content: "Hello" })).rejects.toThrow(
      "Invalid quote payload",
    );
  });

  it("apiQuotesCreate utilise l’erreur par défaut quand le corps est mal formé", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          text: "not-json",
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiQuotesCreate({ content: "Hello" })).rejects.toThrow(
      "Erreur lors de l'ajout de la citation",
    );
  });

  it("apiQuotesUpdate renvoie la citation mise à jour", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '{"quoteID":1,"content":"Updated","author":"Neo","created_at":"2026-01-01"}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiQuotesUpdate(1, { content: "Updated", author: "Neo" }),
    ).resolves.toEqual({
      quoteID: 1,
      content: "Updated",
      author: "Neo",
      created_at: "2026-01-01",
    });
  });

  it("apiQuotesUpdate lance une erreur quand la citation mise à jour est invalide", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '{"quoteID":"1"}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiQuotesUpdate(1, { content: "Hello" })).rejects.toThrow(
      "Invalid quote payload",
    );
  });

  it("apiQuotesDelete lance une erreur avec le message de la réponse", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          text: '{"message":"Delete failed"}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiQuotesDelete(1)).rejects.toThrow("Delete failed");
  });

  it("apiQuotesDelete utilise l’erreur par défaut quand le corps est mal formé", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          text: "not-json",
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiQuotesDelete(1)).rejects.toThrow(
      "Erreur lors de la suppression",
    );
  });

  it("apiAdminUsers journalise puis lance une erreur quand la requête échoue", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          text: '{"message":"Forbidden"}',
        }),
      ),
    );

    await expect(apiAdminUsers()).rejects.toThrow("Forbidden");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("apiAdminUsers renvoie les utilisateurs parsés", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '[{"userID":1,"nickname":"Neo","email":"neo@matrix.tld","roleID":1,"roleLabel":"admin","isVerified":true}]',
        }),
      ),
    );

    await expect(apiAdminUsers()).resolves.toEqual([
      {
        userID: 1,
        nickname: "Neo",
        email: "neo@matrix.tld",
        roleID: 1,
        roleLabel: "admin",
        isVerified: true,
      },
    ]);
  });

  it("apiAdminUsers lance une erreur quand la réponse de succès est invalide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '[{"userID":1}]',
        }),
      ),
    );

    await expect(apiAdminUsers()).rejects.toThrow(
      "Invalid admin users payload",
    );
  });

  it("apiAdminRoles renvoie les rôles parsés", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '[{"roleID":1,"roleLabel":"admin"}]',
        }),
      ),
    );

    await expect(apiAdminRoles()).resolves.toEqual([
      { roleID: 1, roleLabel: "admin" },
    ]);
  });

  it("apiAdminRoles journalise puis lance une erreur quand la requête échoue", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          status: 500,
          statusText: "Server Error",
          text: '{"message":"Roles failed"}',
        }),
      ),
    );

    await expect(apiAdminRoles()).rejects.toThrow("Roles failed");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("apiAdminRoles lance une erreur quand la réponse de succès est invalide", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '[{"roleID":"1"}]',
        }),
      ),
    );

    await expect(apiAdminRoles()).rejects.toThrow(
      "Invalid admin roles payload",
    );
  });

  it("apiAdminUpdateRole envoie la charge utile et renvoie l’utilisateur mis à jour", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '{"userID":1,"nickname":"Neo","email":"neo@matrix.tld","roleID":2,"roleLabel":"organisator","isVerified":true}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiAdminUpdateRole(1, 2)).resolves.toEqual({
      userID: 1,
      nickname: "Neo",
      email: "neo@matrix.tld",
      roleID: 2,
      roleLabel: "organisator",
      isVerified: true,
    });
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("apiAdminUpdateRole journalise puis lance une erreur en cas d’échec", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: false,
          status: 500,
          statusText: "Server Error",
          text: '{"message":"Update failed"}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiAdminUpdateRole(1, 2)).rejects.toThrow("Update failed");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("apiAdminUpdateRole lance une erreur quand la réponse de l’utilisateur mis à jour est invalide", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '{"userID":1}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiAdminUpdateRole(1, 2)).rejects.toThrow(
      "Invalid admin user payload",
    );
  });
});
