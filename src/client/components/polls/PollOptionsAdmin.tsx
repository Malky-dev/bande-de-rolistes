import { useMemo, useState } from "react";
import {
  apiCreatePollOption,
  apiDeletePollOption,
  apiUpdatePollOption,
} from "../../../api/polls";
import type { PollDetails } from "../../../types/api/polls";

type PollOptionsAdminProps = {
  poll: PollDetails;
  disabled?: boolean;
  onChanged: (message: string) => Promise<void> | void;
};

type DraftLabels = Record<number, string>;

function sortOptions(poll: PollDetails) {
  return [...poll.options].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    return left.optionID - right.optionID;
  });
}

export default function PollOptionsAdmin({
  poll,
  disabled = false,
  onChanged,
}: PollOptionsAdminProps) {
  const sortedOptions = useMemo(() => sortOptions(poll), [poll]);

  const [draftLabels, setDraftLabels] = useState<DraftLabels>(() =>
    Object.fromEntries(
      sortedOptions.map((option) => [option.optionID, option.label]),
    ),
  );
  const [newOptionLabel, setNewOptionLabel] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  function setDraftLabel(optionID: number, value: string): void {
    setDraftLabels((current) => ({
      ...current,
      [optionID]: value,
    }));
  }

  async function handleCreateOption(): Promise<void> {
    const label = newOptionLabel.trim();

    if (label.length === 0) {
      setError("Le libellé de la nouvelle option est obligatoire.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const message = await apiCreatePollOption(poll.pollID, { label });
      setNewOptionLabel("");
      await onChanged(message);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'ajouter l'option.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRenameOption(optionID: number): Promise<void> {
    const nextLabel = (draftLabels[optionID] ?? "").trim();
    const currentOption = poll.options.find(
      (option) => option.optionID === optionID,
    );

    if (currentOption === undefined) {
      setError("Option introuvable.");
      return;
    }

    if (nextLabel.length === 0) {
      setError("Le libellé de l'option est obligatoire.");
      return;
    }

    if (nextLabel === currentOption.label) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const message = await apiUpdatePollOption(poll.pollID, optionID, {
        label: nextLabel,
      });
      await onChanged(message);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de modifier l'option.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteOption(optionID: number): Promise<void> {
    const option = poll.options.find((entry) => entry.optionID === optionID);

    if (option === undefined) {
      setError("Option introuvable.");
      return;
    }

    const confirmed = window.confirm(
      `Supprimer l'option "${option.label}" ? Les votes associés seront supprimés.`,
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const message = await apiDeletePollOption(poll.pollID, optionID);
      await onChanged(message);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de supprimer l'option.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h3>Gérer les options</h3>

      {error !== null ? <p role="alert">{error}</p> : null}

      <ul>
        {sortedOptions.map((option) => (
          <li key={option.optionID}>
            <div>
              <label htmlFor={`poll-option-admin-${option.optionID}`}>
                Option
              </label>
              <input
                id={`poll-option-admin-${option.optionID}`}
                type="text"
                value={draftLabels[option.optionID] ?? option.label}
                onChange={(event) =>
                  setDraftLabel(option.optionID, event.target.value)
                }
                disabled={disabled || loading}
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => void handleRenameOption(option.optionID)}
                disabled={disabled || loading}
              >
                Renommer
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteOption(option.optionID)}
                disabled={disabled || loading}
              >
                Supprimer
              </button>
            </div>

            <p>{option.voteCount} vote(s)</p>
          </li>
        ))}
      </ul>

      <div>
        <label htmlFor="poll-new-option">Nouvelle option</label>
        <input
          id="poll-new-option"
          type="text"
          value={newOptionLabel}
          onChange={(event) => setNewOptionLabel(event.target.value)}
          disabled={disabled || loading}
        />
      </div>

      <button
        type="button"
        onClick={() => void handleCreateOption()}
        disabled={disabled || loading}
      >
        Ajouter l'option
      </button>
    </section>
  );
}
