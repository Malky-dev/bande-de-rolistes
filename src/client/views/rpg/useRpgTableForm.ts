import { useCallback, useEffect, useMemo, useState } from "react";

import { RPG_TABLE_STATUSES, type RpgTableStatus } from "@/shared/constants";
import type { RpgTableDetails } from "@/types/api/rpg";
import {
  apiCreateRpgTable,
  apiListRpgStatuses,
  apiUpdateRpgTable,
  apiUpdateRpgTableStatus,
} from "@/api/rpg";
import {
  defaultCreateValues,
  toCreateBody,
  toUpdateBody,
  validateRpgTable,
  valuesFromTable,
  type RpgTableFormValues,
} from "@/client/views/rpg/rpgTableFormModel";
import {
  loadAvailableRpgStatuses,
  resolveNextRpgTableStatus,
} from "@/client/views/rpg/RpgTableForm.helpers";

type CreateProps = {
  mode: "create";
  canSubmit: boolean;
  onDone: (eventID: number) => void;
};

type EditProps = {
  mode: "edit";
  canSubmit: boolean;
  table: RpgTableDetails;
  onDone: () => void;
};

type UseRpgTableFormArgs = CreateProps | EditProps;

export function useRpgTableForm(props: UseRpgTableFormArgs) {
  const initialValues = useMemo<RpgTableFormValues>(() => {
    return props.mode === "edit"
      ? valuesFromTable(props.table)
      : defaultCreateValues();
  }, [props]);

  const [values, setValues] = useState<RpgTableFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<RpgTableStatus[]>(
    [],
  );
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (props.mode !== "edit") {
      setAvailableStatuses([]);
      setIsLoadingStatuses(false);
      return;
    }

    let mounted = true;

    const run = async (): Promise<void> => {
      setIsLoadingStatuses(true);
      try {
        const statuses = await loadAvailableRpgStatuses(
          apiListRpgStatuses,
          RPG_TABLE_STATUSES,
        );
        if (mounted) {
          setAvailableStatuses(statuses);
        }
      } finally {
        if (mounted) {
          setIsLoadingStatuses(false);
        }
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [props.mode]);

  const updateField = useCallback(
    <K extends keyof RpgTableFormValues>(
      field: K,
      value: RpgTableFormValues[K],
    ): void => {
      setValues((currentValues) => ({
        ...currentValues,
        [field]: value,
      }));
    },
    [],
  );

  const submit = useCallback(async (): Promise<void> => {
    setError(null);

    const validationError = validateRpgTable(values);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (props.mode === "create") {
        const created = await apiCreateRpgTable(toCreateBody(values));
        props.onDone(created.eventID);
        setValues(defaultCreateValues());
        return;
      }

      await apiUpdateRpgTable(props.table.eventID, toUpdateBody(values));

      const nextStatus = resolveNextRpgTableStatus(
        values.status,
        props.table.status,
      );
      if (nextStatus !== props.table.status) {
        await apiUpdateRpgTableStatus(props.table.eventID, nextStatus);
      }

      props.onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Erreur");
    } finally {
      setIsSubmitting(false);
    }
  }, [props, values]);

  const statusOptions =
    availableStatuses.length > 0 ? availableStatuses : [...RPG_TABLE_STATUSES];

  return {
    values,
    error,
    isSubmitting,
    availableStatuses: statusOptions,
    isLoadingStatuses,
    updateField,
    submit,
  };
}
