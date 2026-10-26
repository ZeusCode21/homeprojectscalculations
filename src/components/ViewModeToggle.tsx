'use client';

import { cn } from '@/lib/utils';

export type ViewMode = 'projected' | 'real';

export function ViewModeToggle({
  mode,
  onChange,
  realEmpty,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  realEmpty?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border bg-card p-0.5 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('projected')}
        className={cn(
          'rounded-md px-3 py-1.5 text-sm motion-safe:transition-[color,background-color,transform,box-shadow] motion-safe:duration-150',
          mode === 'projected'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-[0.98]'
        )}
      >
        Projected
      </button>
      <button
        type="button"
        onClick={() => onChange('real')}
        className={cn(
          'rounded-md px-3 py-1.5 text-sm motion-safe:transition-[color,background-color,transform,box-shadow] motion-safe:duration-150',
          mode === 'real'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 active:scale-[0.98]'
        )}
      >
        Real
        {realEmpty ? (
          <span className="ml-1.5 text-[10px] opacity-80">empty</span>
        ) : null}
      </button>
    </div>
  );
}
