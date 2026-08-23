import type { Slide } from '@codelife/contracts/learning';
import { TextCodeRenderer } from './TextCodeRenderer';
import { TextImageRenderer } from './TextImageRenderer';
import { TextTextRenderer } from './TextTextRenderer';

export function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.type) {
    case 'TextText': return <TextTextRenderer slide={slide} />;
    case 'TextCode': return <TextCodeRenderer slide={slide} />;
    case 'TextImage': return <TextImageRenderer slide={slide} />;
  }
}
