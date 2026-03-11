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

  it("returns the token when the payload is valid", async () => {
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

  it("throws when the endpoint returns an error status", async () => {
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

  it("throws when the payload does not contain a token", async () => {
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

  it("throws when the token is empty", async () => {
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
