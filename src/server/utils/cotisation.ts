import Cotisation from "../models/Cotisation";

function toLocalDateOnlyString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseLocalDateOnly(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
}

function addDaysLocal(dateOnly: string, days: number): string {
  const dt = parseLocalDateOnly(dateOnly);
  dt.setDate(dt.getDate() + days);
  return toLocalDateOnlyString(dt);
}

function addMonthsMinusOneDayLocal(
  startDateOnly: string,
  months: number,
): string {
  const dt = parseLocalDateOnly(startDateOnly);
  const y = dt.getFullYear();
  const m = dt.getMonth();
  const d = dt.getDate();

  const plusN = new Date(y, m + months, d, 0, 0, 0, 0);
  plusN.setDate(plusN.getDate() - 1);
  return toLocalDateOnlyString(plusN);
}

export async function createPaidCotisation(params: {
  userID: number;
  amountCents: number;
  paidAt?: Date;
}): Promise<Cotisation> {
  const { userID, amountCents } = params;
  const paidAt = params.paidAt ?? new Date();

  const paidDateOnly = toLocalDateOnlyString(paidAt);

  const last = await Cotisation.findOne({
    where: { userID, status: "paid" },
    order: [["periodEnd", "DESC"]],
  });

  const periodStart =
    last && last.periodEnd >= paidDateOnly
      ? addDaysLocal(last.periodEnd, 1)
      : paidDateOnly;

  const periodEnd = addMonthsMinusOneDayLocal(periodStart, 12);

  return Cotisation.create({
    userID,
    amountCents,
    status: "paid",
    paidAt,
    periodStart,
    periodEnd,
  });
}

export async function getMembershipStatus(userID: number): Promise<{
  validUntil: string | null;
  isUpToDate: boolean;
}> {
  const last = await Cotisation.findOne({
    where: { userID, status: "paid" },
    order: [["periodEnd", "DESC"]],
    attributes: ["periodEnd"],
  });

  if (!last) return { validUntil: null, isUpToDate: false };

  const today = toLocalDateOnlyString(new Date());
  return { validUntil: last.periodEnd, isUpToDate: last.periodEnd >= today };
}
