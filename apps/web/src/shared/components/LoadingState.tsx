import { LoaderCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState({ label = 'Carregando…', cards = 0 }: { label?: string; cards?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4 py-8 text-muted-foreground">
      <div className="flex items-center gap-2">
        <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        <span>{label}</span>
      </div>
      {cards > 0 && (
        <div className="grid gap-4 md:grid-cols-3" aria-hidden="true">
          {Array.from({ length: cards }, (_, index) => (
            <Skeleton key={index} className="h-52 rounded-xl" />
          ))}
        </div>
      )}
    </div>
  );
}
