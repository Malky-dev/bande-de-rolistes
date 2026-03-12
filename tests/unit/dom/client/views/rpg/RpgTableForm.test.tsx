import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import RpgTableForm from "@/client/views/rpg/RpgTableForm";
import {
  loadAvailableRpgStatuses,
  resolveNextRpgTableStatus,
} from "@/client/views/rpg/RpgTableForm.helpers";
import {
  apiCreateRpgTable,
  apiListRpgStatuses,
  apiUpdateRpgTable,
  apiUpdateRpgTableStatus,
} from "@/api/rpgApi";

vi.mock("react-datepicker", () => ({
  default: ({
    id,
    selected,
    onChange,
  }: {
    id: string;
    selected: Date | null;
    onChange: (date: Date | null) => void;
  }) => (
    <div>
      <input id={id} value={selected ? selected.toISOString() : ""} readOnly />
      <button
        type="button"
        onClick={() => onChange(new Date("2026-01-02T12:00:00.000Z"))}
      >
        pick-date
      </button>
    </div>
  ),
}));

vi.mock("@/api/rpgApi", () => ({
  apiCreateRpgTable: vi.fn(),
  apiListRpgStatuses: vi.fn(),
  apiUpdateRpgTable: vi.fn(),
  apiUpdateRpgTableStatus: vi.fn(),
}));

describe("RpgTableForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("résout les statuts via les helpers du formulaire de table JDR", async () => {
    await expect(
      loadAvailableRpgStatuses(async () => ["OPEN", "CLOSED"]),
    ).resolves.toEqual(["OPEN", "CLOSED"]);
    await expect(
      loadAvailableRpgStatuses(async () => {
        throw new Error("boom");
      }, ["OPEN", "CANCELLED"]),
    ).resolves.toEqual(["OPEN", "CANCELLED"]);

    expect(resolveNextRpgTableStatus(undefined, "OPEN")).toBe("OPEN");
    expect(resolveNextRpgTableStatus("CLOSED", "OPEN")).toBe("CLOSED");
  });

  it("renvoie null quand la soumission n’est pas autorisée", () => {
    const { container } = render(
      <RpgTableForm
        mode="create"
        canSubmit={false}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("valide le formulaire de création avant soumission", async () => {
    render(
      <RpgTableForm
        mode="create"
        canSubmit={true}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nom du Jeu"), {
      target: { value: "D&D" },
    });
    fireEvent.change(screen.getByLabelText(/Choisir l'endroit/i), {
      target: { value: "Salle Oxford" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => {
      expect(screen.getByText("La date/heure est requise")).toBeInTheDocument();
    });
  });

  it("crée une table et appelle onDone avec l’identifiant d’événement créé", async () => {
    const onDone = vi.fn();
    vi.mocked(apiCreateRpgTable).mockResolvedValue({
      eventID: 12,
      message: "created",
    });

    render(
      <RpgTableForm
        mode="create"
        canSubmit={true}
        onBack={vi.fn()}
        onDone={onDone}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nom du Jeu"), {
      target: { value: "D&D" },
    });
    fireEvent.click(screen.getByText("pick-date"));
    fireEvent.change(screen.getByLabelText(/Nombre de joueurs maximum/i), {
      target: { value: "6" },
    });
    fireEvent.change(screen.getByLabelText(/Choisir l'endroit/i), {
      target: { value: "Salle Oxford" },
    });
    fireEvent.change(screen.getByLabelText(/Commentaire/i), {
      target: { value: "Bring dice" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Créer" }));

    await waitFor(() => {
      expect(apiCreateRpgTable).toHaveBeenCalled();
    });
    expect(onDone).toHaveBeenCalledWith(12);
  });

  it("charge les statuts en mode édition, met à jour la table puis le statut quand il change", async () => {
    const onDone = vi.fn();
    vi.mocked(apiListRpgStatuses).mockResolvedValue(["OPEN", "CLOSED"]);
    vi.mocked(apiUpdateRpgTable).mockResolvedValue();
    vi.mocked(apiUpdateRpgTableStatus).mockResolvedValue();

    render(
      <RpgTableForm
        mode="edit"
        canSubmit={true}
        table={{
          eventID: 12,
          eventDate: "2026-01-01T12:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: "hello",
          status: "OPEN",
          maxPlayers: 6,
          confirmedCap: 6,
          confirmed: [],
          waitlist: [],
        }}
        onBack={vi.fn()}
        onDone={onDone}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("CLOSED")).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText("Nom du Jeu"), {
      target: { value: "Pathfinder" },
    });
    fireEvent.click(screen.getByDisplayValue("CLOSED"));
    fireEvent.submit(
      screen.getByRole("button", { name: "Enregistrer" }).closest("form")!,
    );

    await waitFor(() => {
      expect(apiUpdateRpgTable).toHaveBeenCalledWith(12, {
        eventDate: "2026-01-01T12:00:00.000Z",
        location: "Paris",
        game: "Pathfinder",
        maxPlayers: 6,
        comments: "hello",
      });
    });
    expect(apiUpdateRpgTableStatus).toHaveBeenCalledWith(12, "CLOSED");
    expect(onDone).toHaveBeenCalled();
  });

  it("retombe sur les statuts par défaut et affiche les erreurs de soumission", async () => {
    vi.mocked(apiListRpgStatuses).mockRejectedValue(new Error("status failed"));
    vi.mocked(apiUpdateRpgTable).mockRejectedValue(new Error("update failed"));

    render(
      <RpgTableForm
        mode="edit"
        canSubmit={true}
        table={{
          eventID: 12,
          eventDate: "2026-01-01T12:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 6,
          confirmedCap: 6,
          confirmed: [],
          waitlist: [],
        }}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("OPEN")).toBeInTheDocument();
    });

    fireEvent.submit(
      screen.getByRole("button", { name: "Enregistrer" }).closest("form")!,
    );

    await waitFor(() => {
      expect(apiUpdateRpgTable).toHaveBeenCalled();
      expect(screen.getByText("update failed")).toBeInTheDocument();
    });
  });

  it("ne met pas à jour le statut quand il ne change pas et permet le retour arrière", async () => {
    const onBack = vi.fn();
    vi.mocked(apiListRpgStatuses).mockResolvedValue(["OPEN", "CLOSED"]);
    vi.mocked(apiUpdateRpgTable).mockResolvedValue();

    render(
      <RpgTableForm
        mode="edit"
        canSubmit={true}
        table={{
          eventID: 12,
          eventDate: "2026-01-01T12:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 6,
          confirmedCap: 6,
          confirmed: [],
          waitlist: [],
        }}
        onBack={onBack}
        onDone={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("OPEN")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Retour" }));
    expect(onBack).toHaveBeenCalledTimes(1);

    fireEvent.submit(
      screen.getByRole("button", { name: "Enregistrer" }).closest("form")!,
    );

    await waitFor(() => {
      expect(apiUpdateRpgTable).toHaveBeenCalled();
    });
    expect(apiUpdateRpgTableStatus).not.toHaveBeenCalled();
  });

  it("affiche le message d’erreur générique pour les soumissions non Error", async () => {
    vi.mocked(apiCreateRpgTable).mockRejectedValue("boom");

    render(
      <RpgTableForm
        mode="create"
        canSubmit={true}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nom du Jeu"), {
      target: { value: "D&D" },
    });
    fireEvent.click(screen.getByText("pick-date"));
    fireEvent.change(screen.getByLabelText(/Choisir l'endroit/i), {
      target: { value: "Salle Oxford" },
    });
    fireEvent.submit(
      screen.getByRole("button", { name: "Créer" }).closest("form")!,
    );

    await waitFor(() => {
      expect(screen.getByText("Erreur")).toBeInTheDocument();
    });
  });

  it("retombe sur le libellé brut du statut quand un statut inconnu est renvoyé", async () => {
    vi.mocked(apiListRpgStatuses).mockResolvedValue([
      "OPEN",
      "PAUSED" as unknown as "OPEN",
    ]);

    render(
      <RpgTableForm
        mode="edit"
        canSubmit={true}
        table={{
          eventID: 12,
          eventDate: "2026-01-01T12:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 6,
          confirmedCap: 6,
          confirmed: [],
          waitlist: [],
        }}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("PAUSED")).toBeInTheDocument();
    });
  });
});
