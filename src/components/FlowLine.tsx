'use client';

import { formatUsd, formatNum, formatPct, getRatioClass } from '@/lib/model';
import { cn } from '@/lib/utils';

interface FlowLineProps {
  spend: number;
  signups: number;
  costPerSignup: number;
  convRate: number;
  payingUsers: number;
  costPerPayer: number;
  ltvPayer: number;
  returnRatio: number;
  healthyRatio: number;
}

export function FlowLine({
  spend,
  signups,
  costPerSignup,
  convRate,
  payingUsers,
  costPerPayer,
  ltvPayer,
  returnRatio,
  healthyRatio,
}: FlowLineProps) {
  const ratioClass = getRatioClass(returnRatio, healthyRatio);
  
  return (
    <div className="bg-card border rounded-lg p-4 flex flex-wrap items-center gap-2 text-sm">
      <span>
        <strong className="font-serif text-lg">{formatUsd(spend)}</strong> on lead sources
      </span>
      <span className="text-muted-foreground px-1">→</span>
      <span>
        <strong className="font-serif text-lg">{formatNum(signups)}</strong> sign-ups at{' '}
        <strong className="font-serif text-lg">{formatUsd(costPerSignup)}</strong> each
      </span>
      <span className="text-muted-foreground px-1">→</span>
      <span>
        <strong className="font-serif text-lg">{formatPct(convRate)}</strong> pay ={' '}
        <strong className="font-serif text-lg">~{formatNum(payingUsers)}</strong> paying users at{' '}
        <strong className="font-serif text-lg">{formatUsd(costPerPayer)}</strong> each
      </span>
      <span className="text-muted-foreground px-1">→</span>
      <span>
        each payer worth <strong className="font-serif text-lg">{formatUsd(ltvPayer)}</strong>
      </span>
      <span className="text-muted-foreground px-1">→</span>
      <span>
        every $1 spent returns{' '}
        <strong
          className={cn(
            'font-serif text-lg',
            ratioClass === 'success' && 'text-success',
            ratioClass === 'warning' && 'text-warning',
            ratioClass === 'danger' && 'text-danger'
          )}
        >
          {isFinite(returnRatio) ? formatUsd(returnRatio) : '∞'}
        </strong>
      </span>
    </div>
  );
}
