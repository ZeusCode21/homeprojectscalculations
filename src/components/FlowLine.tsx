'use client';

import { formatUsd, formatNum, formatPct, formatRatio, getRatioClass } from '@/lib/model';
import { cn } from '@/lib/utils';

interface FlowLineProps {
  spend: number;
  signups: number;
  costPerSignup: number;
  convRate: number;
  payingUsers: number;
  costPerPayer: number;
  ltvPayer: number;
  valuePerSignup: number;
  returnRatio: number;
  healthyRatio: number;
}

/**
 * Vertical money → people → return funnel.
 * Pattern: Amplitude / Stripe-style stage funnel — each stage is a bar
 * sized against the previous step so the drop-off is visible without
 * horizontal scrolling or a wrapping sentence of numbers.
 */
export function FlowLine({
  spend,
  signups,
  costPerSignup,
  convRate,
  payingUsers,
  costPerPayer,
  ltvPayer,
  valuePerSignup,
  returnRatio,
  healthyRatio,
}: FlowLineProps) {
  const ratioClass = getRatioClass(returnRatio, healthyRatio);
  const stages = [
    {
      id: 'spend',
      label: '1 · Spend on lead sources',
      value: formatUsd(spend),
      detail: 'Total across the roadmap',
      width: 100,
    },
    {
      id: 'signups',
      label: '2 · Sign-ups',
      value: formatNum(signups),
      detail: `${formatUsd(costPerSignup)} cost each`,
      width: 78,
    },
    {
      id: 'paid',
      label: '3 · Paying users',
      value: `~${formatNum(payingUsers)}`,
      detail: `${formatPct(convRate)} of sign-ups · ${formatUsd(costPerPayer)} cost each`,
      width: Math.max(18, Math.min(78, convRate * 100 * 12)),
    },
    {
      id: 'ltv',
      label: '4 · Worth of a payer',
      value: formatUsd(ltvPayer),
      detail: `${formatUsd(valuePerSignup)} value per sign-up after free-user cost`,
      width: 55,
    },
    {
      id: 'return',
      label: '5 · Return on each $1',
      value: isFinite(returnRatio) ? formatRatio(returnRatio) : '∞',
      detail:
        healthyRatio > 0
          ? `Value ÷ cost · ${healthyRatio}× or more is healthy`
          : 'Value ÷ cost',
      width: Math.max(22, Math.min(100, (isFinite(returnRatio) ? returnRatio : 1) * 28)),
      emphasize: true as const,
    },
  ];

  return (
    <div className="bg-card border rounded-lg p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <div>
          <h3 className="font-serif text-lg">How the money flows</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Read top to bottom. Each step feeds the next.
          </p>
        </div>
        <div
          className={cn(
            'text-right shrink-0',
            ratioClass === 'success' && 'text-success',
            ratioClass === 'warning' && 'text-warning',
            ratioClass === 'danger' && 'text-danger'
          )}
        >
          <div className="text-xs text-muted-foreground">Return</div>
          <div className="font-serif text-2xl tabular-nums">
            {isFinite(returnRatio) ? formatRatio(returnRatio) : '∞'}
          </div>
        </div>
      </div>

      <ol className="space-y-0">
        {stages.map((stage, i) => (
          <li key={stage.id}>
            {i > 0 && (
              <div className="flex items-center gap-3 pl-1 py-1.5" aria-hidden>
                <div className="w-px h-4 bg-border ml-3" />
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  then
                </span>
              </div>
            )}
            <div className="relative">
              <div
                className={cn(
                  'rounded-md px-4 py-3 transition-colors',
                  stage.emphasize ? 'bg-primary/10 border border-primary/25' : 'bg-muted/60'
                )}
                style={{ width: `${stage.width}%`, minWidth: '12rem', maxWidth: '100%' }}
              >
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                  {stage.label}
                </div>
                <div
                  className={cn(
                    'font-serif text-2xl sm:text-3xl tabular-nums leading-none',
                    stage.emphasize &&
                      ratioClass === 'success' &&
                      'text-success',
                    stage.emphasize &&
                      ratioClass === 'warning' &&
                      'text-warning',
                    stage.emphasize && ratioClass === 'danger' && 'text-danger'
                  )}
                >
                  {stage.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5">{stage.detail}</div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
