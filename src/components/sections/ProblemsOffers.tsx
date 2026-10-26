'use client';

import { useState, type ReactNode } from 'react';
import { useModel } from '@/lib/context';
import {
  OfferLearning,
  JourneyPhase,
  SignalStrength,
  SIGNAL_OPTIONS,
  applyPhasesToStages,
  emptyOfferLearning,
  uid,
  formatUsd,
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

const SIGNAL_TONE: Record<SignalStrength, string> = {
  unknown: 'bg-muted text-muted-foreground',
  weak: 'bg-danger-light text-danger',
  mixed: 'bg-warning-light text-warning',
  strong: 'bg-success-light text-success',
};

function asSignalLocal(value: string): SignalStrength {
  return SIGNAL_OPTIONS.some(o => o.value === value)
    ? (value as SignalStrength)
    : 'unknown';
}

export function ProblemsOffers() {
  const { scenario, updateScenarioDeep } = useModel();
  const [openOffer, setOpenOffer] = useState<string | null>(null);
  const [phasesOpen, setPhasesOpen] = useState(true);
  const [problemsOpen, setProblemsOpen] = useState(true);
  const [openProblems, setOpenProblems] = useState<Record<string, boolean>>({});

  const learning = scenario.learning;
  const assigned = new Set(learning.problems.flatMap(p => p.offerPlanIds));
  const unassigned = scenario.plans.filter(p => !assigned.has(p.id));

  const isProblemOpen = (id: string) => openProblems[id] ?? false;
  const toggleProblem = (id: string) =>
    setOpenProblems(prev => ({ ...prev, [id]: !isProblemOpen(id) }));

  const updatePhase = (phaseId: string, patch: Partial<JourneyPhase>) => {
    updateScenarioDeep(s => {
      const ph = s.learning.phases.find(p => p.id === phaseId);
      if (!ph) return;
      Object.assign(ph, patch);
      if (ph.endMonth < ph.startMonth) ph.endMonth = ph.startMonth;
      if (ph.startMonth > ph.endMonth) ph.startMonth = ph.endMonth;
    });
  };

  const addPhase = () => {
    updateScenarioDeep(s => {
      const last = s.learning.phases[s.learning.phases.length - 1];
      const start = last ? Math.min(s.months, last.endMonth + 1) : 1;
      s.learning.phases.push({
        id: uid(),
        name: 'New phase',
        startMonth: start,
        endMonth: Math.min(s.months, start + 2),
        note: '',
      });
    });
  };

  const removePhase = (phaseId: string) => {
    updateScenarioDeep(s => {
      if (s.learning.phases.length <= 1) return;
      s.learning.phases = s.learning.phases.filter(p => p.id !== phaseId);
    });
  };

  const syncRoadmap = () => {
    updateScenarioDeep(s => {
      applyPhasesToStages(s);
    });
  };

  const updateOffer = (planId: string, updater: (o: OfferLearning) => void) => {
    updateScenarioDeep(s => {
      if (!s.learning.offers[planId]) {
        s.learning.offers[planId] = emptyOfferLearning(planId);
      }
      updater(s.learning.offers[planId]);
    });
  };

  const moveOffer = (planId: string, problemId: string | 'none') => {
    updateScenarioDeep(s => {
      s.learning.problems.forEach(p => {
        p.offerPlanIds = p.offerPlanIds.filter(id => id !== planId);
      });
      if (problemId !== 'none') {
        const problem = s.learning.problems.find(p => p.id === problemId);
        if (problem && !problem.offerPlanIds.includes(planId)) {
          problem.offerPlanIds.push(planId);
        }
      }
    });
  };

  const updateProblem = (problemId: string, field: 'name' | 'blurb', value: string) => {
    updateScenarioDeep(s => {
      const p = s.learning.problems.find(x => x.id === problemId);
      if (p) p[field] = value;
    });
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-serif text-2xl mb-2">Problems and test offers</h2>
        <p className="text-sm text-muted-foreground max-w-3xl">
          Two different things live here:{' '}
          <strong className="text-foreground font-medium">journey phases</strong> (when you are in
          the story — test vs launch) and{' '}
          <strong className="text-foreground font-medium">problems &amp; test offers</strong> (what
          you are building to learn want / use / pay).
        </p>
      </div>

      {/* Journey phases — distinct from problems */}
      <section className="rounded-xl border-2 border-dashed border-primary/25 bg-teal-light/40 overflow-hidden">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left hover:bg-teal-light/60"
          onClick={() => setPhasesOpen(v => !v)}
        >
          <div>
            <div className="text-[11px] uppercase tracking-wide text-primary mb-1">
              Timeline · not offers
            </div>
            <h3 className="font-serif text-xl">Journey phases</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Name the stretches of the roadmap (test market &amp; offer → validate → launch → grow).
              This is when — not what you are selling.
            </p>
          </div>
          <span className="text-sm text-muted-foreground shrink-0">
            {phasesOpen ? 'Collapse' : 'Expand'}
          </span>
        </button>

        {phasesOpen && (
          <div className="border-t border-primary/15 px-4 sm:px-5 py-4 space-y-4 bg-background/70">
            <ol className="space-y-3">
              {learning.phases.map((phase, i) => (
                <li
                  key={phase.id}
                  className="rounded-lg border border-primary/15 bg-card p-3 sm:p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs tabular-nums text-primary w-5 font-medium">
                      {i + 1}
                    </span>
                    <Input
                      value={phase.name}
                      onChange={e => updatePhase(phase.id, { name: e.target.value })}
                      className="flex-1 min-w-[10rem] font-medium"
                      aria-label="Phase name"
                    />
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span>mo</span>
                      <Input
                        type="number"
                        value={phase.startMonth}
                        onChange={e =>
                          updatePhase(phase.id, {
                            startMonth: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-14 tabular-nums"
                      />
                      <span>–</span>
                      <Input
                        type="number"
                        value={phase.endMonth}
                        onChange={e =>
                          updatePhase(phase.id, {
                            endMonth: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-14 tabular-nums"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePhase(phase.id)}
                      disabled={learning.phases.length <= 1}
                    >
                      ×
                    </Button>
                  </div>
                  <Input
                    value={phase.note}
                    onChange={e => updatePhase(phase.id, { note: e.target.value })}
                    placeholder="What this phase is for…"
                    className="text-sm"
                  />
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={addPhase}>
                + Add phase
              </Button>
              <Button size="sm" onClick={syncRoadmap}>
                Apply phases to roadmap strip
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Apply writes these names onto Month by month stages so How money flows matches.
            </p>
          </div>
        )}
      </section>

      {/* Problems & test offers — separate block */}
      <section className="space-y-4">
        <button
          type="button"
          onClick={() => setProblemsOpen(v => !v)}
          className="w-full text-left rounded-xl border bg-card px-4 sm:px-5 py-4 hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                Product learning · not timeline
              </div>
              <h3 className="font-serif text-xl">Problems and test offers</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Each problem you solve, and the scratch <strong className="text-foreground font-medium">test offer</strong> under
                it — built only to learn want / use / pay. Not a public launch.
              </p>
            </div>
            <span className="text-sm text-muted-foreground shrink-0 pt-1">
              {problemsOpen ? 'Collapse' : 'Expand'}
            </span>
          </div>
        </button>

        {problemsOpen && (
        <div className="space-y-3">
        {learning.problems.map(problem => {
          const offers = problem.offerPlanIds
            .map(id => scenario.plans.find(p => p.id === id))
            .filter(Boolean);
          const open = isProblemOpen(problem.id);

          return (
            <article key={problem.id} className="bg-card border rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 text-left hover:bg-muted/40"
                onClick={() => toggleProblem(problem.id)}
              >
                <div className="min-w-0">
                  <div className="font-serif text-lg truncate">{problem.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {offers.length === 0
                      ? 'No test offer yet'
                      : `${offers.length} test offer${offers.length === 1 ? '' : 's'}`}
                    {problem.blurb ? ` · ${problem.blurb}` : ''}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground shrink-0">
                  {open ? 'Hide' : 'Show'}
                </span>
              </button>

              {open && (
                <div className="border-t px-4 sm:px-5 py-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Problem name</Label>
                    <Input
                      value={problem.name}
                      onChange={e => updateProblem(problem.id, 'name', e.target.value)}
                    />
                    <Label className="text-xs text-muted-foreground">Short blurb</Label>
                    <Input
                      value={problem.blurb}
                      onChange={e => updateProblem(problem.id, 'blurb', e.target.value)}
                    />
                  </div>

                  {offers.length === 0 ? (
                    <p className="text-sm text-muted-foreground rounded-md bg-muted/50 px-3 py-2.5">
                      No test offer assigned yet. Move a plan here from below, or add one in Plans.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {offers.map(plan => {
                        if (!plan) return null;
                        const offer = learning.offers[plan.id] || emptyOfferLearning(plan.id);
                        const expanded = openOffer === plan.id;
                        return (
                          <OfferCard
                            key={plan.id}
                            planName={plan.name}
                            planOn={plan.on}
                            price={plan.price}
                            planType={plan.type}
                            offer={offer}
                            expanded={expanded}
                            problems={learning.problems}
                            currentProblemId={problem.id}
                            onToggleExpand={() =>
                              setOpenOffer(expanded ? null : plan.id)
                            }
                            onTogglePlan={on =>
                              updateScenarioDeep(s => {
                                const p = s.plans.find(x => x.id === plan.id);
                                if (p) p.on = on;
                              })
                            }
                            onUpdate={updater => updateOffer(plan.id, updater)}
                            onMove={pid => moveOffer(plan.id, pid)}
                          />
                        );
                      })}
                    </div>
                  )}

                  {scenario.plans.some(p => !problem.offerPlanIds.includes(p.id)) && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs text-muted-foreground">Assign offer:</span>
                      <Select
                        onValueChange={v => {
                          if (typeof v === 'string' && v) moveOffer(v, problem.id);
                        }}
                      >
                        <SelectTrigger className="w-[220px] h-8">
                          <SelectValue placeholder="Move a plan here…" />
                        </SelectTrigger>
                        <SelectContent>
                          {scenario.plans
                            .filter(p => !problem.offerPlanIds.includes(p.id))
                            .map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {unassigned.length > 0 && (
          <div className="bg-card border rounded-lg p-4 sm:p-5 space-y-3">
            <div>
              <h3 className="font-medium">Unassigned test offers</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Plans not under a problem yet — assign them above when you know which problem they
                test.
              </p>
            </div>
            <div className="space-y-3">
              {unassigned.map(plan => {
                const offer = learning.offers[plan.id] || emptyOfferLearning(plan.id);
                const expanded = openOffer === plan.id;
                return (
                  <OfferCard
                    key={plan.id}
                    planName={plan.name}
                    planOn={plan.on}
                    price={plan.price}
                    planType={plan.type}
                    offer={offer}
                    expanded={expanded}
                    problems={learning.problems}
                    currentProblemId="none"
                    onToggleExpand={() => setOpenOffer(expanded ? null : plan.id)}
                    onTogglePlan={on =>
                      updateScenarioDeep(s => {
                        const p = s.plans.find(x => x.id === plan.id);
                        if (p) p.on = on;
                      })
                    }
                    onUpdate={updater => updateOffer(plan.id, updater)}
                    onMove={pid => moveOffer(plan.id, pid)}
                  />
                );
              })}
            </div>
          </div>
        )}
        </div>
        )}
      </section>
    </div>
  );
}

interface OfferCardProps {
  planName: string;
  planOn: boolean;
  price: number;
  planType: string;
  offer: OfferLearning;
  expanded: boolean;
  problems: { id: string; name: string }[];
  currentProblemId: string;
  onToggleExpand: () => void;
  onTogglePlan: (on: boolean) => void;
  onUpdate: (updater: (o: OfferLearning) => void) => void;
  onMove: (problemId: string | 'none') => void;
}

function OfferCard({
  planName,
  planOn,
  price,
  planType,
  offer,
  expanded,
  problems,
  currentProblemId,
  onToggleExpand,
  onTogglePlan,
  onUpdate,
  onMove,
}: OfferCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-background overflow-hidden',
        !planOn && 'opacity-55'
      )}
    >
      <div className="p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-start gap-3">
          <Button
            variant={expanded ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleExpand}
          >
            {expanded ? 'Done' : 'Log'}
          </Button>
          <Switch checked={planOn} onCheckedChange={onTogglePlan} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{planName}</span>
              <Badge variant="secondary">test offer</Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {formatUsd(price)}
              {planType === 'monthly' ? '/mo' : ''} · linked to Plans math
            </div>
          </div>
          <Select
            value={currentProblemId}
            onValueChange={v =>
              onMove(typeof v === 'string' && v ? v : 'none')
            }
          >
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Problem…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {problems.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name.length > 36 ? p.name.slice(0, 36) + '…' : p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-baseline justify-between gap-2 mb-1.5">
            <Label className="text-xs text-muted-foreground">Test product progress</Label>
            <span className="text-xs tabular-nums text-muted-foreground">{offer.progress}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={offer.progress}
            onChange={e => onUpdate(o => { o.progress = parseInt(e.target.value) || 0; })}
            className="w-full accent-[var(--primary)]"
          />
          <div className="h-1.5 rounded-full bg-muted overflow-hidden -mt-1 pointer-events-none">
            <div
              className="h-full bg-primary/70 rounded-full"
              style={{ width: `${offer.progress}%` }}
            />
          </div>
        </div>

        {/* Signal chips */}
        <div className="flex flex-wrap gap-2">
          {(['want', 'use', 'pay'] as const).map(key => (
            <span
              key={key}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
                SIGNAL_TONE[offer.signals[key]]
              )}
            >
              <span className="uppercase tracking-wide opacity-70">{key}</span>
              <span className="font-medium capitalize">{offer.signals[key]}</span>
            </span>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="border-t bg-muted/20 px-3 sm:px-4 py-4 space-y-4">
          <Field
            label="What's built / what's left"
            hint="This is the scratch version for testing — not the finished product."
          >
            <textarea
              value={offer.progressNote}
              onChange={e => onUpdate(o => { o.progressNote = e.target.value; })}
              rows={2}
              className={textareaClass}
              placeholder="e.g. Landing + paywall working; design flow still fake…"
            />
          </Field>

          <Field
            label="Building with users"
            hint="Who you're talking to or building alongside."
          >
            <textarea
              value={offer.buildingWithUsers}
              onChange={e => onUpdate(o => { o.buildingWithUsers = e.target.value; })}
              rows={2}
              className={textareaClass}
              placeholder="e.g. 5 homeowners who remodeled last year; 2 contractors…"
            />
          </Field>

          <Field
            label="User & market data"
            hint="What you've collected and what you're using to shape the test."
          >
            <textarea
              value={offer.userData}
              onChange={e => onUpdate(o => { o.userData = e.target.value; })}
              rows={3}
              className={textareaClass}
              placeholder="Interviews, waitlist, screenshots of jobs, quotes, objections…"
            />
          </Field>

          <Field
            label="What we're testing"
            hint="Ads, posts, UGC, waitlist, pricing experiments — whatever you're running."
          >
            <textarea
              value={offer.testing}
              onChange={e => onUpdate(o => { o.testing = e.target.value; })}
              rows={2}
              className={textareaClass}
              placeholder="e.g. Meta ads to waitlist; 3 UGC clips; $4.99 vs free trial…"
            />
          </Field>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3">
              Signals — want · use · pay
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  ['want', 'Do people want it?'],
                  ['use', 'Do they use it?'],
                  ['pay', 'Do they pay?'],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs">{label}</Label>
                  <Select
                    value={offer.signals[key]}
                    onValueChange={v => {
                      if (typeof v !== 'string') return;
                      onUpdate(o => {
                        o.signals[key] = asSignalLocal(v);
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNAL_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <textarea
              value={offer.signals.notes}
              onChange={e =>
                onUpdate(o => {
                  o.signals.notes = e.target.value;
                })
              }
              rows={2}
              className={cn(textareaClass, 'mt-3')}
              placeholder="Evidence for these signals…"
            />
          </div>
        </div>
      )}
    </div>
  );
}

const textareaClass =
  'w-full min-h-[4rem] rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 placeholder:text-muted-foreground';

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
    <div className="space-y-1.5">
      <Label>
        {label}
        {hint && (
          <span className="block text-xs text-muted-foreground font-normal mt-0.5">{hint}</span>
        )}
      </Label>
      {children}
    </div>
  );
}
