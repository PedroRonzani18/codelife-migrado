import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type AdminIslandDetail,
  type CreateIslandInput,
  type UpdateIslandInput,
} from "@codelife/contracts/content-management";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmModal } from "../DeleteConfirmModal";

const islandFormSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
  slug: z
    .string()
    .min(1, "O slug é obrigatório")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "O slug deve conter apenas letras minúsculas, números e hífens"),
});

type IslandFormData = z.infer<typeof islandFormSchema>;

export type IslandFormProps = {
  island?: AdminIslandDetail | null;
  isCreating?: boolean;
  isPending?: boolean;
  onSubmit: (data: CreateIslandInput | UpdateIslandInput) => void;
  onPublish?: (expectedUpdatedAt?: string) => void;
  onUnpublish?: (expectedUpdatedAt?: string) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function IslandForm({
  island,
  isCreating = false,
  isPending = false,
  onSubmit,
  onPublish,
  onUnpublish,
  onDelete,
  onCancel,
  onDirtyChange,
}: IslandFormProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isPublished = Boolean(island?.publishedAt);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<IslandFormData>({
    resolver: zodResolver(islandFormSchema),
    defaultValues: {
      title: island?.title ?? "",
      slug: island?.slug ?? "",
    },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleFormSubmit = (data: IslandFormData) => {
    if (isCreating) {
      onSubmit({ title: data.title, slug: data.slug });
    } else if (island) {
      onSubmit({
        title: data.title,
        slug: data.slug,
        expectedUpdatedAt: island.updatedAt,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isCreating ? "Nova Ilha" : `Editar Ilha: ${island?.title}`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isCreating
              ? "Crie uma nova ilha para agrupar níveis de aprendizado."
              : "Atualize os dados editoriais da ilha."}
          </p>
        </div>
        {!isCreating && island && (
          <div className="flex items-center gap-2">
            <Badge variant={isPublished ? "default" : "outline"}>
              {isPublished ? "Publicada" : "Rascunho"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Posição: {island.position}
            </span>
          </div>
        )}
      </div>

      {!isCreating && isPublished && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
          <strong>Atenção:</strong> Esta ilha está atualmente publicada e visível para os estudantes. Qualquer alteração salva entrará em vigor imediatamente.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground">
            Título da Ilha
          </label>
          <input
            id="title"
            type="text"
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Ex: Interatividade em JavaScript"
            {...register("title")}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-foreground">
            Slug (Identificador Estável na URL)
          </label>
          <input
            id="slug"
            type="text"
            disabled={!isCreating && isPublished}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground"
            placeholder="Ex: island-3"
            {...register("slug")}
          />
          {!isCreating && isPublished && (
            <p className="mt-1 text-xs text-muted-foreground">
              O slug não pode ser alterado após a publicação para preservar referências na URL.
            </p>
          )}
          {errors.slug && (
            <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={isPending || (!isCreating && !isDirty)}
          >
            {isPending ? "Salvando…" : isCreating ? "Criar Ilha" : "Salvar Alterações"}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={onCancel}
            >
              Cancelar
            </Button>
          )}
        </div>

        {!isCreating && island && (
          <div className="flex items-center gap-2">
            {isPublished ? (
              onUnpublish && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => onUnpublish(island.updatedAt)}
                >
                  Despublicar
                </Button>
              )
            ) : (
              onPublish && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  disabled={isPending}
                  onClick={() => onPublish(island.updatedAt)}
                >
                  Publicar
                </Button>
              )
            )}

            {!isPublished && onDelete && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                disabled={isPending}
                onClick={() => setShowDeleteModal(true)}
              >
                Excluir
              </Button>
            )}
          </div>
        )}
      </div>

      {!isCreating && island && onDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          title="Excluir Ilha"
          description={`Tem certeza de que deseja excluir a ilha "${island.title}"? Todos os seus níveis e slides serão excluídos em cascata. Esta ação é irreversível.`}
          isPending={isPending}
          onConfirm={() => {
            setShowDeleteModal(false);
            onDelete();
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </form>
  );
}
