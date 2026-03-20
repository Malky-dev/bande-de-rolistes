import type { FormEvent, ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import { fr } from "date-fns/locale";
import {
  loadAvailableRpgStatuses,
  resolveNextRpgTableStatus,
} from "./RpgTableForm.helpers";

import {
  RPG_LOCATIONS,
  RPG_MAX_PLAYERS_OPTIONS,
  RPG_TABLE_STATUSES,
  RPG_STATUS_LABELS,
} from "../../../shared/constants";
import type { RpgTableStatus } from "../../../shared/constants";
import type { RpgTableDetails } from "../../../types/api/rpg";

import {
  defaultCreateValues,
  toCreateBody,
  toUpdateBody,
  validateRpgTable,
  valuesFromTable,
  type RpgTableFormValues,
} from "./rpgTableFormModel";

import {
  apiCreateRpgTable,
  apiListRpgStatuses,
  apiUpdateRpgTable,
  apiUpdateRpgTableStatus,
} from "../../../api/rpg";

type Props =
  | {
      mode: "create";
      canSubmit: boolean;
      onBack: () => void;
      onDone: (eventID: number) => void;
    }
  | {
      mode: "edit";
      canSubmit: boolean;
      table: RpgTableDetails;
      onBack: () => void;
      onDone: () => void;
    };

export default function RpgTableForm(props: Props): ReactElement | null {
  const initial = useMemo<RpgTableFormValues>(() => {
    return props.mode === "edit"
      ? valuesFromTable(props.table)
      : defaultCreateValues();
  }, [props]);

  const [values, setValues] = useState<RpgTableFormValues>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(initial);
  }, [initial]);

  const [availableStatuses, setAvailableStatuses] = useState<RpgTableStatus[]>(
    [],
  );
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  useEffect(() => {
    if (props.mode !== "edit") return;
    let mounted = true;

    const run = async () => {
      setIsLoadingStatuses(true);
      try {
        const statuses = await loadAvailableRpgStatuses(
          apiListRpgStatuses,
          RPG_TABLE_STATUSES,
        );
        if (mounted) setAvailableStatuses(statuses);
      } finally {
        if (mounted) setIsLoadingStatuses(false);
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, [props.mode]);

  if (!props.canSubmit) return null;

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const msg = validateRpgTable(values);
    if (msg) {
      setError(msg);
      return;
    }

    setIsSubmitting(true);
    try {
      if (props.mode === "create") {
        const created = await apiCreateRpgTable(toCreateBody(values));
        props.onDone(created.eventID);
        setValues(defaultCreateValues());
      } else {
        await apiUpdateRpgTable(props.table.eventID, toUpdateBody(values));

        const nextStatus = resolveNextRpgTableStatus(
          values.status,
          props.table.status,
        );
        if (nextStatus !== props.table.status) {
          await apiUpdateRpgTableStatus(props.table.eventID, nextStatus);
        }

        props.onDone();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rpg-create">
      <h3 className="rpg-create__title">
        {props.mode === "create" ? "Créer une table" : "Modifier la table"}
      </h3>

      {error ? <p className="auth-error">{error}</p> : null}

      <form onSubmit={(e) => void submit(e)} className="form">
        <div>
          <label htmlFor="rpg-game">Nom du Jeu</label>
          <input
            id="rpg-game"
            type="text"
            value={values.game}
            onChange={(e) => setValues((v) => ({ ...v, game: e.target.value }))}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="formField--grow">
          <label htmlFor="rpg-eventDate">
            Choisir la date et l'heure de la table dans le calendrier
          </label>
          <DatePicker
            id="rpg-eventDate"
            selected={values.eventDate}
            onChange={(d: Date | null) =>
              setValues((v) => ({ ...v, eventDate: d }))
            }
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={30}
            dateFormat="dd/MM/yyyy HH:mm"
            locale={fr}
            minTime={new Date(0, 0, 0, 12, 0)}
            maxTime={new Date(0, 0, 0, 23, 30)}
            minDate={new Date()}
            placeholderText="Cliquez ici pour faire apparaître le calendrier"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="rpg-maxPlayers">
            Nombre de joueurs maximum - les suivants seront placés sur la liste
            d'attente
          </label>
          <select
            id="rpg-maxPlayers"
            value={String(values.maxPlayers)}
            onChange={(e) =>
              setValues((v) => ({ ...v, maxPlayers: Number(e.target.value) }))
            }
            disabled={isSubmitting}
            required
          >
            {RPG_MAX_PLAYERS_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rpg-location">
            Choisir l'endroit ou se déroulera la table
          </label>
          <select
            id="rpg-location"
            value={values.location}
            onChange={(e) =>
              setValues((v) => ({ ...v, location: e.target.value }))
            }
            disabled={isSubmitting}
            required
          >
            <option value="">-- Liste des sites --</option>
            {RPG_LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rpg-comments">
            Commentaire - Pour informer les joueurs sur la table
          </label>
          <textarea
            id="rpg-comments"
            value={values.comments}
            onChange={(e) =>
              setValues((v) => ({ ...v, comments: e.target.value }))
            }
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label>Statut</label>
          <div className="radio-group">
            {(availableStatuses.length > 0
              ? availableStatuses
              : [...RPG_TABLE_STATUSES]
            ).map((s) => (
              <label key={s} className="radio-row">
                <input
                  type="radio"
                  name="rpg-status"
                  value={s}
                  checked={(values.status ?? "OPEN") === s}
                  onChange={() => setValues((v) => ({ ...v, status: s }))}
                  disabled={isSubmitting || isLoadingStatuses}
                />
                <span>{RPG_STATUS_LABELS[s] ?? s}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={props.onBack}
            disabled={isSubmitting}
          >
            Retour
          </button>

          <button className="btn-primary" type="submit" disabled={isSubmitting}>
            {props.mode === "create"
              ? isSubmitting
                ? "Création…"
                : "Créer"
              : isSubmitting
                ? "Enregistrement…"
                : "Enregistrer"}
          </button>
        </div>
      </form>
    </section>
  );
}
