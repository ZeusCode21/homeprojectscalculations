'use client';

import { useModel } from '@/lib/context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function OtherIncome() {
  const { scenario, updateScenarioDeep } = useModel();
  
  const handleAffChange = (key: string, value: number | boolean) => {
    updateScenarioDeep(s => {
      (s.aff as unknown as Record<string, number | boolean>)[key] = value;
    });
  };
  
  const handleLeadChange = (key: string, value: number | boolean) => {
    updateScenarioDeep(s => {
      (s.lead as unknown as Record<string, number | boolean>)[key] = value;
    });
  };
  
  return (
    <section id="other-income" className="scroll-mt-16">
      <h2 className="font-serif text-2xl mb-4">Other income</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Materials affiliate */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <Switch
              checked={scenario.aff.on}
              onCheckedChange={v => handleAffChange('on', v)}
            />
            <h3 className="font-serif text-lg">Materials shopping list (affiliate)</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">Starts in month</Label>
              <Input
                type="number"
                value={scenario.aff.start}
                onChange={e => handleAffChange('start', parseInt(e.target.value) || 1)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">Active users who open a materials list, %/mo</Label>
              <Input
                type="number"
                value={scenario.aff.click}
                onChange={e => handleAffChange('click', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                Of those, buy through your link, %
                <span className="block text-xs text-muted-foreground font-normal">
                  Home Depot cookie is short (1 day)
                </span>
              </Label>
              <Input
                type="number"
                value={scenario.aff.conv}
                onChange={e => handleAffChange('conv', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">Average order, $</Label>
              <Input
                type="number"
                value={scenario.aff.aov}
                onChange={e => handleAffChange('aov', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                Commission, %
                <span className="block text-xs text-muted-foreground font-normal">
                  Home Depot 1–8% by category
                </span>
              </Label>
              <Input
                type="number"
                value={scenario.aff.comm}
                onChange={e => handleAffChange('comm', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
          </div>
        </div>
        
        {/* Contractor referrals */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-4">
            <Switch
              checked={scenario.lead.on}
              onCheckedChange={v => handleLeadChange('on', v)}
            />
            <h3 className="font-serif text-lg">Contractor referrals (pros pay)</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">Starts in month</Label>
              <Input
                type="number"
                value={scenario.lead.start}
                onChange={e => handleLeadChange('start', parseInt(e.target.value) || 1)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                Minimum active users before it works
                <span className="block text-xs text-muted-foreground font-normal">
                  You need pros signed up where users live
                </span>
              </Label>
              <Input
                type="number"
                value={scenario.lead.min}
                onChange={e => handleLeadChange('min', parseInt(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">Active users who request a pro, %/mo</Label>
              <Input
                type="number"
                value={scenario.lead.req}
                onChange={e => handleLeadChange('req', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">Requests a pro pays for, %</Label>
              <Input
                type="number"
                value={scenario.lead.sold}
                onChange={e => handleLeadChange('sold', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="flex-1">
                Price per lead, $
                <span className="block text-xs text-muted-foreground font-normal">
                  Thumbtack ~$8–420
                </span>
              </Label>
              <Input
                type="number"
                value={scenario.lead.price}
                onChange={e => handleLeadChange('price', parseFloat(e.target.value) || 0)}
                className="w-20 tabular-nums"
              />
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mt-4">
            Not counted in value per sign-up, since it depends on reaching the minimum.
          </p>
        </div>
      </div>
    </section>
  );
}
