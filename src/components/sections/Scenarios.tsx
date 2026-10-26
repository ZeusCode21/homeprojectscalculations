'use client';

import { useState, useRef } from 'react';
import { useModel } from '@/lib/context';
import { formatUsd, formatNum, formatPct, formatRatio, sim, unitEcon, calcTopMetrics } from '@/lib/model';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getCurrentBusiness } from '@/lib/store';

export function Scenarios() {
  const {
    state,
    scenarioMetas,
    currentScenarioId,
    setScenarioId,
    saveAsNew,
    deleteCurrentScenario,
    resetToDefaults,
    exportJson,
    importJson,
  } = useModel();
  
  const [newName, setNewName] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSaveAsNew = () => {
    if (!newName.trim()) return;
    saveAsNew(newName.trim());
    setNewName('');
  };
  
  const handleDelete = () => {
    if (scenarioMetas.length <= 1) {
      alert('Keep at least one scenario.');
      return;
    }
    if (!confirm(`Delete scenario "${scenarioMetas.find(m => m.id === currentScenarioId)?.displayName}"?`)) {
      return;
    }
    deleteCurrentScenario();
  };
  
  const handleReset = () => {
    if (!confirm('Reset this scenario to the defaults?')) return;
    resetToDefaults();
  };
  
  const handleExport = () => {
    const json = exportJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'growth-model.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    file.text().then(json => {
      const success = importJson(json);
      if (!success) {
        alert('That file is not a valid model export.');
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleCompareToggle = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };
  
  // Get comparison data
  const business = getCurrentBusiness(state);
  const comparisonData = compareIds.map(id => {
    const scenario = business.scenarios[id];
    if (!scenario) return null;
    const simResult = sim(scenario);
    const econ = unitEcon(scenario);
    const metrics = calcTopMetrics(scenario, simResult, econ);
    return {
      id,
      name: scenarioMetas.find(m => m.id === id)?.displayName || id,
      metrics,
      econ,
    };
  }).filter(Boolean) as {
    id: string;
    name: string;
    metrics: ReturnType<typeof calcTopMetrics>;
    econ: ReturnType<typeof unitEcon>;
  }[];
  
  return (
    <section id="scenarios" className="scroll-mt-16">
      <h2 className="font-serif text-2xl mb-4">Scenarios</h2>
      
      <div className="bg-card border rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <strong>Scenario</strong>
          <Select value={currentScenarioId} onValueChange={(v) => v && setScenarioId(v)}>
            <SelectTrigger className="w-[200px]">
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
          
          <div className="flex items-center gap-2">
            <Input
              placeholder="New scenario name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="w-[180px]"
            />
            <Button variant="outline" onClick={handleSaveAsNew} disabled={!newName.trim()}>
              Save as new
            </Button>
          </div>
          
          <Button variant="outline" onClick={handleDelete}>
            Delete
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            Export file
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            Import file
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button variant="outline" onClick={handleReset}>
            Reset to defaults
          </Button>
          
          <div className="flex-1" />
          
          <Dialog open={showCompare} onOpenChange={setShowCompare}>
            <DialogTrigger render={<Button variant="outline" />}>
              Compare scenarios
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Compare scenarios</DialogTitle>
                <DialogDescription>
                  Select 2 to 4 scenarios to compare side by side
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {scenarioMetas.map(m => (
                  <Button
                    key={m.id}
                    variant={compareIds.includes(m.id) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCompareToggle(m.id)}
                  >
                    {m.displayName}
                  </Button>
                ))}
              </div>
              
              {comparisonData.length >= 2 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {comparisonData.map(d => (
                        <TableHead key={d.id} className="text-right">{d.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Total spend</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatUsd(d.metrics.spend)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Total sign-ups</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatNum(d.metrics.signups)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Cost per sign-up</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatUsd(d.metrics.costPerSignup)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Sign-up → paid</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatPct(d.metrics.convRate)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Cost per payer</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatUsd(d.metrics.costPerPayer)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Lifetime value per payer</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatUsd(d.metrics.ltvPayer)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Value per sign-up</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatUsd(d.metrics.valuePerSignup)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Return</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatRatio(d.metrics.returnRatio)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Break-even month</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {d.metrics.breakEvenMonth ? `Month ${d.metrics.breakEvenMonth}` : 'Not reached'}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Most money down</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatUsd(d.metrics.mostDown)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Total profit</TableCell>
                      {comparisonData.map(d => (
                        <TableCell key={d.id} className="text-right tabular-nums">
                          {formatUsd(d.metrics.totalProfit)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCompare(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <p className="text-xs text-muted-foreground mt-4">
          Changes save automatically to this scenario in this browser.
          Export a file to keep a copy or move it to another computer.
        </p>
      </div>
    </section>
  );
}
