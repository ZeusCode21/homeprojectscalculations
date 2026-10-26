/**
 * Build overview metrics + chart series from manually entered Real numbers.
 * When a month has no entry, it contributes 0 (not projected fill).
 */

import {
  Scenario,
  SimRow,
  TopMetrics,
  UnitEcon,
} from './model';

function num(v: number | '' | undefined): number {
  return typeof v === 'number' && isFinite(v) ? v : 0;
}

export interface RealMonthPoint {
  m: number;
  spend: number;
  signups: number;
  buyers: number;
  /** Rough: value of sign-ups that month minus spend (uses projected value/sign-up). */
  profit: number;
  /** Cumulative sign-ups as a stand-in until we track real MAU. */
  mau: number;
  hasData: boolean;
}

export interface RealView {
  spend: number;
  signups: number;
  buyers: number;
  costPerSignup: number;
  convRate: number;
  costPerPayer: number;
  monthsWithData: number;
  sourceRows: {
    chanId: string;
    name: string;
    on: boolean;
    spend: number;
    signups: number;
    cps: number;
    ret: number;
  }[];
  chartRows: SimRow[];
  metrics: TopMetrics;
  empty: boolean;
}

export function calcRealView(s: Scenario, econ: UnitEcon): RealView {
  const N = s.months;
  const points: RealMonthPoint[] = [];
  let cumSu = 0;
  let cumCash = 0;
  let mostDown = 0;
  let breakEvenMonth: number | null = null;

  for (let m = 1; m <= N; m++) {
    let spend = 0;
    let signups = 0;
    let buyers = 0;
    let hasData = false;

    s.chans.forEach(c => {
      const a = s.act.ch[c.id];
      if (!a) return;
      const sp = a.spend[m - 1];
      const su = a.su[m - 1];
      if (sp !== '' || su !== '') hasData = true;
      spend += num(sp);
      signups += num(su);
    });

    s.plans.forEach(p => {
      const a = s.act.plan[p.id];
      if (!a) return;
      const b = a[m - 1];
      if (b !== '') hasData = true;
      buyers += num(b);
    });

    const profit = signups * econ.perSU - spend;
    cumSu += signups;
    cumCash += profit;
    if (cumCash < -mostDown) mostDown = Math.abs(cumCash);
    if (cumCash >= 0 && hasData && (spend > 0 || signups > 0 || buyers > 0)) {
      breakEvenMonth = m;
    }

    points.push({
      m,
      spend,
      signups,
      buyers,
      profit,
      mau: cumSu,
      hasData,
    });
  }

  // Break-even: first month cumulative stays non-negative through end (same idea as projected)
  breakEvenMonth = null;
  for (let i = points.length - 1; i >= 0; i--) {
    const running = points.slice(0, i + 1).reduce((a, p) => a + p.profit, 0);
    if (running >= 0 && (points[i].spend > 0 || points[i].signups > 0)) {
      breakEvenMonth = points[i].m;
    } else if (points[i].hasData) {
      break;
    }
  }

  const spend = points.reduce((a, p) => a + p.spend, 0);
  const signups = points.reduce((a, p) => a + p.signups, 0);
  const buyers = points.reduce((a, p) => a + p.buyers, 0);
  const costPerSignup = signups ? spend / signups : NaN;
  const convRate = signups ? buyers / signups : 0;
  const costPerPayer = convRate ? costPerSignup / convRate : NaN;
  const returnRatio = costPerSignup > 0 ? econ.perSU / costPerSignup : Infinity;
  const monthsWithData = points.filter(p => p.hasData).length;

  const sourceRows = s.chans.map(c => {
    const a = s.act.ch[c.id] || { spend: [], su: [] };
    const chSpend = a.spend.reduce<number>((sum, v) => sum + num(v), 0);
    const chSu = a.su.reduce<number>((sum, v) => sum + num(v), 0);
    const cps = chSu ? chSpend / chSu : NaN;
    const ret = cps > 0 ? econ.perSU / cps : chSu ? Infinity : NaN;
    return {
      chanId: c.id,
      name: c.name,
      on: c.on,
      spend: chSpend,
      signups: chSu,
      cps,
      ret,
    };
  });

  const chartRows: SimRow[] = points.map(p => ({
    m: p.m,
    stage: s.grid.stage[p.m - 1] || '',
    chU: p.signups,
    chC: p.spend,
    newM: p.signups,
    mau: p.mau,
    payNew: p.buyers,
    aff: 0,
    lead: 0,
    pRev: p.signups * Math.max(0, econ.perSU),
    pCost: 0,
    usage: 0,
    maint: p.spend,
    rev: p.signups * Math.max(0, econ.perSU),
    profit: p.profit,
    cum: 0,
  }));
  let running = 0;
  chartRows.forEach(r => {
    running += r.profit;
    r.cum = running;
  });

  const metrics: TopMetrics = {
    spend,
    signups,
    costPerSignup,
    convRate,
    costPerPayer,
    ltvPayer: econ.perPayer,
    valuePerSignup: econ.perSU,
    returnRatio,
    breakEvenMonth,
    mostDown,
    totalProfit: chartRows[chartRows.length - 1]?.cum ?? 0,
    lastMau: cumSu,
  };

  return {
    spend,
    signups,
    buyers,
    costPerSignup,
    convRate,
    costPerPayer,
    monthsWithData,
    sourceRows,
    chartRows,
    metrics,
    empty: monthsWithData === 0,
  };
}

export function realDataHint(monthsWithData: number, totalMonths: number): string {
  if (monthsWithData === 0) {
    return 'No real months entered yet. Add spend, sign-ups, and buyers on Real numbers.';
  }
  return `${monthsWithData} of ${totalMonths} months have real entries. Value per sign-up still uses your plan model until payments are connected.`;
}
