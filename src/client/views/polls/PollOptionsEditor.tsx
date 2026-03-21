import type { ChangeEvent, ReactElement } from "react";

import type { EditablePollOption } from "@/client/views/polls/pollOptionEditor.model";

type Props = {
  options: EditablePollOption[];
  activeOptionCount: number;
  saving: boolean;
  onAddOption: () => void;
  onRemoveOption: (localID: string) => void;
  onRestoreOption: (localID: string) => void;
  onUpdateOption: (localID: string, value: string) => void;
};

export default function PollOptionsEditor({
  options,
  activeOptionCount,
  saving,
  onAddOption,
  onRemoveOption,
  onRestoreOption,
  onUpdateOption,
}: Props): ReactElement {
  return (
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
                  onClick={() => onRestoreOption(option.localID)}
                  disabled={saving}
                >
                  Restaurer
                </button>
              </div>
            );
          }

          return (
            <div key={option.localID} className="poll-option-row">
              <input
                id={`poll-option-${index}`}
                type="text"
                className="form-input"
                placeholder={`Réponse ${index + 1}`}
                value={option.label}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  onUpdateOption(option.localID, event.target.value)
                }
                disabled={saving}
              />

              <button
                type="button"
                className="btn-secondary"
                onClick={() => onRemoveOption(option.localID)}
                disabled={saving || activeOptionCount <= 2}
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
        onClick={onAddOption}
        disabled={saving}
      >
        Ajouter une réponse
      </button>
    </section>
  );
}
