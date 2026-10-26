'use client';

import { useModel } from '@/lib/context';
import { formatUsd, formatNum, LEAD_SOURCE_KINDS } from '@/lib/model';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function MonthGrid() {
  const { scenario, simResult, updateScenarioDeep } = useModel();
  const { rows } = simResult;
  const N = scenario.months;
  
  const handleMonthsChange = (value: number) => {
    updateScenarioDeep(s => {
      s.months = Math.max(6, Math.min(48, value));
    });
  };
  
  const handleFwdChange = (value: boolean) => {
    updateScenarioDeep(s => {
      s.fwd = value;
    });
  };
  
  const handleStageChange = (month: number, value: string) => {
    updateScenarioDeep(s => {
      const oldValue = s.grid.stage[month];
      s.grid.stage[month] = value;
      if (s.fwd) {
        for (let i = month + 1; i < s.months; i++) {
          if (s.grid.stage[i] !== oldValue) break;
          s.grid.stage[i] = value;
        }
      }
    });
  };
  
  const handleChanChange = (chanId: string, month: number, value: number) => {
    updateScenarioDeep(s => {
      if (!s.grid.ch[chanId]) s.grid.ch[chanId] = Array(s.months).fill(0);
      s.grid.ch[chanId][month] = value;
      if (s.fwd) {
        for (let i = month + 1; i < s.months; i++) {
          s.grid.ch[chanId][i] = value;
        }
      }
    });
  };
  
  const handleCostChange = (costId: string, month: number, value: number) => {
    updateScenarioDeep(s => {
      if (!s.grid.cost[costId]) s.grid.cost[costId] = Array(s.months).fill(0);
      s.grid.cost[costId][month] = value;
      if (s.fwd) {
        for (let i = month + 1; i < s.months; i++) {
          s.grid.cost[costId][i] = value;
        }
      }
    });
  };
  
  return (
    <section id="month-grid" className="scroll-mt-16">
      <h2 className="font-serif text-2xl mb-2">Month by month</h2>
      <p className="text-sm text-muted-foreground mb-4 max-w-3xl">
        Your spend on each lead source and each running cost, month by month.
        With &quot;Change later months too&quot; on, typing a number fills every month after it.
        Turn it off to change one month only. The stage row names each stretch on the roadmap.
      </p>
      
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Switch
              id="fwd"
              checked={scenario.fwd}
              onCheckedChange={handleFwdChange}
            />
            <Label htmlFor="fwd">Change later months too</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="months">Months in the plan</Label>
            <Input
              id="months"
              type="number"
              min={6}
              max={48}
              value={scenario.months}
              onChange={e => handleMonthsChange(parseInt(e.target.value) || 18)}
              className="w-16 tabular-nums"
            />
          </div>
        </div>
        
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
              {/* Stage row */}
              <tr>
                <td className="sticky left-0 bg-card z-10 p-2 border-b">
                  <strong>Stage</strong>{' '}
                  <span className="text-xs text-muted-foreground">(names the roadmap bands)</span>
                </td>
                {Array.from({ length: N }, (_, i) => (
                  <td key={i} className="p-1 border-b">
                    <Input
                      value={scenario.grid.stage[i] || ''}
                      onChange={e => handleStageChange(i, e.target.value)}
                      className="w-16 text-xs h-7 px-1"
                      title={scenario.grid.stage[i] || ''}
                    />
                  </td>
                ))}
              </tr>
              
              {/* Lead sources header */}
              <tr className="bg-muted/50">
                <td colSpan={N + 1} className="p-2 text-xs font-semibold text-muted-foreground">
                  Lead sources: monthly spend (creators = number of creators)
                </td>
              </tr>
              
              {/* Lead source rows */}
              {scenario.chans.map(chan => {
                const K = LEAD_SOURCE_KINDS[chan.kind];
                return (
                  <tr key={chan.id} className={cn(!chan.on && 'opacity-50')}>
                    <td className="sticky left-0 bg-card z-10 p-2 border-b">
                      {chan.name} <Badge variant="secondary" className="text-[10px]">{K.unit}</Badge>
                    </td>
                    {Array.from({ length: N }, (_, i) => (
                      <td key={i} className="p-1 border-b">
                        <Input
                          type="number"
                          value={scenario.grid.ch[chan.id]?.[i] ?? 0}
                          onChange={e => handleChanChange(chan.id, i, parseFloat(e.target.value) || 0)}
                          className="w-16 tabular-nums text-xs h-7 px-1"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
              
              {/* Costs header */}
              <tr className="bg-muted/50">
                <td colSpan={N + 1} className="p-2 text-xs font-semibold text-muted-foreground">
                  Costs to maintain, $ per month
                </td>
              </tr>
              
              {/* Cost rows */}
              {scenario.costs.map(cost => (
                <tr key={cost.id}>
                  <td className="sticky left-0 bg-card z-10 p-2 border-b">{cost.name}</td>
                  {Array.from({ length: N }, (_, i) => (
                    <td key={i} className="p-1 border-b">
                      <Input
                        type="number"
                        value={scenario.grid.cost[cost.id]?.[i] ?? 0}
                        onChange={e => handleCostChange(cost.id, i, parseFloat(e.target.value) || 0)}
                        className="w-16 tabular-nums text-xs h-7 px-1"
                      />
                    </td>
                  ))}
                </tr>
              ))}
              
              {/* Free-user cost row */}
              <tr className="text-muted-foreground">
                <td className="sticky left-0 bg-card z-10 p-2 border-b">
                  Free-user renders + text (calculated)
                </td>
                {rows.map(r => (
                  <td key={r.m} className="text-right tabular-nums p-2 border-b">
                    {formatUsd(r.usage)}
                  </td>
                ))}
              </tr>
              
              {/* Results header */}
              <tr className="bg-muted/50">
                <td colSpan={N + 1} className="p-2 text-xs font-semibold text-muted-foreground">
                  Results
                </td>
              </tr>
              
              {/* Result rows */}
              <tr className="text-muted-foreground">
                <td className="sticky left-0 bg-card z-10 p-2 border-b">New sign-ups</td>
                {rows.map(r => (
                  <td key={r.m} className="text-right tabular-nums p-2 border-b">
                    {formatNum(r.newM)}
                  </td>
                ))}
              </tr>
              <tr className="text-muted-foreground">
                <td className="sticky left-0 bg-card z-10 p-2 border-b">Cost per sign-up</td>
                {rows.map(r => (
                  <td key={r.m} className="text-right tabular-nums p-2 border-b">
                    {r.newM ? formatUsd(r.chC / r.newM) : '–'}
                  </td>
                ))}
              </tr>
              <tr className="text-muted-foreground">
                <td className="sticky left-0 bg-card z-10 p-2 border-b">New paying users</td>
                {rows.map(r => (
                  <td key={r.m} className="text-right tabular-nums p-2 border-b">
                    {formatNum(r.payNew)}
                  </td>
                ))}
              </tr>
              <tr className="text-muted-foreground">
                <td className="sticky left-0 bg-card z-10 p-2 border-b">Active users</td>
                {rows.map(r => (
                  <td key={r.m} className="text-right tabular-nums p-2 border-b">
                    {formatNum(r.mau)}
                  </td>
                ))}
              </tr>
              <tr className="text-muted-foreground">
                <td className="sticky left-0 bg-card z-10 p-2 border-b">Revenue</td>
                {rows.map(r => (
                  <td key={r.m} className="text-right tabular-nums p-2 border-b">
                    {formatUsd(r.rev)}
                  </td>
                ))}
              </tr>
              <tr className="text-muted-foreground">
                <td className="sticky left-0 bg-card z-10 p-2 border-b">All costs</td>
                {rows.map(r => (
                  <td key={r.m} className="text-right tabular-nums p-2 border-b">
                    {formatUsd(r.chC + r.maint + r.usage + r.pCost)}
                  </td>
                ))}
              </tr>
              <tr className="font-medium">
                <td className="sticky left-0 bg-card z-10 p-2 border-b">Profit</td>
                {rows.map(r => (
                  <td
                    key={r.m}
                    className={cn(
                      'text-right tabular-nums p-2 border-b',
                      r.profit >= 0 ? 'text-success' : 'text-danger'
                    )}
                  >
                    {formatUsd(r.profit)}
                  </td>
                ))}
              </tr>
              <tr className="font-medium">
                <td className="sticky left-0 bg-card z-10 p-2 border-b">Running total</td>
                {rows.map(r => (
                  <td
                    key={r.m}
                    className={cn(
                      'text-right tabular-nums p-2 border-b',
                      r.cum >= 0 ? 'text-success' : 'text-danger'
                    )}
                  >
                    {formatUsd(r.cum)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
