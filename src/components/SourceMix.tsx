'use client';

import { formatUsd, formatNum, formatRatio, getRatioClass } from '@/lib/model';
import { cn } from '@/lib/utils';

interface SourceRow {
  chan: { id: string; name: string; on: boolean };
  spend: number;
  signups: number;
  cps: number;
  ret: number;
}

interface SourceMixProps {
  rows: SourceRow[];
  healthyRatio: number;
  valuePerSignup: number;
}

/** Horizontal bar mix — spend and sign-ups by source, no sideways scroll. */
export function SourceMix({ rows, healthyRatio, valuePerSignup }: SourceMixProps) {
  const active = rows.filter(r => r.chan.on && (r.spend > 0 || r.signups > 0));
  const maxSpend = Math.max(1, ...active.map(r => r.spend));
  const maxSu = Math.max(1, ...active.map(r => r.signups));

  if (active.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-5 text-sm text-muted-foreground">
        No source totals yet. Add projected volume in Month by month, or real spend / sign-ups on
        Real numbers.
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-5 sm:p-6">
      <h3 className="font-serif text-lg mb-1">Where sign-ups come from</h3>
      <p className="text-sm text-muted-foreground mb-5">
        Bar length = share of the biggest source. Color on return shows healthy vs losing money.
      </p>

      <ul className="space-y-5">
        {active.map(({ chan, spend, signups, cps, ret }) => {
          const retClass = getRatioClass(ret, healthyRatio);
          return (
            <li key={chan.id}>
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <div className="font-medium text-sm truncate">{chan.name}</div>
                <div
                  className={cn(
                    'text-xs tabular-nums shrink-0',
                    retClass === 'success' && 'text-success',
                    retClass === 'warning' && 'text-warning',
                    retClass === 'danger' && 'text-danger'
                  )}
                >
                  {isFinite(ret) ? formatRatio(ret) : signups ? '∞' : '–'} return
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[11px] text-muted-foreground shrink-0">Spend</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(spend / maxSpend) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs tabular-nums text-muted-foreground shrink-0">
                    {formatUsd(spend)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 text-[11px] text-muted-foreground shrink-0">Sign-ups</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal-dark/80"
                      style={{ width: `${(signups / maxSu) * 100}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs tabular-nums text-muted-foreground shrink-0">
                    {formatNum(signups)}
                  </span>
                </div>
              </div>

              <div className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                {formatUsd(cps)} / sign-up
                {valuePerSignup > 0 && isFinite(cps)
                  ? ` · needs ≤ ${formatUsd(valuePerSignup)} to break even on value`
                  : ''}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
