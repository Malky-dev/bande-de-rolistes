import { describe, expect, it } from "vitest";

import {
  canCreateRpgTable,
  canEditRpgTable,
} from "@/client/views/rpg/rpgPermissions";

describe("rpgPermissions", () => {
  it("canCreateRpgTable allows only role IDs 1, 2, and 3", () => {
    expect(canCreateRpgTable(null)).toBe(false);
    expect(
      canCreateRpgTable({
        userID: 1,
        nickname: "Neo",
        roleID: 1,
        role: "admin",
        isVerified: true,
      }),
    ).toBe(true);
    expect(
      canCreateRpgTable({
        userID: 1,
        nickname: "Neo",
        roleID: 4,
        role: "member",
        isVerified: true,
      }),
    ).toBe(false);
  });

  it("canEditRpgTable allows admin, organisator, or the dungeon master", () => {
    const table = {
      eventID: 1,
      eventDate: "2026-01-01T00:00:00.000Z",
      dungeonMaster: { userID: 7, nickname: "DM" },
      location: "Paris",
      game: "D&D",
      comments: null,
      status: "OPEN" as const,
      maxPlayers: 6,
      confirmedCap: 6,
      confirmed: [],
      waitlist: [],
    };

    expect(canEditRpgTable(null, table)).toBe(false);
    expect(
      canEditRpgTable(
        {
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        },
        table,
      ),
    ).toBe(true);
    expect(
      canEditRpgTable(
        {
          userID: 7,
          nickname: "DM",
          roleID: 5,
          role: "member",
          isVerified: true,
        },
        table,
      ),
    ).toBe(true);
    expect(
      canEditRpgTable(
        {
          userID: 8,
          nickname: "Other",
          roleID: 5,
          role: "member",
          isVerified: true,
        },
        table,
      ),
    ).toBe(false);
  });
});
