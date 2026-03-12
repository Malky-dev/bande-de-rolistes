import { describe, expect, it } from "vitest";

import {
  defaultCreateValues,
  toCreateBody,
  toUpdateBody,
  validateRpgTable,
  valuesFromTable,
} from "@/client/views/rpg/rpgTableFormModel";

describe("rpgTableFormModel", () => {
  it("renvoie les valeurs par défaut de création", () => {
    expect(defaultCreateValues()).toEqual({
      eventDate: null,
      location: "",
      game: "",
      maxPlayers: 6,
      comments: "",
    });
  });

  it("mappe les valeurs de table et gère les dates invalides", () => {
    expect(
      valuesFromTable({
        eventID: 1,
        eventDate: "invalid",
        dungeonMaster: { userID: 1, nickname: "DM" },
        location: "Paris",
        game: "D&D",
        comments: null,
        status: "OPEN",
        maxPlayers: 8,
        confirmedCap: 6,
        confirmed: [],
        waitlist: [],
      }),
    ).toEqual({
      eventDate: null,
      location: "Paris",
      game: "D&D",
      maxPlayers: 8,
      comments: "",
      status: "OPEN",
    });
  });

  it("retombe sur des valeurs par défaut quand le lieu, le jeu, les commentaires et le nombre maximum de joueurs sont absents", () => {
    expect(
      valuesFromTable({
        eventID: 1,
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMaster: { userID: 1, nickname: "DM" },
        location: undefined as unknown as string,
        game: undefined as unknown as string,
        comments: undefined as unknown as string | null,
        status: "CLOSED",
        maxPlayers: undefined as unknown as number,
        confirmedCap: 6,
        confirmed: [],
        waitlist: [],
      }),
    ).toEqual({
      eventDate: new Date("2026-01-01T00:00:00.000Z"),
      location: "",
      game: "",
      maxPlayers: 6,
      comments: "",
      status: "CLOSED",
    });
  });

  it("valide chaque champ", () => {
    expect(
      validateRpgTable({
        eventDate: null,
        location: "",
        game: "",
        maxPlayers: 6,
        comments: "",
      }),
    ).toBe("La date/heure est requise");

    expect(
      validateRpgTable({
        eventDate: new Date("invalid"),
        location: "Paris",
        game: "D&D",
        maxPlayers: 6,
        comments: "",
      }),
    ).toBe("Date/heure invalide");

    expect(
      validateRpgTable({
        eventDate: new Date("2026-01-01T00:00:00.000Z"),
        location: "P",
        game: "D&D",
        maxPlayers: 6,
        comments: "",
      }),
    ).toBe("Lieu invalide");

    expect(
      validateRpgTable({
        eventDate: new Date("2026-01-01T00:00:00.000Z"),
        location: "Paris",
        game: "D",
        maxPlayers: 6,
        comments: "",
      }),
    ).toBe("Jeu invalide");

    expect(
      validateRpgTable({
        eventDate: new Date("2026-01-01T00:00:00.000Z"),
        location: "Paris",
        game: "D&D",
        maxPlayers: 11,
        comments: "",
      }),
    ).toBe("Nombre max de joueurs invalide (1 à 10)");

    expect(
      validateRpgTable({
        eventDate: new Date("2026-01-01T00:00:00.000Z"),
        location: "Paris",
        game: "D&D",
        maxPlayers: 6,
        comments: "",
      }),
    ).toBeNull();
  });

  it("convertit les valeurs du formulaire en payloads API", () => {
    const values = {
      eventDate: new Date("2026-01-01T00:00:00.000Z"),
      location: " Paris ",
      game: " D&D ",
      maxPlayers: 6,
      comments: "  hello ",
      status: "OPEN" as const,
    };

    expect(toCreateBody(values)).toEqual({
      eventDate: "2026-01-01T00:00:00.000Z",
      location: "Paris",
      game: "D&D",
      maxPlayers: 6,
      comments: "hello",
    });

    expect(
      toUpdateBody({
        ...values,
        comments: "   ",
      }),
    ).toEqual({
      eventDate: "2026-01-01T00:00:00.000Z",
      location: "Paris",
      game: "D&D",
      maxPlayers: 6,
      comments: null,
    });
  });
});
