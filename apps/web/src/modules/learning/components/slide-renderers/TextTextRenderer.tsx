import type { TextTextSlide } from '@codelife/contracts/learning';

export function TextTextRenderer({ slide }: { slide: TextTextSlide }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <p className="text-pretty text-xl leading-9 text-foreground sm:text-2xl">{slide.primaryText}</p>
      {slide.secondaryText && (
        <aside className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-base leading-7 text-muted-foreground">
          {slide.secondaryText}
        </aside>
      )}
    </div>
  );
}
