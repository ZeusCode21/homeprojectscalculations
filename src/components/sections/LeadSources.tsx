'use client';

import { useState } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

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
        // Add default values for new kind
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
  
  const handleTargetChange = (value: number) => {
    updateScenarioDeep(s => {
      s.set.target = value;
    });
  };
  
  const handleRatioChange = (value: number) => {
    updateScenarioDeep(s => {
      s.set.ratio = value;
    });
  };
  
  return (
    <section id="lead-sources" className="scroll-mt-16">
      <h2 className="font-serif text-2xl mb-2">Lead sources</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
        Each channel's cost per sign-up, sign-ups per $100, cost per paying user and return on each dollar.
        Set a target cost per sign-up and the last column shows what has to change to hit it.
        Spend per month is set in the Month by month section.
      </p>
      
      <div className="bg-card border rounded-lg p-4">
        {/* Target inputs */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="target">Target cost per sign-up, $</Label>
            <Input
              id="target"
              type="number"
              value={scenario.set.target}
              onChange={e => handleTargetChange(parseFloat(e.target.value) || 0)}
              className="w-20 tabular-nums"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ratio">Healthy return (value ÷ cost)</Label>
            <Input
              id="ratio"
              type="number"
              value={scenario.set.ratio}
              onChange={e => handleRatioChange(parseFloat(e.target.value) || 0)}
              className="w-20 tabular-nums"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">On</TableHead>
                <TableHead>Lead source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right tabular-nums">Spend</TableHead>
                <TableHead className="text-right tabular-nums">Sign-ups</TableHead>
                <TableHead className="text-right tabular-nums">Cost per sign-up</TableHead>
                <TableHead className="text-right tabular-nums">Sign-ups per $100</TableHead>
                <TableHead className="text-right tabular-nums">Cost per paying user</TableHead>
                <TableHead className="text-right tabular-nums">Return</TableHead>
                <TableHead>What it takes to hit ${scenario.set.target}</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenario.chans.map((chan, i) => {
                const signups = simResult.cu[i];
                const cost = simResult.cc[i];
                const cps = signups ? cost / signups : NaN;
                const cpp = econ.conv ? cps / econ.conv : NaN;
                const ret = cps > 0 ? econ.perSU / cps : signups ? Infinity : NaN;
                const per100 = cost > 0 ? (signups / cost) * 100 : signups ? Infinity : 0;
                const retClass = getRatioClass(ret, scenario.set.ratio);
                const K = LEAD_SOURCE_KINDS[chan.kind];
                
                return (
                  <>
                    <TableRow key={chan.id} className={cn(!chan.on && 'opacity-50')}>
                      <TableCell>
                        <Switch
                          checked={chan.on}
                          onCheckedChange={v => handleToggle(chan.id, v)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{chan.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{K.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatUsd(cost)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNum(signups)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatUsd(cps)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {cost > 0 ? per100.toFixed(1) : signups ? 'free' : '–'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatUsd(cpp)}</TableCell>
                      <TableCell
                        className={cn(
                          'text-right tabular-nums',
                          retClass === 'success' && 'text-success',
                          retClass === 'warning' && 'text-warning',
                          retClass === 'danger' && 'text-danger'
                        )}
                      >
                        {isFinite(ret) ? formatRatio(ret) : signups ? '∞' : '–'}
                      </TableCell>
                      <TableCell className="text-sm max-w-xs">
                        {whatItTakes(chan, cps, scenario.set.target)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant={editingId === chan.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setEditingId(editingId === chan.id ? null : chan.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(chan.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {editingId === chan.id && (
                      <TableRow>
                        <TableCell colSpan={11} className="bg-muted/50 p-4">
                          <EditPanel
                            chan={chan}
                            onFieldChange={(f, v) => handleFieldChange(chan.id, f, v)}
                            onKindChange={k => handleKindChange(chan.id, k)}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </div>
        
        {/* Add new */}
        <div className="flex items-center gap-2 mt-4">
          <Button variant="outline" onClick={handleAdd}>
            + Add lead source
          </Button>
          <Select value={addKind} onValueChange={v => setAddKind(v as LeadSourceKind)}>
            <SelectTrigger className="w-[240px]">
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
        
        <p className="text-xs text-muted-foreground mt-4">
          Sign-ups here are before referrals. <strong>Cost per paying user</strong> = cost per sign-up ÷
          the share of sign-ups who buy a plan. <strong>Return</strong> = what a sign-up is worth ÷ what it costs.
          {scenario.set.ratio}× or more is healthy; under 1× loses money on every sign-up.
        </p>
      </div>
    </section>
  );
}

interface EditPanelProps {
  chan: LeadSource;
  onFieldChange: (field: string, value: number | string) => void;
  onKindChange: (kind: LeadSourceKind) => void;
}

function EditPanel({ chan, onFieldChange, onKindChange }: EditPanelProps) {
  const K = LEAD_SOURCE_KINDS[chan.kind];
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input
          value={chan.name}
          onChange={e => onFieldChange('name', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Type</Label>
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
      </div>
      <div className="space-y-1">
        <Label>Starts in month</Label>
        <Input
          type="number"
          value={chan.start}
          onChange={e => onFieldChange('start', parseInt(e.target.value) || 1)}
        />
      </div>
      {K.fields.map(field => (
        <div key={field.key} className="space-y-1">
          <Label>
            {field.label}
            {field.hint && (
              <span className="block text-xs text-muted-foreground font-normal">
                {field.hint}
              </span>
            )}
          </Label>
          <Input
            type="number"
            value={(chan as unknown as Record<string, number>)[field.key] || 0}
            onChange={e => onFieldChange(field.key, parseFloat(e.target.value) || 0)}
            className="tabular-nums"
          />
        </div>
      ))}
      <div className="col-span-3 text-xs text-muted-foreground">
        Monthly {K.unit.replace('$ ', '')} for this source is in the Month by month section.
      </div>
    </div>
  );
}
