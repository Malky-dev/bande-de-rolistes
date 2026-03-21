import type { PollDetails } from "@/types/api/polls";

export type EditablePollOption = {
  localID: string;
  optionID: number | null;
  label: string;
  initialLabel: string;
  markedForDeletion: boolean;
};

export function normalizePollOptionLabel(value: string): string {
  return value.trim();
}

export function buildEmptyPollOption(): EditablePollOption {
  return {
    localID: crypto.randomUUID(),
    optionID: null,
    label: "",
    initialLabel: "",
    markedForDeletion: false,
  };
}

export function buildInitialPollOptions(): EditablePollOption[] {
  return [buildEmptyPollOption(), buildEmptyPollOption()];
}

export function mapPollDetailsToEditableOptions(
  poll: PollDetails,
): EditablePollOption[] {
  const sortedOptions = [...poll.options].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    return left.optionID - right.optionID;
  });

  if (sortedOptions.length === 0) {
    return buildInitialPollOptions();
  }

  return sortedOptions.map((option) => ({
    localID: crypto.randomUUID(),
    optionID: option.optionID,
    label: option.label,
    initialLabel: option.label,
    markedForDeletion: false,
  }));
}

export function getActiveEditablePollOptions(
  options: EditablePollOption[],
): EditablePollOption[] {
  return options.filter((option) => !option.markedForDeletion);
}

export function getNormalizedActivePollOptionLabels(
  options: EditablePollOption[],
): string[] {
  return getActiveEditablePollOptions(options)
    .map((option) => normalizePollOptionLabel(option.label))
    .filter((label) => label.length > 0);
}

export function updateEditablePollOptionLabel(
  options: EditablePollOption[],
  localID: string,
  value: string,
): EditablePollOption[] {
  return options.map((option) =>
    option.localID === localID ? { ...option, label: value } : option,
  );
}

export function addEditablePollOption(
  options: EditablePollOption[],
): EditablePollOption[] {
  return [...options, buildEmptyPollOption()];
}

export function removeEditablePollOption(
  options: EditablePollOption[],
  localID: string,
): EditablePollOption[] {
  const target = options.find((option) => option.localID === localID);
  const activeCount = getActiveEditablePollOptions(options).length;

  if (target === undefined || activeCount <= 2) {
    return options;
  }

  if (target.optionID === null) {
    return options.filter((option) => option.localID !== localID);
  }

  return options.map((option) =>
    option.localID === localID
      ? { ...option, markedForDeletion: true }
      : option,
  );
}

export function restoreEditablePollOption(
  options: EditablePollOption[],
  localID: string,
): EditablePollOption[] {
  return options.map((option) =>
    option.localID === localID
      ? { ...option, markedForDeletion: false }
      : option,
  );
}
