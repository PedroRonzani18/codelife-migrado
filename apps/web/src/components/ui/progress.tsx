import * as React from 'react';

import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentProps<'div'> {
  value?: number;
  max?: number;
}

function Progress({ className, value = 0, max = 100, ...props }: ProgressProps) {
  const boundedValue = Math.min(Math.max(value, 0), max);
  const percentage = max > 0 ? (boundedValue / max) * 100 : 0;

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={boundedValue}
      data-slot="progress"
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
      {...props}
    >
      <div data-slot="progress-indicator" className="h-full w-full flex-1 bg-primary transition-all" style={{ transform: `translateX(-${100 - percentage}%)` }} />
    </div>
  );
}

export { Progress };
