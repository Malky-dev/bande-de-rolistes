import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/csrf", () => ({
  getCsrfToken: vi.fn(),
}));

import { getCsrfToken } from "@/api/csrf";
import {
  apiCreateRpgTable,
  apiGetRpgTable,
  apiListRpgStatuses,
  apiListRpgTables,
  apiSignupRpg,
  apiUnsignupRpg,
  apiUpdateRpgTable,
  apiUpdateRpgTableStatus,
  hasRpgTableBaseFields,
  isRpgTableDetails,
  isRpgTableStatusList,
  isSignupItem,
} from "@/api/rpg";
import { isApiErrorPayload, readErrorMessage } from "@/api/http";

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

describe("rpg", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("valide les helpers rpg et les erreurs mal formées", async () => {
    expect(isApiErrorPayload({ message: "boom" })).toBe(true);
    expect(isApiErrorPayload({ code: 1 })).toBe(false);

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
        makeResponse({ ok: false, text: "not-json" }) as Response,
        "fallback",
      ),
    ).resolves.toBe("fallback");
  });

  it("apiListRpgTables renvoie la liste parsée", async () => {
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

  it("apiListRpgTables lance une erreur quand la réponse est invalide", async () => {
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

  it("apiListRpgTables rejette les statuts invalides et les types de commentaires invalides", async () => {
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

  it("apiListRpgTables relance le message backend en cas d’échec", async () => {
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

  it("apiListRpgTables utilise le message par défaut quand le corps d’erreur est mal formé", async () => {
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

  it("apiGetRpgTable renvoie les détails parsés", async () => {
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

  it("apiGetRpgTable lance une erreur quand les détails sont invalides", async () => {
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

  it("apiGetRpgTable rejette les confirmedCap et les inscriptions invalides", async () => {
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

  it("apiGetRpgTable utilise le message par défaut quand le corps d’erreur est mal formé", async () => {
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

  it("apiSignupRpg envoie la requête avec le token CSRF", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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

  it("apiSignupRpg lance le message d’erreur de secours", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: false, text: "not-json" })),
    );

    await expect(apiSignupRpg(5)).rejects.toThrow("Inscription impossible");
  });

  it("apiUnsignupRpg lance le message d’erreur de secours", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(makeResponse({ ok: false, text: "not-json" })),
    );

    await expect(apiUnsignupRpg(5)).rejects.toThrow(
      "Désinscription impossible",
    );
  });

  it("apiUnsignupRpg envoie la requête avec le token CSRF", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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

  it("apiCreateRpgTable renvoie la réponse de création", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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

  it("apiCreateRpgTable lance une erreur quand la réponse de création est invalide", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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

  it("apiCreateRpgTable lance une erreur quand le corps de la réponse de création n’est pas un objet", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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
    ).rejects.toThrow("Invalid JSON payload");
  });

  it("apiCreateRpgTable utilise l’erreur par défaut quand le corps est mal formé", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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
    ).rejects.toThrow("Création impossible");
  });

  it("apiUpdateRpgTable envoie la charge utile de mise à jour", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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

  it("apiUpdateRpgTable relance le message backend en cas d’erreur", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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

  it("apiUpdateRpgTable utilise l’erreur par défaut quand le corps est mal formé", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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
      "Mise à jour impossible",
    );
  });

  it("apiUpdateRpgTableStatus envoie la charge utile du statut", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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

  it("apiUpdateRpgTableStatus utilise le message de secours en cas d’erreur mal formée", async () => {
    vi.mocked(getCsrfToken).mockResolvedValue("csrf-1");
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
      "Mise à jour du statut impossible",
    );
  });

  it("apiListRpgStatuses renvoie les statuts parsés", async () => {
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

  it("apiListRpgStatuses lance une erreur quand la réponse est invalide", async () => {
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

  it("apiListRpgStatuses utilise le message par défaut en cas d’erreur mal formée", async () => {
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
