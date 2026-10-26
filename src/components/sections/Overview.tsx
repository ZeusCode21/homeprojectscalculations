'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useModel } from '@/lib/context';
import { formatUsd, formatNum, formatPct, formatRatio, getRatioClass } from '@/lib/model';
import { calcRealView, realDataHint } from '@/lib/realView';
import { MetricCard } from '@/components/MetricCard';
import { FlowLine } from '@/components/FlowLine';
import { SourceMix } from '@/components/SourceMix';
import { ProfitChart } from '@/components/ProfitChart';
import { RoadmapStrip } from '@/components/RoadmapStrip';
import { ViewModeToggle, type ViewMode } from '@/components/ViewModeToggle';
import { Badge } from '@/components/ui/badge';

export function Overview() {
  const { scenario, simResult, econ, metrics } = useModel();
  const [mode, setMode] = useState<ViewMode>('projected');

  const real = useMemo(() => calcRealView(scenario, econ), [scenario, econ]);

  const activeMetrics = mode === 'real' ? real.metrics : metrics;
  const ratioClass = getRatioClass(activeMetrics.returnRatio, scenario.set.ratio);
  const profitClass = activeMetrics.totalProfit >= 0 ? 'success' : 'danger';
  const breakEvenClass = activeMetrics.breakEvenMonth ? 'success' : 'danger';

  const projectedSources = scenario.chans.map((chan, i) => {
    const signups = simResult.cu[i];
    const spend = simResult.cc[i];
    const cps = signups ? spend / signups : NaN;
    const ret = cps > 0 ? econ.perSU / cps : signups ? Infinity : NaN;
    return { chan, spend, signups, cps, ret };
  });

  const sourceRows =
    mode === 'real'
      ? real.sourceRows.map(r => ({
          chan: {
            id: r.chanId,
            name: r.name,
            on: r.on,
            kind: 'flat' as const,
            start: 1,
          },
          spend: r.spend,
          signups: r.signups,
          cps: r.cps,
          ret: r.ret,
        }))
      : projectedSources;

  const chartRows = mode === 'real' ? real.chartRows : simResult.rows;
  const payingUsers =
    mode === 'real'
      ? real.buyers
      : metrics.signups * econ.conv;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">How money flows</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            Roadmap and the main chart up top. Switch Projected vs Real for the funnel, Level 1,
            and the graph.
          </p>
        </div>
        <ViewModeToggle mode={mode} onChange={setMode} realEmpty={real.empty} />
      </div>

      {mode === 'real' && (
        <p className="text-sm text-muted-foreground rounded-lg border bg-muted/30 px-4 py-3">
          {realDataHint(real.monthsWithData, scenario.months)}{' '}
          <Link href="/real-numbers" className="underline underline-offset-2 hover:text-foreground">
            Enter real numbers
          </Link>
        </p>
      )}

      {/* Top: roadmap + chart */}
      <div className="space-y-4">
        <RoadmapStrip
          scenario={scenario}
          simResult={simResult}
          breakEvenMonth={activeMetrics.breakEvenMonth}
        />

        <ProfitChart
          rows={chartRows}
          title={
            mode === 'real'
              ? 'Real · estimated profit & cumulative sign-ups'
              : 'Projected · profit and active users'
          }
          subtitle={
            mode === 'real'
              ? 'Bars ≈ sign-up value − spend for months you entered. Line = cumulative real sign-ups.'
              : 'Bars = monthly profit. Line = active users.'
          }
          lineLabel={mode === 'real' ? 'Cumulative sign-ups' : 'Active users'}
        />
      </div>

      {/* Funnel */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h3 className="font-serif text-xl">Money flow</h3>
          <Badge variant="secondary">{mode === 'real' ? 'real entries' : 'projected'}</Badge>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <FlowLine
            spend={activeMetrics.spend}
            signups={activeMetrics.signups}
            costPerSignup={activeMetrics.costPerSignup}
            convRate={activeMetrics.convRate}
            payingUsers={payingUsers}
            costPerPayer={activeMetrics.costPerPayer}
            ltvPayer={activeMetrics.ltvPayer}
            valuePerSignup={activeMetrics.valuePerSignup}
            returnRatio={activeMetrics.returnRatio}
            healthyRatio={scenario.set.ratio}
          />
          <SourceMix
            rows={sourceRows}
            healthyRatio={scenario.set.ratio}
            valuePerSignup={econ.perSU}
          />
        </div>
      </div>

      {/* Level 1 */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Level 1 · decide where money goes
          <span className="normal-case tracking-normal font-normal ml-2">
            ({mode === 'real' ? 'real' : 'projected'})
          </span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <MetricCard
            label="Cost per sign-up"
            value={formatUsd(activeMetrics.costPerSignup)}
            variant="primary"
          />
          <MetricCard
            label="Sign-up → paid"
            value={formatPct(activeMetrics.convRate)}
            variant="primary"
          />
          <MetricCard
            label="Cost per paying user"
            value={formatUsd(activeMetrics.costPerPayer)}
            variant="primary"
          />
          <MetricCard
            label="Lifetime value / payer"
            value={formatUsd(activeMetrics.ltvPayer)}
            variant="primary"
          />
          <MetricCard
            label="Return (value ÷ cost)"
            value={
              isFinite(activeMetrics.returnRatio)
                ? formatRatio(activeMetrics.returnRatio)
                : '∞'
            }
            variant={ratioClass || 'default'}
          />
        </div>
      </div>

      {/* Over the roadmap */}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Over the roadmap
          <span className="normal-case tracking-normal font-normal ml-2">
            ({mode === 'real' ? 'real' : 'projected'})
          </span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          <MetricCard
            label="Value per sign-up"
            value={formatUsd(activeMetrics.valuePerSignup)}
            size="sm"
          />
          <MetricCard
            label={
              mode === 'real'
                ? `Sign-ups entered · ${real.monthsWithData} mo`
                : `Sign-ups · ${scenario.months} mo`
            }
            value={formatNum(activeMetrics.signups)}
            size="sm"
          />
          <MetricCard
            label="Break-even month"
            value={
              activeMetrics.breakEvenMonth
                ? `Month ${activeMetrics.breakEvenMonth}`
                : mode === 'real' && real.empty
                  ? 'Need real data'
                  : `Not in ${scenario.months} mo`
            }
            variant={breakEvenClass}
            size="sm"
          />
          <MetricCard
            label="Most money down"
            value={formatUsd(activeMetrics.mostDown)}
            size="sm"
          />
          <MetricCard
            label="Total profit"
            value={formatUsd(activeMetrics.totalProfit)}
            variant={profitClass}
            size="sm"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {mode === 'projected' ? (
          <>
            Cost per sign-up = {formatUsd(metrics.spend)} spend ÷ {formatNum(metrics.signups)}{' '}
            sign-ups. Last month: {formatNum(metrics.lastMau)} active users.
          </>
        ) : (
          <>
            Real spend {formatUsd(real.spend)} · {formatNum(real.signups)} sign-ups ·{' '}
            {formatNum(real.buyers)} buyers entered. Keep the ledger current on{' '}
            <Link href="/real-numbers" className="underline underline-offset-2">
              Real numbers
            </Link>
            .
          </>
        )}
      </p>
    </div>
  );
}
