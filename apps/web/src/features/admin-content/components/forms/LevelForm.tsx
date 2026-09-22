import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type AdminLevelDetail,
  type CreateLevelInput,
  type UpdateLevelInput,
} from "@codelife/contracts/content-management";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteConfirmModal } from "../DeleteConfirmModal";

const levelFormSchema = z.object({
  title: z.string().min(1, "O título é obrigatório"),
});

type LevelFormData = z.infer<typeof levelFormSchema>;

export type LevelFormProps = {
  islandId: string;
  level?: AdminLevelDetail | null;
  isCreating?: boolean;
  isPending?: boolean;
  onSubmit: (data: CreateLevelInput | UpdateLevelInput) => void;
  onPublish?: (expectedUpdatedAt?: string) => void;
  onUnpublish?: (expectedUpdatedAt?: string) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function LevelForm({
  islandId: _islandId,
  level,
  isCreating = false,
  isPending = false,
  onSubmit,
  onPublish,
  onUnpublish,
  onDelete,
  onCancel,
  onDirtyChange,
}: LevelFormProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isPublished = Boolean(level?.publishedAt);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<LevelFormData>({
    resolver: zodResolver(levelFormSchema),
    defaultValues: {
      title: level?.title ?? "",
    },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const handleFormSubmit = (data: LevelFormData) => {
    if (isCreating) {
      onSubmit({ title: data.title });
    } else if (level) {
      onSubmit({
        title: data.title,
        expectedUpdatedAt: level.updatedAt,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {isCreating ? "Novo Nível" : `Editar Nível: ${level?.title}`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isCreating
              ? "Crie um novo nível nesta ilha para conter slides de aprendizado."
              : "Atualize os dados editoriais do nível."}
          </p>
        </div>
        {!isCreating && level && (
          <div className="flex items-center gap-2">
            <Badge variant={isPublished ? "default" : "outline"}>
              {isPublished ? "Publicado" : "Rascunho"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Posição: {level.position} | {level.slideCount} slide{level.slideCount === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      {!isCreating && isPublished && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-600 dark:text-amber-400">
          <strong>Atenção:</strong> Este nível está publicado. Alterações salvas entrarão no ar imediatamente.
        </div>
      )}

      <div>
        <label htmlFor="level-title" className="block text-sm font-medium text-foreground">
          Título do Nível
        </label>
        <input
          id="level-title"
          type="text"
          className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Ex: Variáveis e Constantes"
          {...register("title")}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="sm"
            disabled={isPending || (!isCreating && !isDirty)}
          >
            {isPending ? "Salvando…" : isCreating ? "Criar Nível" : "Salvar Alterações"}
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

        {!isCreating && level && (
          <div className="flex items-center gap-2">
            {isPublished ? (
              onUnpublish && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isPending}
                  onClick={() => onUnpublish(level.updatedAt)}
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
                  disabled={isPending || level.slideCount === 0}
                  title={level.slideCount === 0 ? "É necessário ter pelo menos 1 slide para publicar" : undefined}
                  onClick={() => onPublish(level.updatedAt)}
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

      {!isCreating && level && onDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          title="Excluir Nível"
          description={`Tem certeza de que deseja excluir o nível "${level.title}"? Todos os seus slides serão excluídos em cascata. Esta ação é irreversível.`}
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
