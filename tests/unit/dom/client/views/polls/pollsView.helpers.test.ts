import { describe, expect, it } from "vitest";
import {
  canCreatePoll,
  computeNextSelectedOptionIDs,
  getPollsViewErrorMessage,
} from "@/client/views/polls/pollsView.helpers";

describe("pollsView.helpers", () => {
  describe("canCreatePoll", () => {
    it("refuse une session nulle", () => {
      expect(canCreatePoll(null)).toBe(false);
    });

    it("autorise le rôle 1", () => {
      expect(
        canCreatePoll({
          userID: 1,
          nickname: "Admin",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }),
      ).toBe(true);
    });

    it("autorise le rôle 2", () => {
      expect(
        canCreatePoll({
          userID: 1,
          nickname: "Modo",
          roleID: 2,
          role: "member",
          isVerified: true,
        }),
      ).toBe(true);
    });

    it("refuse les autres rôles", () => {
      expect(
        canCreatePoll({
          userID: 1,
          nickname: "Paul",
          roleID: 5,
          role: "member",
          isVerified: true,
        }),
      ).toBe(false);
    });
  });

  describe("getPollsViewErrorMessage", () => {
    it("retourne le message de Error", () => {
      expect(getPollsViewErrorMessage(new Error("boom"), "fallback")).toBe(
        "boom",
      );
    });

    it("retourne le fallback pour une valeur non Error", () => {
      expect(getPollsViewErrorMessage("boom", "fallback")).toBe("fallback");
    });
  });

  describe("computeNextSelectedOptionIDs", () => {
    it("ne change rien si details est null", () => {
      expect(
        computeNextSelectedOptionIDs({
          details: null,
          actionLoading: false,
          selectedOptionIDs: [1],
          optionID: 2,
        }),
      ).toEqual([1]);
    });

    it("ne change rien si le vote est interdit", () => {
      expect(
        computeNextSelectedOptionIDs({
          details: { canVote: false, maxSelections: 2 },
          actionLoading: false,
          selectedOptionIDs: [1],
          optionID: 2,
        }),
      ).toEqual([1]);
    });

    it("ne change rien pendant le chargement", () => {
      expect(
        computeNextSelectedOptionIDs({
          details: { canVote: true, maxSelections: 2 },
          actionLoading: true,
          selectedOptionIDs: [1],
          optionID: 2,
        }),
      ).toEqual([1]);
    });

    it("sélectionne une option en choix unique", () => {
      expect(
        computeNextSelectedOptionIDs({
          details: { canVote: true, maxSelections: 1 },
          actionLoading: false,
          selectedOptionIDs: [],
          optionID: 2,
        }),
      ).toEqual([2]);
    });

    it("désélectionne une option déjà choisie en choix unique", () => {
      expect(
        computeNextSelectedOptionIDs({
          details: { canVote: true, maxSelections: 1 },
          actionLoading: false,
          selectedOptionIDs: [2],
          optionID: 2,
        }),
      ).toEqual([]);
    });

    it("retire une option cochée en multi-sélection", () => {
      expect(
        computeNextSelectedOptionIDs({
          details: { canVote: true, maxSelections: 2 },
          actionLoading: false,
          selectedOptionIDs: [1, 2],
          optionID: 2,
        }),
      ).toEqual([1]);
    });

    it("refuse un choix supplémentaire au-delà de la limite", () => {
      expect(
        computeNextSelectedOptionIDs({
          details: { canVote: true, maxSelections: 2 },
          actionLoading: false,
          selectedOptionIDs: [1, 2],
          optionID: 3,
        }),
      ).toEqual([1, 2]);
    });

    it("ajoute une option en multi-sélection sous la limite", () => {
      expect(
        computeNextSelectedOptionIDs({
          details: { canVote: true, maxSelections: 3 },
          actionLoading: false,
          selectedOptionIDs: [1],
          optionID: 2,
        }),
      ).toEqual([1, 2]);
    });
  });
});
