import type { RpgTableListItem } from "@/types/api/rpg";

export function formatDate(iso: string): string {
  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return iso;
  }

  return d.toLocaleString("fr-FR", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusLabel(status: RpgTableListItem["status"]): string {
  if (status === "OPEN") return "Inscription Ouverte";
  if (status === "CLOSED") return "Inscription Fermée";
  return "Table Annulée";
}

export function statusClass(status: RpgTableListItem["status"]): string {
  if (status === "OPEN") return "rpg-status rpg-status--open";
  if (status === "CLOSED") return "rpg-status rpg-status--closed";
  return "rpg-status rpg-status--cancelled";
}

export function getSelectedTableID(
  selectedID: number | null,
  tables: RpgTableListItem[],
): number | null {
  if (selectedID !== null) return selectedID;
  if (tables.length === 0) return null;
  return tables[0].eventID;
}
