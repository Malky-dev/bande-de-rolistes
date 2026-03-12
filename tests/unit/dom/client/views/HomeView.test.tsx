import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomeView from "@/client/views/HomeView";

describe("HomeView", () => {
  it("affiche le contenu principal et déclenche les actions", () => {
    const onDiscover = vi.fn();
    const onJoinTable = vi.fn();

    render(<HomeView onDiscover={onDiscover} onJoinTable={onJoinTable} />);

    expect(screen.getByText(/Bienvenue à/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Prochaine soirée découverte/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /Découvrir l'association/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Rejoindre une table/i }),
    );

    expect(onDiscover).toHaveBeenCalledTimes(1);
    expect(onJoinTable).toHaveBeenCalledTimes(1);
  });
});
