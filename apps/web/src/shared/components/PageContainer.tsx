import * as React from 'react';
import { cn } from '@/lib/utils';

type PageWidth = 'wide' | 'reader';

const pageWidthClasses: Record<PageWidth, string> = {
  wide: 'max-w-6xl',
  reader: 'max-w-5xl',
};

type PageContainerProps = React.ComponentProps<'main'> & {
  width?: PageWidth;
};

export function PageContainer({ className, width = 'wide', ...props }: PageContainerProps) {
  return <main className={cn('mx-auto w-full px-5', pageWidthClasses[width], className)} {...props} />;
}
