import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type AdminSlideDetail,
  type CreateSlideInput,
  type UpdateSlideInput,
} from "@codelife/contracts/content-management";
import type { MediaAssetSummary } from "@codelife/contracts/learning";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DeleteConfirmModal } from "../DeleteConfirmModal";
import { SlidePreview } from "../SlidePreview";
import { mapApiErrorMessage } from "@/shared/http";

const slideFormSchema = z.object({
  type: z.enum(["TextText", "TextImage", "TextCode"]),
  title: z.string().min(1, "O título é obrigatório"),
  primaryText: z.string().optional(),
  secondaryText: z.string().nullable().optional(),
  text: z.string().optional(),
  altText: z.string().optional(),
  mediaAssetId: z.string().optional(),
  code: z.string().optional(),
  language: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "TextText") {
    if (!data.primaryText || data.primaryText.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O texto principal é obrigatório", path: ["primaryText"] });
    }
  } else if (data.type === "TextImage") {
    if (!data.text || data.text.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O texto explicativo é obrigatório", path: ["text"] });
    }
    if (!data.altText || data.altText.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O texto alternativo é obrigatório", path: ["altText"] });
    }
    if (!data.mediaAssetId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O upload de uma imagem é obrigatório", path: ["mediaAssetId"] });
    }
  } else if (data.type === "TextCode") {
    if (!data.text || data.text.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O texto explicativo é obrigatório", path: ["text"] });
    }
    if (!data.code || data.code.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "O código é obrigatório", path: ["code"] });
    }
    if (!data.language || data.language.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A linguagem é obrigatória", path: ["language"] });
    }
  }
});

type SlideFormData = z.infer<typeof slideFormSchema>;

export type SlideFormProps = {
  levelId: string;
  slide?: AdminSlideDetail | null;
  isCreating?: boolean;
  isPending?: boolean;
  onSubmit: (data: CreateSlideInput | UpdateSlideInput) => void;
  onUploadMedia?: (file: File) => Promise<MediaAssetSummary>;
  onDelete?: () => void;
  onCancel?: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

export function SlideForm({
  levelId: _levelId,
  slide,
  isCreating = false,
  isPending = false,
  onSubmit,
  onUploadMedia,
  onDelete,
  onCancel,
  onDirtyChange,
}: SlideFormProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentMediaAsset, setCurrentMediaAsset] = useState<MediaAssetSummary | null>(
    slide?.type === "TextImage" ? slide.mediaAsset : null
  );

  const defaultType = slide?.type ?? "TextText";

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isDirty },
  } = useForm<SlideFormData>({
    resolver: zodResolver(slideFormSchema),
    defaultValues: {
      type: defaultType,
      title: slide?.title ?? "",
      primaryText: slide?.type === "TextText" ? slide.primaryText : "",
      secondaryText: slide?.type === "TextText" ? slide.secondaryText ?? "" : "",
      text: slide?.type === "TextImage" || slide?.type === "TextCode" ? slide.text : "",
      altText: slide?.type === "TextImage" ? slide.altText : "",
      mediaAssetId: slide?.type === "TextImage" ? slide.mediaAssetId : undefined,
      code: slide?.type === "TextCode" ? slide.code : "",
      language: slide?.type === "TextCode" ? slide.language : "javascript",
    },
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  const watchedValues = useWatch({ control });
  const selectedType = (watchedValues.type ?? defaultType) as "TextText" | "TextImage" | "TextCode";

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onUploadMedia) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("O arquivo excede o limite máximo permitido de 5 MB.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      const asset = await onUploadMedia(file);
      setCurrentMediaAsset(asset);
      setValue("mediaAssetId", asset.id, { shouldDirty: true, shouldValidate: true });
    } catch (err) {
      setUploadError(mapApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = (data: SlideFormData) => {
    if (isCreating) {
      if (data.type === "TextText") {
        onSubmit({
          type: "TextText",
          title: data.title,
          primaryText: data.primaryText!,
          secondaryText: data.secondaryText || null,
        });
      } else if (data.type === "TextImage") {
        onSubmit({
          type: "TextImage",
          title: data.title,
          text: data.text!,
          mediaAssetId: data.mediaAssetId!,
          altText: data.altText!,
        });
      } else if (data.type === "TextCode") {
        onSubmit({
          type: "TextCode",
          title: data.title,
          text: data.text!,
          code: data.code!,
          language: data.language!,
        });
      }
    } else if (slide) {
      if (data.type === "TextText") {
        onSubmit({
          type: "TextText",
          title: data.title,
          primaryText: data.primaryText,
          secondaryText: data.secondaryText || null,
          expectedUpdatedAt: slide.updatedAt,
        });
      } else if (data.type === "TextImage") {
        onSubmit({
          type: "TextImage",
          title: data.title,
          text: data.text,
          mediaAssetId: data.mediaAssetId,
          altText: data.altText,
          expectedUpdatedAt: slide.updatedAt,
        });
      } else if (data.type === "TextCode") {
        onSubmit({
          type: "TextCode",
          title: data.title,
          text: data.text,
          code: data.code,
          language: data.language,
          expectedUpdatedAt: slide.updatedAt,
        });
      }
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isCreating ? "Novo Slide" : `Editar Slide: ${slide?.title}`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isCreating
                ? "Adicione um novo slide ao nível atual."
                : "Edite o conteúdo e visualização do slide."}
            </p>
          </div>
          {!isCreating && slide && (
            <div className="text-xs text-muted-foreground">
              Posição: {slide.position}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {isCreating ? (
            <div>
              <label htmlFor="slide-type" className="block text-sm font-medium text-foreground">
                Tipo do Slide
              </label>
              <select
                id="slide-type"
                className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                {...register("type")}
              >
                <option value="TextText">Texto Puro (TextText)</option>
                <option value="TextImage">Texto com Imagem (TextImage)</option>
                <option value="TextCode">Texto com Código (TextCode)</option>
              </select>
            </div>
          ) : (
            <div className="rounded-md bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
              Tipo do slide: <strong>{slide?.type}</strong> (não modificável)
            </div>
          )}

          <div>
            <label htmlFor="slide-title" className="block text-sm font-medium text-foreground">
              Título do Slide
            </label>
            <input
              id="slide-title"
              type="text"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ex: Introdução a Variáveis"
              {...register("title")}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {selectedType === "TextText" && (
            <>
              <div>
                <label htmlFor="primaryText" className="block text-sm font-medium text-foreground">
                  Texto Principal
                </label>
                <textarea
                  id="primaryText"
                  rows={4}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Conteúdo principal do slide..."
                  {...register("primaryText")}
                />
                {errors.primaryText && (
                  <p className="mt-1 text-xs text-destructive">{errors.primaryText.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="secondaryText" className="block text-sm font-medium text-foreground">
                  Texto Secundário (Opcional)
                </label>
                <textarea
                  id="secondaryText"
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Dica, nota ou observação secundária..."
                  {...register("secondaryText")}
                />
              </div>
            </>
          )}

          {selectedType === "TextImage" && (
            <>
              <div>
                <label htmlFor="image-text" className="block text-sm font-medium text-foreground">
                  Texto Explicativo
                </label>
                <textarea
                  id="image-text"
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Explicação acompanhando a ilustração..."
                  {...register("text")}
                />
                {errors.text && (
                  <p className="mt-1 text-xs text-destructive">{errors.text.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="altText" className="block text-sm font-medium text-foreground">
                  Texto Alternativo da Imagem (Acessibilidade)
                </label>
                <input
                  id="altText"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Descrição da imagem para leitores de tela..."
                  {...register("altText")}
                />
                {errors.altText && (
                  <p className="mt-1 text-xs text-destructive">{errors.altText.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="image-file" className="block text-sm font-medium text-foreground">
                  Arquivo de Imagem (PNG, JPEG ou WebP, máx. 5 MB)
                </label>
                <input
                  id="image-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={isUploading || isPending}
                  onChange={handleFileUpload}
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                />
                {isUploading && (
                  <p className="mt-1 text-xs text-primary animate-pulse">Enviando e normalizando imagem…</p>
                )}
                {uploadError && (
                  <p className="mt-1 text-xs text-destructive">{uploadError}</p>
                )}
                {currentMediaAsset && !isUploading && (
                  <p className="mt-1 text-xs text-emerald-600 font-medium">
                    Imagem carregada: {currentMediaAsset.width}x{currentMediaAsset.height} ({currentMediaAsset.mimeType})
                  </p>
                )}
                {errors.mediaAssetId && (
                  <p className="mt-1 text-xs text-destructive">{errors.mediaAssetId.message}</p>
                )}
              </div>
            </>
          )}

          {selectedType === "TextCode" && (
            <>
              <div>
                <label htmlFor="code-text" className="block text-sm font-medium text-foreground">
                  Texto Explicativo
                </label>
                <textarea
                  id="code-text"
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Explicação do bloco de código..."
                  {...register("text")}
                />
                {errors.text && (
                  <p className="mt-1 text-xs text-destructive">{errors.text.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-medium text-foreground">
                  Linguagem do Código
                </label>
                <input
                  id="language"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ex: javascript, typescript, python, html"
                  {...register("language")}
                />
                {errors.language && (
                  <p className="mt-1 text-xs text-destructive">{errors.language.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-foreground">
                  Código
                </label>
                <textarea
                  id="code"
                  rows={6}
                  className="mt-1 block w-full rounded-md border border-border bg-slate-950 px-3 py-2 font-mono text-sm text-slate-100 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="const x = 10;
console.log(x);"
                  {...register("code")}
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-destructive">{errors.code.message}</p>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={isPending || isUploading || (!isCreating && !isDirty)}
            >
              {isPending ? "Salvando…" : isCreating ? "Criar Slide" : "Salvar Alterações"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || isUploading}
                onClick={onCancel}
              >
                Cancelar
              </Button>
            )}
          </div>

          {!isCreating && slide && onDelete && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10"
              disabled={isPending || isUploading}
              onClick={() => setShowDeleteModal(true)}
            >
              Excluir Slide
            </Button>
          )}
        </div>
      </form>

      <SlidePreview
        id={slide?.id}
        type={selectedType}
        title={watchedValues.title}
        primaryText={watchedValues.primaryText}
        secondaryText={watchedValues.secondaryText}
        text={watchedValues.text}
        altText={watchedValues.altText}
        mediaAsset={currentMediaAsset}
        code={watchedValues.code}
        language={watchedValues.language}
      />

      {!isCreating && slide && onDelete && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          title="Excluir Slide"
          description={`Tem certeza de que deseja excluir o slide "${slide.title}"? Esta ação é irreversível.`}
          isPending={isPending}
          onConfirm={() => {
            setShowDeleteModal(false);
            onDelete();
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
