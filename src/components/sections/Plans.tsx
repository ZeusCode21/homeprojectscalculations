'use client';

import { useState } from 'react';
import { useModel } from '@/lib/context';
import {
  Plan,
  PlanType,
  formatUsd,
  formatNum,
  formatRatio,
  getRatioClass,
  keepOf,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  
  return (
    <section id="plans" className="scroll-mt-16">
      <h2 className="font-serif text-2xl mb-2">Plans and what a sign-up is worth</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
        Conversion = the share of new sign-ups who buy that plan.
        Lifetime value per buyer = what you keep per sale × how long they stay (monthly) or how many times they buy (one-time).
        Value per sign-up adds it all up, because most sign-ups never pay.
      </p>
      
      <div className="bg-card border rounded-lg p-4 mb-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">On</TableHead>
                <TableHead>Plan / feature</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right tabular-nums">Price</TableHead>
                <TableHead className="text-right tabular-nums">You keep per sale</TableHead>
                <TableHead className="text-right tabular-nums">Conversion</TableHead>
                <TableHead className="text-right tabular-nums">How long they pay</TableHead>
                <TableHead className="text-right tabular-nums">Lifetime value per buyer</TableHead>
                <TableHead className="text-right tabular-nums">Worth per sign-up</TableHead>
                <TableHead className="text-right tabular-nums">Buyers</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenario.plans.map((plan, i) => {
                const keep = keepOf(plan, scenario.set);
                const stays = staysOf(plan, scenario.months);
                const ltv = ltvOf(plan, scenario.set, scenario.months);
                const worth = plan.on ? (plan.conv / 100) * ltv : 0;
                const buyers = simResult.nb[i];
                
                return (
                  <>
                    <TableRow key={plan.id} className={cn(!plan.on && 'opacity-50')}>
                      <TableCell>
                        <Switch
                          checked={plan.on}
                          onCheckedChange={v => handleToggle(plan.id, v)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {plan.type === 'monthly' ? 'Monthly' : 'One-time'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUsd(plan.price)}{plan.type === 'monthly' ? '/mo' : ''}
                      </TableCell>
                      <TableCell className={cn('text-right tabular-nums', keep <= 0 && 'text-danger')}>
                        {formatUsd(keep)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{plan.conv}%</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {plan.type === 'monthly'
                          ? plan.churn > 0
                            ? `${stays.toFixed(1)} months`
                            : 'never cancel'
                          : plan.repeat === 1
                          ? 'buys once'
                          : `${plan.repeat} purchases`}
                      </TableCell>
                      <TableCell className={cn('text-right tabular-nums', ltv <= 0 && 'text-danger')}>
                        {formatUsd(ltv)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatUsd(worth)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNum(buyers)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant={editingId === plan.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setEditingId(editingId === plan.id ? null : plan.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemove(plan.id)}
                          >
                            ×
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {editingId === plan.id && (
                      <TableRow>
                        <TableCell colSpan={11} className="bg-muted/50 p-4">
                          <PlanEditPanel
                            plan={plan}
                            onFieldChange={(f, v) => handleFieldChange(plan.id, f, v)}
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
        
        <Button variant="outline" onClick={handleAdd} className="mt-4">
          + Add plan or feature
        </Button>
      </div>
      
      {/* Value breakdown */}
      <div className="bg-card border rounded-lg p-4">
        <h3 className="font-serif text-lg mb-3">What one sign-up is worth</h3>
        <Table>
          <TableBody>
            {scenario.plans.filter(p => p.on).map(plan => {
              const ltv = ltvOf(plan, scenario.set, scenario.months);
              const worth = (plan.conv / 100) * ltv;
              return (
                <TableRow key={plan.id}>
                  <TableCell>
                    {plan.name}: {plan.conv}% buy × {formatUsd(ltv)} lifetime value
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatUsd(worth)}</TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell>
                Materials commissions per user over {scenario.set.life} months
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatUsd(econ.mat)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Minus what a free user costs you (renders + text over {scenario.set.life} months)
              </TableCell>
              <TableCell className="text-right tabular-nums text-danger">
                -{formatUsd(econ.freeCost)}
              </TableCell>
            </TableRow>
            <TableRow className="font-medium">
              <TableCell>Value per sign-up</TableCell>
              <TableCell className="text-right tabular-nums">{formatUsd(econ.perSU)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                Value per paying user = plan value per sign-up {formatUsd(econ.planVal)} ÷{' '}
                {(econ.conv * 100).toFixed(1)}% who pay
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatUsd(econ.perPayer)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cost per sign-up (from Lead sources)</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatUsd(metrics.costPerSignup)}
              </TableCell>
            </TableRow>
            <TableRow className="font-medium">
              <TableCell>
                Return (value ÷ cost; {scenario.set.ratio}× or more is healthy)
              </TableCell>
              <TableCell
                className={cn(
                  'text-right tabular-nums',
                  ratioClass === 'success' && 'text-success',
                  ratioClass === 'warning' && 'text-warning',
                  ratioClass === 'danger' && 'text-danger'
                )}
              >
                {isFinite(metrics.returnRatio) ? formatRatio(metrics.returnRatio) : '∞'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

interface PlanEditPanelProps {
  plan: Plan;
  onFieldChange: (field: string, value: number | string) => void;
}

function PlanEditPanel({ plan, onFieldChange }: PlanEditPanelProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-1">
        <Label>Name</Label>
        <Input
          value={plan.name}
          onChange={e => onFieldChange('name', e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Type</Label>
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
      </div>
      <div className="space-y-1">
        <Label>Price, $</Label>
        <Input
          type="number"
          value={plan.price}
          onChange={e => onFieldChange('price', parseFloat(e.target.value) || 0)}
          className="tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <Label>Launches in month</Label>
        <Input
          type="number"
          value={plan.start}
          onChange={e => onFieldChange('start', parseInt(e.target.value) || 1)}
          className="tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <Label>
          Conversion, % of new sign-ups
          <span className="block text-xs text-muted-foreground font-normal">
            Freemium median 2.1% for all plans combined
          </span>
        </Label>
        <Input
          type="number"
          value={plan.conv}
          onChange={e => onFieldChange('conv', parseFloat(e.target.value) || 0)}
          className="tabular-nums"
        />
      </div>
      {plan.type === 'monthly' ? (
        <div className="space-y-1">
          <Label>
            Cancel per month, %
            <span className="block text-xs text-muted-foreground font-normal">
              AI apps ~20%; stay = 1 ÷ churn
            </span>
          </Label>
          <Input
            type="number"
            value={plan.churn}
            onChange={e => onFieldChange('churn', parseFloat(e.target.value) || 0)}
            className="tabular-nums"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <Label>
            Purchases per buyer
            <span className="block text-xs text-muted-foreground font-normal">
              1 = buys once
            </span>
          </Label>
          <Input
            type="number"
            value={plan.repeat}
            onChange={e => onFieldChange('repeat', parseFloat(e.target.value) || 1)}
            className="tabular-nums"
          />
        </div>
      )}
      <div className="space-y-1">
        <Label>
          Renders used
          <span className="block text-xs text-muted-foreground font-normal">
            Per month (monthly) or per purchase
          </span>
        </Label>
        <Input
          type="number"
          value={plan.renders}
          onChange={e => onFieldChange('renders', parseFloat(e.target.value) || 0)}
          className="tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <Label>
          Other cost per sale, $
          <span className="block text-xs text-muted-foreground font-normal">
            Text/voice, storage
          </span>
        </Label>
        <Input
          type="number"
          value={plan.cost}
          onChange={e => onFieldChange('cost', parseFloat(e.target.value) || 0)}
          className="tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <Label>Fixed cost per month, $</Label>
        <Input
          type="number"
          value={plan.fixed}
          onChange={e => onFieldChange('fixed', parseFloat(e.target.value) || 0)}
          className="tabular-nums"
        />
      </div>
      <div className="space-y-1">
        <Label>
          Bought on the web, %
          <span className="block text-xs text-muted-foreground font-normal">
            The rest pay the App Store fee
          </span>
        </Label>
        <Input
          type="number"
          value={plan.web}
          onChange={e => onFieldChange('web', parseFloat(e.target.value) || 0)}
          className="tabular-nums"
        />
      </div>
    </div>
  );
}
