'use client';

import { useState, type ReactNode } from 'react';
import { useModel } from '@/lib/context';
import {
  LeadSource,
  LEAD_SOURCE_KINDS,
  NEW_LEAD_SOURCE_DEFAULTS,
  LeadSourceKind,
  formatUsd,
  formatNum,
  formatRatio,
  getRatioClass,
  whatItTakes,
  uid,
  clone,
} from '@/lib/model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

function rateSummary(chan: LeadSource): string {
  switch (chan.kind) {
    case 'creators':
      return `${formatNum(chan.views || 0)} views/creator · ${chan.s ?? 0} sign-ups / 1,000 views`;
    case 'views':
      return `${formatNum(chan.v || 0)} views mo 1 · +${chan.g ?? 0}%/mo · ${chan.s ?? 0} / 1,000`;
    case 'search':
      return `${formatNum(chan.v || 0)} visits mo 1 · ${chan.conv ?? 0}% visit→sign-up`;
    case 'cpm':
      return `$${chan.cpm ?? 0} CPM · ${chan.ctr ?? 0}% CTR · ${chan.lp ?? 0}% land→sign-up`;
    case 'cpc':
      return `$${chan.cpc ?? 0}/click · ${chan.cvr ?? 0}% click→sign-up`;
    case 'cps':
      return `$${chan.cps ?? 0} per sign-up`;
    case 'flat':
      return `${chan.users ?? 0} sign-ups / month`;
    default:
      return '';
  }
}

function formulaHint(chan: LeadSource): string {
  switch (chan.kind) {
    case 'creators': {
      const views = chan.views || 0;
      const s = chan.s || 0;
      const perCreator = (views / 1000) * s;
      const exCreators = 6;
      const exViews = exCreators * views;
      const exSu = (exViews / 1000) * s;
      return (
        `Sign-ups = # creators × views per creator ÷ 1,000 × sign-ups per 1,000. ` +
        `At these rates, 1 creator → ${formatNum(perCreator)} sign-ups. ` +
        `Example: ${exCreators} creators × ${formatNum(views)} views = ${formatNum(exViews)} views → ${formatNum(exSu)} sign-ups. ` +
        `Cost = creators × base pay + (total views ÷ 1,000 × pay per 1,000). # creators is set month by month.`
      );
    }
    case 'views':
      return `Sign-ups = views that month ÷ 1,000 × sign-ups per 1,000. Views grow from month 1 up to the cap. Optional monthly $ cost is in Month by month.`;
    case 'search':
      return `Sign-ups = search visits × visit-to-sign-up %. Visits grow from month 1 up to the cap. Optional monthly $ cost is in Month by month.`;
    case 'cpm':
      return `Sign-ups = (spend ÷ CPM × 1,000) × CTR% × landing%. Monthly $ spend is set in Month by month.`;
    case 'cpc':
      return `Sign-ups = (spend ÷ CPC) × click-to-sign-up %. Monthly $ spend is set in Month by month.`;
    case 'cps':
      return `Sign-ups = spend ÷ price per sign-up. Monthly $ spend is set in Month by month.`;
    case 'flat':
      return `Sign-ups = the fixed count each month. Optional monthly $ cost is in Month by month.`;
    default:
      return '';
  }
}

export function LeadSources() {
  const { scenario, simResult, econ, updateScenarioDeep } = useModel();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addKind, setAddKind] = useState<LeadSourceKind>('cpm');

  const handleToggle = (chanId: string, on: boolean) => {
    updateScenarioDeep(s => {
      const chan = s.chans.find(c => c.id === chanId);
      if (chan) chan.on = on;
    });
  };

  const handleFieldChange = (chanId: string, field: string, value: number | string) => {
    updateScenarioDeep(s => {
      const chan = s.chans.find(c => c.id === chanId);
      if (chan) {
        (chan as unknown as Record<string, number | string>)[field] = value;
      }
    });
  };

  const handleKindChange = (chanId: string, kind: LeadSourceKind) => {
    updateScenarioDeep(s => {
      const chan = s.chans.find(c => c.id === chanId);
      if (chan) {
        chan.kind = kind;
        const defaults = NEW_LEAD_SOURCE_DEFAULTS[kind];
        Object.entries(defaults).forEach(([k, v]) => {
          const chanAny = chan as unknown as Record<string, unknown>;
          if (chanAny[k] === undefined) {
            chanAny[k] = v;
          }
        });
      }
    });
  };

  const handleAdd = () => {
    updateScenarioDeep(s => {
      const newId = uid();
      const newChan: LeadSource = {
        id: newId,
        on: true,
        name: 'New lead source',
        kind: addKind,
        start: 1,
        ...clone(NEW_LEAD_SOURCE_DEFAULTS[addKind]),
      };
      s.chans.push(newChan);
      s.grid.ch[newId] = Array(s.months).fill(0);
    });
    setEditingId(null);
  };

  const handleRemove = (chanId: string) => {
    if (!confirm('Remove this lead source?')) return;
    updateScenarioDeep(s => {
      const idx = s.chans.findIndex(c => c.id === chanId);
      if (idx >= 0) {
        s.chans.splice(idx, 1);
        delete s.grid.ch[chanId];
      }
    });
    if (editingId === chanId) setEditingId(null);
  };

  return (
    <section id="lead-sources" className="scroll-mt-16">
      <h2 className="font-serif text-2xl mb-2">Lead sources</h2>
      <p className="text-sm text-muted-foreground mb-5 max-w-3xl">
        Each source is one stack — rates on top, totals underneath. No sideways scrolling.
        Monthly volume ($ spend or # creators) is set in{' '}
        <a href="/month-by-month" className="underline underline-offset-2 hover:text-foreground">
          Month by month
        </a>
        . Totals below are <strong className="text-foreground font-medium">across all months</strong>.
      </p>

      <div className="flex flex-wrap items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="target">Target cost / sign-up, $</Label>
          <Input
            id="target"
            type="number"
            value={scenario.set.target}
            onChange={e =>
              updateScenarioDeep(s => {
                s.set.target = parseFloat(e.target.value) || 0;
              })
            }
            className="w-20 tabular-nums"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="ratio">Healthy return</Label>
          <Input
            id="ratio"
            type="number"
            value={scenario.set.ratio}
            onChange={e =>
              updateScenarioDeep(s => {
                s.set.ratio = parseFloat(e.target.value) || 0;
              })
            }
            className="w-20 tabular-nums"
          />
        </div>
      </div>

      <div className="space-y-3">
        {scenario.chans.map((chan, i) => {
          const signups = simResult.cu[i];
          const cost = simResult.cc[i];
          const cps = signups ? cost / signups : NaN;
          const cpp = econ.conv ? cps / econ.conv : NaN;
          const ret = cps > 0 ? econ.perSU / cps : signups ? Infinity : NaN;
          const retClass = getRatioClass(ret, scenario.set.ratio);
          const K = LEAD_SOURCE_KINDS[chan.kind];
          const open = editingId === chan.id;

          return (
            <article
              key={chan.id}
              className={cn(
                'bg-card border rounded-lg overflow-hidden',
                !chan.on && 'opacity-55',
                open && 'ring-1 ring-primary/30'
              )}
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3 mb-4">
                  <Button
                    variant={open ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditingId(open ? null : chan.id)}
                  >
                    {open ? 'Done' : 'Edit'}
                  </Button>
                  <Switch
                    checked={chan.on}
                    onCheckedChange={v => handleToggle(chan.id, v)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{chan.name}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge variant="secondary">{K.label}</Badge>
                      <span className="text-sm text-muted-foreground">{rateSummary(chan)}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(chan.id)}
                    aria-label={`Remove ${chan.name}`}
                  >
                    ×
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Total spend" value={formatUsd(cost)} hint="all months" />
                  <Stat label="Sign-ups" value={formatNum(signups)} />
                  <Stat label="Cost / sign-up" value={formatUsd(cps)} />
                  <Stat
                    label="Return"
                    value={isFinite(ret) ? formatRatio(ret) : signups ? '∞' : '–'}
                    hint={isFinite(cpp) ? `${formatUsd(cpp)} / payer` : undefined}
                    tone={retClass}
                  />
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  To hit ${scenario.set.target}/sign-up:{' '}
                  <span className="text-foreground">{whatItTakes(chan, cps, scenario.set.target)}</span>
                </p>
              </div>

              {open && (
                <EditPanel
                  chan={chan}
                  onFieldChange={(f, v) => handleFieldChange(chan.id, f, v)}
                  onKindChange={k => handleKindChange(chan.id, k)}
                />
              )}
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <Button variant="outline" onClick={handleAdd}>
          + Add lead source
        </Button>
        <Select value={addKind} onValueChange={v => setAddKind(v as LeadSourceKind)}>
          <SelectTrigger className="w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LEAD_SOURCE_KINDS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string | null;
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          'font-serif text-xl tabular-nums mt-0.5',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-danger'
        )}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

interface EditPanelProps {
  chan: LeadSource;
  onFieldChange: (field: string, value: number | string) => void;
  onKindChange: (kind: LeadSourceKind) => void;
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>
        {label}
        {hint && (
          <span className="block text-xs text-muted-foreground font-normal">{hint}</span>
        )}
      </Label>
      {children}
    </div>
  );
}

function EditPanel({ chan, onFieldChange, onKindChange }: EditPanelProps) {
  const K = LEAD_SOURCE_KINDS[chan.kind];
  const rateKeys = new Set(
    chan.kind === 'creators'
      ? ['views', 's']
      : chan.kind === 'views'
        ? ['v', 'g', 'cap', 's']
        : chan.kind === 'search'
          ? ['v', 'g', 'cap', 'conv']
          : chan.kind === 'cpm'
            ? ['cpm', 'ctr', 'lp']
            : chan.kind === 'cpc'
              ? ['cpc', 'cvr']
              : chan.kind === 'cps'
                ? ['cps']
                : ['users']
  );
  const payFields = K.fields.filter(f => !rateKeys.has(f.key));
  const rateFields = K.fields.filter(f => rateKeys.has(f.key));

  return (
    <div className="px-4 sm:px-5 pb-5 pt-1 space-y-5 border-t bg-muted/20">
      <p className="text-sm text-muted-foreground max-w-3xl leading-relaxed pt-4">
        {formulaHint(chan)}
      </p>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Identity
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Name">
            <Input value={chan.name} onChange={e => onFieldChange('name', e.target.value)} />
          </Field>
          <Field label="Type">
            <Select value={chan.kind} onValueChange={v => onKindChange(v as LeadSourceKind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEAD_SOURCE_KINDS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    {v.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Starts in month">
            <Input
              type="number"
              value={chan.start}
              onChange={e => onFieldChange('start', parseInt(e.target.value) || 1)}
              className="tabular-nums"
            />
          </Field>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Rates that drive sign-ups
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rateFields.map(field => (
            <Field key={field.key} label={field.label} hint={field.hint}>
              <Input
                type="number"
                value={(chan as unknown as Record<string, number>)[field.key] || 0}
                onChange={e => onFieldChange(field.key, parseFloat(e.target.value) || 0)}
                className="tabular-nums"
              />
            </Field>
          ))}
        </div>
      </div>

      {payFields.length > 0 && (
        <div>
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
            Pay / cost inputs
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {payFields.map(field => (
              <Field key={field.key} label={field.label} hint={field.hint}>
                <Input
                  type="number"
                  value={(chan as unknown as Record<string, number>)[field.key] || 0}
                  onChange={e => onFieldChange(field.key, parseFloat(e.target.value) || 0)}
                  className="tabular-nums"
                />
              </Field>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
