import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import UpsertRpgTableView from "@/client/views/rpg/UpsertRpgTableView";
import { apiGetRpgTable } from "@/api/rpgApi";

vi.mock("@/api/rpgApi", () => ({
  apiGetRpgTable: vi.fn(),
}));

vi.mock("@/client/views/rpg/RpgTableForm", () => ({
  default: (props: {
    mode: string;
    canSubmit: boolean;
    table?: { eventID: number };
    onDone: () => void;
  }) => (
    <div>
      <span>{props.mode}</span>
      <span>{String(props.canSubmit)}</span>
      <span>{props.table ? props.table.eventID : "no-table"}</span>
      <button onClick={props.onDone}>done</button>
    </div>
  ),
}));

describe("UpsertRpgTableView", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le formulaire de création quand aucun identifiant d’événement n’est fourni", () => {
    const onBack = vi.fn();
    const onDone = vi.fn();

    render(
      <UpsertRpgTableView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onBack={onBack}
        onDone={onDone}
      />,
    );

    expect(screen.getByText("create")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
    screen.getByText("done").click();
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  it("affiche les états chargement, erreur et introuvable en mode édition", async () => {
    const { rerender } = render(
      <UpsertRpgTableView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        eventID={10}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    expect(screen.getByText("Chargement…")).toBeInTheDocument();

    vi.mocked(apiGetRpgTable).mockRejectedValueOnce(new Error("Load failed"));
    rerender(
      <UpsertRpgTableView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        eventID={11}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Load failed")).toBeInTheDocument();
    });

    vi.mocked(apiGetRpgTable).mockResolvedValueOnce(null as never);
    rerender(
      <UpsertRpgTableView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        eventID={12}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Table introuvable.")).toBeInTheDocument();
    });
  });

  it("affiche l’erreur de chargement générique pour les échecs non Error", async () => {
    vi.mocked(apiGetRpgTable).mockRejectedValue("boom");

    render(
      <UpsertRpgTableView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        eventID={10}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de charger la table"),
      ).toBeInTheDocument();
    });
  });

  it("affiche le formulaire d’édition et calcule canSubmit à partir de la table chargée", async () => {
    vi.mocked(apiGetRpgTable).mockResolvedValue({
      eventID: 10,
      eventDate: "2026-01-01T12:00:00.000Z",
      dungeonMaster: { userID: 7, nickname: "DM" },
      location: "Paris",
      game: "D&D",
      comments: null,
      status: "OPEN",
      maxPlayers: 6,
      confirmedCap: 6,
      confirmed: [],
      waitlist: [],
    });

    render(
      <UpsertRpgTableView
        session={{
          userID: 7,
          nickname: "DM",
          roleID: 5,
          role: "member",
          isVerified: true,
        }}
        eventID={10}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("edit")).toBeInTheDocument();
    });
    expect(screen.getByText("true")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
