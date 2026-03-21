import type { PollDetails } from "@/types/api/polls";
import type { SessionInfo } from "@/types/api/session";
import { canCreatePoll as canCreatePollFromPermissions } from "@/client/utils/permissions";

export function canCreatePoll(session: SessionInfo | null): boolean {
  return canCreatePollFromPermissions(session);
}

export function getPollsViewErrorMessage(
  cause: unknown,
  fallback: string,
): string {
  return cause instanceof Error ? cause.message : fallback;
}

export function computeNextSelectedOptionIDs(params: {
  details: Pick<PollDetails, "canVote" | "maxSelections"> | null;
  actionLoading: boolean;
  selectedOptionIDs: number[];
  optionID: number;
}): number[] {
  const { details, actionLoading, selectedOptionIDs, optionID } = params;

  if (details === null || !details.canVote || actionLoading) {
    return selectedOptionIDs;
  }

  if (details.maxSelections === 1) {
    return selectedOptionIDs.includes(optionID) ? [] : [optionID];
  }

  const checked = selectedOptionIDs.includes(optionID);

  if (checked) {
    return selectedOptionIDs.filter(
      (currentOptionID) => currentOptionID !== optionID,
    );
  }

  if (selectedOptionIDs.length >= details.maxSelections) {
    return selectedOptionIDs;
  }

  return [...selectedOptionIDs, optionID];
}
