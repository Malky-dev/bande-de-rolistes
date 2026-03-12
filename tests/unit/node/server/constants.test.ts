import { describe, it, expect } from "vitest";
import { EMAIL_REGEX, RPG_TABLE_STATUSES } from "@/server/constants";

describe("constantes serveur", () => {
  it("réexporte les constantes partagées", () => {
    expect(EMAIL_REGEX.test("neo@matrix.tld")).toBe(true);
    expect(RPG_TABLE_STATUSES.includes("OPEN")).toBe(true);
  });
});
