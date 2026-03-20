import type {
  RpgTableDetails,
  RpgCreateTableBody,
  RpgUpdateTableBody,
} from "../../../types/api/rpg";
import type { RpgTableStatus } from "../../../shared/constants";

export type RpgTableFormValues = {
  eventDate: Date | null;
  location: string;
  game: string;
  maxPlayers: number;
  comments: string;
  status?: RpgTableStatus; // edit only
};

export function defaultCreateValues(): RpgTableFormValues {
  return {
    eventDate: null,
    location: "",
    game: "",
    maxPlayers: 6,
    comments: "",
  };
}

export function valuesFromTable(table: RpgTableDetails): RpgTableFormValues {
  const d = new Date(table.eventDate);
  return {
    eventDate: Number.isNaN(d.getTime()) ? null : d,
    location: table.location ?? "",
    game: table.game ?? "",
    maxPlayers: table.maxPlayers ?? 6,
    comments: table.comments ?? "",
    status: table.status,
  };
}

export function validateRpgTable(values: RpgTableFormValues): string | null {
  if (!values.eventDate) return "La date/heure est requise";
  if (Number.isNaN(values.eventDate.getTime())) return "Date/heure invalide";
  if (values.location.trim().length < 2) return "Lieu invalide";
  if (values.game.trim().length < 2) return "Jeu invalide";

  if (
    !Number.isInteger(values.maxPlayers) ||
    values.maxPlayers < 1 ||
    values.maxPlayers > 10
  ) {
    return "Nombre max de joueurs invalide (1 à 10)";
  }

  return null;
}

export function toCreateBody(values: RpgTableFormValues): RpgCreateTableBody {
  return {
    eventDate: values.eventDate!.toISOString(),
    location: values.location.trim(),
    game: values.game.trim(),
    maxPlayers: values.maxPlayers,
    comments: values.comments.trim().length ? values.comments.trim() : null,
  };
}

export function toUpdateBody(values: RpgTableFormValues): RpgUpdateTableBody {
  return {
    eventDate: values.eventDate!.toISOString(),
    location: values.location.trim(),
    game: values.game.trim(),
    maxPlayers: values.maxPlayers,
    comments: values.comments.trim().length ? values.comments.trim() : null,
  };
}
