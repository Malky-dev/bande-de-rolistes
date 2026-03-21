import {
  apiCreatePollOption,
  apiDeletePollOption,
  apiUpdatePollOption,
} from "@/api/polls";
import {
  normalizePollOptionLabel,
  type EditablePollOption,
} from "@/client/views/polls/pollOptionEditor.model";

export async function syncEditedPollOptions(
  pollID: number,
  options: EditablePollOption[],
): Promise<void> {
  const optionsToDelete = options.filter(
    (option) => option.optionID !== null && option.markedForDeletion,
  );

  const optionsToRename = options.filter((option) => {
    if (option.optionID === null || option.markedForDeletion) {
      return false;
    }

    const normalizedLabel = normalizePollOptionLabel(option.label);

    return (
      normalizedLabel.length > 0 && normalizedLabel !== option.initialLabel
    );
  });

  const optionsToCreate = options.filter((option) => {
    if (option.optionID !== null || option.markedForDeletion) {
      return false;
    }

    return normalizePollOptionLabel(option.label).length > 0;
  });

  for (const option of optionsToDelete) {
    await apiDeletePollOption(pollID, option.optionID as number);
  }

  for (const option of optionsToRename) {
    await apiUpdatePollOption(pollID, option.optionID as number, {
      label: normalizePollOptionLabel(option.label),
    });
  }

  for (const option of optionsToCreate) {
    await apiCreatePollOption(pollID, {
      label: normalizePollOptionLabel(option.label),
    });
  }
}
