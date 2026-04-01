import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import { fr } from "date-fns/locale";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { apiCreatePoll, apiGetPoll, apiUpdatePoll } from "@/api/polls";
import { syncEditedPollOptions } from "@/client/views/polls/pollOptionEditor.service";
import { canManagePolls } from "@/client/utils/permissions";
import {
  addEditablePollOption,
  buildInitialPollOptions,
  getActiveEditablePollOptions,
  getNormalizedActivePollOptionLabels,
  mapPollDetailsToEditableOptions,
  removeEditablePollOption,
  restoreEditablePollOption,
  updateEditablePollOptionLabel,
  type EditablePollOption,
} from "@/client/views/polls/pollOptionEditor.model";
import {
  buildCreatePollPayload,
  buildPollFormError,
  buildUpdatePollPayload,
} from "@/client/views/polls/pollForm.helpers";
import PollOptionsEditor from "@/client/views/polls/PollOptionsEditor";
import PollEditorState from "@/client/views/polls/PollEditorState";
import type { PollDetails } from "@/types/api/polls";
import type { SessionInfo } from "@/types/api/session";

type Props = {
  session: SessionInfo | null;
  pollID?: number | null;
  onBack: () => void;
  onDone: () => void;
};

function toDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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
  const [options, setOptions] = useState<EditablePollOption[]>(
    buildInitialPollOptions,
  );
  const [loading, setLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit || typeof pollID !== "number") {
      setPoll(null);
      setTitle("");
      setDescription("");
      setEndAt(null);
      setOptions(buildInitialPollOptions());
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
        setOptions(mapPollDetailsToEditableOptions(nextPoll));
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
    () => getActiveEditablePollOptions(options),
    [options],
  );

  const normalizedActiveLabels = useMemo(
    () => getNormalizedActivePollOptionLabels(options),
    [options],
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
      updateEditablePollOptionLabel(current, localID, value),
    );
  }

  function addOption(): void {
    setOptions((current) => addEditablePollOption(current));
  }

  function removeOption(localID: string): void {
    setOptions((current) => removeEditablePollOption(current, localID));
  }

  function restoreOption(localID: string): void {
    setOptions((current) => restoreEditablePollOption(current, localID));
  }

  async function handleSubmit(): Promise<void> {
    const formError = buildPollFormError(
      canSubmit,
      {
        title,
        description,
        endAt,
      },
      normalizedActiveLabels,
    );

    if (formError !== null) {
      setError(formError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isEdit && typeof pollID === "number") {
        const payload = buildUpdatePollPayload({
          title,
          description,
          endAt,
        });

        await apiUpdatePoll(pollID, payload);
        await syncEditedPollOptions(pollID, options);
      } else {
        const payload = buildCreatePollPayload(
          {
            title,
            description,
            endAt,
          },
          normalizedActiveLabels,
        );

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
    return <PollEditorState mode="forbidden" onBack={onBack} />;
  }

  if (isEdit && loading) {
    return <PollEditorState mode="loading" onBack={onBack} />;
  }

  if (isEdit && !loading && error !== null && poll === null) {
    return (
      <PollEditorState mode="load-error" message={error} onBack={onBack} />
    );
  }

  if (isEdit && !loading && poll === null) {
    return <PollEditorState mode="not-found" onBack={onBack} />;
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
          <PollOptionsEditor
            options={options}
            activeOptionCount={activeOptions.length}
            saving={saving}
            onAddOption={addOption}
            onRemoveOption={removeOption}
            onRestoreOption={restoreOption}
            onUpdateOption={updateOption}
          />
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
