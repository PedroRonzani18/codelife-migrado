import { AlertCircle, CircleCheck, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type FeedbackKind = 'error' | 'success' | 'info';

const icons = {
  error: AlertCircle,
  success: CircleCheck,
  info: Info,
} as const;

export function FeedbackAlert({
  title,
  description,
  kind = 'info',
  requestId,
  className,
  focusRef,
}: {
  title: string;
  description: string;
  kind?: FeedbackKind;
  requestId?: string;
  className?: string;
  focusRef?: React.Ref<HTMLDivElement>;
}) {
  const Icon = icons[kind];
  return (
    <Alert
      ref={focusRef}
      tabIndex={-1}
      variant={kind === 'error' ? 'destructive' : 'default'}
      className={cn(
        kind === 'success' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
        kind === 'info' && 'border-sky-500/40 bg-sky-500/10 text-sky-100',
        className,
      )}
    >
      <Icon aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        {requestId && <p className="mt-2 text-xs opacity-75">Referência: {requestId}</p>}
      </AlertDescription>
    </Alert>
  );
}
