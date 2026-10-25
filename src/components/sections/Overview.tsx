'use client';

import { useModel } from '@/lib/context';
import { formatUsd, formatNum, formatPct, formatRatio, getRatioClass } from '@/lib/model';
import { MetricCard } from '@/components/MetricCard';
import { FlowLine } from '@/components/FlowLine';
import { ProfitChart } from '@/components/ProfitChart';
import { RoadmapStrip } from '@/components/RoadmapStrip';
import { Badge } from '@/components/ui/badge';

export function Overview() {
  const { scenario, simResult, econ, metrics } = useModel();
  
  const ratioClass = getRatioClass(metrics.returnRatio, scenario.set.ratio);
  const profitClass = metrics.totalProfit >= 0 ? 'success' : 'danger';
  const breakEvenClass = metrics.breakEvenMonth ? 'success' : 'danger';
  
  return (
    <section id="overview" className="scroll-mt-16">
      {/* Roadmap strip - at the top */}
      <RoadmapStrip
        scenario={scenario}
        simResult={simResult}
        breakEvenMonth={metrics.breakEvenMonth}
      />
      
      <div className="flex items-center gap-3 mt-6 mb-4">
        <h2 className="font-serif text-2xl">Top numbers</h2>
        <Badge variant="secondary">whole roadmap</Badge>
      </div>
      
      {/* Flow line */}
      <FlowLine
        spend={metrics.spend}
        signups={metrics.signups}
        costPerSignup={metrics.costPerSignup}
        convRate={metrics.convRate}
        payingUsers={metrics.signups * econ.conv}
        costPerPayer={metrics.costPerPayer}
        ltvPayer={metrics.ltvPayer}
        returnRatio={metrics.returnRatio}
        healthyRatio={scenario.set.ratio}
      />
      
      {/* Primary KPIs */}
      <div className="grid grid-cols-5 gap-3 mt-4">
        <MetricCard
          label="Cost per sign-up (all sources, incl. referrals)"
          value={formatUsd(metrics.costPerSignup)}
          variant="primary"
        />
        <MetricCard
          label="Sign-up → paid (all plans that are on)"
          value={formatPct(metrics.convRate)}
          variant="primary"
        />
        <MetricCard
          label="Cost per paying user"
          value={formatUsd(metrics.costPerPayer)}
          variant="primary"
        />
        <MetricCard
          label="Lifetime value per paying user"
          value={formatUsd(metrics.ltvPayer)}
          variant="primary"
        />
        <MetricCard
          label={`Return: value per sign-up ÷ cost per sign-up`}
          value={isFinite(metrics.returnRatio) ? formatRatio(metrics.returnRatio) : '∞'}
          variant={ratioClass || 'default'}
        />
      </div>
      
      {/* Secondary KPIs */}
      <div className="grid grid-cols-5 gap-3 mt-3">
        <MetricCard
          label="Value per sign-up (after free-user costs)"
          value={formatUsd(metrics.valuePerSignup)}
          size="sm"
        />
        <MetricCard
          label={`Sign-ups over ${scenario.months} months`}
          value={formatNum(metrics.signups)}
          size="sm"
        />
        <MetricCard
          label="First month it stays above water"
          value={metrics.breakEvenMonth ? `Month ${metrics.breakEvenMonth}` : `Not in ${scenario.months} mo`}
          variant={breakEvenClass}
          size="sm"
        />
        <MetricCard
          label="Most money you're down at any point"
          value={formatUsd(metrics.mostDown)}
          size="sm"
        />
        <MetricCard
          label="Total profit over the roadmap"
          value={formatUsd(metrics.totalProfit)}
          variant={profitClass}
          size="sm"
        />
      </div>
      
      <p className="text-xs text-muted-foreground mt-3">
        Cost per sign-up = {formatUsd(metrics.spend)} spend ÷ {formatNum(metrics.signups)} sign-ups.
        Paying share and lifetime value come from Plans section.
        Last month: {formatNum(metrics.lastMau)} active users.
      </p>
      
      {/* Profit chart */}
      <div className="mt-6">
        <ProfitChart rows={simResult.rows} />
      </div>
    </section>
  );
}
