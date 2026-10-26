'use client';

import { Fragment, useMemo } from 'react';
import { useModel } from '@/lib/context';
import {
  formatUsd,
  formatNum,
  formatRatio,
  LEAD_SOURCE_KINDS,
  whatItTakes,
  ltvOf,
} from '@/lib/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ActualChan {
  i: number;
  chanId: string;
  name: string;
  n: number;
  sp: number;
  su: number;
  ps: number;
  pu: number;
  real: number;
  plan: number;
}

interface ActualPlan {
  i: number;
  planId: string;
  name: string;
  n: number;
  b: number;
  s: number;
  real: number;
  planConv: number;
}

export function RealNumbers() {
  const { scenario, simResult, econ, updateScenarioDeep, logChange } = useModel();
  const N = scenario.months;

  // actuals are initialized in normalizeScenario — never mutate scenario from render
  
  const handleActualChange = (
    type: 'ch' | 'plan',
    id: string,
    field: 'spend' | 'su' | null,
    month: number,
    value: string
  ) => {
    updateScenarioDeep(s => {
      if (type === 'ch') {
        if (!s.act.ch[id]) s.act.ch[id] = { spend: Array(s.months).fill(''), su: Array(s.months).fill('') };
        const arr = field === 'spend' ? s.act.ch[id].spend : s.act.ch[id].su;
        arr[month] = value === '' ? '' : parseFloat(value) || 0;
      } else {
        if (!s.act.plan[id]) s.act.plan[id] = Array(s.months).fill('');
        s.act.plan[id][month] = value === '' ? '' : parseFloat(value) || 0;
      }
    });
  };
  
  // Calculate actuals comparison
  const { actualChans, actualPlans } = useMemo(() => {
    const actualChans: ActualChan[] = [];
    const actualPlans: ActualPlan[] = [];
    const totSU: number[] = Array(N).fill(0);
    
    scenario.chans.forEach((c, i) => {
      const A = scenario.act.ch[c.id];
      if (!A) return;
      
      let sp = 0, su = 0, ps = 0, pu = 0, n = 0;
      for (let j = 0; j < N; j++) {
        if (A.spend[j] === '' && A.su[j] === '') continue;
        n++;
        sp += +(A.spend[j]) || 0;
        su += +(A.su[j]) || 0;
        totSU[j] += +(A.su[j]) || 0;
        ps += simResult.cm[i]?.[j]?.c || 0;
        pu += simResult.cm[i]?.[j]?.u || 0;
      }
      
      if (n > 0) {
        actualChans.push({
          i,
          chanId: c.id,
          name: c.name,
          n,
          sp,
          su,
          ps,
          pu,
          real: su ? sp / su : NaN,
          plan: pu ? ps / pu : NaN
        });
      }
    });
    
    scenario.plans.forEach((p, i) => {
      const A = scenario.act.plan[p.id];
      if (!A) return;
      
      let b = 0, s = 0, n = 0;
      for (let j = 0; j < N; j++) {
        if (A[j] === '') continue;
        n++;
        b += +(A[j]) || 0;
        s += totSU[j];
      }
      
      if (n > 0) {
        actualPlans.push({
          i,
          planId: p.id,
          name: p.name,
          n,
          b,
          s,
          real: s ? (b / s) * 100 : NaN,
          planConv: p.conv
        });
      }
    });
    
    return { actualChans, actualPlans };
  }, [scenario, simResult, N]);
  
  // What to fix first
  const fixes = useMemo(() => {
    const fx: { priority: number; message: string; type: 'Real' | 'Model' }[] = [];
    
    actualChans.forEach(x => {
      const g = x.real / x.plan;
      if (isFinite(g) && g > 1.15) {
        const chan = scenario.chans[x.i];
        const K = LEAD_SOURCE_KINDS[chan.kind];
        fx.push({
          priority: x.sp * (g - 1),
          message: `${chan.name} costs ${formatUsd(x.real)} per sign-up vs ${formatUsd(x.plan)} planned (${formatRatio(g)}). ${K.lever ? `Main lever: ${K.leverName}.` : 'Negotiate the price per sign-up.'} To hit your $${scenario.set.target} target: ${whatItTakes(chan, x.real, scenario.set.target)}.`,
          type: 'Real'
        });
      }
    });
    
    actualPlans.forEach(x => {
      const g = x.real / x.planConv;
      if (isFinite(g) && g < 0.87) {
        const plan = scenario.plans[x.i];
        const ltv = ltvOf(plan, scenario.set, scenario.months);
        fx.push({
          priority: x.s * (x.planConv - x.real) / 100 * ltv,
          message: `${plan.name} converts ${x.real.toFixed(2)}% of sign-ups vs ${x.planConv}% planned. Worth testing the offer, price or where it's shown.`,
          type: 'Real'
        });
      }
    });
    
    scenario.chans.forEach((c, i) => {
      const u = simResult.cu[i];
      const cs = u ? simResult.cc[i] / u : NaN;
      if (c.on && isFinite(cs) && cs > 0 && econ.perSU / cs < 1) {
        fx.push({
          priority: simResult.cc[i],
          message: `${c.name}: each sign-up costs ${formatUsd(cs)} but is worth ${formatUsd(econ.perSU)}, so it loses money at today's rates. To break even: ${whatItTakes(c, cs, econ.perSU)}.`,
          type: 'Model'
        });
      }
    });
    
    if (econ.perSU <= 0) {
      fx.push({
        priority: 1e9,
        message: `A sign-up is worth ${formatUsd(econ.perSU)} after free-user costs. Raise plan conversion or prices, or lower render use, before spending on ads.`,
        type: 'Model'
      });
    }
    
    fx.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'Real' ? -1 : 1;
      return b.priority - a.priority;
    });
    
    return fx.slice(0, 6);
  }, [scenario, simResult, econ, actualChans, actualPlans]);
  
  const handleUseRealRate = (type: 'chan' | 'plan', index: number) => {
    if (type === 'chan') {
      const x = actualChans.find(a => a.i === index);
      if (!x) return;
      const chan = scenario.chans[index];
      const paid = ['cpm', 'cpc', 'cps', 'creators'].includes(chan.kind);
      const f = paid ? (x.su / x.sp) / (x.pu / x.ps) : x.su / x.pu;
      if (!isFinite(f) || f <= 0) return;
      
      const K = LEAD_SOURCE_KINDS[chan.kind];
      const lever = K.lever;
      if (!lever) return;
      
      const oldVal = (chan as unknown as Record<string, number>)[lever];
      const newVal = +(oldVal * f).toFixed(3);
      
      logChange(
        `${chan.name} ${K.leverName}`,
        oldVal.toString(),
        newVal.toString(),
        'use real rate'
      );
      
      updateScenarioDeep(s => {
        const c = s.chans[index];
        if (chan.kind === 'cps') {
          c.cps = +(c.cps! / f).toFixed(3);
        } else {
          (c as unknown as Record<string, number>)[lever] = newVal;
        }
      });
    } else {
      const x = actualPlans.find(a => a.i === index);
      if (!x || !isFinite(x.real)) return;
      const plan = scenario.plans[index];
      
      logChange(
        `${plan.name} conversion`,
        plan.conv.toString(),
        x.real.toFixed(3),
        'use real rate'
      );
      
      updateScenarioDeep(s => {
        s.plans[index].conv = +x.real.toFixed(3);
      });
    }
  };
  
  return (
    <section id="real-numbers" className="scroll-mt-16">
      <h2 className="font-serif text-2xl mb-2">Real numbers</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
        Type what actually happened each month (from Meta Ads, Google Ads, creator links, your sign-up table and Stripe/Whop).
        Leave a month blank until you have it. The comparison shows where reality differs from the plan,
        and &quot;Use real rate&quot; updates the model to match.
      </p>
      
      {/* Actuals entry grid */}
      <div className="bg-card border rounded-lg p-4 mb-4">
        <div className="overflow-x-auto">
          <table className="text-sm w-full min-w-max border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-card z-10 text-left p-2 min-w-[220px] border-b">
                  Month
                </th>
                {Array.from({ length: N }, (_, i) => (
                  <th key={i} className="text-right tabular-nums p-2 border-b min-w-[70px]">
                    {i + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scenario.chans.map(chan => {
                const A = scenario.act.ch[chan.id] || { spend: [], su: [] };
                return (
                  <Fragment key={chan.id}>
                    <tr className={cn(!chan.on && 'opacity-50')}>
                      <td className="sticky left-0 bg-card z-10 p-2 border-b">
                        {chan.name} · <strong>spend $</strong>
                      </td>
                      {Array.from({ length: N }, (_, i) => (
                        <td key={i} className="p-1 border-b">
                          <Input
                            type="number"
                            value={A.spend[i] ?? ''}
                            onChange={e => handleActualChange('ch', chan.id, 'spend', i, e.target.value)}
                            placeholder=""
                            className="w-16 tabular-nums text-xs h-7 px-1"
                          />
                        </td>
                      ))}
                    </tr>
                    <tr className={cn(!chan.on && 'opacity-50')}>
                      <td className="sticky left-0 bg-card z-10 p-2 border-b">
                        {chan.name} · <strong>sign-ups</strong>
                      </td>
                      {Array.from({ length: N }, (_, i) => (
                        <td key={i} className="p-1 border-b">
                          <Input
                            type="number"
                            value={A.su[i] ?? ''}
                            onChange={e => handleActualChange('ch', chan.id, 'su', i, e.target.value)}
                            placeholder=""
                            className="w-16 tabular-nums text-xs h-7 px-1"
                          />
                        </td>
                      ))}
                    </tr>
                  </Fragment>
                );
              })}
              <tr className="bg-muted/50">
                <td colSpan={N + 1} className="p-2 text-xs font-semibold text-muted-foreground">
                  Paying
                </td>
              </tr>
              {scenario.plans.map(plan => {
                const A = scenario.act.plan[plan.id] || [];
                return (
                  <tr key={plan.id} className={cn(!plan.on && 'opacity-50')}>
                    <td className="sticky left-0 bg-card z-10 p-2 border-b">
                      {plan.name} · <strong>new buyers</strong>
                    </td>
                    {Array.from({ length: N }, (_, i) => (
                      <td key={i} className="p-1 border-b">
                        <Input
                          type="number"
                          value={A[i] ?? ''}
                          onChange={e => handleActualChange('plan', plan.id, null, i, e.target.value)}
                          placeholder=""
                          className="w-16 tabular-nums text-xs h-7 px-1"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Plan vs Real */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-serif text-lg mb-3">Plan vs real</h3>
          {actualChans.length === 0 && actualPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No real numbers yet. Enter spend and sign-ups for a month above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead source</TableHead>
                  <TableHead className="text-right">Months</TableHead>
                  <TableHead className="text-right">Real cost/sign-up</TableHead>
                  <TableHead className="text-right">Plan</TableHead>
                  <TableHead className="text-right">Gap</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actualChans.map(x => {
                  const g = x.real / x.plan;
                  return (
                    <TableRow key={x.chanId}>
                      <TableCell>
                        {x.name}
                        <div className="text-xs text-muted-foreground">
                          {formatUsd(x.sp)} → {formatNum(x.su)} sign-ups
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{x.n}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatUsd(x.real)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatUsd(x.plan)}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums',
                          isFinite(g) && g > 1.15 && 'text-danger',
                          isFinite(g) && g < 0.87 && 'text-success'
                        )}
                      >
                        {isFinite(g) ? formatRatio(g) : '–'}
                      </TableCell>
                      <TableCell>
                        {x.pu > 0 && x.su > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUseRealRate('chan', x.i)}
                          >
                            Use real rate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {actualPlans.length > 0 && (
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Months</TableHead>
                    <TableHead className="text-right">Real conversion</TableHead>
                    <TableHead className="text-right">Plan</TableHead>
                    <TableHead className="text-right">Gap</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                )}
                {actualPlans.map(x => {
                  const g = x.real / x.planConv;
                  return (
                    <TableRow key={x.planId}>
                      <TableCell>
                        {x.name}
                        <div className="text-xs text-muted-foreground">
                          {formatNum(x.b)} buyers from {formatNum(x.s)} sign-ups
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{x.n}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {isFinite(x.real) ? `${x.real.toFixed(2)}%` : '–'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{x.planConv}%</TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums',
                          isFinite(g) && g < 0.87 && 'text-danger',
                          isFinite(g) && g > 1.15 && 'text-success'
                        )}
                      >
                        {isFinite(g) ? formatRatio(g) : '–'}
                      </TableCell>
                      <TableCell>
                        {isFinite(x.real) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUseRealRate('plan', x.i)}
                          >
                            Use real rate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Gap for lead sources = real cost ÷ planned cost (above 1× is worse).
            For plans = real ÷ planned conversion (below 1× is worse).
            Planned numbers use the same months you filled in.
          </p>
        </div>
        
        {/* What to fix first */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-serif text-lg mb-3">What to fix first</h3>
          {fixes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing flagged. Every lead source returns more than it costs, and real numbers (if any) are on plan.
            </p>
          ) : (
            <>
              <ol className="list-decimal list-inside space-y-3">
                {fixes.map((f, i) => (
                  <li key={i} className="text-sm">
                    <Badge variant="secondary" className="mr-2">
                      {f.type === 'Real' ? 'Real numbers' : 'Model'}
                    </Badge>
                    {f.message}
                  </li>
                ))}
              </ol>
              <p className="text-xs text-muted-foreground mt-3">
                Ranked by money at stake.
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
