import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Slide } from '@codelife/contracts/learning';
import { SlideRenderer } from './SlideRenderer';

const ids = {
  text: '00000000-0000-4000-8000-000000000701',
  code: '00000000-0000-4000-8000-000000000702',
  image: '00000000-0000-4000-8000-000000000703',
  asset: '00000000-0000-4000-8000-000000000901',
};

const base = { position: 1, previousSlideId: null, nextSlideId: null };
const slides: Slide[] = [
  { ...base, id: ids.text, title: 'Texto', type: 'TextText', primaryText: 'Texto principal', secondaryText: 'Texto secundário' },
  { ...base, id: ids.code, title: 'Código', type: 'TextCode', text: 'Exemplo', code: 'const valor = 1;', language: 'javascript' },
  { ...base, id: ids.image, title: 'Imagem', type: 'TextImage', text: 'Ilustração', altText: 'Descrição acessível da imagem', mediaAsset: { id: ids.asset, objectKey: 'learning/image.svg', mimeType: 'image/svg+xml', sizeBytes: null, width: 640, height: 360, checksum: null } },
];

describe('SlideRenderer', () => {
  it('renders TextText, TextCode and TextImage without accessibility violations', async () => {
    const { rerender } = render(<main><h1>Slide</h1><SlideRenderer slide={slides[0]} /></main>);
    expect(screen.getByText('Texto principal')).toBeInTheDocument();
    rerender(<main><h1>Slide</h1><SlideRenderer slide={slides[1]} /></main>);
    expect(screen.getByText('const valor = 1;')).toBeInTheDocument();
    rerender(<main><h1>Slide</h1><SlideRenderer slide={slides[2]} /></main>);
    expect(screen.getByRole('img', { name: 'Descrição acessível da imagem' })).toHaveAttribute('width', '640');
  });
});
