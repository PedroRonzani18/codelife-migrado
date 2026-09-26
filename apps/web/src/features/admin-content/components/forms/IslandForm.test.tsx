import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IslandForm } from "./IslandForm";
import type { AdminIslandDetail } from "@codelife/contracts/content-management";

const mockIsland: AdminIslandDetail = {
  id: "island-1",
  slug: "island-1",
  title: "Primeiros Passos",
  position: 1,
  publishedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  levelCount: 2,
  levels: [],
};

describe("IslandForm", () => {
  afterEach(cleanup);

  it("renders creation mode and validates mandatory fields", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <IslandForm
        isCreating={true}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByRole("heading", { name: "Nova Ilha" })).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Criar Ilha" });
    await user.click(submitBtn);

    expect(await screen.findByText("O título é obrigatório")).toBeInTheDocument();
    expect(await screen.findByText("O slug é obrigatório")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("validates slug pattern", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <IslandForm
        isCreating={true}
        onSubmit={handleSubmit}
      />
    );

    const titleInput = screen.getByLabelText(/título/i);
    const slugInput = screen.getByLabelText(/slug/i);

    await user.type(titleInput, "Ilha Teste");
    await user.type(slugInput, "SLUG COM ESPAÇO");

    const submitBtn = screen.getByRole("button", { name: "Criar Ilha" });
    await user.click(submitBtn);

    expect(
      await screen.findByText("O slug deve conter apenas letras minúsculas, números e hífens")
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits valid create payload", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <IslandForm
        isCreating={true}
        onSubmit={handleSubmit}
      />
    );

    await user.type(screen.getByLabelText(/título/i), "Variáveis e Tipos");
    await user.type(screen.getByLabelText(/slug/i), "variaveis-e-tipos");

    await user.click(screen.getByRole("button", { name: "Criar Ilha" }));

    expect(handleSubmit).toHaveBeenCalledWith({
      title: "Variáveis e Tipos",
      slug: "variaveis-e-tipos",
    });
  });

  it("renders edit mode with existing data and handles publish", async () => {
    const user = userEvent.setup();
    const handlePublish = vi.fn();

    render(
      <IslandForm
        island={mockIsland}
        isCreating={false}
        onSubmit={vi.fn()}
        onPublish={handlePublish}
      />
    );

    expect(screen.getByRole("heading", { name: /Editar Ilha: Primeiros Passos/i })).toBeInTheDocument();
    expect(screen.getByText("Rascunho")).toBeInTheDocument();

    const publishBtn = screen.getByRole("button", { name: "Publicar" });
    await user.click(publishBtn);

    expect(handlePublish).toHaveBeenCalledWith(mockIsland.updatedAt);
  });
});
