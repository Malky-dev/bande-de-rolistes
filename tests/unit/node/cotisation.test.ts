import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/server/models/Cotisation", () => {
  return {
    default: {
      findOne: vi.fn(),
      create: vi.fn(),
    },
  };
});

import Cotisation from "@/server/models/Cotisation";
import {
  createPaidCotisation,
  getMembershipStatus,
} from "@/server/utils/cotisation";

describe("cotisation utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createPaidCotisation", () => {
    it("crée une cotisation à partir de paidAt si aucune précédente", async () => {
      (Cotisation.findOne as any).mockResolvedValue(null);
      (Cotisation.create as any).mockImplementation(
        async (payload: any) => payload,
      );

      const paidAt = new Date(2026, 2, 3, 10, 0, 0);

      const created = await createPaidCotisation({
        userID: 42,
        amountCents: 2500,
        paidAt,
      });

      expect(Cotisation.findOne).toHaveBeenCalledTimes(1);
      expect(Cotisation.create).toHaveBeenCalledTimes(1);

      expect(created).toMatchObject({
        userID: 42,
        amountCents: 2500,
        status: "paid",
        periodStart: "2026-03-03",
        periodEnd: "2027-03-02",
      });
    });

    it("enchaîne après la dernière cotisation si elle couvre la date de paiement", async () => {
      (Cotisation.findOne as any).mockResolvedValue({
        periodEnd: "2026-03-10",
      });
      (Cotisation.create as any).mockImplementation(
        async (payload: any) => payload,
      );

      const paidAt = new Date(2026, 2, 3, 10, 0, 0);

      const created = await createPaidCotisation({
        userID: 42,
        amountCents: 2500,
        paidAt,
      });

      expect(created.periodStart).toBe("2026-03-11");
      expect(created.periodEnd).toBe("2027-03-10");
    });

    it("repart de paidAt si la dernière cotisation est expirée", async () => {
      (Cotisation.findOne as any).mockResolvedValue({
        periodEnd: "2026-02-15",
      });
      (Cotisation.create as any).mockImplementation(
        async (payload: any) => payload,
      );

      const paidAt = new Date(2026, 2, 3, 10, 0, 0);

      const created = await createPaidCotisation({
        userID: 42,
        amountCents: 2500,
        paidAt,
      });

      expect(created.periodStart).toBe("2026-03-03");
      expect(created.periodEnd).toBe("2027-03-02");
    });
  });

  describe("getMembershipStatus", () => {
    it("retourne non à jour si aucune cotisation", async () => {
      (Cotisation.findOne as any).mockResolvedValue(null);

      const status = await getMembershipStatus(42);

      expect(status).toEqual({ validUntil: null, isUpToDate: false });
    });

    it("retourne à jour si periodEnd >= today", async () => {
      (Cotisation.findOne as any).mockResolvedValue({
        periodEnd: "2026-03-03",
      });

      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 3, 12, 0, 0));

      const status = await getMembershipStatus(42);

      expect(status).toEqual({ validUntil: "2026-03-03", isUpToDate: true });
    });

    it("retourne expiré si periodEnd < today", async () => {
      (Cotisation.findOne as any).mockResolvedValue({
        periodEnd: "2026-03-02",
      });

      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 2, 3, 12, 0, 0));

      const status = await getMembershipStatus(42);

      expect(status).toEqual({ validUntil: "2026-03-02", isUpToDate: false });
    });
  });
});
