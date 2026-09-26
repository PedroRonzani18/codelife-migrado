import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LevelForm } from "./LevelForm";
import type { AdminLevelDetail } from "@codelife/contracts/content-management";

const mockLevel: AdminLevelDetail = {
  id: "level-1",
  islandId: "island-1",
  title: "Conceito de Variável",
  position: 1,
  publishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  slideCount: 3,
  slides: [],
};

describe("LevelForm", () => {
  afterEach(cleanup);

  it("renders creation mode and validates mandatory title", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <LevelForm
        islandId="island-1"
        isCreating={true}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByRole("heading", { name: "Novo Nível" })).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Criar Nível" });
    await user.click(submitBtn);

    expect(await screen.findByText("O título é obrigatório")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits valid create payload", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <LevelForm
        islandId="island-1"
        isCreating={true}
        onSubmit={handleSubmit}
      />
    );

    await user.type(screen.getByLabelText(/título/i), "Condicionais e Fluxo");
    await user.click(screen.getByRole("button", { name: "Criar Nível" }));

    expect(handleSubmit).toHaveBeenCalledWith({
      title: "Condicionais e Fluxo",
    });
  });

  it("renders edit mode with existing data and handles publish", async () => {
    const user = userEvent.setup();
    const handlePublish = vi.fn();

    render(
      <LevelForm
        islandId="island-1"
        level={mockLevel}
        isCreating={false}
        onSubmit={vi.fn()}
        onPublish={handlePublish}
      />
    );

    expect(screen.getByRole("heading", { name: /Editar Nível: Conceito de Variável/i })).toBeInTheDocument();
    expect(screen.getByText("Rascunho")).toBeInTheDocument();
    expect(screen.getByText(/3 slides/i)).toBeInTheDocument();

    const publishBtn = screen.getByRole("button", { name: "Publicar" });
    await user.click(publishBtn);

    expect(handlePublish).toHaveBeenCalledWith(mockLevel.updatedAt);
  });
});
