/**
 * Growth Model - Pure TypeScript module
 * Ported from HomeProjects-growth-model.html
 * No UI imports - just math
 */

export interface Settings {
  life: number;           // months a user stays active
  refs: number;           // new users each user brings (0.1 = 10%)
  webFee: number;         // web payment fees %
  appFee: number;         // App Store fee %
  render: number;         // cost per render $
  freeRenders: number;    // free renders per active user per month
  textCost: number;       // text/assistant cost per active user
  launchSell: boolean;    // launch month sells to existing users
  target: number;         // target cost per sign-up $
  ratio: number;          // healthy return ratio (e.g. 3x)
}

export type LeadSourceKind = 'views' | 'search' | 'creators' | 'cpm' | 'cpc' | 'cps' | 'flat';

export interface LeadSource {
  id: string;
  on: boolean;
  name: string;
  kind: LeadSourceKind;
  start: number;
  // views (organic reels)
  v?: number;     // views first month
  g?: number;     // growth %/mo
  cap?: number;   // views cap
  s?: number;     // sign-ups per 1000 views
  // search (SEO)
  conv?: number;  // visit-to-sign-up %
  // creators (UGC)
  views?: number; // views per creator per month
  base?: number;  // base pay per creator
  bonus?: number; // pay per 1000 views
  // cpm (Meta, TikTok)
  cpm?: number;   // CPM $
  ctr?: number;   // click-through %
  lp?: number;    // landing to sign-up %
  // cpc (Google)
  cpc?: number;   // cost per click $
  cvr?: number;   // click-to-sign-up %
  // cps (pay per sign-up)
  cps?: number;   // price per sign-up $
  // flat (fixed)
  users?: number; // sign-ups per month
}

export type PlanType = 'monthly' | 'one-time';

export interface Plan {
  id: string;
  on: boolean;
  name: string;
  type: PlanType;
  price: number;
  start: number;      // launch month
  conv: number;       // conversion % of new sign-ups
  churn: number;      // cancel per month % (monthly only)
  repeat: number;     // purchases per buyer (one-time only)
  renders: number;    // renders used
  cost: number;       // other cost per sale
  fixed: number;      // fixed cost per month
  web: number;        // % bought on web (vs App Store)
}

export interface RunningCost {
  id: string;
  name: string;
}

export interface Affiliate {
  on: boolean;
  start: number;
  click: number;   // % of active users who open a list
  conv: number;    // % who buy
  aov: number;     // average order $
  comm: number;    // commission %
}

export interface ContractorLeads {
  on: boolean;
  start: number;
  min: number;     // minimum active users
  req: number;     // % who request a pro
  sold: number;    // % of requests a pro pays for
  price: number;   // price per lead $
}

export interface MonthGrid {
  stage: string[];
  ch: Record<string, number[]>;
  cost: Record<string, number[]>;
}

export interface Actuals {
  ch: Record<string, { spend: (number | '')[], su: (number | '')[] }>;
  plan: Record<string, (number | '')[]>;
}

export interface Scenario {
  months: number;
  fwd: boolean;
  set: Settings;
  chans: LeadSource[];
  plans: Plan[];
  costs: RunningCost[];
  aff: Affiliate;
  lead: ContractorLeads;
  grid: MonthGrid;
  act: Actuals;
}

// Helper to create arrays
export const fillArr = <T>(n: number, f: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => f(i + 1));

// Default scenario - Home Projects
export const DEFAULT_SCENARIO: Scenario = {
  months: 18,
  fwd: true,
  set: {
    life: 6,
    refs: 0.1,
    webFee: 6,
    appFee: 15,
    render: 0.034,
    freeRenders: 3,
    textCost: 0.03,
    launchSell: true,
    target: 5,
    ratio: 3
  },
  chans: [
    { id: "org", on: true, name: "Organic reels (your own)", kind: "views", start: 1, v: 20000, g: 15, cap: 1000000, s: 2 },
    { id: "seo", on: true, name: "SEO pages (\"Cost to ___ in [city]\")", kind: "search", start: 4, v: 500, g: 20, cap: 50000, conv: 3 },
    { id: "ugc", on: true, name: "UGC creators", kind: "creators", start: 1, views: 100000, base: 500, bonus: 1.5, s: 2 },
    { id: "meta", on: true, name: "Meta static ads", kind: "cpm", start: 1, cpm: 20, ctr: 0.97, lp: 15 },
    { id: "video", on: true, name: "Meta video ads", kind: "cpm", start: 1, cpm: 20, ctr: 1.2, lp: 15 },
    { id: "google", on: true, name: "Google search ads", kind: "cpc", start: 1, cpc: 7.85, cvr: 7.33 }
  ],
  plans: [
    { id: "pack", on: true, name: "Small-item pack (40 credits)", type: "one-time", price: 4.99, start: 3, conv: 1, churn: 0, repeat: 1, renders: 25, cost: 0, fixed: 0, web: 50 },
    { id: "plus", on: true, name: "Design Plus", type: "monthly", price: 14.99, start: 3, conv: 1.5, churn: 20, repeat: 1, renders: 60, cost: 0.1, fixed: 0, web: 60 },
    { id: "pass", on: true, name: "Build Project Pass", type: "one-time", price: 39, start: 6, conv: 0.7, churn: 0, repeat: 1, renders: 40, cost: 0.2, fixed: 0, web: 80 },
    { id: "pro", on: false, name: "Pro (small contractors)", type: "monthly", price: 29, start: 12, conv: 0.2, churn: 10, repeat: 1, renders: 200, cost: 0.3, fixed: 0, web: 90 }
  ],
  aff: { on: true, start: 4, click: 5, conv: 8, aov: 150, comm: 4 },
  lead: { on: true, start: 12, min: 5000, req: 1, sold: 50, price: 25 },
  costs: [{ id: "base", name: "Hosting + tools (Vercel, Supabase, domain, Apple)" }],
  grid: {
    stage: fillArr(18, m => m < 3 ? "Launch: organic only" : m < 6 ? "Validate: 1 creator" : m < 12 ? "Grow" : "Scale"),
    ch: {
      org: fillArr(18, () => 0),
      seo: fillArr(18, () => 0),
      ugc: fillArr(18, m => m < 3 ? 0 : m < 6 ? 1 : m < 12 ? 2 : 4),
      meta: fillArr(18, m => m < 6 ? 0 : m < 12 ? 500 : 1500),
      video: fillArr(18, m => m < 12 ? 0 : 1500),
      google: fillArr(18, () => 0)
    },
    cost: {
      base: fillArr(18, () => 150)
    }
  },
  act: { ch: {}, plan: {} }
};

// Initialize actuals for a scenario
export function initializeActuals(s: Scenario): void {
  s.act = s.act || { ch: {}, plan: {} };
  const N = s.months;
  const fitB = (a: (number | '')[] | undefined): (number | '')[] => {
    const arr = a || [];
    while (arr.length < N) arr.push('');
    return arr.slice(0, N);
  };
  s.chans.forEach(c => {
    const a = s.act.ch[c.id] = s.act.ch[c.id] || { spend: [], su: [] };
    a.spend = fitB(a.spend);
    a.su = fitB(a.su);
  });
  s.plans.forEach(p => {
    s.act.plan[p.id] = fitB(s.act.plan[p.id]);
  });
}

// Normalize scenario arrays to correct length
export function normalizeScenario(s: Scenario): void {
  const N = Math.max(6, Math.min(48, Math.round(s.months || 18)));
  s.months = N;
  
  const fit = <T>(a: T[] | undefined, fillv: T): T[] => {
    const arr = a || [];
    while (arr.length < N) arr.push(arr.length ? arr[arr.length - 1] : fillv);
    return arr.slice(0, N);
  };
  
  s.grid = s.grid || { stage: [], ch: {}, cost: {} };
  s.grid.stage = fit(s.grid.stage, '');
  s.grid.ch = s.grid.ch || {};
  s.grid.cost = s.grid.cost || {};
  
  s.chans.forEach(c => {
    s.grid.ch[c.id] = fit(s.grid.ch[c.id], 0);
  });
  s.costs.forEach(c => {
    s.grid.cost[c.id] = fit(s.grid.cost[c.id], 0);
  });
  
  initializeActuals(s);
}

// Calculate blended payment fee
export function feeOf(p: Plan, set: Settings): number {
  return (p.web / 100) * set.webFee / 100 + (1 - p.web / 100) * set.appFee / 100;
}

// Calculate what you keep per sale
export function keepOf(p: Plan, set: Settings): number {
  return p.price * (1 - feeOf(p, set)) - p.renders * set.render - p.cost;
}

// Calculate how long they stay
export function staysOf(p: Plan, months: number): number {
  if (p.type === 'monthly') {
    return p.churn > 0 ? 100 / p.churn : months;
  }
  return p.repeat;
}

// Calculate lifetime value per buyer
export function ltvOf(p: Plan, set: Settings, months: number): number {
  return keepOf(p, set) * staysOf(p, months);
}

// Channel month calculation result
export interface ChanMonthResult {
  u: number;  // sign-ups
  c: number;  // cost
}

// Calculate sign-ups and cost for a lead source in a given month
export function chanMonth(c: LeadSource, m: number, G: number): ChanMonthResult {
  if (!c.on || m < c.start) return { u: 0, c: 0 };
  const t = m - c.start;
  const spend = +G || 0;
  
  switch (c.kind) {
    case 'views': {
      const V = Math.min(c.cap!, c.v! * Math.pow(1 + c.g! / 100, t));
      return { u: V / 1000 * c.s!, c: spend };
    }
    case 'search': {
      const V = Math.min(c.cap!, c.v! * Math.pow(1 + c.g! / 100, t));
      return { u: V * c.conv! / 100, c: spend };
    }
    case 'creators': {
      const uv = spend * c.views!;
      return { u: uv / 1000 * c.s!, c: spend * c.base! + uv / 1000 * c.bonus! };
    }
    case 'cpm':
      return { u: c.cpm ? spend / c.cpm * 1000 * c.ctr! / 100 * c.lp! / 100 : 0, c: spend };
    case 'cpc':
      return { u: c.cpc ? spend / c.cpc * c.cvr! / 100 : 0, c: spend };
    case 'cps':
      return { u: c.cps ? spend / c.cps : 0, c: spend };
    case 'flat':
      return { u: c.users!, c: spend };
    default:
      return { u: 0, c: 0 };
  }
}

// Unit economics result
export interface UnitEcon {
  conv: number;        // share who pay (capped at 100%)
  planVal: number;     // sum of plan worth per sign-up
  mat: number;         // materials commissions per user
  freeCost: number;    // free-user cost
  perSU: number;       // value per sign-up
  perPayer: number;    // value per paying user
}

// Calculate unit economics
export function unitEcon(s: Scenario): UnitEcon {
  const on = s.plans.filter(p => p.on);
  const conv = Math.min(1, on.reduce((a, p) => a + p.conv, 0) / 100);
  const planVal = on.reduce((a, p) => a + p.conv / 100 * ltvOf(p, s.set, s.months), 0);
  const mat = s.aff.on ? s.aff.click / 100 * s.aff.conv / 100 * s.aff.aov * s.aff.comm / 100 * s.set.life : 0;
  const freeCost = (s.set.freeRenders * s.set.render + s.set.textCost) * s.set.life;
  const perSU = planVal + mat - freeCost;
  return {
    conv,
    planVal,
    mat,
    freeCost,
    perSU,
    perPayer: conv ? planVal / conv : NaN
  };
}

// Monthly simulation row
export interface SimRow {
  m: number;           // month number
  stage: string;       // stage name
  chU: number;         // channel sign-ups (before referrals)
  chC: number;         // channel cost
  newM: number;        // new sign-ups (with referrals)
  mau: number;         // monthly active users
  payNew: number;      // new paying users
  aff: number;         // affiliate revenue
  lead: number;        // contractor lead revenue
  pRev: number;        // plan revenue
  pCost: number;       // plan costs
  usage: number;       // free-user usage cost
  maint: number;       // maintenance/running costs
  rev: number;         // total revenue
  profit: number;      // monthly profit
  cum: number;         // cumulative profit
}

// Simulation result
export interface SimResult {
  rows: SimRow[];
  cu: number[];        // cumulative sign-ups per channel
  cc: number[];        // cumulative cost per channel
  cm: ChanMonthResult[][];  // month results per channel
  subs: number[];      // active subscribers per plan
  nb: number[];        // new buyers per plan
  pm: number[][];      // buyers per month per plan
}

// Run the simulation
export function sim(s: Scenario): SimResult {
  const N = s.months;
  const rows: SimRow[] = [];
  let mau = 0;
  let cum = 0;
  
  const cu = s.chans.map(() => 0);
  const cc = s.chans.map(() => 0);
  const cm: ChanMonthResult[][] = s.chans.map(() => []);
  
  const subs = s.plans.map(() => 0);
  const nb = s.plans.map(() => 0);
  const pm: number[][] = s.plans.map(() => []);
  
  for (let m = 1; m <= N; m++) {
    let chU = 0;
    let chC = 0;
    
    s.chans.forEach((c, i) => {
      const r = chanMonth(c, m, s.grid.ch[c.id]?.[m - 1] ?? 0);
      chU += r.u;
      chC += r.c;
      cu[i] += r.u;
      cc[i] += r.c;
      cm[i].push(r);
    });
    
    const newM = chU * (1 + s.set.refs);
    const prev = mau;
    mau = prev * (1 - 1 / s.set.life) + newM;
    
    const aff = s.aff.on && m >= s.aff.start
      ? mau * s.aff.click / 100 * s.aff.conv / 100 * s.aff.aov * s.aff.comm / 100
      : 0;
    
    const lead = s.lead.on && m >= s.lead.start && mau >= s.lead.min
      ? mau * s.lead.req / 100 * s.lead.sold / 100 * s.lead.price
      : 0;
    
    let pRev = 0;
    let pCost = 0;
    let payNew = 0;
    
    s.plans.forEach((p, i) => {
      if (!p.on || m < p.start) {
        pm[i].push(0);
        return;
      }
      
      const pool = newM + (s.set.launchSell && m === p.start ? prev : 0);
      const buyers = pool * p.conv / 100;
      nb[i] += buyers;
      payNew += buyers;
      pm[i].push(buyers);
      
      let units: number;
      if (p.type === 'monthly') {
        subs[i] = subs[i] * (1 - p.churn / 100) + buyers;
        units = subs[i];
      } else {
        units = buyers * p.repeat;
      }
      
      const rev = units * p.price;
      pRev += rev;
      pCost += rev * feeOf(p, s.set) + units * (p.renders * s.set.render + p.cost) + p.fixed;
    });
    
    const usage = mau * (s.set.freeRenders * s.set.render + s.set.textCost);
    const maint = s.costs.reduce((a, c) => a + (+s.grid.cost[c.id]?.[m - 1] || 0), 0);
    const rev = aff + lead + pRev;
    const costs = chC + maint + usage + pCost;
    const profit = rev - costs;
    cum += profit;
    
    rows.push({
      m,
      stage: s.grid.stage[m - 1] || '',
      chU,
      chC,
      newM,
      mau,
      payNew,
      aff,
      lead,
      pRev,
      pCost,
      usage,
      maint,
      rev,
      profit,
      cum
    });
  }
  
  return { rows, cu, cc, cm, subs, nb, pm };
}

// Top-level metrics
export interface TopMetrics {
  spend: number;
  signups: number;
  costPerSignup: number;
  convRate: number;
  costPerPayer: number;
  ltvPayer: number;
  valuePerSignup: number;
  returnRatio: number;
  breakEvenMonth: number | null;
  mostDown: number;
  totalProfit: number;
  lastMau: number;
}

// Calculate top metrics from simulation
export function calcTopMetrics(s: Scenario, simResult: SimResult, econ: UnitEcon): TopMetrics {
  const { rows, cc } = simResult;
  
  const spend = cc.reduce((a, b) => a + b, 0);
  const signups = rows.reduce((a, r) => a + r.newM, 0);
  const costPerSignup = signups ? spend / signups : NaN;
  const costPerPayer = econ.conv ? costPerSignup / econ.conv : NaN;
  const returnRatio = costPerSignup > 0 ? econ.perSU / costPerSignup : Infinity;
  
  // Find break-even: first month where profit >= 0 and stays that way
  let breakEvenMonth: number | null = null;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].profit >= 0 && rows[i].rev > 0) {
      breakEvenMonth = rows[i].m;
    } else {
      break;
    }
  }
  
  const mostDown = Math.abs(Math.min(0, ...rows.map(r => r.cum)));
  const last = rows[rows.length - 1];
  
  return {
    spend,
    signups,
    costPerSignup,
    convRate: econ.conv,
    costPerPayer,
    ltvPayer: econ.perPayer,
    valuePerSignup: econ.perSU,
    returnRatio,
    breakEvenMonth,
    mostDown,
    totalProfit: last?.cum ?? 0,
    lastMau: last?.mau ?? 0
  };
}

// Lead source type info
export interface LeadSourceKindInfo {
  label: string;
  unit: string;
  lever: string | null;
  leverName: string;
  fields: { key: string; label: string; hint?: string }[];
}

export const LEAD_SOURCE_KINDS: Record<LeadSourceKind, LeadSourceKindInfo> = {
  views: {
    label: 'Views (your reels)',
    unit: '$ cost',
    lever: 's',
    leverName: 'sign-ups per 1,000 views',
    fields: [
      { key: 'v', label: 'Views in first month' },
      { key: 'g', label: 'View growth per month, %' },
      { key: 'cap', label: 'Views cap per month' },
      { key: 's', label: 'Sign-ups per 1,000 views', hint: 'Your number; measure it' }
    ]
  },
  search: {
    label: 'Search (SEO)',
    unit: '$ cost',
    lever: 'conv',
    leverName: 'visit-to-sign-up %',
    fields: [
      { key: 'v', label: 'Search visits in first month' },
      { key: 'g', label: 'Search growth per month, %' },
      { key: 'cap', label: 'Search visits cap' },
      { key: 'conv', label: 'Visit to sign-up, %' }
    ]
  },
  creators: {
    label: 'Creators (UGC)',
    unit: '# creators',
    lever: 's',
    leverName: 'sign-ups per 1,000 views',
    fields: [
      { key: 'views', label: 'Views per creator per month', hint: 'Start ~100K; 1M is a stretch' },
      { key: 'base', label: 'Base pay per creator, $' },
      { key: 'bonus', label: 'Pay per 1,000 views, $' },
      { key: 's', label: 'Sign-ups per 1,000 views' }
    ]
  },
  cpm: {
    label: 'Impressions (Meta, TikTok ads)',
    unit: '$ spend',
    lever: 'lp',
    leverName: 'landing sign-up %',
    fields: [
      { key: 'cpm', label: 'CPM, $', hint: 'Meta US ~$19–22' },
      { key: 'ctr', label: 'Click-through, %', hint: 'Meta static 0.97%' },
      { key: 'lp', label: 'Landing to sign-up, %' }
    ]
  },
  cpc: {
    label: 'Clicks (Google ads)',
    unit: '$ spend',
    lever: 'cvr',
    leverName: 'click-to-sign-up %',
    fields: [
      { key: 'cpc', label: 'Cost per click, $', hint: 'Home & Improvement $7.85' },
      { key: 'cvr', label: 'Click to sign-up, %', hint: 'Home & Improvement 7.33%' }
    ]
  },
  cps: {
    label: 'Pay per sign-up',
    unit: '$ spend',
    lever: null,
    leverName: '',
    fields: [
      { key: 'cps', label: 'Price per sign-up, $', hint: 'Referral bounty, affiliate' }
    ]
  },
  flat: {
    label: 'Fixed (in person, email)',
    unit: '$ cost',
    lever: 'users',
    leverName: 'sign-ups per month',
    fields: [
      { key: 'users', label: 'Sign-ups per month' }
    ]
  }
};

// Default values for new lead sources
export const NEW_LEAD_SOURCE_DEFAULTS: Record<LeadSourceKind, Partial<LeadSource>> = {
  views: { v: 5000, g: 10, cap: 500000, s: 2 },
  search: { v: 200, g: 15, cap: 20000, conv: 3 },
  creators: { views: 50000, base: 300, bonus: 1, s: 2 },
  cpm: { cpm: 20, ctr: 1, lp: 15 },
  cpc: { cpc: 7.85, cvr: 7.33 },
  cps: { cps: 10 },
  flat: { users: 20 }
};

// Calculate "what it takes" to hit target
export function whatItTakes(c: LeadSource, cps: number, target: number): string {
  const K = LEAD_SOURCE_KINDS[c.kind];
  
  if (!c.on) return 'off';
  if (!isFinite(cps)) return 'No sign-ups yet; add spend in month plan';
  if (cps <= target) return 'Already at or under target';
  if (target <= 0) return 'Not reachable: sign-up value is $0 or less. Fix plan value first.';
  
  const f = cps / target;
  const r = (v: number) => v >= 100 ? Math.round(v).toLocaleString() : (+v.toFixed(2)).toString();
  const pc = (v: number) => v > 100 ? `${r(v)}% (impossible)` : `${r(v)}%`;
  
  switch (c.kind) {
    case 'cpm':
      return `Landing sign-up ${r(c.lp!)}% → ${pc(c.lp! * f)}, or click-through ${r(c.ctr!)}% → ${pc(c.ctr! * f)}, or CPM ≤ $${r(c.cpm! / f)}`;
    case 'cpc':
      return `Click-to-sign-up ${r(c.cvr!)}% → ${pc(c.cvr! * f)}, or cost per click ≤ $${r(c.cpc! / f)}`;
    case 'creators': {
      let t = `Sign-ups per 1,000 views ${r(c.s!)} → ${r(c.s! * f)}`;
      const d = target * c.s! - c.bonus!;
      t += d > 0 ? `, or ${r(1000 * c.base! / d)} views per creator` : '; at this view bonus no view count gets there';
      return t;
    }
    case 'cps':
      return `Pay ≤ $${r(target)} per sign-up`;
    case 'views':
      return `Sign-ups per 1,000 views ${r(c.s!)} → ${r(c.s! * f)}, or cut monthly cost to ${Math.round(100 / f)}%`;
    case 'search':
      return `Visit-to-sign-up ${r(c.conv!)}% → ${pc(c.conv! * f)}, or cut monthly cost to ${Math.round(100 / f)}%`;
    case 'flat':
      return `${r(c.users! * f)} sign-ups a month at this cost, or cut cost to ${Math.round(100 / f)}%`;
    default:
      return '';
  }
}

// Format helpers
export function formatUsd(x: number | undefined | null): string {
  if (x == null || !isFinite(x)) return '–';
  const s = x < 0 ? '-' : '';
  const a = Math.abs(x);
  return s + '$' + (a >= 1000 ? Math.round(a).toLocaleString() : a >= 100 ? Math.round(a).toString() : a.toFixed(2));
}

export function formatNum(x: number | undefined | null): string {
  if (x == null || !isFinite(x)) return '–';
  return Math.round(x).toLocaleString();
}

export function formatPct(x: number | undefined | null): string {
  if (x == null || !isFinite(x)) return '–';
  const v = x * 100;
  return (v >= 10 ? Math.round(v) : v.toFixed(1)) + '%';
}

export function formatRatio(x: number | undefined | null): string {
  if (x == null || !isFinite(x)) return '–';
  return x.toFixed(x < 1 ? 2 : 1) + '×';
}

export function getRatioClass(ratio: number, healthy: number): 'success' | 'warning' | 'danger' | '' {
  if (!isFinite(ratio)) return '';
  if (ratio >= healthy) return 'success';
  if (ratio >= 1) return 'warning';
  return 'danger';
}

// Generate unique ID
export function uid(): string {
  return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

// Deep clone helper
export function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Golden test verification
export function verifyGoldenTest(): { passed: boolean; results: Record<string, { expected: string | number; actual: string | number; match: boolean }> } {
  const s = clone(DEFAULT_SCENARIO);
  normalizeScenario(s);
  const simResult = sim(s);
  const econ = unitEcon(s);
  const metrics = calcTopMetrics(s, simResult, econ);
  
  // Find Design Plus plan
  const designPlus = s.plans.find(p => p.name === 'Design Plus')!;
  const designKeep = keepOf(designPlus, s.set);
  const designStays = staysOf(designPlus, s.months);
  const designLtv = ltvOf(designPlus, s.set, s.months);
  
  const results: Record<string, { expected: string | number; actual: string | number; match: boolean }> = {
    signups: {
      expected: 16105,
      actual: Math.round(metrics.signups),
      match: Math.abs(metrics.signups - 16105) < 10
    },
    spend: {
      expected: 51950,
      actual: Math.round(metrics.spend),
      match: Math.abs(metrics.spend - 51950) < 100
    },
    costPerSignup: {
      expected: 3.23,
      actual: +metrics.costPerSignup.toFixed(2),
      match: Math.abs(metrics.costPerSignup - 3.23) < 0.05
    },
    convRate: {
      expected: '3.2%',
      actual: formatPct(metrics.convRate),
      match: Math.abs(metrics.convRate * 100 - 3.2) < 0.1
    },
    costPerPayer: {
      expected: 101,
      actual: Math.round(metrics.costPerPayer),
      match: Math.abs(metrics.costPerPayer - 101) < 5
    },
    ltvPayer: {
      expected: 35.40,
      actual: +metrics.ltvPayer.toFixed(2),
      match: Math.abs(metrics.ltvPayer - 35.40) < 1
    },
    valuePerSignup: {
      expected: 0.48,
      actual: +metrics.valuePerSignup.toFixed(2),
      match: Math.abs(metrics.valuePerSignup - 0.48) < 0.05
    },
    returnRatio: {
      expected: 0.15,
      actual: +metrics.returnRatio.toFixed(2),
      match: Math.abs(metrics.returnRatio - 0.15) < 0.02
    },
    designPlusKeep: {
      expected: 11.41,
      actual: +designKeep.toFixed(2),
      match: Math.abs(designKeep - 11.41) < 0.5
    },
    designPlusStays: {
      expected: 5.0,
      actual: +designStays.toFixed(1),
      match: Math.abs(designStays - 5.0) < 0.1
    },
    designPlusLtv: {
      expected: 57.05,
      actual: +designLtv.toFixed(2),
      match: Math.abs(designLtv - 57.05) < 1
    },
    mostDown: {
      expected: 43290,
      actual: Math.round(metrics.mostDown),
      match: Math.abs(metrics.mostDown - 43290) < 500
    },
    totalProfit: {
      expected: -43290,
      actual: Math.round(metrics.totalProfit),
      match: Math.abs(metrics.totalProfit - (-43290)) < 500
    },
    breakEven: {
      expected: 'not in 18 months',
      actual: metrics.breakEvenMonth === null ? 'not in 18 months' : `Month ${metrics.breakEvenMonth}`,
      match: metrics.breakEvenMonth === null
    }
  };
  
  const passed = Object.values(results).every(r => r.match);
  
  return { passed, results };
}
