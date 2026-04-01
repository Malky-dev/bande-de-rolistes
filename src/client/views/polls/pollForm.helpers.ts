import type { CreatePollBody, UpdatePollBody } from "@/types/api/polls";

type PollFormValues = {
  title: string;
  description: string;
  endAt: Date | null;
};

export function buildPollFormError(
  canSubmit: boolean,
  values: PollFormValues,
  normalizedActiveLabels: string[],
): string | null {
  if (!canSubmit) {
    return "Vous n'avez pas les droits pour gérer les sondages.";
  }

  const trimmedTitle = values.title.trim();

  if (trimmedTitle.length === 0) {
    return "Le titre est obligatoire.";
  }

  if (values.endAt === null || Number.isNaN(values.endAt.getTime())) {
    return "La date de fin est invalide.";
  }

  if (normalizedActiveLabels.length < 2) {
    return "Un sondage doit contenir au moins deux réponses.";
  }

  return null;
}

export function buildCreatePollPayload(
  values: PollFormValues,
  normalizedActiveLabels: string[],
): CreatePollBody {
  const trimmedTitle = values.title.trim();
  const trimmedDescription = values.description.trim();

  return {
    title: trimmedTitle,
    description: trimmedDescription.length > 0 ? trimmedDescription : null,
    endAt: (values.endAt as Date).toISOString(),
    maxSelections: 1,
    options: normalizedActiveLabels,
  };
}

export function buildUpdatePollPayload(values: PollFormValues): UpdatePollBody {
  const trimmedTitle = values.title.trim();
  const trimmedDescription = values.description.trim();

  return {
    title: trimmedTitle,
    description: trimmedDescription.length > 0 ? trimmedDescription : null,
    endAt: (values.endAt as Date).toISOString(),
    maxSelections: 1,
  };
}
