'use client';

import { useModel } from '@/lib/context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const NAV_ITEMS = [
  { id: 'overview', label: 'Top numbers' },
  { id: 'lead-sources', label: 'Lead sources' },
  { id: 'plans', label: 'Plans and value' },
  { id: 'month-grid', label: 'Month by month' },
  { id: 'costs', label: 'Costs' },
  { id: 'other-income', label: 'Other income' },
  { id: 'real-numbers', label: 'Real numbers' },
  { id: 'scenarios', label: 'Scenarios' },
];

export function Header() {
  const {
    state,
    currentBusinessId,
    currentBusinessName,
    setBusinessId,
    scenarioMetas,
    currentScenarioId,
    setScenarioId,
  } = useModel();
  
  const businesses = Object.values(state.businesses);
  const currentScenarioName = scenarioMetas.find(m => m.id === currentScenarioId)?.displayName || 'Base plan';
  
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <header className="sticky top-0 z-50 bg-background border-b">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Top bar */}
        <div className="flex items-center gap-6 py-3 border-b">
          <h1 className="font-serif text-xl">Growth Model</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Business:</span>
            <Select value={currentBusinessId} onValueChange={(v) => v && setBusinessId(v)}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {businesses.map(b => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentBusinessId === 'safemomma' && (
              <Badge variant="secondary">placeholder</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Scenario:</span>
            <Select value={currentScenarioId} onValueChange={(v) => v && setScenarioId(v)}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenarioMetas.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1" />
          
          <span className="text-xs text-muted-foreground">
            {currentBusinessName} · {currentScenarioName}
          </span>
        </div>
        
        {/* Navigation */}
        <nav className="flex gap-1 py-2 overflow-x-auto">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
