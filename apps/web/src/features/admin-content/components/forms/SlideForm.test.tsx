import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SlideForm } from "./SlideForm";
import type { AdminSlideDetail } from "@codelife/contracts/content-management";

const mockTextTextSlide: AdminSlideDetail = {
  id: "slide-1",
  levelId: "level-1",
  title: "Introdução",
  position: 1,
  type: "TextText",
  primaryText: "Olá mundo!",
  secondaryText: "Bem-vindo ao CodeLife",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("SlideForm", () => {
  afterEach(cleanup);

  it("renders TextText form and validates mandatory primaryText", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <SlideForm
        levelId="level-1"
        isCreating={true}
        onSubmit={handleSubmit}
      />
    );

    expect(screen.getByRole("heading", { name: "Novo Slide" })).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: "Criar Slide" });
    await user.click(submitBtn);

    expect(await screen.findByText("O título é obrigatório")).toBeInTheDocument();
    expect(await screen.findByText("O texto principal é obrigatório")).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits valid TextText slide", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <SlideForm
        levelId="level-1"
        isCreating={true}
        onSubmit={handleSubmit}
      />
    );

    await user.type(screen.getByLabelText(/título do slide/i), "Slide 1");
    await user.type(screen.getByLabelText(/texto principal/i), "Conteúdo principal do slide");

    await user.click(screen.getByRole("button", { name: "Criar Slide" }));

    expect(handleSubmit).toHaveBeenCalledWith({
      title: "Slide 1",
      type: "TextText",
      primaryText: "Conteúdo principal do slide",
      secondaryText: null,
    });
  });

  it("switches to TextCode and validates code and text", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <SlideForm
        levelId="level-1"
        isCreating={true}
        onSubmit={handleSubmit}
      />
    );

    await user.selectOptions(screen.getByLabelText(/tipo do slide/i), "TextCode");

    expect(screen.getByLabelText(/^código$/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/título do slide/i), "Slide de Código");
    await user.click(screen.getByRole("button", { name: "Criar Slide" }));

    expect(await screen.findByText("O texto explicativo é obrigatório")).toBeInTheDocument();
    expect(await screen.findByText("O código é obrigatório")).toBeInTheDocument();
  });

  it("renders edit mode with existing slide", () => {
    render(
      <SlideForm
        levelId="level-1"
        slide={mockTextTextSlide}
        isCreating={false}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: /Editar Slide: Introdução/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Olá mundo!")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bem-vindo ao CodeLife")).toBeInTheDocument();
  });
});
