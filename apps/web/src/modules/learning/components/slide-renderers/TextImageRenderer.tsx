import { useState } from 'react';
import type { TextImageSlide } from '@codelife/contracts/learning';
import { getMediaUrl } from '../../services/learningService';
import { FeedbackAlert } from '@/shared/components';

export function TextImageRenderer({ slide }: { slide: TextImageSlide }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="grid items-center gap-8 lg:grid-cols-[0.8fr_1.2fr]">
      <p className="text-lg leading-8 text-muted-foreground">{slide.text}</p>
      {failed ? (
        <FeedbackAlert kind="error" title="Imagem indisponível" description="Não foi possível carregar a ilustração deste slide." />
      ) : (
        <img
          src={getMediaUrl(slide.mediaAsset.id)}
          alt={slide.altText}
          width={slide.mediaAsset.width ?? undefined}
          height={slide.mediaAsset.height ?? undefined}
          crossOrigin="use-credentials"
          onError={() => setFailed(true)}
          className="h-auto w-full rounded-xl border border-border bg-white p-3"
        />
      )}
    </div>
  );
}
