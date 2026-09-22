import { useMemo } from "react";
import type { MediaAssetSummary, Slide } from "@codelife/contracts/learning";
import { SlideRenderer } from "@/modules/learning/components/slide-renderers/SlideRenderer";

export type SlidePreviewProps = {
  id?: string;
  type: "TextText" | "TextImage" | "TextCode";
  title?: string;
  primaryText?: string;
  secondaryText?: string | null;
  text?: string;
  altText?: string;
  mediaAsset?: MediaAssetSummary | null;
  code?: string;
  language?: string;
};

export function SlidePreview({
  id = "00000000-0000-4000-8000-000000000999",
  type,
  title = "Pré-visualização",
  primaryText = "Texto principal do slide...",
  secondaryText = null,
  text = "Texto explicativo...",
  altText = "Descrição da imagem",
  mediaAsset = null,
  code = "// Seu código aqui",
  language = "javascript",
}: SlidePreviewProps) {
  const slide = useMemo<Slide | null>(() => {
    const base = {
      id,
      title: title || "Sem título",
      position: 1,
      previousSlideId: null,
      nextSlideId: null,
    };

    if (type === "TextText") {
      return {
        ...base,
        type: "TextText",
        primaryText: primaryText || "Texto principal do slide...",
        secondaryText: secondaryText || null,
      };
    }

    if (type === "TextCode") {
      return {
        ...base,
        type: "TextCode",
        text: text || "Texto explicativo...",
        code: code || "// Código de exemplo",
        language: language || "javascript",
      };
    }

    if (type === "TextImage") {
      if (!mediaAsset) return null;
      return {
        ...base,
        type: "TextImage",
        text: text || "Texto explicativo...",
        altText: altText || "Ilustração",
        mediaAsset: {
          id: mediaAsset.id,
          objectKey: mediaAsset.objectKey,
          mimeType: mediaAsset.mimeType,
          sizeBytes: mediaAsset.sizeBytes,
          width: mediaAsset.width,
          height: mediaAsset.height,
          checksum: mediaAsset.checksum,
        },
      };
    }

    return null;
  }, [id, type, title, primaryText, secondaryText, text, altText, mediaAsset, code, language]);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          Preview em tempo real
        </h3>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {type}
        </span>
      </div>
      {slide ? (
        <SlideRenderer slide={slide} />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-center text-sm text-muted-foreground p-6">
          Faça o upload de uma imagem acima para ver a pré-visualização completa deste slide.
        </div>
      )}
    </div>
  );
}
