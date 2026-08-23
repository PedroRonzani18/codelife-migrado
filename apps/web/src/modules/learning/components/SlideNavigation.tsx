import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SlideNavigation({
  hasPrevious,
  hasNext,
  canComplete,
  isCompleted,
  isPending,
  completionAction,
  onPrevious,
  onNext,
  onComplete,
}: {
  hasPrevious: boolean;
  hasNext: boolean;
  canComplete: boolean;
  isCompleted: boolean;
  isPending: boolean;
  completionAction?: { label: string; onAction: () => void };
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
}) {
  return (
    <nav aria-label="Navegação entre slides" className="flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
      <Button type="button" variant="outline" size="lg" onClick={onPrevious} disabled={!hasPrevious || isPending}>
        <ArrowLeft aria-hidden="true" /> Anterior
      </Button>
      {hasNext && (
        <Button type="button" size="lg" onClick={onNext} disabled={isPending}>
          {isPending ? 'Salvando…' : 'Próximo'} <ArrowRight aria-hidden="true" />
        </Button>
      )}
      {canComplete && (
        <Button type="button" size="lg" onClick={onComplete} disabled={isPending}>
          <CheckCircle2 aria-hidden="true" /> {isPending ? 'Concluindo…' : 'Concluir nível'}
        </Button>
      )}
      {!hasNext && isCompleted && (
        <div className="flex flex-wrap items-center gap-3" role="status">
          <p className="flex items-center gap-2 font-semibold text-emerald-300">
            <CheckCircle2 className="size-5" aria-hidden="true" /> Nível concluído
          </p>
          {completionAction && (
            <Button type="button" size="lg" onClick={completionAction.onAction} disabled={isPending}>
              {completionAction.label} <ArrowRight aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </nav>
  );
}
