import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";
import DatePicker from "react-datepicker";
import { fr } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import {
  apiCreatePoll,
  apiCreatePollOption,
  apiDeletePollOption,
  apiGetPoll,
  apiUpdatePoll,
  apiUpdatePollOption,
} from "../../../api/pollsApi";
import type {
  CreatePollBody,
  PollDetails,
  UpdatePollBody,
} from "../../../types/api/polls";
import type { SessionInfo } from "../../../types/api/session";

type Props = {
  session: SessionInfo | null;
  pollID?: number | null;
  onBack: () => void;
  onDone: () => void;
};

type EditableOption = {
  localID: string;
  optionID: number | null;
  label: string;
  initialLabel: string;
  markedForDeletion: boolean;
};

function canManagePolls(session: SessionInfo | null): boolean {
  return session !== null && (session.roleID === 1 || session.roleID === 2);
}

function normalizeOptionLabel(value: string): string {
  return value.trim();
}

function buildEmptyOption(): EditableOption {
  return {
    localID: crypto.randomUUID(),
    optionID: null,
    label: "",
    initialLabel: "",
    markedForDeletion: false,
  };
}

function toDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildInitialOptions(): EditableOption[] {
  return [buildEmptyOption(), buildEmptyOption()];
}

function mapPollOptions(poll: PollDetails): EditableOption[] {
  const sortedOptions = [...poll.options].sort((left, right) => {
    if (left.displayOrder !== right.displayOrder) {
      return left.displayOrder - right.displayOrder;
    }

    return left.optionID - right.optionID;
  });

  if (sortedOptions.length === 0) {
    return buildInitialOptions();
  }

  return sortedOptions.map((option) => ({
    localID: crypto.randomUUID(),
    optionID: option.optionID,
    label: option.label,
    initialLabel: option.label,
    markedForDeletion: false,
  }));
}

export default function UpsertPollView({
  session,
  pollID,
  onBack,
  onDone,
}: Props): ReactElement {
  const isEdit = typeof pollID === "number";
  const canSubmit = canManagePolls(session);

  const [poll, setPoll] = useState<PollDetails | null>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [endAt, setEndAt] = useState<Date | null>(null);
  const [options, setOptions] = useState<EditableOption[]>(buildInitialOptions);
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || typeof pollID !== "number") {
      setPoll(null);
      setTitle("");
      setDescription("");
      setEndAt(null);
      setOptions(buildInitialOptions());
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;

    const run = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const nextPoll = await apiGetPoll(pollID);

        /* v8 ignore next -- @preserve */
        if (!mounted) {
          return;
        }

        setPoll(nextPoll);
        setTitle(nextPoll.title);
        setDescription(nextPoll.description ?? "");
        setEndAt(toDate(nextPoll.endAt));
        setOptions(mapPollOptions(nextPoll));
      } catch (cause) {
        /* v8 ignore next -- @preserve */
        if (!mounted) {
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Impossible de charger le sondage.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [isEdit, pollID]);

  const activeOptions = useMemo(
    () => options.filter((option) => !option.markedForDeletion),
    [options],
  );

  const normalizedActiveLabels = useMemo(
    () =>
      activeOptions
        .map((option) => normalizeOptionLabel(option.label))
        .filter((label) => label.length > 0),
    [activeOptions],
  );

  function handleTitleChange(event: ChangeEvent<HTMLInputElement>): void {
    setTitle(event.target.value);
  }

  function handleDescriptionChange(
    event: ChangeEvent<HTMLTextAreaElement>,
  ): void {
    setDescription(event.target.value);
  }

  function updateOption(localID: string, value: string): void {
    setOptions((current) =>
      current.map((option) =>
        option.localID === localID ? { ...option, label: value } : option,
      ),
    );
  }

  function addOption(): void {
    setOptions((current) => [...current, buildEmptyOption()]);
  }

  function removeOption(localID: string): void {
    setOptions((current) => {
      const target = current.find((option) => option.localID === localID);
      const activeCount = current.filter(
        (option) => !option.markedForDeletion,
      ).length;

      if (target === undefined || activeCount <= 2) {
        return current;
      }

      if (target.optionID === null) {
        return current.filter((option) => option.localID !== localID);
      }

      return current.map((option) =>
        option.localID === localID
          ? { ...option, markedForDeletion: true }
          : option,
      );
    });
  }

  function restoreOption(localID: string): void {
    setOptions((current) =>
      current.map((option) =>
        option.localID === localID
          ? { ...option, markedForDeletion: false }
          : option,
      ),
    );
  }

  async function syncEditedOptions(currentPollID: number): Promise<void> {
    const optionsToDelete = options.filter(
      (option) => option.optionID !== null && option.markedForDeletion,
    );

    const optionsToRename = options.filter((option) => {
      if (option.optionID === null || option.markedForDeletion) {
        return false;
      }

      const normalizedLabel = normalizeOptionLabel(option.label);
      return (
        normalizedLabel.length > 0 && normalizedLabel !== option.initialLabel
      );
    });

    const optionsToCreate = options.filter((option) => {
      if (option.optionID !== null || option.markedForDeletion) {
        return false;
      }

      return normalizeOptionLabel(option.label).length > 0;
    });

    for (const option of optionsToDelete) {
      await apiDeletePollOption(currentPollID, option.optionID as number);
    }

    for (const option of optionsToRename) {
      await apiUpdatePollOption(currentPollID, option.optionID as number, {
        label: normalizeOptionLabel(option.label),
      });
    }

    for (const option of optionsToCreate) {
      await apiCreatePollOption(currentPollID, {
        label: normalizeOptionLabel(option.label),
      });
    }
  }

  async function handleSubmit(): Promise<void> {
    if (!canSubmit) {
      setError("Vous n'avez pas les droits pour gérer les sondages.");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length === 0) {
      setError("Le titre est obligatoire.");
      return;
    }

    if (endAt === null || Number.isNaN(endAt.getTime())) {
      setError("La date de fin est invalide.");
      return;
    }

    if (normalizedActiveLabels.length < 2) {
      setError("Un sondage doit contenir au moins deux réponses.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEdit && typeof pollID === "number") {
        const payload: UpdatePollBody = {
          title: trimmedTitle,
          description:
            trimmedDescription.length > 0 ? trimmedDescription : null,
          endAt: endAt.toISOString(),
          maxSelections: 1,
        };

        await apiUpdatePoll(pollID, payload);
        await syncEditedOptions(pollID);
      } else {
        const payload: CreatePollBody = {
          title: trimmedTitle,
          description:
            trimmedDescription.length > 0 ? trimmedDescription : null,
          endAt: endAt.toISOString(),
          maxSelections: 1,
          options: normalizedActiveLabels,
        };

        await apiCreatePoll(payload);
      }

      onDone();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible d'enregistrer le sondage.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!canSubmit) {
    return <p>Accès refusé.</p>;
  }

  if (isEdit && loading) {
    return <p>Chargement…</p>;
  }

  if (isEdit && !loading && error !== null && poll === null) {
    return (
      <div>
        <p>{error}</p>
        <button type="button" className="btn-secondary" onClick={onBack}>
          Retour
        </button>
      </div>
    );
  }

  if (isEdit && !loading && poll === null) {
    return (
      <div>
        <p>Sondage introuvable.</p>
        <button type="button" className="btn-secondary" onClick={onBack}>
          Retour
        </button>
      </div>
    );
  }

  return (
    <section className="poll-modal">
      <header className="poll-modal__header">
        <h2>{isEdit ? "Modifier le sondage" : "Créer un sondage"}</h2>

        <button
          type="button"
          className="btn-secondary"
          onClick={onBack}
          disabled={saving}
        >
          Fermer
        </button>
      </header>

      {error !== null ? <div className="alert-error">{error}</div> : null}

      <div className="poll-edit">
        <div className="poll-edit__main">
          <div className="poll-edit__section">
            <div className="form-group">
              <label htmlFor="poll-title">Titre</label>
              <input
                id="poll-title"
                className="form-input"
                value={title}
                onChange={handleTitleChange}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="poll-description">Description</label>
              <textarea
                id="poll-description"
                className="form-textarea"
                value={description}
                onChange={handleDescriptionChange}
                disabled={saving}
                rows={6}
              />
            </div>

            <div className="poll-edit__section">
              <div className="form-group">
                <label htmlFor="poll-end-at">Date de fin</label>
                <DatePicker
                  id="poll-end-at"
                  selected={endAt}
                  onChange={(date: Date | null) => setEndAt(date)}
                  showTimeSelect
                  timeIntervals={15}
                  timeCaption="Heure"
                  dateFormat="dd/MM/yyyy HH:mm"
                  locale={fr}
                  placeholderText="Choisir une date et une heure"
                  className="form-input"
                  disabled={saving}
                  isClearable
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="poll-edit__side">
          <section className="poll-options-editor poll-edit__section">
            <div className="poll-edit__section-header">
              <h3>Réponses</h3>
              <p>Ajoute, modifie ou retire les options proposées au vote.</p>
            </div>

            <div className="poll-options-editor__list">
              {options.map((option, index) => {
                if (option.markedForDeletion) {
                  return (
                    <div
                      key={option.localID}
                      className="poll-option-row poll-option-row--deleted"
                    >
                      <input
                        className="form-input"
                        value={`${option.label} (supprimée)`}
                        disabled
                      />

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => restoreOption(option.localID)}
                        disabled={saving}
                      >
                        Restaurer
                      </button>
                    </div>
                  );
                }

                const activeCount = activeOptions.length;

                return (
                  <div key={option.localID} className="poll-option-row">
                    <input
                      id={`poll-option-${index}`}
                      type="text"
                      className="form-input"
                      placeholder={`Réponse ${index + 1}`}
                      value={option.label}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        updateOption(option.localID, event.target.value)
                      }
                      disabled={saving}
                    />

                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => removeOption(option.localID)}
                      disabled={saving || activeCount <= 2}
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-secondary poll-options-editor__add"
              onClick={addOption}
              disabled={saving}
            >
              Ajouter une réponse
            </button>
          </section>
        </aside>
      </div>

      <footer className="poll-modal__footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={onBack}
          disabled={saving}
        >
          Annuler
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={() => void handleSubmit()}
          disabled={saving}
        >
          {isEdit
            ? saving
              ? "Enregistrement…"
              : "Enregistrer"
            : saving
              ? "Création…"
              : "Créer"}
        </button>
      </footer>
    </section>
  );
}
