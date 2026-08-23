import { ArrowRight, CheckCircle2, CirclePlay, LockKeyhole, RotateCcw } from 'lucide-react';
import type { LevelAvailability } from '@codelife/contracts/learning';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const stateCopy: Record<LevelAvailability, { label: string; description: string }> = {
  available: { label: 'Disponível', description: 'Pronto para começar.' },
  in_progress: { label: 'Em andamento', description: 'Continue do último slide confirmado.' },
  blocked: { label: 'Bloqueado', description: 'Conclua o nível anterior para liberar.' },
  completed: { label: 'Concluído', description: 'Conteúdo disponível para revisão.' },
};

const icons = {
  available: CirclePlay,
  in_progress: ArrowRight,
  blocked: LockKeyhole,
  completed: CheckCircle2,
} satisfies Record<LevelAvailability, typeof CirclePlay>;

export function LevelCard({
  id,
  title,
  position,
  availability,
  isPending,
  onAction,
}: {
  id: string;
  title: string;
  position: number;
  availability: LevelAvailability;
  isPending: boolean;
  onAction: (levelId: string) => void;
}) {
  const copy = stateCopy[availability];
  const Icon = icons[availability];
  const action = availability === 'available' ? 'Iniciar nível' : availability === 'in_progress' ? 'Continuar' : 'Revisar';

  return (
    <Card
      className={cn(
        'h-full justify-between overflow-hidden transition-colors',
        availability === 'blocked' && 'border-border/60 bg-muted/30 text-muted-foreground',
        availability === 'completed' && 'border-emerald-500/35',
        availability === 'in_progress' && 'border-primary/50 shadow-lg shadow-primary/5',
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <Badge variant={availability === 'completed' ? 'secondary' : availability === 'blocked' ? 'outline' : 'default'}>
            <Icon aria-hidden="true" /> {copy.label}
          </Badge>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nível {position}</span>
        </div>
        <h2 className="mt-4 text-xl font-semibold leading-7 tracking-tight">{title}</h2>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{copy.description}</p>
      </CardContent>
      <CardFooter>
        {availability === 'blocked' ? (
          <div className="flex min-h-9 items-center gap-2 text-sm font-medium" aria-label={`${title}: bloqueado`}>
            <LockKeyhole className="size-4" aria-hidden="true" /> Indisponível
          </div>
        ) : (
          <Button type="button" variant={availability === 'completed' ? 'outline' : 'default'} className="w-full" disabled={isPending} onClick={() => onAction(id)}>
            {availability === 'completed' && <RotateCcw aria-hidden="true" />}
            {isPending ? 'Salvando…' : action}
            {availability !== 'completed' && <ArrowRight aria-hidden="true" />}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
