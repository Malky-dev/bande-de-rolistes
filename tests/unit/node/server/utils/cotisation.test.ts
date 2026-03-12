import { afterEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

const cotisationUtilsUrl = pathToFileURL(
  path.join(root, "src/server/utils/cotisation.ts"),
).href;

const cotisationModelUrl = pathToFileURL(
  path.join(root, "src/server/models/Cotisation.ts"),
).href;

async function load(opts?: {
  findOneResult?: { periodEnd: string } | null;
  createResult?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const Cotisation = {
    findOne: vi.fn().mockResolvedValue(opts?.findOneResult ?? null),
    create: vi
      .fn()
      .mockResolvedValue(
        opts?.createResult ?? { cotisationID: 1, status: "paid" },
      ),
  };

  vi.doMock(cotisationModelUrl, () => ({
    __esModule: true,
    default: Cotisation,
  }));

  const mod = await import(cotisationUtilsUrl);

  return {
    createPaidCotisation: mod.createPaidCotisation,
    getMembershipStatus: mod.getMembershipStatus,
    mocks: { Cotisation },
  };
}

describe("utils cotisation", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createPaidCotisation", () => {
    it("crée une cotisation payée à partir de la date de paiement s’il n’existe aucune période payée précédente", async () => {
      const paidAt = new Date(2026, 0, 15, 9, 30, 0, 0);
      const createResult = { cotisationID: 12 };

      const { createPaidCotisation, mocks } = await load({
        findOneResult: null,
        createResult,
      });

      const result = await createPaidCotisation({
        userID: 7,
        amountCents: 2500,
        paidAt,
      });

      expect(mocks.Cotisation.findOne).toHaveBeenCalledWith({
        where: { userID: 7, status: "paid" },
        order: [["periodEnd", "DESC"]],
      });
      expect(mocks.Cotisation.create).toHaveBeenCalledWith({
        userID: 7,
        amountCents: 2500,
        status: "paid",
        paidAt,
        periodStart: "2026-01-15",
        periodEnd: "2027-01-14",
      });
      expect(result).toBe(createResult);
    });

    it("prolonge l’adhésion après la période payée précédente lorsqu’elle se chevauche encore", async () => {
      const paidAt = new Date(2026, 0, 15, 9, 30, 0, 0);

      const { createPaidCotisation, mocks } = await load({
        findOneResult: { periodEnd: "2026-12-31" },
      });

      await createPaidCotisation({
        userID: 8,
        amountCents: 3000,
        paidAt,
      });

      expect(mocks.Cotisation.create).toHaveBeenCalledWith({
        userID: 8,
        amountCents: 3000,
        status: "paid",
        paidAt,
        periodStart: "2027-01-01",
        periodEnd: "2027-12-31",
      });
    });

    it("démarre une nouvelle période à partir de la date de paiement lorsque la période payée précédente est expirée", async () => {
      const paidAt = new Date(2026, 0, 15, 9, 30, 0, 0);

      const { createPaidCotisation, mocks } = await load({
        findOneResult: { periodEnd: "2025-12-31" },
      });

      await createPaidCotisation({
        userID: 9,
        amountCents: 1500,
        paidAt,
      });

      expect(mocks.Cotisation.create).toHaveBeenCalledWith({
        userID: 9,
        amountCents: 1500,
        status: "paid",
        paidAt,
        periodStart: "2026-01-15",
        periodEnd: "2027-01-14",
      });
    });

    it("utilise la date courante si paidAt est omis", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 10, 12, 34, 56, 0));

      const { createPaidCotisation, mocks } = await load();

      await createPaidCotisation({
        userID: 3,
        amountCents: 999,
      });

      expect(mocks.Cotisation.create).toHaveBeenCalledWith({
        userID: 3,
        amountCents: 999,
        status: "paid",
        paidAt: new Date(2026, 2, 10, 12, 34, 56, 0),
        periodStart: "2026-03-10",
        periodEnd: "2027-03-09",
      });
    });
  });

  describe("getMembershipStatus", () => {
    it("retourne une adhésion non à jour lorsqu’aucune cotisation payée n’existe", async () => {
      const { getMembershipStatus, mocks } = await load({
        findOneResult: null,
      });

      const result = await getMembershipStatus(4);

      expect(mocks.Cotisation.findOne).toHaveBeenCalledWith({
        where: { userID: 4, status: "paid" },
        order: [["periodEnd", "DESC"]],
        attributes: ["periodEnd"],
      });
      expect(result).toEqual({ validUntil: null, isUpToDate: false });
    });

    it("considère une adhésion se terminant aujourd’hui comme à jour", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15, 8, 0, 0, 0));

      const { getMembershipStatus } = await load({
        findOneResult: { periodEnd: "2026-06-15" },
      });

      await expect(getMembershipStatus(5)).resolves.toEqual({
        validUntil: "2026-06-15",
        isUpToDate: true,
      });
    });

    it("marque une adhésion expirée comme non à jour", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 5, 15, 8, 0, 0, 0));

      const { getMembershipStatus } = await load({
        findOneResult: { periodEnd: "2026-06-14" },
      });

      await expect(getMembershipStatus(6)).resolves.toEqual({
        validUntil: "2026-06-14",
        isUpToDate: false,
      });
    });
  });
});
