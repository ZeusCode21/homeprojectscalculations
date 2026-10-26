'use client';

import { useModel } from '@/lib/context';
import { formatUsd, uid } from '@/lib/model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function Costs() {
  const { scenario, updateScenarioDeep } = useModel();
  
  const handleCostNameChange = (costId: string, name: string) => {
    updateScenarioDeep(s => {
      const cost = s.costs.find(c => c.id === costId);
      if (cost) cost.name = name;
    });
  };
  
  const handleAddCost = () => {
    updateScenarioDeep(s => {
      const newId = uid();
      s.costs.push({ id: newId, name: 'New running cost' });
      s.grid.cost[newId] = Array(s.months).fill(0);
    });
  };
  
  const handleRemoveCost = (costId: string) => {
    updateScenarioDeep(s => {
      const idx = s.costs.findIndex(c => c.id === costId);
      if (idx >= 0) {
        s.costs.splice(idx, 1);
        delete s.grid.cost[costId];
      }
    });
  };
  
  const handleSettingChange = (key: string, value: number | boolean) => {
    updateScenarioDeep(s => {
      (s.set as unknown as Record<string, number | boolean>)[key] = value;
    });
  };
  
  const getCostTotal = (costId: string) => {
    return (scenario.grid.cost[costId] || []).reduce((a, b) => a + (+b || 0), 0);
  };
  
  return (
    <section id="costs" className="scroll-mt-16">
      <h2 className="font-serif text-2xl mb-2">Costs to maintain</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
        Monthly running costs are rows in the Month by month table. Add one for each tool or bill.
        The settings below set what free users and payments cost.
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Running cost lines */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-serif text-lg mb-3">Running cost lines</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenario.costs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No running costs yet.
                  </TableCell>
                </TableRow>
              ) : (
                scenario.costs.map(cost => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      <Input
                        value={cost.name}
                        onChange={e => handleCostNameChange(cost.id, e.target.value)}
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatUsd(getCostTotal(cost.id))} total
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCost(cost.id)}
                      >
                        ×
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Button variant="outline" onClick={handleAddCost} className="mt-3">
            + Add running cost
          </Button>
        </div>
        
        {/* Settings */}
        <div className="bg-card border rounded-lg p-4">
          <h3 className="font-serif text-lg mb-3">Users, free usage and fees</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                Months a user stays active
                <span className="block text-xs text-muted-foreground font-normal">
                  Projects end; assumed ~4 paid months
                </span>
              </Label>
              <Input
                type="number"
                value={scenario.set.life}
                onChange={e => handleSettingChange('life', parseFloat(e.target.value) || 1)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                New users each user brings
                <span className="block text-xs text-muted-foreground font-normal">
                  Before/after reveals get shared
                </span>
              </Label>
              <Input
                type="number"
                value={scenario.set.refs}
                onChange={e => handleSettingChange('refs', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
                step="0.01"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                Cost per render, $
                <span className="block text-xs text-muted-foreground font-normal">
                  NB 2.1 1K $0.034; batch $0.017
                </span>
              </Label>
              <Input
                type="number"
                value={scenario.set.render}
                onChange={e => handleSettingChange('render', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
                step="0.001"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">Free renders per active user per month</Label>
              <Input
                type="number"
                value={scenario.set.freeRenders}
                onChange={e => handleSettingChange('freeRenders', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">Text/assistant cost per active user, $/mo</Label>
              <Input
                type="number"
                value={scenario.set.textCost}
                onChange={e => handleSettingChange('textCost', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
                step="0.01"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                Web payment fees, %
                <span className="block text-xs text-muted-foreground font-normal">
                  Stripe ~2.9% + 30¢ + Billing
                </span>
              </Label>
              <Input
                type="number"
                value={scenario.set.webFee}
                onChange={e => handleSettingChange('webFee', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                App Store fee, %
                <span className="block text-xs text-muted-foreground font-normal">
                  15% small business
                </span>
              </Label>
              <Input
                type="number"
                value={scenario.set.appFee}
                onChange={e => handleSettingChange('appFee', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                A plan&apos;s launch month also sells to users already active
              </Label>
              <Switch
                checked={scenario.set.launchSell}
                onCheckedChange={v => handleSettingChange('launchSell', v)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
