import { describe, it, expect } from "vitest";
import { getCookieValue } from "@/server/utils/cookies";

describe("getCookieValue", () => {
  it("retourne undefined si header absent", () => {
    expect(getCookieValue(undefined, "sid")).toBeUndefined();
  });

  it("retourne undefined si cookie non trouvé", () => {
    expect(getCookieValue("a=1; b=2", "sid")).toBeUndefined();
  });

  it("retourne la valeur si cookie trouvé", () => {
    expect(getCookieValue("sid=abc123", "sid")).toBe("abc123");
  });

  it("gère les espaces autour des segments", () => {
    expect(getCookieValue("  a=1 ;   sid=ok  ; c=3  ", "sid")).toBe("ok");
  });

  it("sélectionne le bon cookie parmi plusieurs", () => {
    expect(getCookieValue("a=1; sid=abc; sid2=def", "sid2")).toBe("def");
  });

  it("décode les valeurs encodées", () => {
    expect(getCookieValue("name=Jean%20Claude; x=1", "name")).toBe(
      "Jean Claude",
    );
  });

  it("si la valeur est mal encodée, renvoie brut", () => {
    expect(getCookieValue("bad=%E0%A4; x=1", "bad")).toBe("%E0%A4");
  });

  it("ignore les segments invalides (sans '=')", () => {
    expect(getCookieValue("a=1; broken; sid=ok", "sid")).toBe("ok");
  });

  it("ignore les segments vides entre deux ';'", () => {
    expect(getCookieValue("a=1;   ; sid=ok", "sid")).toBe("ok");
  });
});
