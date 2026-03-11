import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/securityApi", () => ({
  fetchCsrfToken: vi.fn(),
}));

import {
  apiCreateRpgTable,
  apiGetRpgTable,
  hasRpgTableBaseFields,
  isApiErrorPayload,
  isRecord,
  isRpgTableDetails,
  isRpgTableStatusList,
  isSignupItem,
  apiListRpgStatuses,
  apiListRpgTables,
  apiSignupRpg,
  apiUnsignupRpg,
  apiUpdateRpgTable,
  apiUpdateRpgTableStatus,
  parseJsonUnknown,
  readErrorMessage,
} from "@/api/rpgApi";
import { fetchCsrfToken } from "@/api/securityApi";

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

describe("rpgApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("rpgApi helper functions validate payloads and malformed errors", async () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isApiErrorPayload({ message: "boom" })).toBe(true);
    expect(isApiErrorPayload({ code: 1 })).toBe(false);
    expect(parseJsonUnknown("42")).toBe(42);

    expect(
      hasRpgTableBaseFields({
        eventID: 1,
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMaster: { userID: 1, nickname: "DM" },
        location: "Paris",
        game: "D&D",
        status: "OPEN",
        maxPlayers: 6,
      }),
    ).toBe(true);
    expect(
      isSignupItem({
        userID: 1,
        nickname: "Neo",
        created_at: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(true);
    expect(isSignupItem({ userID: 1, nickname: "Neo" })).toBe(false);
    expect(isRpgTableStatusList(["OPEN", "CLOSED"])).toBe(true);
    expect(isRpgTableStatusList(["OPEN", "BROKEN"])).toBe(false);
    expect(
      isRpgTableDetails({
        eventID: 1,
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMaster: { userID: 1, nickname: "DM" },
        location: "Paris",
        game: "D&D",
        comments: undefined,
        status: "OPEN",
        maxPlayers: 6,
        confirmedCap: 6,
        confirmed: [],
        waitlist: [],
      }),
    ).toBe(true);

    await expect(
      readErrorMessage(
        makeResponse({ ok: false, text: "not-json" }) as unknown as Response,
        "fallback",
      ),
    ).resolves.toBe("fallback");
  });

  it("apiListRpgTables returns the parsed list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '[{"eventID":1,"eventDate":"2026-01-01T00:00:00.000Z","dungeonMaster":{"userID":7,"nickname":"DM"},"location":"Paris","game":"D&D","comments":null,"status":"OPEN","maxPlayers":6}]',
        }),
      ),
    );

    await expect(apiListRpgTables()).resolves.toEqual([
      {
        eventID: 1,
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMaster: { userID: 7, nickname: "DM" },
        location: "Paris",
        game: "D&D",
        comments: null,
        status: "OPEN",
        maxPlayers: 6,
      },
    ]);
  });

  it("apiListRpgTables throws when the payload is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '[{"eventID":"1"}]',
        }),
      ),
    );

    await expect(apiListRpgTables()).rejects.toThrow("Invalid tables payload");
  });

  it("apiListRpgTables rejects invalid status and invalid comments types", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '[{"eventID":1,"eventDate":"2026-01-01T00:00:00.000Z","dungeonMaster":{"userID":7,"nickname":"DM"},"location":"Paris","game":"D&D","comments":null,"status":"BROKEN","maxPlayers":6}]',
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '[{"eventID":1,"eventDate":"2026-01-01T00:00:00.000Z","dungeonMaster":{"userID":7,"nickname":"DM"},"location":"Paris","game":"D&D","comments":false,"status":"OPEN","maxPlayers":6}]',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiListRpgTables()).rejects.toThrow("Invalid tables payload");
    await expect(apiListRpgTables()).rejects.toThrow("Invalid tables payload");
  });

  it("apiListRpgTables throws the backend message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: '{"message":"Tables failed"}',
        }),
      ),
    );

    await expect(apiListRpgTables()).rejects.toThrow("Tables failed");
  });

  it("apiListRpgTables falls back to the default message when the error body is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: "not-json",
        }),
      ),
    );

    await expect(apiListRpgTables()).rejects.toThrow(
      "Impossible de charger les tables JDR",
    );
  });

  it("apiGetRpgTable returns the parsed details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '{"eventID":1,"eventDate":"2026-01-01T00:00:00.000Z","dungeonMaster":{"userID":7,"nickname":"DM"},"location":"Paris","game":"D&D","comments":null,"status":"OPEN","maxPlayers":6,"confirmedCap":6,"confirmed":[],"waitlist":[]}',
        }),
      ),
    );

    await expect(apiGetRpgTable(1)).resolves.toEqual({
      eventID: 1,
      eventDate: "2026-01-01T00:00:00.000Z",
      dungeonMaster: { userID: 7, nickname: "DM" },
      location: "Paris",
      game: "D&D",
      comments: null,
      status: "OPEN",
      maxPlayers: 6,
      confirmedCap: 6,
      confirmed: [],
      waitlist: [],
    });
  });

  it("apiGetRpgTable throws when the details payload is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '{"eventID":1,"eventDate":"2026-01-01T00:00:00.000Z","dungeonMaster":{"userID":7,"nickname":"DM"},"location":"Paris","game":"D&D","comments":false,"status":"OPEN","maxPlayers":6,"confirmedCap":6,"confirmed":[],"waitlist":[]}',
        }),
      ),
    );

    await expect(apiGetRpgTable(1)).rejects.toThrow("Invalid table payload");
  });

  it("apiGetRpgTable rejects invalid confirmedCap and signup items", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '{"eventID":1,"eventDate":"2026-01-01T00:00:00.000Z","dungeonMaster":{"userID":7,"nickname":"DM"},"location":"Paris","game":"D&D","comments":null,"status":"OPEN","maxPlayers":6,"confirmedCap":"6","confirmed":[],"waitlist":[]}',
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '{"eventID":1,"eventDate":"2026-01-01T00:00:00.000Z","dungeonMaster":{"userID":7,"nickname":"DM"},"location":"Paris","game":"D&D","comments":null,"status":"OPEN","maxPlayers":6,"confirmedCap":6,"confirmed":[{"userID":"1","nickname":"Neo","created_at":"x"}],"waitlist":[]}',
        }),
      )
      .mockResolvedValueOnce(
        makeResponse({
          ok: true,
          text: '{"eventID":1,"eventDate":"2026-01-01T00:00:00.000Z","dungeonMaster":{"userID":7,"nickname":"DM"},"location":"Paris","game":"D&D","comments":null,"status":"OPEN","maxPlayers":6,"confirmedCap":6,"confirmed":[],"waitlist":[{"userID":1,"nickname":"Neo"}]}',
        }),
      );

    vi.stubGlobal("fetch", fetchMock);

    await expect(apiGetRpgTable(1)).rejects.toThrow("Invalid table payload");
    await expect(apiGetRpgTable(1)).rejects.toThrow("Invalid table payload");
    await expect(apiGetRpgTable(1)).rejects.toThrow("Invalid table payload");
  });

  it("apiGetRpgTable falls back to the default message when the error body is malformed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: "not-json",
        }),
      ),
    );

    await expect(apiGetRpgTable(1)).rejects.toThrow(
      "Impossible de charger la table",
    );
  });

  it("apiSignupRpg posts with the csrf token", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse({ ok: true, text: "{}" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiSignupRpg(5)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/rpg/tables/5/signup", {
      method: "POST",
      headers: { "x-csrf-token": "csrf-1" },
      credentials: "include",
    });
  });

  it("apiSignupRpg throws the fallback error message", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: false, text: "not-json" })),
    );

    await expect(apiSignupRpg(5)).rejects.toThrow("Inscription impossible");
  });

  it("apiUnsignupRpg throws the fallback error message", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: false, text: "not-json" })),
    );

    await expect(apiUnsignupRpg(5)).rejects.toThrow(
      "D\u00e9sinscription impossible",
    );
  });

  it("apiUnsignupRpg posts with the csrf token", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse({ ok: true, text: "{}" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiUnsignupRpg(5)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/rpg/tables/5/signup", {
      method: "DELETE",
      headers: { "x-csrf-token": "csrf-1" },
      credentials: "include",
    });
  });

  it("apiCreateRpgTable returns the created payload", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    const fetchMock = vi.fn().mockResolvedValue(
      makeResponse({
        ok: true,
        text: '{"eventID":10,"message":"created"}',
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiCreateRpgTable({
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      }),
    ).resolves.toEqual({
      eventID: 10,
      message: "created",
    });
  });

  it("apiCreateRpgTable throws when the create payload is invalid", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '{"eventID":"10"}',
        }),
      ),
    );

    await expect(
      apiCreateRpgTable({
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      }),
    ).rejects.toThrow("Invalid create payload");
  });

  it("apiCreateRpgTable throws when the create payload body is not an object", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: "42",
        }),
      ),
    );

    await expect(
      apiCreateRpgTable({
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      }),
    ).rejects.toThrow("Invalid create payload");
  });

  it("apiCreateRpgTable falls back to the default error when the body is malformed", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: "not-json",
        }),
      ),
    );

    await expect(
      apiCreateRpgTable({
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      }),
    ).rejects.toThrow("Cr\u00e9ation impossible");
  });

  it("apiUpdateRpgTable sends the update payload", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse({ ok: true, text: "{}" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiUpdateRpgTable(10, { location: "Paris" }),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/rpg/tables/10", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "csrf-1",
      },
      credentials: "include",
      body: JSON.stringify({ location: "Paris" }),
    });
  });

  it("apiUpdateRpgTable throws the backend message on error", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: '{"message":"Update failed"}',
        }),
      ),
    );

    await expect(apiUpdateRpgTable(10, { location: "Paris" })).rejects.toThrow(
      "Update failed",
    );
  });

  it("apiUpdateRpgTable falls back to the default error when the body is malformed", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: "not-json",
        }),
      ),
    );

    await expect(apiUpdateRpgTable(10, { location: "Paris" })).rejects.toThrow(
      "Mise \u00e0 jour impossible",
    );
  });

  it("apiUpdateRpgTableStatus sends the status payload", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(makeResponse({ ok: true, text: "{}" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      apiUpdateRpgTableStatus(10, "CLOSED"),
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/rpg/tables/10/status", {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-csrf-token": "csrf-1",
      },
      credentials: "include",
      body: JSON.stringify({ status: "CLOSED" }),
    });
  });

  it("apiUpdateRpgTableStatus throws the fallback message on malformed errors", async () => {
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: "not-json",
        }),
      ),
    );

    await expect(apiUpdateRpgTableStatus(10, "CLOSED")).rejects.toThrow(
      "Mise \u00e0 jour du statut impossible",
    );
  });

  it("apiListRpgStatuses returns the parsed statuses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '["OPEN","CLOSED","CANCELLED"]',
        }),
      ),
    );

    await expect(apiListRpgStatuses()).resolves.toEqual([
      "OPEN",
      "CLOSED",
      "CANCELLED",
    ]);
  });

  it("apiListRpgStatuses throws when the payload is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: true,
          text: '["OPEN","BROKEN"]',
        }),
      ),
    );

    await expect(apiListRpgStatuses()).rejects.toThrow(
      "Invalid statuses payload",
    );
  });

  it("apiListRpgStatuses falls back to the default message on malformed errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        makeResponse({
          ok: false,
          text: "not-json",
        }),
      ),
    );

    await expect(apiListRpgStatuses()).rejects.toThrow(
      "Impossible de charger les statuts",
    );
  });
});
