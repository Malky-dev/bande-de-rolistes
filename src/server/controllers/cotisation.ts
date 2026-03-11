import type { Request, Response, NextFunction } from "express";
import Cotisation from "../models/Cotisation";
import { createPaidCotisation, getMembershipStatus } from "../utils/cotisation";

function parseUserID(req: Request, res: Response): number | null {
  const userID = Number(req.params.userID);
  if (!Number.isInteger(userID) || userID <= 0) {
    res.status(400).json({ code: "BAD_USER_ID", message: "Invalid userID" });
    return null;
  }
  return userID;
}

type CreateCotisationBody = {
  amountCents: unknown;
  paidAt?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getCreateCotisationBody(req: Request): CreateCotisationBody {
  if (!isRecord(req.body)) {
    return {
      amountCents: undefined,
      paidAt: undefined,
    };
  }
  return {
    amountCents: req.body.amountCents,
    paidAt: req.body.paidAt ?? undefined,
  };
}

function parseOptionalDate(value: unknown): Date | undefined | null {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  if (value === undefined || value === null) {
    return undefined;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function parseNonNegativeInt(value: unknown): number | null {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;

  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

export async function createCotisation(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userID = parseUserID(req, res);
    if (!userID) return;

    const body = getCreateCotisationBody(req);

    const amountCents = parseNonNegativeInt(body.amountCents);
    if (amountCents === null) {
      res.status(400).json({
        code: "BAD_AMOUNT",
        message: "amountCents must be a non-negative integer",
      });
      return;
    }

    const paidAtParsed = parseOptionalDate(body.paidAt);

    if (paidAtParsed === null) {
      res.status(400).json({
        code: "BAD_PAID_AT",
        message: "paidAt must be a valid date (ISO string, timestamp, or Date)",
      });
      return;
    }

    const paidAt = paidAtParsed;

    const cotisation = await createPaidCotisation({
      userID,
      amountCents,
      paidAt,
    });

    res.status(201).json({
      cotisationID: cotisation.cotisationID,
      userID: cotisation.userID,
      amountCents: cotisation.amountCents,
      paidAt: cotisation.paidAt,
      periodStart: cotisation.periodStart,
      periodEnd: cotisation.periodEnd,
      status: cotisation.status,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCotisationStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userID = parseUserID(req, res);
    if (!userID) return;

    const status = await getMembershipStatus(userID);
    res.status(200).json(status);
  } catch (err) {
    next(err);
  }
}

export async function listCotisations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userID = parseUserID(req, res);
    if (!userID) return;

    const items = await Cotisation.findAll({
      where: { userID, status: "paid" },
      order: [["periodStart", "DESC"]],
      attributes: [
        "cotisationID",
        "userID",
        "amountCents",
        "paidAt",
        "periodStart",
        "periodEnd",
        "status",
        "created_at",
        "updated_at",
      ],
    });

    res.status(200).json(items);
  } catch (err) {
    next(err);
  }
}
