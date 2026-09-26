import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminContentTree } from "./AdminContentTree";
import type { AdminContentTree as AdminContentTreeType } from "@codelife/contracts/content-management";

const mockTree: AdminContentTreeType = [
  {
    id: "island-1",
    slug: "island-1",
    title: "Ilha 1",
    position: 1,
    publishedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    levels: [
      {
        id: "level-1",
        islandId: "island-1",
        title: "Nível 1",
        position: 1,
        publishedAt: null,
        updatedAt: "2026-01-01T00:00:00.000Z",
        slides: [
          {
            id: "slide-1",
            levelId: "level-1",
            title: "Slide 1",
            position: 1,
            type: "TextText",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        ],
      },
    ],
  },
  {
    id: "island-2",
    slug: "island-2",
    title: "Ilha 2",
    position: 2,
    publishedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    levels: [],
  },
];

describe("AdminContentTree", () => {
  afterEach(cleanup);

  it("renders tree nodes, titles, and publication badges", () => {
    render(
      <AdminContentTree
        tree={mockTree}
        onSelect={vi.fn()}
        onCreateIsland={vi.fn()}
        onCreateLevel={vi.fn()}
        onCreateSlide={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Ilha 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ilha 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nível 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^1\. Slide 1/ })).toBeInTheDocument();

    expect(screen.getByText("Pub")).toBeInTheDocument();
    expect(screen.getAllByText("Rasc")).toHaveLength(2); // Level 1 and Island 2
  });

  it("handles node selection", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <AdminContentTree
        tree={mockTree}
        onSelect={handleSelect}
        onCreateIsland={vi.fn()}
        onCreateLevel={vi.fn()}
        onCreateSlide={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Ilha 1" }));
    expect(handleSelect).toHaveBeenCalledWith("island", "island-1");

    await user.click(screen.getByRole("button", { name: "Nível 1" }));
    expect(handleSelect).toHaveBeenCalledWith("level", "level-1");

    await user.click(screen.getByRole("button", { name: /^1\. Slide 1/ }));
    expect(handleSelect).toHaveBeenCalledWith("slide", "slide-1");
  });

  it("handles reordering via accessible move buttons", async () => {
    const user = userEvent.setup();
    const handleReorderIslands = vi.fn();

    render(
      <AdminContentTree
        tree={mockTree}
        onSelect={vi.fn()}
        onCreateIsland={vi.fn()}
        onCreateLevel={vi.fn()}
        onCreateSlide={vi.fn()}
        onReorderIslands={handleReorderIslands}
      />
    );

    const moveDownBtn = screen.getByRole("button", { name: 'Mover ilha "Ilha 1" para baixo' });
    await user.click(moveDownBtn);

    expect(handleReorderIslands).toHaveBeenCalledWith(["island-2", "island-1"]);
  });
});
