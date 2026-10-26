'use client';

import { useState, type ReactNode } from 'react';
import { useModel } from '@/lib/context';
import {
  Plan,
  PlanType,
  formatUsd,
  formatNum,
  formatRatio,
  getRatioClass,
  staysOf,
  ltvOf,
  uid,
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

export function Plans() {
  const { scenario, simResult, econ, metrics, updateScenarioDeep } = useModel();
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleToggle = (planId: string, on: boolean) => {
    updateScenarioDeep(s => {
      const plan = s.plans.find(p => p.id === planId);
      if (plan) plan.on = on;
    });
  };

  const handleFieldChange = (planId: string, field: string, value: number | string) => {
    updateScenarioDeep(s => {
      const plan = s.plans.find(p => p.id === planId);
      if (plan) {
        (plan as unknown as Record<string, number | string>)[field] = value;
      }
    });
  };

  const handleAdd = () => {
    updateScenarioDeep(s => {
      const newId = uid();
      const newPlan: Plan = {
        id: newId,
        on: true,
        name: 'New plan',
        type: 'monthly',
        price: 9.99,
        start: 6,
        conv: 0.5,
        churn: 20,
        repeat: 1,
        renders: 20,
        cost: 0,
        fixed: 0,
        web: 60,
      };
      s.plans.push(newPlan);
    });
  };

  const handleRemove = (planId: string) => {
    if (!confirm('Remove this plan?')) return;
    updateScenarioDeep(s => {
      const idx = s.plans.findIndex(p => p.id === planId);
      if (idx >= 0) {
        s.plans.splice(idx, 1);
      }
    });
    if (editingId === planId) setEditingId(null);
  };

  const ratioClass = getRatioClass(metrics.returnRatio, scenario.set.ratio);
  const totalConv = scenario.plans.filter(p => p.on).reduce((sum, p) => sum + p.conv, 0);

  return (
    <section id="plans" className="scroll-mt-16 space-y-8">
      <div>
        <h2 className="font-serif text-2xl mb-2">Plans</h2>
        <p className="text-sm text-muted-foreground max-w-3xl">
          These are the same <strong className="text-foreground font-medium">test offers</strong> under
          Problems &amp; test offers — here you set price, conversion, and value for the growth math.
          Edit conversion inline; that&apos;s the lever that moves sign-up → paid.
        </p>
      </div>

      <div className="space-y-3">
        {scenario.plans.map((plan, i) => {
          const stays = staysOf(plan, scenario.months);
          const ltv = ltvOf(plan, scenario.set, scenario.months);
          const worth = plan.on ? (plan.conv / 100) * ltv : 0;
          const buyers = simResult.nb[i];
          const open = editingId === plan.id;

          return (
            <article
              key={plan.id}
              className={cn(
                'bg-card border rounded-lg overflow-hidden',
                !plan.on && 'opacity-55',
                open && 'ring-1 ring-primary/30'
              )}
            >
              <div className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-3 mb-4">
                  <Button
                    variant={open ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditingId(open ? null : plan.id)}
                  >
                    {open ? 'Done' : 'Edit'}
                  </Button>
                  <Switch
                    checked={plan.on}
                    onCheckedChange={v => handleToggle(plan.id, v)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{plan.name}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Badge variant="secondary">
                        {plan.type === 'monthly' ? 'Monthly' : 'One-time'}
                      </Badge>
                      <span>
                        {formatUsd(plan.price)}
                        {plan.type === 'monthly' ? '/mo' : ''}
                      </span>
                      <span>· launches mo {plan.start}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(plan.id)}
                    aria-label={`Remove ${plan.name}`}
                  >
                    ×
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-md bg-muted/50 px-3 py-2.5 col-span-2 sm:col-span-1">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Conversion
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={plan.conv}
                        onChange={e =>
                          handleFieldChange(plan.id, 'conv', parseFloat(e.target.value) || 0)
                        }
                        className="w-20 tabular-nums h-8"
                        disabled={!plan.on}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">of new sign-ups</div>
                  </div>
                  <Stat
                    label="Stay / buys"
                    value={
                      plan.type === 'monthly'
                        ? plan.churn > 0
                          ? `${stays.toFixed(1)} mo`
                          : '∞'
                        : plan.repeat === 1
                          ? 'once'
                          : `${plan.repeat}×`
                    }
                  />
                  <Stat label="LTV / buyer" value={formatUsd(ltv)} danger={ltv <= 0} />
                  <Stat label="Worth / sign-up" value={formatUsd(worth)} emphasize />
                </div>

                <div className="text-xs text-muted-foreground mt-3 tabular-nums">
                  {formatNum(buyers)} buyers over the roadmap · {plan.conv}% × {formatUsd(ltv)} LTV ={' '}
                  {formatUsd(worth)} per sign-up
                </div>
              </div>

              {open && (
                <PlanEditPanel
                  plan={plan}
                  onFieldChange={(f, v) => handleFieldChange(plan.id, f, v)}
                />
              )}
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={handleAdd}>
          + Add plan or feature
        </Button>
        <p className="text-xs text-muted-foreground">
          Combined conversion:{' '}
          <span className="tabular-nums text-foreground font-medium">{totalConv.toFixed(1)}%</span>{' '}
          of new sign-ups buy something
        </p>
      </div>

      {/* Value stack — hierarchy under plans */}
      <div className="bg-card border rounded-lg p-5 sm:p-6">
        <h3 className="font-serif text-xl mb-1">What one sign-up is worth</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
          Stacks plan value + other income − free-user cost. Compare to cost per sign-up from Lead
          sources.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <ol className="space-y-0 border rounded-lg overflow-hidden divide-y">
            {scenario.plans
              .filter(p => p.on)
              .map((plan, idx) => {
                const ltv = ltvOf(plan, scenario.set, scenario.months);
                const worth = (plan.conv / 100) * ltv;
                return (
                  <li
                    key={plan.id}
                    className="flex items-baseline justify-between gap-4 px-4 py-3 bg-background"
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground tabular-nums">
                        {idx + 1}
                      </div>
                      <div className="text-sm font-medium truncate">{plan.name}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {plan.conv}% × {formatUsd(ltv)}
                      </div>
                    </div>
                    <div className="text-sm tabular-nums shrink-0">{formatUsd(worth)}</div>
                  </li>
                );
              })}
            <li className="flex items-baseline justify-between gap-4 px-4 py-3 bg-background">
              <div>
                <div className="text-sm font-medium">+ Materials</div>
                <div className="text-xs text-muted-foreground">
                  over {scenario.set.life} mo active
                </div>
              </div>
              <div className="text-sm tabular-nums">{formatUsd(econ.mat)}</div>
            </li>
            <li className="flex items-baseline justify-between gap-4 px-4 py-3 bg-background">
              <div>
                <div className="text-sm font-medium">− Free-user cost</div>
                <div className="text-xs text-muted-foreground">
                  renders + text · {scenario.set.life} mo
                </div>
              </div>
              <div className="text-sm tabular-nums text-danger">−{formatUsd(econ.freeCost)}</div>
            </li>
            <li className="flex items-baseline justify-between gap-4 px-4 py-3.5 bg-muted/50">
              <div className="font-medium">= Value per sign-up</div>
              <div className="text-base font-serif tabular-nums font-medium">
                {formatUsd(econ.perSU)}
              </div>
            </li>
          </ol>

          <div className="grid gap-3 content-start">
            <Outcome
              label="Value per paying user"
              value={formatUsd(econ.perPayer)}
              hint={`plan value ${formatUsd(econ.planVal)} ÷ ${(econ.conv * 100).toFixed(1)}% who pay`}
            />
            <Outcome
              label="Cost per sign-up"
              value={formatUsd(metrics.costPerSignup)}
              hint="from Lead sources · all months"
            />
            <Outcome
              label={`Return · ${scenario.set.ratio}× healthy`}
              value={isFinite(metrics.returnRatio) ? formatRatio(metrics.returnRatio) : '∞'}
              hint="value ÷ cost"
              tone={ratioClass}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  danger,
  emphasize,
}: {
  label: string;
  value: string;
  danger?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div
        className={cn(
          'font-serif text-xl tabular-nums mt-0.5',
          danger && 'text-danger',
          emphasize && 'font-medium'
        )}
      >
        {value}
      </div>
    </div>
  );
}

function Outcome({
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
    <div className="rounded-lg border px-4 py-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div
        className={cn(
          'text-2xl font-serif tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-danger'
        )}
      >
        {value}
      </div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}

interface PlanEditPanelProps {
  plan: Plan;
  onFieldChange: (field: string, value: number | string) => void;
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

function PlanEditPanel({ plan, onFieldChange }: PlanEditPanelProps) {
  return (
    <div className="px-4 sm:px-5 pb-5 pt-4 space-y-5 border-t bg-muted/20">
      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Offer
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Name">
            <Input value={plan.name} onChange={e => onFieldChange('name', e.target.value)} />
          </Field>
          <Field label="Type">
            <Select
              value={plan.type}
              onValueChange={v => onFieldChange('type', v as PlanType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="one-time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Price, $">
            <Input
              type="number"
              value={plan.price}
              onChange={e => onFieldChange('price', parseFloat(e.target.value) || 0)}
              className="tabular-nums"
            />
          </Field>
          <Field label="Launches in month">
            <Input
              type="number"
              value={plan.start}
              onChange={e => onFieldChange('start', parseInt(e.target.value) || 1)}
              className="tabular-nums"
            />
          </Field>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Conversion and how long they pay
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field
            label="Conversion, % of new sign-ups"
            hint="Freemium median ~2.1% for all plans combined"
          >
            <Input
              type="number"
              step="0.1"
              value={plan.conv}
              onChange={e => onFieldChange('conv', parseFloat(e.target.value) || 0)}
              className="tabular-nums"
            />
          </Field>
          {plan.type === 'monthly' ? (
            <Field label="Cancel per month, %" hint="AI apps ~20%; stay ≈ 1 ÷ churn">
              <Input
                type="number"
                value={plan.churn}
                onChange={e => onFieldChange('churn', parseFloat(e.target.value) || 0)}
                className="tabular-nums"
              />
            </Field>
          ) : (
            <Field label="Purchases per buyer" hint="1 = buys once">
              <Input
                type="number"
                value={plan.repeat}
                onChange={e => onFieldChange('repeat', parseFloat(e.target.value) || 1)}
                className="tabular-nums"
              />
            </Field>
          )}
          <Field label="Bought on the web, %" hint="The rest pay the App Store fee">
            <Input
              type="number"
              value={plan.web}
              onChange={e => onFieldChange('web', parseFloat(e.target.value) || 0)}
              className="tabular-nums"
            />
          </Field>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
          Cost to deliver
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Renders used" hint="Per month (monthly) or per purchase">
            <Input
              type="number"
              value={plan.renders}
              onChange={e => onFieldChange('renders', parseFloat(e.target.value) || 0)}
              className="tabular-nums"
            />
          </Field>
          <Field label="Other cost per sale, $" hint="Text/voice, storage">
            <Input
              type="number"
              value={plan.cost}
              onChange={e => onFieldChange('cost', parseFloat(e.target.value) || 0)}
              className="tabular-nums"
            />
          </Field>
          <Field label="Fixed cost per month, $">
            <Input
              type="number"
              value={plan.fixed}
              onChange={e => onFieldChange('fixed', parseFloat(e.target.value) || 0)}
              className="tabular-nums"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
