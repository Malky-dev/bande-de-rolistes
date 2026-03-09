import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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

import UpsertRpgTableView from "@/client/views/rpg/UpsertRpgTableView";
import { apiGetRpgTable } from "@/api/rpgApi";

describe("UpsertRpgTableView", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the create form when no event id is provided", () => {
    const onBack = vi.fn();
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
      />,
    );

    expect(screen.getByText("create")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
    screen.getByText("done").click();
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders the loading, error, and not-found edit states", async () => {
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
      />,
    );

    expect(screen.getByText("Chargement\u2026")).toBeInTheDocument();

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
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Table introuvable.")).toBeInTheDocument();
    });
  });

  it("shows the generic load error for non-Error failures", async () => {
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
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de charger la table"),
      ).toBeInTheDocument();
    });
  });

  it("renders the edit form and computes canSubmit from the loaded table", async () => {
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
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("edit")).toBeInTheDocument();
    });
    expect(screen.getByText("true")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });
});
