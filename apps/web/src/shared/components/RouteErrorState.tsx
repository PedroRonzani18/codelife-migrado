import { Button } from '@/components/ui/button';
import { FeedbackAlert } from './FeedbackAlert';

export function RouteErrorState({
  title = 'Não foi possível carregar esta página',
  description,
  requestId,
  onRetry,
}: {
  title?: string;
  description: string;
  requestId?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4 py-12">
      <FeedbackAlert kind="error" title={title} description={description} requestId={requestId} />
      {onRetry && <Button type="button" variant="outline" onClick={onRetry}>Tentar novamente</Button>}
    </div>
  );
}
