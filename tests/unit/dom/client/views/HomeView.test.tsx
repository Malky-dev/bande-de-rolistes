import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomeView from "@/client/views/HomeView";

describe("HomeView", () => {
  it("renders the hero content and triggers actions", () => {
    const onDiscover = vi.fn();
    const onJoinTable = vi.fn();

    render(<HomeView onDiscover={onDiscover} onJoinTable={onJoinTable} />);

    expect(screen.getByText(/Bienvenue \u00e0/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Prochaine soir\u00e9e d\u00e9couverte/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /D\u00e9couvrir l'association/i }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Rejoindre une table/i }),
    );

    expect(onDiscover).toHaveBeenCalledTimes(1);
    expect(onJoinTable).toHaveBeenCalledTimes(1);
  });
});
