import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiAdminRoles,
  apiAdminUpdateRole,
  apiAdminUsers,
  apiLogin,
  apiLogout,
  apiQuote,
  isApiErrorPayload,
  isPaginatedQuoteAdmin,
  apiQuotesCreate,
  apiQuotesDelete,
  apiQuotesList,
  apiQuotesUpdate,
  apiSession,
  apiSignin,
  parseJsonObject,
  readErrorMessage,
} from "@/api/authApi";

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

describe("authApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("authApi helper functions validate payloads and fall back on malformed errors", async () => {
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

  it("apiSignin posts the signup payload with a csrf token", async () => {
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

  it("apiSignin throws the response message on failure", async () => {
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

  it("apiSignin throws when the csrf payload is invalid", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: true, text: "{}" })),
    );

    await expect(
      apiSignin("Neo", "neo@matrix.tld", "Password12345", "Password12345"),
    ).rejects.toThrow("Token CSRF invalide re\u00e7u du serveur");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("apiLogin posts the login payload", async () => {
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

  it("apiLogin falls back to the generic message when the error payload is invalid", async () => {
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

  it("apiSession falls back to the default unauthenticated message when the error body is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: false, text: "not-json" })),
    );

    await expect(apiSession()).rejects.toThrow("Not authenticated");
  });

  it("apiSession returns the parsed session", async () => {
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

  it("apiSession throws when the session payload is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeResponse({ ok: true, text: '{"userID":"1"}' })),
    );

    await expect(apiSession()).rejects.toThrow("Invalid session payload");
  });

  it("apiSession throws the backend error for an unauthenticated response", async () => {
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

  it("apiLogout returns the parsed payload", async () => {
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

  it("apiLogout throws when the logout payload is invalid", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({ ok: true, text: '{"csrfToken":"csrf-1"}' }),
      )
      .mockResolvedValueOnce(makeResponse({ ok: true, text: "{}" }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiLogout()).rejects.toThrow("Invalid logout payload");
  });

  it("apiLogout throws the csrf fallback message when the csrf endpoint fails", async () => {
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
      "Impossible de r\u00e9cup\u00e9rer le token CSRF",
    );
  });

  it("apiQuote returns the parsed quote", async () => {
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

  it("apiQuote throws when the payload is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(makeResponse({ ok: true, text: '{"content":1}' })),
    );

    await expect(apiQuote()).rejects.toThrow("Invalid quote payload");
  });

  it("apiQuote throws when the payload is not an object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: true, text: '"hello"' })),
    );

    await expect(apiQuote()).rejects.toThrow("Invalid JSON payload");
  });

  it("apiQuote falls back to the default error when the body is malformed", async () => {
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
      "Erreur lors de la r\u00e9cup\u00e9ration de la citation",
    );
  });

  it("apiQuotesList builds the query and returns the parsed page", async () => {
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

  it("apiQuotesList throws when the paginated payload is invalid", async () => {
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

  it("apiQuotesCreate posts the payload and returns the created quote", async () => {
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

  it("apiQuotesCreate throws when the created quote payload is invalid", async () => {
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

  it("apiQuotesCreate falls back to the default error when the body is malformed", async () => {
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

  it("apiQuotesUpdate returns the updated quote", async () => {
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

  it("apiQuotesUpdate throws when the updated quote payload is invalid", async () => {
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

  it("apiQuotesDelete throws with the response message", async () => {
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

  it("apiQuotesDelete falls back to the default error when the body is malformed", async () => {
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

  it("apiAdminUsers logs and throws when the request fails", async () => {
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

  it("apiAdminUsers returns the parsed users", async () => {
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

  it("apiAdminUsers throws when the success payload is invalid", async () => {
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

  it("apiAdminRoles returns the parsed roles", async () => {
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

  it("apiAdminRoles logs and throws when the payload is invalid", async () => {
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

  it("apiAdminRoles throws when the success payload is invalid", async () => {
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

  it("apiAdminUpdateRole posts the payload and returns the updated user", async () => {
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

  it("apiAdminUpdateRole logs and throws on failure", async () => {
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

  it("apiAdminUpdateRole throws when the updated user payload is invalid", async () => {
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
